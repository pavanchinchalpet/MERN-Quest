const express = require('express');
const { getUsers, getProfile, getStats, getAchievements, getLeaderboard, updateProfile } = require('../controllers/userController');
const protect = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/profile', protect, getProfile);
router.get('/stats', protect, getStats);
router.get('/achievements', protect, getAchievements);
router.get('/leaderboard', protect, getLeaderboard);
router.put('/profile', protect, updateProfile);
router.get('/', protect, admin, getUsers);

module.exports = router;
