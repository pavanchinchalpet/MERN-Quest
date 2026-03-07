const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { userHelpers } = require('../utils/supabaseHelpers');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required in environment variables');
}

/*
--------------------------------
COOKIE CONFIGURATION
--------------------------------
*/

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
};

/*
--------------------------------
HELPERS
--------------------------------
*/

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: '7d'
  });
};

const extractToken = (req) => {
  return (
    req.header('Authorization')?.replace('Bearer ', '') ||
    req.cookies?.token
  );
};

/*
--------------------------------
REGISTER
--------------------------------
*/

const register = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { username, email, password } = req.body;

    const { data: existingUser } =
      await userHelpers.getUserByEmailOrUsername(email, username);

    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === email
            ? 'Email already registered'
            : 'Username already taken'
      });
    }

    const serviceClient = supabase.getServiceClient();

    if (!serviceClient) {
      return res.status(500).json({
        message: 'Service role not configured'
      });
    }

    const { data: authData, error: authError } =
      await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username }
      });

    if (authError || !authData.user) {
      return res.status(400).json({
        message: authError?.message || 'User creation failed'
      });
    }

    await userHelpers.createUserProfile(authData.user.id, {
      username,
      email,
      avatar: 'default'
    });

    const token = generateToken(authData.user.id);

    res.cookie('token', token, cookieOptions);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: authData.user.id,
        username,
        email
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/*
--------------------------------
LOGIN
--------------------------------
*/

const login = async (req, res) => {
  try {

    const errors = validationResult(req);

    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    const { data: userProfile } =
      await userHelpers.getUserByEmailOrUsername(email, '');

    if (!userProfile)
      return res.status(401).json({ message: 'Invalid credentials' });

    const { data: authData, error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error || !authData.user)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(authData.user.id);

    res.cookie('token', token, cookieOptions);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: userProfile.id,
        username: userProfile.username,
        email: userProfile.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/*
--------------------------------
GET PROFILE
--------------------------------
*/

const getProfile = async (req, res) => {
  try {

    const userId = req.user.userId;

    const { data: user } =
      await userHelpers.getUserById(userId);

    if (!user)
      return res.status(404).json({
        message: 'User not found'
      });

    res.json({ user });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/*
--------------------------------
GET CURRENT USER
--------------------------------
*/

const getCurrentUser = async (req, res) => {
  try {

    const userId = req.user?.userId;

    if (!userId)
      return res.status(401).json({
        message: 'Not authenticated'
      });

    const { data: userProfile, error } =
      await userHelpers.getUserById(userId);

    if (error || !userProfile)
      return res.status(404).json({
        message: 'User not found'
      });

    res.json({
      user: userProfile
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/*
--------------------------------
LOGOUT
--------------------------------
*/

const logout = async (req, res) => {

  res.clearCookie('token', cookieOptions);

  res.json({
    message: 'Logout successful'
  });
};

/*
--------------------------------
SEND OTP
--------------------------------
*/

const sendOTP = async (req, res) => {
  try {

    const { email } = req.body;

    const { data: user } =
      await userHelpers.getUserByEmailOrUsername(email, '');

    if (!user)
      return res.status(404).json({
        message: 'User not found'
      });

    const { error } =
      await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false
        }
      });

    if (error)
      return res.status(500).json({
        message: error.message
      });

    res.json({
      message: 'OTP sent successfully',
      expiresIn: 300
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error sending OTP'
    });
  }
};

/*
--------------------------------
VERIFY OTP
--------------------------------
*/

const verifyOTP = async (req, res) => {
  try {

    const { email, otp } = req.body;

    const { data, error } =
      await supabase.auth.verifyOtp({
        email,
        token: String(otp),
        type: 'email'
      });

    if (error || !data.user)
      return res.status(400).json({
        message: 'Invalid OTP'
      });

    const { data: userProfile } =
      await userHelpers.getUserByEmailOrUsername(email, '');

    const token = generateToken(userProfile.id);

    res.cookie('token', token, cookieOptions);

    res.json({
      message: 'OTP verified successfully',
      token,
      user: userProfile
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error verifying OTP'
    });
  }
};

/*
--------------------------------
REQUEST PASSWORD RESET
--------------------------------
*/

const requestPasswordReset = async (req, res) => {
  try {

    const { email } = req.body;

    const { error } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.CLIENT_URL}/reset-password`
      });

    if (error)
      return res.status(500).json({
        message: error.message
      });

    res.json({
      message: 'Password reset email sent'
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error sending reset email'
    });
  }
};

/*
--------------------------------
RESET PASSWORD
--------------------------------
*/

const resetPassword = async (req, res) => {
  try {

    const { password } = req.body;

    const { error } =
      await supabase.auth.updateUser({
        password
      });

    if (error)
      return res.status(400).json({
        message: error.message
      });

    res.json({
      message: 'Password updated successfully'
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error resetting password'
    });
  }
};

/*
--------------------------------
REFRESH TOKEN
--------------------------------
*/

const refresh = async (req, res) => {
  try {

    const token = extractToken(req);

    if (!token)
      return res.status(401).json({
        message: 'No token provided'
      });

    const decoded = jwt.verify(token, JWT_SECRET);

    const newToken = generateToken(decoded.userId);

    res.cookie('token', newToken, cookieOptions);

    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    });

  } catch (error) {
    res.status(401).json({
      message: 'Invalid token'
    });
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
  refresh
};