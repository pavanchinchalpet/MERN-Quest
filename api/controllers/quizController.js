const supabase = require('../config/supabaseClient');

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Private
const getQuizzes = async (req, res, next) => {
  try {
    // Optional query parameters for filtering/pagination
    const { category_id, limit = 50, offset = 0 } = req.query;

    let query = supabase.from('quizzes').select('*').eq('is_active', true);
    
    if (category_id) {
      query = query.eq('category_id', category_id);
    }
    
    const { data: quizzes, error } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    res.json({ success: true, count: quizzes.length, data: quizzes });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Private
const getQuizById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !quiz) {
      res.status(404);
      throw new Error('Quiz not found');
    }

    res.json({ success: true, data: quiz });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a quiz (Admin)
// @route   POST /api/quizzes
// @access  Private/Admin
const createQuiz = async (req, res, next) => {
  try {
    const { title, description, question_text, options, answer, explanation, difficulty, points, time_limit, category_id } = req.body;

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert([
        {
          title,
          description,
          question_text,
          options,
          answer,
          explanation,
          difficulty: difficulty || 'medium',
          points: points || 10,
          time_limit: time_limit || 30,
          category_id,
          created_by: req.user.id,
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);

    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all categories
// @route   GET /api/quiz/categories
// @access  Private
const getCategories = async (req, res, next) => {
  try {
    const { data: categories, error } = await supabase
      .from('quiz_categories')
      .select('*');

    if (error) throw new Error(error.message);

    res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit quiz result
// @route   POST /api/quiz/submit
// @access  Private
const submitQuiz = async (req, res, next) => {
  try {
    const { answers, timeTaken } = req.body;
    if (!answers || !Array.isArray(answers)) {
      res.status(400);
      throw new Error('Answers are required');
    }

    const questionIds = answers.map(a => Number(a.questionId) || a.questionId);
    
    // Fetch all questions
    const { data: questions, error } = await supabase
      .from('quizzes')
      .select('*')
      .in('id', questionIds);
      
    if (error) throw new Error(error.message);

    let correctAnswers = 0;
    let pointsEarned = 0;
    const review = [];

    for (const ans of answers) {
      const q = questions.find(q => String(q.id) === String(ans.questionId));
      if (!q) continue;

      const isCorrect = String(ans.selectedAnswer).trim().toLowerCase() === String(q.answer).trim().toLowerCase();
      if (isCorrect) {
        correctAnswers++;
        pointsEarned += (q.points || 10);
      }

      review.push({
        questionId: q.id,
        question: q.question_text,
        selectedAnswer: ans.selectedAnswer,
        correctAnswer: q.answer,
        isCorrect,
        explanation: q.explanation
      });
    }

    const totalQuestions = Math.max(questionIds.length, 1);
    const score = Math.round((correctAnswers / totalQuestions) * 100) || 0;
    
    // Update streak (simplified logic)
    let newStreak = req.user.streak || 0;
    if (score >= 60) {
      newStreak += 1;
    } else {
      newStreak = 0;
    }

    // Insert into quiz_scores 
    await supabase.from('quiz_scores').insert([{
      user_id: req.user.id,
      score: score,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      time_taken: timeTaken || 0,
      points_earned: pointsEarned,
      streak: newStreak
    }]);

    // Update user stats (streak, total points etc)
    const { data: userData } = await supabase.from('users').select('points, level').eq('id', req.user.id).single();
    const newTotalPoints = (userData?.points || 0) + pointsEarned;
    const newLevel = Math.floor(newTotalPoints / 150) + 1;

    await supabase.from('users').update({
      streak: newStreak,
      points: newTotalPoints,
      level: newLevel
    }).eq('id', req.user.id);

    res.status(201).json({
      success: true,
      score,
      correctAnswers,
      totalQuestions,
      pointsEarned,
      streak: newStreak,
      timeTaken,
      review
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuizzes,
  getQuizById,
  createQuiz,
  getCategories,
  submitQuiz
};
