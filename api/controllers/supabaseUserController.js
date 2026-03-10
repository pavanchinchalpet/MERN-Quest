const { userHelpers } = require("../utils/supabaseHelpers");
const supabase = require("../config/supabase");

/*
GET USER PROFILE
GET /api/user/profile
*/
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: user, error } = await userHelpers.getUserById(userId);

    if (error || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Since `users` table doesn't have stat columns, compute it from quiz_scores
    const { data: scores } = await supabase
      .from("quiz_scores")
      .select("points_earned, total_questions, correct_answers")
      .eq("user_id", userId);

    const stats = (scores || []).reduce(
      (acc, score) => ({
        points: acc.points + (score.points_earned || 0),
        totalAnswers: acc.totalAnswers + (score.total_questions || 0),
        correctAnswers: acc.correctAnswers + (score.correct_answers || 0),
        totalQuizzes: acc.totalQuizzes + 1,
      }),
      { points: 0, totalAnswers: 0, correctAnswers: 0, totalQuizzes: 0 }
    );

    const level = Math.floor(stats.points / 100) + 1; // Basic level calculation

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      points: stats.points,
      level: level,
      streak: user.streak || 0,
      role: user.role,
      totalQuizzes: stats.totalQuizzes,
      correctAnswers: stats.correctAnswers,
      totalAnswers: stats.totalAnswers,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/*
UPDATE USER PROFILE
PUT /api/user/profile
*/
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, avatar } = req.body;

    const updates = {};

    if (username) {
      const { data: existingUser } =
        await userHelpers.getUserByEmailOrUsername("", username);

      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Username already taken" });
      }

      updates.username = username;
    }

    if (avatar) updates.avatar = avatar;

    const { data: updatedUser, error } =
      await userHelpers.updateUserProfile(userId, updates);

    if (error) {
      console.error("Update profile error:", error);
      return res.status(500).json({ message: "Error updating profile" });
    }

    res.json({
      message: "Profile updated",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/*
GET LEADERBOARD
GET /api/user/leaderboard
*/
const getLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const { data: users, error } = await supabase
      .from("users")
      .select("id, username, avatar");

    if (error) {
      console.error("Leaderboard error:", error);
      return res.status(500).json({ message: "Error fetching leaderboard users" });
    }

    // Get all scores
    const { data: allScores } = await supabase
      .from("quiz_scores")
      .select("user_id, points_earned");
      
    const userScores = users.map(user => {
      const userPoints = (allScores || [])
        .filter(s => s.user_id === user.id)
        .reduce((sum, score) => sum + (score.points_earned || 0), 0);
        
      return {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        points: userPoints,
        level: Math.floor(userPoints / 100) + 1
      };
    });

    // Sort by points descending and taking the top "limit"
    const leaderboard = userScores
      .sort((a, b) => b.points - a.points)
      .slice(0, parseInt(limit))
      .map((user, index) => ({
        rank: index + 1,
        id: user.id,
        username: user.username,
        points: user.points,
        level: user.level,
        avatar: user.avatar
      }));

    res.json(leaderboard);
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/*
GET USER STATS
GET /api/user/stats
*/
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: user, error } = await userHelpers.getUserById(userId);

    if (error || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { data: scores, error: scoreError } = await supabase
      .from("quiz_scores")
      .select("*")
      .eq("user_id", userId)
      .order("attempted_at", { ascending: false })
      .limit(10);

    if (scoreError) {
      console.error(scoreError);
    }

    const stats = (scores || []).reduce(
      (acc, score) => ({
        points: acc.points + (score.points_earned || 0),
        totalAnswers: acc.totalAnswers + (score.total_questions || 0),
        correctAnswers: acc.correctAnswers + (score.correct_answers || 0),
        totalQuizzes: acc.totalQuizzes + 1,
      }),
      { points: 0, totalAnswers: 0, correctAnswers: 0, totalQuizzes: 0 }
    );

    const combinedStats = {
      totalQuizzes: stats.totalQuizzes,
      correctAnswers: stats.correctAnswers,
      totalAnswers: stats.totalAnswers,
      points: stats.points,
      level: Math.floor(stats.points / 100) + 1,
      streak: user.streak || 0,
      accuracy:
        stats.totalAnswers > 0
          ? Math.round((stats.correctAnswers / stats.totalAnswers) * 100)
          : 0,
      recentScores:
        scores?.slice(0, 10).map((s) => ({
          score: s.score,
          correctAnswers: s.correct_answers,
          totalQuestions: s.total_questions,
          pointsEarned: s.points_earned,
          timeTaken: s.time_taken,
          attemptedAt: s.attempted_at
        })) || []
    };

    res.json(combinedStats);
  } catch (error) {
    console.error("User stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/*
GET USER ACHIEVEMENTS
GET /api/user/achievements
*/
const getUserAchievements = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: user } = await userHelpers.getUserById(userId);

    const { data: scores } = await supabase
      .from("quiz_scores")
      .select("points_earned")
      .eq("user_id", userId);

    const totalQuizzes = scores?.length || 0;
    const totalPoints = (scores || []).reduce((sum, score) => sum + (score.points_earned || 0), 0);

    const achievements = [];

    if (totalQuizzes >= 1)
      achievements.push({
        name: "First Quiz",
        icon: "🎯"
      });

    if (totalQuizzes >= 10)
      achievements.push({
        name: "Quiz Explorer",
        icon: "📚"
      });

    if (totalPoints >= 500)
      achievements.push({
        name: "Quiz Master",
        icon: "🏆"
      });

    if (user.streak >= 5)
      achievements.push({
        name: "Streak Champion",
        icon: "🔥"
      });

    res.json(achievements);
  } catch (error) {
    console.error("Achievements error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getLeaderboard,
  getUserStats,
  getUserAchievements
};