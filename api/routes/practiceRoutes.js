const express = require('express');
const router = express.Router();
const { getPractices, getPracticeById } = require('../controllers/codingPracticeController');
const protect = require('../middleware/authMiddleware');

router.get('/', protect, getPractices);
router.get('/:id', protect, getPracticeById);

module.exports = router;
