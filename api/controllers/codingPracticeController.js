const supabase = require('../config/supabaseClient');
const { executeCode } = require('../services/executionService');
const { generateLiveTrace } = require('../services/liveTraceService');

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
    
    // Standardized response
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

// @desc    Submit practice code for execution and evaluation
// @route   POST /api/practices/submit
// @access  Private
const submitPractice = async (req, res, next) => {
  try {
    const { id, code, language, isTest = false } = req.body;

    if (!code) {
      res.status(400);
      throw new Error('Code is required');
    }

    // 1. Fetch the problem details including test cases
    const { data: practice, error: fetchError } = await supabase
      .from('coding_practices')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !practice) {
      res.status(404);
      throw new Error('Problem not found');
    }

    // 2. Execute code against test cases
    const executionLanguage = language || practice.category || 'javascript';
    const result = await executeCode(executionLanguage, code, practice.test_cases);
    const liveTrace = generateLiveTrace({ practice, code });

    // 3. Record the submission if it's not a test run
    let submission = null;
    if (!isTest) {
      const { data, error: subError } = await supabase
        .from('submissions')
        .insert([{
          user_id: req.user.id,
          practice_id: id,
          code: code,
          status: result.status,
          runtime: result.runtime,
          test_cases_passed: result.passedCount,
          total_test_cases: result.totalCount,
          error_message: !result.success ? result.error : null
        }])
        .select()
        .single();
      
      submission = data;
      if (subError) {
        console.error('Submission recording error:', subError);
      }
    }

    // 4. Update user stats if the solution is Accepted and not a test run
    let pointsEarned = 0;
    if (result.status === 'Accepted' && !isTest) {
      pointsEarned = practice.points || 50;
      
      // Update user XP and streak
      const { data: user } = await supabase.from('users').select('points, streak').eq('id', req.user.id).single();
      const newPoints = (user?.points || 0) + pointsEarned;
      const newStreak = (user?.streak || 0) + 1;
      
      await supabase.from('users').update({ 
        points: newPoints,
        streak: newStreak
      }).eq('id', req.user.id);
    }

    // 5. Send back standardized result
    res.json({ 
      success: true, 
      data: {
        status: result.status,
        runtime: result.runtime,
        passedCount: result.passedCount,
        totalCount: result.totalCount,
        results: result.results,
        userLogs: result.userLogs,
        error: result.error || null,
        language: executionLanguage,
        liveTrace,
        pointsEarned,
        submissionId: submission?.id
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPractices,
  getPracticeById,
  submitPractice
};
