const express = require('express');
const router = express.Router();
const { getAssessments, getAssessmentById } = require('../controllers/assessmentController');
const protect = require('../middleware/authMiddleware');

router.get('/', protect, getAssessments);
router.get('/:id', protect, getAssessmentById);

module.exports = router;
