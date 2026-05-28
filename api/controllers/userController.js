const supabase = require('../config/supabaseClient');

const buildUserProfile = async (userId) => {
  const { data: profile, error } = await supabase
    .from('users')
    .select('id, username, email, name, role, avatar, points, level, streak, last_login, created_at')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return profile;
};

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, name, role, streak, last_login, created_at');

    if (error) throw new Error(error.message);

    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user stats
// @route   GET /api/user/stats
// @access  Private
const getStats = async (req, res, next) => {
  try {
    const { data: userStats, error } = await supabase
      .from('users')
      .select('points, level, streak')
      .eq('id', req.user.id)
      .single();

    if (error) throw new Error(error.message);

    const { data: recentScores, error: scoreError } = await supabase
      .from('quiz_scores')
      .select('id, quiz_id, score, correct_answers, total_questions, points_earned, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (scoreError) throw new Error(scoreError.message);

    const totalQuizzes = recentScores.length;
    const pointsEarnedThisWeek = recentScores.reduce((sum, score) => sum + (score.points_earned || 0), 0);

    const formattedScores = recentScores.map(score => ({
      id: score.id,
      quizTitle: score.quiz_id ? 'Quiz Attempt' : 'Assessment Attempt',
      category: 'General', 
      score: score.score,
      correctAnswers: score.correct_answers,
      totalQuestions: score.total_questions,
      pointsEarned: score.points_earned,
      attemptedAt: score.created_at
    }));

    res.json({
      success: true,
      data: {
        points: userStats?.points || 0,
        level: userStats?.level || 1,
        streak: userStats?.streak || 0,
        totalQuizzes,
        pointsEarnedThisWeek,
        recentScores: formattedScores
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/user/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const profile = await buildUserProfile(req.user.id);

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user achievements
// @route   GET /api/user/achievements
// @access  Private
const getAchievements = async (req, res, next) => {
  try {
    const { data: userStats } = await supabase
      .from('users')
      .select('points, level, streak')
      .eq('id', req.user.id)
      .single();
      
    const level = userStats?.level || 1;
    const streak = userStats?.streak || 0;
    
    // Mock achievements since we don't have an achievements table
    const achievements = [
      { id: 1, title: 'First Quest', description: 'Take your first quiz', icon: '🎯', unlocked: true },
      { id: 2, title: 'On a Roll', description: 'Reach a 3-day streak', icon: '🔥', unlocked: streak >= 3 },
      { id: 3, title: 'Rising Star', description: 'Reach Level 2', icon: '⭐', unlocked: level >= 2 },
      { id: 4, title: 'Knowledge Seeker', description: 'Reach Level 5', icon: '🧠', unlocked: level >= 5 },
      { id: 5, title: 'MERN Master', description: 'Reach Level 10', icon: '👑', unlocked: level >= 10 },
      { id: 6, title: 'Dedicated', description: 'Reach a 7-day streak', icon: '📅', unlocked: streak >= 7 },
    ];

    res.json({ success: true, data: achievements });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leaderboard
// @route   GET /api/user/leaderboard
// @access  Private
const getLeaderboard = async (req, res, next) => {
  try {
    const { data: leaderboard, error } = await supabase
      .from('users')
      .select('id, username, points, level, streak, avatar')
      .order('points', { ascending: false })
      .order('streak', { ascending: false })
      .limit(50);
      
    if (error) throw new Error(error.message);

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { username, avatar } = req.body;
    
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ username, avatar })
      .eq('id', req.user.id)
      .select('id, username, email, name, role, points, level, streak, avatar')
      .single();

    if (error) throw new Error(error.message);

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getProfile,
  getStats,
  getAchievements,
  getLeaderboard,
  updateProfile
};
