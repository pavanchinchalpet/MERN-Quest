const supabase = require('../config/supabaseClient');
const env = require('../config/env');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { hashPassword, matchPassword } = require('../utils/passwordUtils');
const { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME, setAuthCookies, clearAuthCookies } = require('../utils/generateToken');
const crypto = require('crypto');

const buildUserResponse = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  name: user.name,
  role: user.role,
  avatar: user.avatar,
  streak: user.streak,
  last_login: user.last_login,
});

const getGoogleRedirectUri = (req) =>
  env.GOOGLE_OAUTH_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

const createUsernameFromEmail = async (email) => {
  const base = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30) || 'user';

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = attempt === 0 ? '' : crypto.randomBytes(2).toString('hex');
    const username = `${base}${suffix}`.slice(0, 50);
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return username;
  }

  return `user${crypto.randomBytes(8).toString('hex')}`.slice(0, 50);
};

const upsertGoogleLogin = async (user, googleProfile, req) => {
  const marker = `google:${googleProfile.sub}`;

  const { data: existingLogin, error: existingLoginError } = await supabase
    .from('auth_logins')
    .select('id')
    .eq('user_id', user.id)
    .eq('method', 'google')
    .maybeSingle();

  if (existingLoginError) throw new Error(existingLoginError.message);

  const loginPayload = {
    user_id: user.id,
    method: 'google',
    password_hash: marker,
    ip_address: req.ip || '',
    user_agent: req.headers['user-agent'] || '',
    is_active: true,
    is_verified: Boolean(googleProfile.email_verified),
  };

  if (existingLogin) {
    const { error } = await supabase
      .from('auth_logins')
      .update(loginPayload)
      .eq('id', existingLogin.id);

    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from('auth_logins').insert([loginPayload]);
  if (error) throw new Error(error.message);
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password, name } = req.body;

    // Default username if not provided
    const finalUsername = username || email.split('@')[0] + crypto.randomBytes(2).toString('hex');
    const finalName = name || finalUsername;

    // 1. Check if user already exists
    const { data: userExists, error: existenceError } = await supabase
      .from('users')
      .select('email, username')
      .or(`email.eq.${email},username.eq.${finalUsername}`);

    if (existenceError) throw new Error(existenceError.message);

    if (userExists && userExists.length > 0) {
      res.status(400);
      throw new Error('User with this email or username already exists');
    }

    // 2. Hash password
    const hashedPassword = await hashPassword(password);

    // 3. Insert into users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([
        { 
          username: finalUsername, 
          email: email, 
          name: finalName, 
          role: 'user' 
        }
      ])
      .select()
      .single();

    if (userError) throw new Error(userError.message);

    // 4. Insert into auth_logins table
    const { error: loginError } = await supabase
      .from('auth_logins')
      .insert([
        {
          user_id: user.id,
          method: 'password',
          password_hash: hashedPassword,
          ip_address: req.ip || '',
          user_agent: req.headers['user-agent'] || '',
          is_active: true,
          is_verified: true
        }
      ]);

    if (loginError) throw new Error(loginError.message);

    // 5. Generate token and return success
    setAuthCookies(res, user.id, user.role);

    res.status(201).json({
      success: true,
      data: buildUserResponse(user)
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // 2. Find auth_logins for this user
    const { data: authLogin, error: loginError } = await supabase
      .from('auth_logins')
      .select('password_hash')
      .eq('user_id', user.id)
      .eq('method', 'password')
      .eq('is_active', true)
      .single();

    if (loginError || !authLogin || !authLogin.password_hash) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // 3. Verify password
    const isMatch = await matchPassword(password, authLogin.password_hash);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // 4. Update last_login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Update IP in auth_logins
    await supabase
      .from('auth_logins')
      .update({ ip_address: req.ip, user_agent: req.headers['user-agent'] })
      .eq('user_id', user.id);

    // 5. Generate JWT Cookie
    setAuthCookies(res, user.id, user.role);

    res.json({
      success: true,
      data: buildUserResponse(user)
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = (req, res, next) => {
  try {
    clearAuthCookies(res);

    res.json({ success: true, message: 'Logged out successfully' });
  } catch(error) {
    next(error);
  }
};

const refreshAccessToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      res.status(401);
      throw new Error('Refresh token missing');
    }

    const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);

    if (decoded.type !== 'refresh') {
      res.status(401);
      throw new Error('Invalid refresh token');
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      res.status(401);
      throw new Error('Refresh token user not found');
    }

    setAuthCookies(res, user.id, user.role);

    res.json({
      success: true,
      data: buildUserResponse(user),
    });
  } catch (error) {
    clearAuthCookies(res);
    res.status(401);
    next(new Error('Refresh token expired or invalid'));
  }
};

// @desc    Redirect to Google OAuth
// @route   GET /api/auth/google
// @access  Public
const startGoogleOAuth = (req, res, next) => {
  try {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      res.status(500);
      throw new Error('Google OAuth is not configured');
    }

    const returnTo = typeof req.query.returnTo === 'string' ? req.query.returnTo : '/home';
    const state = Buffer.from(JSON.stringify({ returnTo })).toString('base64url');
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: getGoogleRedirectUri(req),
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      state,
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (error) {
    next(error);
  }
};

// @desc    Handle Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
const handleGoogleOAuthCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      res.status(400);
      throw new Error('Google authorization code missing');
    }

    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: getGoogleRedirectUri(req),
        grant_type: 'authorization_code',
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const profileResponse = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
    });

    const profile = profileResponse.data;
    if (!profile.email) {
      res.status(400);
      throw new Error('Google account email is required');
    }

    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('*')
      .eq('email', profile.email)
      .maybeSingle();

    if (existingUserError) throw new Error(existingUserError.message);

    let user = existingUser;
    if (!user) {
      const username = await createUsernameFromEmail(profile.email);
      const { data: createdUser, error: createUserError } = await supabase
        .from('users')
        .insert([
          {
            username,
            email: profile.email,
            name: profile.name || username,
            avatar: profile.picture || 'default',
            role: 'user',
            last_login: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (createUserError) throw new Error(createUserError.message);
      user = createdUser;
    } else {
      const updates = {
        last_login: new Date().toISOString(),
      };

      if ((!user.avatar || user.avatar === 'default') && profile.picture) {
        updates.avatar = profile.picture;
      }

      if (!user.name && profile.name) {
        updates.name = profile.name;
      }

      const { data: updatedUser, error: updateUserError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateUserError) throw new Error(updateUserError.message);
      user = updatedUser;
    }

    await upsertGoogleLogin(user, profile, req);
    setAuthCookies(res, user.id, user.role);

    let returnTo = '/home';
    if (state) {
      try {
        const parsedState = JSON.parse(Buffer.from(String(state), 'base64url').toString('utf8'));
        if (typeof parsedState.returnTo === 'string' && parsedState.returnTo.startsWith('/')) {
          returnTo = parsedState.returnTo;
        }
      } catch (error) {
        returnTo = '/home';
      }
    }

    res.redirect(`${env.FRONTEND_URL.replace(/\/$/, '')}${returnTo}`);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = req.user; // Set by auth middleware

    res.json({
      success: true,
      data: buildUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  startGoogleOAuth,
  handleGoogleOAuthCallback,
  logoutUser,
  refreshAccessToken,
  getMe
};
