const supabase = require('../config/supabaseClient');

// @desc    Get all coding practices
// @route   GET /api/practices
// @access  Private
const getPractices = async (req, res, next) => {
  try {
    const { data: practices, error } = await supabase
      .from('coding_practices')
      .select('id, title, description, difficulty, points, created_at')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    res.json({ success: true, count: practices.length, data: practices });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single coding practice
// @route   GET /api/practices/:id
// @access  Private
const getPracticeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: practice, error } = await supabase
      .from('coding_practices')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !practice) {
      res.status(404);
      throw new Error('Coding practice not found');
    }

    res.json({ success: true, data: practice });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPractices,
  getPracticeById
};
