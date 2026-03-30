const supabase = require('../config/supabaseClient');

// @desc    Get all assessments
// @route   GET /api/assessments
// @access  Private
const getAssessments = async (req, res, next) => {
  try {
    const { data: assessments, error } = await supabase
      .from('assessments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    res.json({ success: true, count: assessments.length, data: assessments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single assessment
// @route   GET /api/assessments/:id
// @access  Private
const getAssessmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: assessment, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !assessment) {
      res.status(404);
      throw new Error('Assessment not found');
    }

    res.json({ success: true, data: assessment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssessments,
  getAssessmentById
};
