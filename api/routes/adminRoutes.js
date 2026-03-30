const express = require('express');
const { getUsers } = require('../controllers/userController');
const { getQuizzes, createQuiz } = require('../controllers/quizController');
const protect = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');

const router = express.Router();

// All admin routes are protected
router.use(protect, admin);

router.get('/users', getUsers);
router.get('/quizzes', getQuizzes);
router.post('/quizzes', createQuiz);

// Stubs for complex frontend admin routes to prevent errors before next iteration
router.post('/upload-quiz', (req, res) => res.json({ success: true }));
router.post('/questions', (req, res) => res.json({ success: true }));
router.delete('/quizzes/:id', (req, res) => res.json({ success: true }));
router.get('/quizzes/:id/questions', (req, res) => res.json([]));
router.put('/quizzes/:id', (req, res) => res.json({ success: true }));

module.exports = router;
