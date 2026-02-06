const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const supabaseAuth = require('../controllers/supabaseAuthController');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], supabaseAuth.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .exists()
    .withMessage('Password is required')
], supabaseAuth.login);

// @route   POST /api/auth/send-otp
// @desc    Send OTP for login (custom JWT flow)
// @access  Public
router.post('/send-otp', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
], supabaseAuth.sendOTP);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login (custom JWT flow)
// @access  Public
router.post('/verify-otp', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('otp')
    .custom((value) => {
      const s = String(value || '').trim();
      return s.length === 6 && /^\d{6}$/.test(s);
    })
    .withMessage('OTP must be 6 digits')
], supabaseAuth.verifyOTP);

// @route   POST /api/auth/reset-password-request
// @desc    Request password reset OTP
// @access  Public
router.post('/reset-password-request', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
], supabaseAuth.requestPasswordReset);

// @route   POST /api/auth/reset-password
// @desc    Reset password with OTP
// @access  Public
router.post('/reset-password', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], supabaseAuth.resetPassword);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, supabaseAuth.getCurrentUser);

// @route   GET /api/auth/profile
// @desc    Get current user profile (alternative endpoint)
// @access  Private
router.get('/profile', auth, supabaseAuth.getProfile);

// @route   POST /api/auth/logout
// @desc    Logout user (clear cookie) - allow even if not authenticated
// @access  Public
router.post('/logout', supabaseAuth.logout);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', supabaseAuth.refresh);

module.exports = router;
