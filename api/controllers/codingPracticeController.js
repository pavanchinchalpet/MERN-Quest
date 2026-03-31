const supabase = require('../config/supabaseClient');

// @desc    Get all coding practices
// @route   GET /api/practices
// @access  Private
const getPractices = async (req, res, next) => {
  try {
    const { data: practices, error } = await supabase
      .from('coding_practices')
      .select('id, title, description, difficulty, points, category, subcategory, created_at')
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

// @desc    Submit practice result
// @route   POST /api/practices/submit
// @access  Private
const submitPractice = async (req, res, next) => {
  try {
    const { id, score = 100 } = req.body;
    
    // For now, we simply record the completion. 
    // This can be expanded to check actual code execution results.
    const { error: scoreError } = await supabase.from('quiz_scores').insert([{
      user_id: req.user.id,
      score: score,
      total_questions: 1,
      correct_answers: score === 100 ? 1 : 0,
      points_earned: score === 100 ? 50 : 0, // DSA worth more
      streak: (req.user.streak || 0) + 1
    }]);

    if (scoreError) throw new Error(scoreError.message);

    // Update user XP
    const { data: user } = await supabase.from('users').select('points').eq('id', req.user.id).single();
    const newPoints = (user?.points || 0) + (score === 100 ? 50 : 0);
    
    await supabase.from('users').update({ 
      points: newPoints,
      streak: (req.user.streak || 0) + 1
    }).eq('id', req.user.id);

    res.json({ success: true, pointsEarned: score === 100 ? 50 : 0 });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPractices,
  getPracticeById,
  submitPractice
};
