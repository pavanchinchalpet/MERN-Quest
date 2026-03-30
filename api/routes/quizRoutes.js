const express = require('express');
const { getQuizzes, getQuizById, createQuiz, getCategories, submitQuiz } = require('../controllers/quizController');
const protect = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/categories', protect, getCategories);
router.post('/submit', protect, submitQuiz);

router.route('/')
  .get(protect, getQuizzes)
  .post(protect, admin, createQuiz);

router.route('/:id')
  .get(protect, getQuizById);

module.exports = router;