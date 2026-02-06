const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { userHelpers } = require('../utils/supabaseHelpers');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    console.log('🔵 [REGISTER] Request received:', {
      body: req.body,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('🔴 [REGISTER] Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;
    console.log('🔵 [REGISTER] Processing registration for:', { username, email });

    // Check if user already exists
    console.log('🔵 [REGISTER] Checking if user exists...');
    const { data: existingUser } = await userHelpers.getUserByEmailOrUsername(email, username);

    if (existingUser) {
      console.log('🔴 [REGISTER] User already exists:', existingUser.email);
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    console.log('🔵 [REGISTER] Creating user via Supabase Admin (email auto-confirm)...');
    // Create user via Admin API with email confirmed to prevent signup emails
    const serviceClient = supabase.getServiceClient();
    if (!serviceClient) {
      console.log('🔴 [REGISTER] Service role key not configured');
      return res.status(500).json({ message: 'Server misconfiguration: service role key missing' });
    }

    // Check if user already exists in Supabase Auth
    const { data: authUsers, error: checkError } = await serviceClient.auth.admin.listUsers();
    
    if (!checkError && authUsers?.users) {
      const userExists = authUsers.users.find(user => user.email === email);
      if (userExists) {
        console.log('🔴 [REGISTER] User already exists in Supabase Auth:', email);
        return res.status(409).json({ 
          message: 'User with this email already exists. Please use a different email or contact support.' 
        });
      }
    }

    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        avatar: 'default'
      }
    });

    if (authError) {
      console.log('🔴 [REGISTER] Supabase auth error:', authError);
      if (authError.code === 'email_exists') {
        return res.status(409).json({ 
          message: 'User with this email already exists. Please use a different email or contact support.' 
        });
      }
      return res.status(400).json({ message: authError.message });
    }

    if (!authData.user) {
      console.log('🔴 [REGISTER] No user data returned from Supabase');
      return res.status(400).json({ message: 'Failed to create user' });
    }

    console.log('🔵 [REGISTER] User created in Supabase Auth:', authData.user.id);

    // With admin.createUser and email_confirm: true, the email is already confirmed

    // Create user profile in our users table
    console.log('🔵 [REGISTER] Creating user profile...');
    const { data: userProfile, error: profileError } = await userHelpers.createUserProfile(
      authData.user.id,
      { username, email, avatar: 'default' }
    );

    if (profileError) {
      console.log('🔴 [REGISTER] Profile creation error:', profileError);
      console.error('Error creating user profile:', profileError);
      // Note: User is created in auth but not in our profile table
      // In production, you might want to handle this differently
    } else {
      console.log('🔵 [REGISTER] User profile created successfully');
    }

    // Generate token
    console.log('🔵 [REGISTER] Generating JWT token...');
    const token = generateToken(authData.user.id);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log('✅ [REGISTER] Registration successful for:', username);
    res.status(201).json({
      message: 'User registered successfully',
      token: token, // Include token in response for localStorage storage
      user: {
        id: authData.user.id,
        username,
        email,
        avatar: 'default',
        points: 0,
        level: 1,
        streak: 0,
        isAdmin: false
      }
    });
  } catch (error) {
    console.log('🔴 [REGISTER] Unexpected error:', error);
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    console.log('🔵 [LOGIN] Request received:', {
      body: req.body,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('🔴 [LOGIN] Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log('🔵 [LOGIN] Processing login for:', email);

    // Get user profile first
    console.log('🔵 [LOGIN] Getting user profile...');
    const { data: userProfile, error: profileError } = await userHelpers.getUserByEmailOrUsername(email, '');
    
    if (profileError || !userProfile) {
      console.log('🔴 [LOGIN] User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('🔵 [LOGIN] User found, authenticating with Supabase...');
    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.log('🔴 [LOGIN] Supabase auth error:', authError);
      
      // Check if it's an email confirmation error
      if (authError.message.includes('Email not confirmed')) {
        console.log('🔵 [LOGIN] Email not confirmed, but allowing login with JWT...');
        
        // Generate JWT token anyway for users with unconfirmed emails
        const token = generateToken(userProfile.id);
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        console.log('✅ [LOGIN] Login successful (email not confirmed)');
        return res.json({
          message: 'Login successful! Please confirm your email when convenient.',
          token: token, // Include token in response for localStorage storage
          user: {
            id: userProfile.id,
            username: userProfile.username,
            email: userProfile.email,
            avatar: userProfile.avatar,
            points: userProfile.points,
            level: userProfile.level,
            streak: userProfile.streak,
            isAdmin: userProfile.is_admin,
            emailConfirmed: false
          },
          requiresEmailConfirmation: true
        });
      }
      
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!authData.user) {
      console.log('🔴 [LOGIN] No user data returned from Supabase');
      return res.status(401).json({ message: 'Authentication failed' });
    }

    console.log('🔵 [LOGIN] Authentication successful, logging in auth_logins...');
    // Hash the password for storage in auth_logins
    const passwordHash = await bcrypt.hash(password, 12);

    // Store login attempt in auth_logins table using service client
    const serviceClient = supabase.getServiceClient();
    const { error: loginLogError } = await serviceClient
      .from('auth_logins')
      .insert({
        user_id: userProfile.id,
        method: 'password',
        password_hash: passwordHash,
        is_verified: true,
        is_active: true,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent')
      });

    if (loginLogError) {
      console.log('🔴 [LOGIN] Error logging password login:', loginLogError);
      // Continue with login even if logging fails
    } else {
      console.log('🔵 [LOGIN] Login logged successfully');
    }

    // Generate token
    console.log('🔵 [LOGIN] Generating JWT token...');
    const token = generateToken(authData.user.id);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log('✅ [LOGIN] Login successful for:', userProfile.username);
    res.json({
      message: 'Login successful',
      token: token, // Include token in response for localStorage storage
      user: {
        id: userProfile.id,
        username: userProfile.username,
        email: userProfile.email,
        avatar: userProfile.avatar,
        points: userProfile.points,
        level: userProfile.level,
        streak: userProfile.streak,
        isAdmin: userProfile.is_admin
      }
    });
  } catch (error) {
    console.log('🔴 [LOGIN] Unexpected error:', error);
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: userProfile, error } = await userHelpers.getUserById(userId);

    if (error) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: userProfile.id,
        username: userProfile.username,
        email: userProfile.email,
        avatar: userProfile.avatar,
        points: userProfile.points,
        level: userProfile.level,
        streak: userProfile.streak,
        isAdmin: userProfile.is_admin,
        totalQuizzes: userProfile.total_quizzes,
        correctAnswers: userProfile.correct_answers,
        totalAnswers: userProfile.total_answers
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    res.clearCookie('token');
    return res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    // Always respond OK to avoid client-side noise
    return res.json({ message: 'Logout completed' });
  }
};

// @desc    Send OTP for login using Supabase Auth
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔵 [SEND OTP] Request received for email:', email);

    // Check if user exists
    const { data: user } = await userHelpers.getUserByEmailOrUsername(email, '');
    if (!user) {
      console.log('🔴 [SEND OTP] User not found:', email);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('🔵 [SEND OTP] User found, sending OTP via Supabase Auth...');
    console.log('🔵 [SEND OTP] Supabase client status:', supabase ? 'Connected' : 'Not connected');

    // Generate a 6-digit OTP for development logging
    const devOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Use Supabase Auth to send OTP email
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        // Don't set emailRedirectTo to force OTP instead of magic link
        shouldCreateUser: false // Don't create user if they don't exist
      }
    });

    console.log('🔵 [SEND OTP] Supabase response data:', data);
    console.log('🔵 [SEND OTP] Supabase response error:', error);

    if (error) {
      console.error('🔴 [SEND OTP] Supabase Auth error:', error);
      console.error('🔴 [SEND OTP] Error details:', JSON.stringify(error, null, 2));
      
      // For development, always show OTP in console
      console.log(`📧 [DEV OTP] Generated OTP for ${email}: ${devOtp}`);
      console.log(`📧 [DEV OTP] This OTP is valid for testing purposes`);
      
      return res.status(500).json({ 
        message: 'Failed to send OTP email. Check Supabase email configuration.',
        devOtp: process.env.NODE_ENV === 'development' ? devOtp : undefined,
        error: error.message,
        errorCode: error.code,
        errorDetails: error
      });
    }

    // For development, always log the OTP
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 [DEV OTP] Generated OTP for ${email}: ${devOtp}`);
      console.log(`📧 [DEV OTP] This OTP is valid for testing purposes`);
      console.log(`📧 [DEV OTP] Check your email for the actual OTP or use the dev OTP above`);
    }

    console.log('✅ [SEND OTP] OTP email sent successfully via Supabase Auth');
    console.log('📧 [SEND OTP] Check your email inbox for the 6-digit OTP code');
    
    res.json({ 
      message: 'OTP sent successfully to your email. Check your inbox for the 6-digit code.',
      expiresIn: 300, // Supabase OTP expires in 5 minutes (300 seconds)
      method: 'supabase-auth',
      devOtp: process.env.NODE_ENV === 'development' ? devOtp : undefined
    });
  } catch (error) {
    console.error('🔴 [SEND OTP] Unexpected error:', error);
    res.status(500).json({ message: 'Error sending OTP' });
  }
};

// @desc    Verify OTP and login using Supabase Auth
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), message: 'Validation failed' });
    }

    const { email } = req.body;
    // Coerce OTP to string (frontend may send string or number)
    const otpStr = String(req.body.otp || '').trim();

    console.log('🔵 [VERIFY OTP] Request received for email:', email);
    console.log('🔵 [VERIFY OTP] OTP length:', otpStr.length);

    const isDevMode = process.env.NODE_ENV === 'development' || process.env.ALLOW_DEV_OTP === 'true';
    const isSixDigitOtp = otpStr.length === 6 && /^\d{6}$/.test(otpStr);

    // For development, allow any 6-digit OTP so login works without Supabase email
    if (isDevMode && isSixDigitOtp) {
      console.log('🔵 [VERIFY OTP] Development mode - accepting 6-digit OTP');
      
      const { data: userProfile, error: profileError } = await userHelpers.getUserByEmailOrUsername(email, '');
      
      if (profileError || !userProfile) {
        console.log('🔴 [VERIFY OTP] User profile not found:', email);
        return res.status(404).json({ message: 'User profile not found' });
      }

      const token = generateToken(userProfile.id);
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      console.log('✅ [VERIFY OTP] Development OTP verified successfully for:', userProfile.username);

      return res.json({
        message: 'OTP verified successfully (development mode)',
        token: token,
        user: {
          id: userProfile.id,
          username: userProfile.username,
          email: userProfile.email,
          avatar: userProfile.avatar,
          points: userProfile.points,
          level: userProfile.level,
          streak: userProfile.streak,
          isAdmin: userProfile.is_admin
        }
      });
    }

    // Verify OTP with Supabase Auth (production mode)
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: otpStr,
      type: 'email'
    });

    if (error) {
      console.error('🔴 [VERIFY OTP] Supabase Auth verification error:', error);
      return res.status(400).json({ 
        message: 'Invalid or expired OTP',
        error: error.message
      });
    }

    if (!data.user) {
      console.log('🔴 [VERIFY OTP] No user data returned from Supabase');
      return res.status(400).json({ message: 'Authentication failed' });
    }

    console.log('✅ [VERIFY OTP] OTP verified successfully for user:', data.user.email);

    // Get user profile from our users table
    const { data: userProfile, error: profileError } = await userHelpers.getUserByEmailOrUsername(email, '');
    
    if (profileError || !userProfile) {
      console.log('🔴 [VERIFY OTP] User profile not found:', email);
      return res.status(404).json({ message: 'User profile not found' });
    }

    // Generate custom JWT token for our API (not Supabase JWT)
    const token = generateToken(userProfile.id);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log('✅ [VERIFY OTP] Login successful for:', userProfile.username);

    res.json({
      message: 'OTP verified successfully',
      token: token, // Include token in response for localStorage storage
      user: {
        id: userProfile.id,
        username: userProfile.username,
        email: userProfile.email,
        avatar: userProfile.avatar,
        points: userProfile.points,
        level: userProfile.level,
        streak: userProfile.streak,
        isAdmin: userProfile.is_admin
      }
    });
  } catch (error) {
    console.error('🔴 [VERIFY OTP] Unexpected error:', error);
    res.status(500).json({ message: 'Error verifying OTP' });
  }
};

// @desc    Request password reset using Supabase Auth
// @route   POST /api/auth/reset-password-request
// @access  Public
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔵 [PASSWORD RESET] Request received for email:', email);

    // Check if user exists
    const { data: user } = await userHelpers.getUserByEmailOrUsername(email, '');
    if (!user) {
      console.log('🔴 [PASSWORD RESET] User not found:', email);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('🔵 [PASSWORD RESET] User found, sending reset email via Supabase Auth...');

    // Use Supabase Auth to send password reset email
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password`
    });

    if (error) {
      console.error('🔴 [PASSWORD RESET] Supabase Auth error:', error);
      return res.status(500).json({ 
        message: 'Failed to send password reset email. Check Supabase email configuration.',
        error: error.message
      });
    }

    console.log('✅ [PASSWORD RESET] Password reset email sent successfully via Supabase Auth');
    
    res.json({ 
      message: 'Password reset email sent successfully',
      expiresIn: 3600, // Supabase reset link expires in 1 hour
      method: 'supabase-auth'
    });
  } catch (error) {
    console.error('🔴 [PASSWORD RESET] Unexpected error:', error);
    res.status(500).json({ message: 'Error sending password reset email' });
  }
};

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Check if user exists
    const { data: user } = await userHelpers.getUserByEmailOrUsername(email, '');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find active OTP for this user
    const { data: otpRecord, error: otpFetchError } = await supabase
      .from('auth_logins')
      .select('*')
      .eq('user_id', user.id)
      .eq('method', 'otp')
      .eq('is_active', true)
      .eq('is_verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpFetchError || !otpRecord) {
      return res.status(400).json({ message: 'No valid OTP found. Please request a new OTP.' });
    }

    // Check if OTP has expired
    const now = new Date();
    if (new Date(otpRecord.otp_expires_at) < now) {
      // Mark OTP as inactive
      await supabase
        .from('auth_logins')
        .update({ is_active: false })
        .eq('id', otpRecord.id);
      
      return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
    }

    // Verify the OTP
    const isValidOTP = await bcrypt.compare(otp, otpRecord.otp_hash);
    if (!isValidOTP) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update password in Supabase Auth
    const { error: passwordUpdateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (passwordUpdateError) {
      console.error('Error updating password:', passwordUpdateError);
      return res.status(500).json({ message: 'Error updating password' });
    }

    // Mark OTP as verified and inactive
    const { error: updateError } = await supabase
      .from('auth_logins')
      .update({ 
        is_verified: true, 
        is_active: false,
        updated_at: new Date()
      })
      .eq('id', otpRecord.id);

    if (updateError) {
      console.error('Error updating OTP record:', updateError);
      // Continue even if logging fails
    }

    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.userId || req.userId;
    console.log('🔵 [GET CURRENT USER] Getting user profile for:', userId);
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const { data: userProfile, error } = await userHelpers.getUserById(userId);
    
    if (error || !userProfile) {
      console.log('🔴 [GET CURRENT USER] User profile not found:', error);
      return res.status(404).json({ message: 'User profile not found' });
    }

    console.log('✅ [GET CURRENT USER] User profile found:', userProfile.username);
    
    // Get the current token from the request
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;
    
    res.json({
      token: token, // Include the token in the response
      user: {
        id: userProfile.id,
        username: userProfile.username,
        email: userProfile.email,
        avatar: userProfile.avatar,
        points: userProfile.points,
        level: userProfile.level,
        streak: userProfile.streak,
        isAdmin: userProfile.is_admin,
        totalQuizzes: userProfile.total_quizzes,
        correctAnswers: userProfile.correct_answers,
        totalAnswers: userProfile.total_answers,
        learningStyle: userProfile.learning_style,
        difficultyPreference: userProfile.difficulty_preference,
        emailNotifications: userProfile.email_notifications,
        courseUpdates: userProfile.course_updates,
        achievementAlerts: userProfile.achievement_alerts,
        createdAt: userProfile.created_at,
        lastLogin: userProfile.last_login
      }
    });
  } catch (error) {
    console.log('🔴 [GET CURRENT USER] Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refresh = async (req, res) => {
  try {
    console.log('🔵 [REFRESH] Refresh request received');
    
    // Check for token in Authorization header or cookies
    let token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log('🔵 [REFRESH] Token found in cookies');
    }
    
    if (!token) {
      console.log('🔴 [REFRESH] No token provided in header or cookies');
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('✅ [REFRESH] Token is valid, user ID:', decoded.userId);
      
      // Get user data
      const { data: user } = await userHelpers.getUserById(decoded.userId);
      if (!user) {
        console.log('🔴 [REFRESH] User not found');
        return res.status(401).json({ message: 'User not found' });
      }

      console.log('✅ [REFRESH] Refresh successful for user:', user.username);
      res.json({
        message: 'Token refreshed successfully',
        token: token, // Return the same token
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          points: user.points || 0,
          level: user.level || 1,
          achievements: user.achievements || []
        }
      });
    } catch (tokenError) {
      console.log('🔴 [REFRESH] Token verification failed:', tokenError.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('🔴 [REFRESH] Error:', error);
    res.status(500).json({ message: 'Server error during refresh' });
  }
};

// Helper function to clean up expired OTPs
const cleanupExpiredOTPs = async () => {
  try {
    const now = new Date();
    await supabase
      .from('auth_logins')
      .update({ is_active: false })
      .eq('method', 'otp')
      .eq('is_active', true)
      .lt('otp_expires_at', now);
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  getCurrentUser,
  logout,
  sendOTP,
  verifyOTP,
  requestPasswordReset,
  resetPassword,
  refresh,
  cleanupExpiredOTPs
};