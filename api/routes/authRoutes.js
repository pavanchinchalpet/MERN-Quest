const express = require('express');
const { body } = require('express-validator');
const {
  registerUser,
  loginUser,
  startGoogleOAuth,
  handleGoogleOAuthCallback,
  logoutUser,
  refreshAccessToken,
  getMe,
} = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest'); // We will create this generic validation interceptor

const router = express.Router();

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be 6 or more characters'),
  ],
  validateRequest,
  registerUser
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  validateRequest,
  loginUser
);

router.post('/logout', protect, logoutUser);
router.post('/refresh', refreshAccessToken);
router.get('/google', startGoogleOAuth);
router.get('/google/callback', handleGoogleOAuthCallback);
router.get('/me', protect, getMe);
router.get('/profile', protect, getMe);

module.exports = router;
