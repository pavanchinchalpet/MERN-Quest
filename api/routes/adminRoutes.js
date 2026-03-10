const express = require('express');
const { auth } = require('../middleware/auth');
const supabase = require('../config/supabase');

const router = express.Router();

/*
ADMIN MIDDLEWARE
*/
const adminOnly = (req, res, next) => {

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Admin access required'
    });
  }

  next();
};


/*
GET ALL QUIZZES
*/
router.get('/quizzes', auth, adminOnly, async (req, res) => {

  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});


/*
CREATE QUIZ
*/
router.post('/quizzes', auth, adminOnly, async (req, res) => {

  const { title, description, category, difficulty, timeLimit } = req.body;

  const { data, error } = await supabase
    .from('quizzes')
    .insert({
      title,
      description,
      category,
      difficulty,
      time_limit: timeLimit || 30,
      created_by: req.user.id,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});


/*
ADD QUESTION
*/
router.post('/questions', auth, adminOnly, async (req, res) => {

  const { quizId, question, options, correctAnswer, explanation } = req.body;

  if (!question || !options || options.length !== 4) {
    return res.status(400).json({
      message: 'Question and 4 options required'
    });
  }

  const { data, error } = await supabase
    .from('quiz_questions')
    .insert({
      quiz_id: quizId,
      question_text: question,
      options,
      correct_answer: correctAnswer,
      explanation,
      created_by: req.user.id
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});


/*
GET QUIZ QUESTIONS
*/
router.get('/quizzes/:quizId/questions', auth, adminOnly, async (req, res) => {

  const { quizId } = req.params;

  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});


/*
DELETE QUIZ
*/
router.delete('/quizzes/:quizId', auth, adminOnly, async (req, res) => {

  const { quizId } = req.params;

  await supabase
    .from('quiz_questions')
    .delete()
    .eq('quiz_id', quizId);

  await supabase
    .from('quiz_scores')
    .delete()
    .eq('quiz_id', quizId);

  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', quizId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    message: 'Quiz deleted'
  });
});

module.exports = router;