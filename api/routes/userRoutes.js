const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getUserProfile,
  updateUserProfile,
  getLeaderboard,
  getUserStats
} = require('../controllers/supabaseUserController');

const router = express.Router();

router.get('/profile', auth, getUserProfile);

router.put('/profile', auth, updateUserProfile);

router.get('/leaderboard', getLeaderboard);

router.get('/stats', auth, getUserStats);

module.exports = router;