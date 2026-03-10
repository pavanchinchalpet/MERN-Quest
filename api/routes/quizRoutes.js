const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  getQuizzes,
  getQuizById,
  getQuizQuestions,
  submitQuiz,
  getQuizCategories
} = require('../controllers/supabaseQuizController');

const router = express.Router();

// Get all quizzes
router.get('/', getQuizzes);

// Get quiz categories
router.get('/categories', getQuizCategories);

// Get quiz by id
router.get('/:id', getQuizById);

// Get questions
router.get('/:id/questions', getQuizQuestions);

// Submit quiz
router.post('/submit',
  auth,
  body('answers').isArray(),
  body('timeTaken').isInt(),
  submitQuiz
);

module.exports = router;