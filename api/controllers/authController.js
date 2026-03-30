const supabase = require('../config/supabaseClient');
const generateToken = require('../utils/generateToken');
const { hashPassword, matchPassword } = require('../utils/passwordUtils');
const crypto = require('crypto');

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
    generateToken(res, user.id, user.role);

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role
      }
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
    generateToken(res, user.id, user.role);

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        streak: user.streak
      }
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
    res.cookie('jwt', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      expires: new Date(0),
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch(error) {
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
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        streak: user.streak,
        last_login: user.last_login
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe
};
