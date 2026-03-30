const express = require('express');
const router = express.Router();
const { getPractices, getPracticeById, submitPractice } = require('../controllers/codingPracticeController');
const protect = require('../middleware/authMiddleware');

router.get('/', protect, getPractices);
router.post('/submit', protect, submitPractice);
router.get('/:id', protect, getPracticeById);

module.exports = router;
