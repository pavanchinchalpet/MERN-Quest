const supabase = require("../config/supabase");

/*
========================================
USER HELPERS
========================================
*/

const userHelpers = {
  // Create user profile
  createUserProfile: async (userId, userData) => {
    const client = supabase.getServiceClient() || supabase;

    const { data, error } = await client
      .from("users")
      .insert({
        id: userId,
        username: userData.username,
        email: userData.email,
        avatar: userData.avatar || "default",
        role: userData.role || "user",
        streak: 0
      })
      .select()
      .single();

    return { data, error };
  },

  // Get user by email or username
  getUserByEmailOrUsername: async (email, username) => {
    const client = supabase.getServiceClient() || supabase;

    let query = client.from("users").select("*");

    if (email && username) {
      query = query.or(`email.eq.${email},username.eq.${username}`);
    } else if (email) {
      query = query.eq("email", email);
    } else if (username) {
      query = query.eq("username", username);
    }

    const { data, error } = await query.maybeSingle();

    return { data, error };
  },

  // Get user by ID
  getUserById: async (userId) => {
    const client = supabase.getServiceClient() || supabase;

    const { data, error } = await client
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    return { data, error };
  },

  // Update profile
  updateUserProfile: async (userId, updates) => {
    const client = supabase.getServiceClient() || supabase;

    const { data, error } = await client
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    return { data, error };
  },

  // Leaderboard
  getLeaderboard: async (limit = 10) => {
    const client = supabase.getServiceClient() || supabase;

    const { data, error } = await client
      .from("users")
      .select("id, username, points, level, avatar")
      .order("points", { ascending: false })
      .limit(limit);

    return { data, error };
  }
};

/*
========================================
QUIZ HELPERS
========================================
*/

const quizHelpers = {

  /*
  GET ALL QUIZZES
  */
  getAllQuizzes: async (filters = {}) => {

    const client = supabase.getServiceClient() || supabase;

    let query = client
      .from("quizzes")
      .select(`
        *,
        quiz_category:quiz_categories(
          id,
          name,
          title
        )
      `)
      .eq("is_active", true);

    if (filters.category)
      query = query.eq("category_id", filters.category);

    if (filters.difficulty)
      query = query.eq("difficulty", filters.difficulty);

    if (filters.limit)
      query = query.limit(filters.limit);

    const { data, error } = await query;

    return { data, error };
  },


  /*
  GET QUIZ BY ID
  */
  getQuizById: async (quizId) => {

    const client = supabase.getServiceClient() || supabase;

    const { data, error } = await client
      .from("quizzes")
      .select(`
        *,
        quiz_category:quiz_categories(
          id,
          name,
          title
        )
      `)
      .eq("id", quizId)
      .single();

    return { data, error };
  },


  /*
  GET QUIZ QUESTIONS
  */
  getQuizQuestions: async (quizId) => {
    const { data, error } = await quizHelpers.getQuizById(quizId);

    return { data, error };
  },


  /*
  GET QUIZ CATEGORIES
  */
  getQuizCategories: async () => {

    const client = supabase.getServiceClient() || supabase;

    const { data, error } = await client
      .from("quiz_categories")
      .select("id,name,title,created_at");

    return { data, error };
  },


  /*
  SUBMIT QUIZ
  */
  submitQuizAnswers: async (userId, quizId, answers, timeTaken) => {

    try {

      const client = supabase.getServiceClient() || supabase;

      const questionIds = answers.map(a => a.questionId);

      const { data: questions, error } = await client
        .from("quizzes")
        .select("*")
        .in("id", questionIds);

      if (error) return { data: null, error };

      let correctAnswers = 0;
      let pointsEarned = 0;

      questions.forEach(q => {

        const userAnswer = answers.find(a => String(a.questionId) === String(q.id));

        if (
          userAnswer &&
          String(userAnswer.selectedAnswer ?? userAnswer.answer).trim().toLowerCase() ===
            String(q.answer).trim().toLowerCase()
        ) {
          correctAnswers++;
          pointsEarned += q.points || 10;
        }

      });

      const totalQuestions = answers.length;

      const score = Math.round((correctAnswers / totalQuestions) * 100);

      const { data: scoreData, error: scoreError } = await client
        .from("quiz_scores")
        .insert({
          user_id: userId,
          quiz_id: quizId,
          score,
          time_taken: Math.max(timeTaken, 1),
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          points_earned: pointsEarned,
        })
        .select()
        .single();

      if (scoreError) return { data: null, error: scoreError };

      // We no longer update the `users` table with points/totals because
      // those columns don't exist in the current schema. They will be 
      // dynamically calculated in the user controller via `quiz_scores`.

      return {
        data: {
          score,
          correctAnswers,
          totalQuestions,
          pointsEarned,
          timeTaken
        },
        error: null
      };

    } catch (err) {

      return { data: null, error: err };

    }
  }

};

/*
========================================
COURSE HELPERS
========================================
*/

const courseHelpers = {
  getAllCourses: async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("is_published", true);

    return { data, error };
  },

  getCourseById: async (courseId) => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    return { data, error };
  },

  getLessonsByCourse: async (courseId) => {
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", courseId)
      .eq("is_published", true)
      .order("order_index");

    return { data, error };
  }
};

module.exports = {
  userHelpers,
  quizHelpers,
  courseHelpers
};
