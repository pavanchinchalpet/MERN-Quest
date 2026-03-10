const { validationResult } = require("express-validator");
const { quizHelpers } = require("../utils/supabaseHelpers");

/*
UTILITY: Shuffle Array
*/
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/*
GET ALL QUIZZES
GET /api/quiz
*/
const getQuizzes = async (req, res) => {
  try {
    const { category, difficulty, limit = 10 } = req.query;

    const filters = {
      category,
      difficulty,
      limit: parseInt(limit)
    };

    const { data, error } = await quizHelpers.getAllQuizzes(filters);

    if (error) {
      console.error("Get quizzes error:", error);
      return res.status(500).json({ message: "Error fetching quizzes" });
    }

    const quizzes = data.map((quiz) => {
      const { correct_answer, ...rest } = quiz;
      return rest;
    });

    res.json(quizzes);
  } catch (err) {
    console.error("Get quizzes error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/*
GET QUIZ BY ID
GET /api/quiz/:id
*/
const getQuizById = async (req, res) => {
  try {
    const quizId = req.params.id;

    const { data, error } = await quizHelpers.getQuizById(quizId);

    if (error || !data) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const { correct_answer, ...quiz } = data;

    res.json(quiz);
  } catch (err) {
    console.error("Quiz fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/*
GET QUIZ QUESTIONS
GET /api/quiz/:id/questions
*/
const getQuizQuestions = async (req, res) => {

  try {

    const quizId = req.params.id;

    const { data, error } =
      await quizHelpers.getQuizQuestions(quizId);

    if (error) {
      return res.status(500).json({
        message: "Error fetching questions"
      });
    }

    const questions = data.map(q => ({
      id: q.id,
      question: q.question_text,
      options: q.options,
      points: q.points
    }));

    res.json(questions);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error"
    });

  }

};

/*
GET QUIZ CATEGORIES
GET /api/quiz/categories
*/
const getQuizCategories = async (req, res) => {
  try {
    const { data, error } = await quizHelpers.getQuizCategories();

    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Error fetching categories" });
    }

    const categories = data.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      icon: cat.icon
    }));

    res.json(categories);
  } catch (err) {
    console.error("Category error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/*
SUBMIT QUIZ
POST /api/quiz/submit
*/
const submitQuiz = async (req, res) => {

  try {

    const userId = req.user.userId;
    const { quizId, answers, timeTaken } = req.body;

    if (!quizId || !answers || answers.length === 0) {
      return res.status(400).json({
        message: "Quiz ID and answers required"
      });
    }

    const { data, error } =
      await quizHelpers.submitQuizAnswers(
        userId,
        quizId,
        answers,
        timeTaken
      );

    if (error) {
      console.error(error);
      return res.status(500).json({
        message: "Error submitting quiz"
      });
    }

    res.json(data);

  } catch (err) {

    console.error("Submit quiz error:", err);

    res.status(500).json({
      message: "Server error"
    });

  }

};

/*
GET QUIZ STATS
GET /api/quiz/stats
*/
const getQuizStats = async (req, res) => {
  try {
    const { data, error } = await quizHelpers.getAllQuizzes();

    if (error) {
      return res.status(500).json({ message: "Error fetching stats" });
    }

    const stats = {
      totalQuizzes: data.length,
      categories: {},
      difficulties: {}
    };

    data.forEach((quiz) => {
      stats.categories[quiz.category_id] =
        (stats.categories[quiz.category_id] || 0) + 1;

      stats.difficulties[quiz.difficulty] =
        (stats.difficulties[quiz.difficulty] || 0) + 1;
    });

    res.json(stats);
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getQuizzes,
  getQuizById,
  getQuizQuestions,
  getQuizCategories,
  submitQuiz,
  getQuizStats
};