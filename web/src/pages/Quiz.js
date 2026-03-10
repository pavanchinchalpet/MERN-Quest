import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { QuizSkeleton } from '../components/SkeletonLoader';

const Quiz = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [quizCategories, setQuizCategories] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [showFullReview, setShowFullReview] = useState(false);
  const [examActive, setExamActive] = useState(false);
  const [pausedQuiz, setPausedQuiz] = useState(null);
  const [quizProgress, setQuizProgress] = useState(0);
  const autoSubmitTriggeredRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadQuizData();
  }, []);

  useEffect(() => {
    if (selectedQuiz && selectedQuiz.questions) {
      const totalQuestions = selectedQuiz.questions.length;
      const answeredQuestions = Object.keys(selectedAnswers).length;
      setQuizProgress(Math.round((answeredQuestions / totalQuestions) * 100));
    }
  }, [selectedAnswers, selectedQuiz]);

  const handleAutoSubmit = useCallback(async () => {
    if (submitting) return;
    
    setTimerActive(false);
    setSubmitting(true);
    
    try {
      const answers = Object.entries(selectedAnswers).map(([questionId, answer]) => ({
        questionId,
        selectedAnswer: answer
      }));

      const actualTimeTaken = Math.floor((Date.now() - startTime) / 1000);

      const response = await api.post('/quiz/submit', {
        answers,
        timeTaken: actualTimeTaken
      });

      setResults(response.data);
      setQuizComplete(true);
      if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
        try {
          if (document.exitFullscreen) await document.exitFullscreen();
          else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
          else if (document.msExitFullscreen) await document.msExitFullscreen();
        } catch (_) {}
      }
    } catch (error) {
      console.error('Error auto-submitting quiz:', error);
      alert('Time\'s up! Quiz submitted automatically.');
    } finally {
      setSubmitting(false);
    }
  }, [submitting, selectedAnswers, startTime]);

  const handleQuizExit = useCallback(async () => {
    if (autoSubmitTriggeredRef.current || submitting || quizComplete) return;
    
    setPausedQuiz({
      ...selectedQuiz,
      currentIndex: currentQuizIndex,
      answers: selectedAnswers,
      timeLeft: timeLeft,
      startTime: startTime
    });
    
    setTimerActive(false); 
    setExamActive(false); 
    setSelectedQuiz(null); 
    
    try {
      await exitFullscreen();
    } catch (_) {}
    
    alert('Quiz paused. You can resume by clicking "Resume Quiz" below.');
  }, [submitting, quizComplete, selectedQuiz, currentQuizIndex, selectedAnswers, timeLeft, startTime]);

  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      handleAutoSubmit();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, handleAutoSubmit]);

  const startTimer = (minutes) => {
    setTimeLeft(minutes * 60);
    setTimerActive(true);
    setStartTime(Date.now());
  };

  const stopTimer = () => {
    setTimerActive(false);
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const loadQuizData = async () => {
    try {
      setLoading(true);
      
      const [categoriesResponse, quizzesResponse] = await Promise.all([
        api.get('/quiz/categories'),
        api.get('/quiz?limit=200')
      ]);
      
      const questionCountsByCategory = {};
      const categoryDifficulties = {};
      
      if (quizzesResponse.data && quizzesResponse.data.length > 0) {
        quizzesResponse.data.forEach(quiz => {
          if (quiz.category_id) {
            if (!questionCountsByCategory[quiz.category_id]) {
              questionCountsByCategory[quiz.category_id] = 0;
            }
            questionCountsByCategory[quiz.category_id]++;
            
            if (quiz.difficulty) {
              categoryDifficulties[quiz.category_id] = quiz.difficulty;
            }
          }
        });
      }
      
      const normalizedCategories = (categoriesResponse.data || []).map((ct) => {
        const actualCount = questionCountsByCategory[ct.id] || ct.count || ct.questions || 0;
        
        const normalizedCategory = {
          id: ct.id,
          title: ct.title || ct.name || 'Category',
          description: ct.description || '',
          icon: ct.icon || '📚',
          difficulty: ct.difficulty || categoryDifficulties[ct.id] || undefined,
          timeLimit: ct.timeLimit || Math.ceil(actualCount * 2),
          xp: ct.xp || Math.max(actualCount * 10, 50),
          questions: actualCount
        };
        
        return normalizedCategory;
      });

      setQuizCategories(normalizedCategories);
      setQuizzes(quizzesResponse.data);
    } catch (error) {
      console.error('Error loading quiz data:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestFullscreen = async () => {
    const el = document.documentElement;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
    } catch (_) {}
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
      else if (document.msExitFullscreen) await document.msExitFullscreen();
    } catch (_) {}
  };

  const handleQuizSelect = async (categoryId) => {
    const selectedCategory = quizCategories.find(cat => cat.id === categoryId);
    if (selectedCategory) {
      const filteredQuizzes = quizzes.filter((quiz) => quiz.category_id === categoryId);
      
      if (filteredQuizzes.length > 0) {
        try {
          const questions = filteredQuizzes.map(quiz => ({
            id: quiz.id,
            question: quiz.question_text,
            options: quiz.options,
            correctAnswer: quiz.answer,
            explanation: quiz.explanation,
            points: quiz.points || 10
          }));
          
          if (questions.length > 0) {
            const selectedQuestions = questions;
            
            setSelectedQuiz({
              ...selectedCategory,
              questions: selectedQuestions
            });
            setCurrentQuizIndex(0);
            setSelectedAnswers({});
            setQuizComplete(false);
            setResults(null);
            
            const calculatedTimeLimit = selectedQuestions.length * 2;
            startTimer(calculatedTimeLimit);
            requestFullscreen();
            setExamActive(true);
            autoSubmitTriggeredRef.current = false;
          } else {
            alert('No questions available for this quiz. Please try another category.');
          }
        } catch (error) {
          console.error('Error loading quiz questions:', error);
          alert('Error loading quiz questions. Please try again.');
        }
      } else {
        alert('No quizzes available for this category. Please try another quiz.');
      }
    }
  };

  const handleResumeQuiz = () => {
    if (!pausedQuiz) return;
    
    setSelectedQuiz(pausedQuiz);
    setCurrentQuizIndex(pausedQuiz.currentIndex);
    setSelectedAnswers(pausedQuiz.answers);
    setTimeLeft(pausedQuiz.timeLeft);
    setStartTime(pausedQuiz.startTime);
    setQuizComplete(false);
    setResults(null);
    
    if (pausedQuiz.timeLeft > 0) {
      setTimerActive(true);
    }
    
    requestFullscreen();
    setExamActive(true);
    autoSubmitTriggeredRef.current = false;
    setPausedQuiz(null);
  };

  const handleAnswerSelect = (questionId, answer) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: answer
    });
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length < selectedQuiz.questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    stopTimer();
    
    try {
      const answers = Object.entries(selectedAnswers).map(([questionId, answer]) => ({
        questionId,
        selectedAnswer: answer
      }));

      const actualTimeTaken = Math.floor((Date.now() - startTime) / 1000);

      const response = await api.post('/quiz/submit', {
        answers,
        timeTaken: actualTimeTaken
      });

      setResults(response.data);
      setQuizComplete(true);
      await exitFullscreen();
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Error submitting quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!selectedQuiz || quizComplete) {
      setExamActive(false);
      autoSubmitTriggeredRef.current = false;
      return;
    }

    const handleVisibility = () => {
      if (document.hidden && examActive) setTimerActive(false);
    };

    const handleBlur = () => {
      if (examActive) setTimerActive(false);
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        if (examActive) {
          setTimerActive(false);
          setExamActive(false);
        }
      }
    };

    const handleContextMenu = (e) => {
      if (examActive) e.preventDefault();
    };

    const handleKeyDown = (e) => {
      if (!examActive) return;
      const key = e.key.toLowerCase();
      if (e.ctrlKey && (key === 'w' || key === 't' || key === 'l' || key === 'r')) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (key === 'f11') {
        e.preventDefault();
        e.stopPropagation();
        requestFullscreen();
      }
      if (key === 'escape') {
        e.preventDefault();
        e.stopPropagation();
        handleQuizExit();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [selectedQuiz, quizComplete, examActive, submitting, handleAutoSubmit, handleQuizExit]);

  const handleNext = () => {
    if (currentQuizIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
    }
  };

  const clearCurrentSelection = () => {
    const currentId = selectedQuiz.questions[currentQuizIndex].id;
    const updated = { ...selectedAnswers };
    delete updated[currentId];
    setSelectedAnswers(updated);
  };

  const handleSkip = () => {
    if (currentQuizIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
    }
  };

  const getDifficultyColor = useCallback((difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Hard':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-slate-700 text-slate-300 border border-slate-600';
    }
  }, []);

  const memoizedQuizCategories = useMemo(() => {
    return quizCategories;
  }, [quizCategories]);

  if (loading) return <QuizSkeleton />;

  // Quiz Selection Screen
  if (!selectedQuiz) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-12">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border-b border-slate-800 p-12 lg:p-16 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 drop-shadow-md relative z-10 flex justify-center items-center gap-3">
            <span className="text-5xl">🧠</span> Knowledge Quests
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto relative z-10 font-medium">
            Test your MERN stack skills, conquer challenges, and earn XP points
          </p>
          
          {/* Resume Quiz Banner */}
          {pausedQuiz && (
            <div className="mt-8 relative z-10">
              <div className="bg-slate-800/90 border-2 border-amber-500/80 rounded-2xl max-w-md mx-auto shadow-2xl overflow-hidden backdrop-blur-sm shadow-amber-500/10">
                <div className="p-6 text-center">
                  <div className="text-4xl mb-3 drop-shadow-md">⏸️</div>
                  <h3 className="text-xl font-bold text-white mb-2">Quiz Paused</h3>
                  <p className="text-slate-300 font-medium mb-6 bg-slate-900/50 py-2 px-4 rounded-lg inline-block">
                    {Math.floor(pausedQuiz.timeLeft / 60)}:{(pausedQuiz.timeLeft % 60).toString().padStart(2, '0')} remaining
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button 
                      onClick={handleResumeQuiz}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"
                    >
                      <span>🔄</span> Resume
                    </button>
                    <button 
                      onClick={() => setPausedQuiz(null)}
                      className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quiz Categories Grid */}
        <div className="max-w-7xl mx-auto p-6 lg:p-12">
          {quizzes.length === 0 ? (
            <div className="text-center p-16 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-slate-300 mb-2">No quests available yet</h2>
              <p className="text-slate-400 mb-6 font-medium">Check back later for new challenges!</p>
              <button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95">
                🔄 Refresh
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {memoizedQuizCategories.map((category) => (
                <div 
                  key={category.id} 
                  className="bg-slate-800 rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden hover:-translate-y-1.5 transition-all duration-300 hover:shadow-indigo-500/10 hover:border-indigo-500/30 group cursor-pointer flex flex-col"
                  onClick={() => handleQuizSelect(category.id)}
                >
                  <div className="p-8 border-b border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900/80 relative overflow-hidden flex-1">
                    <div className="flex justify-between items-center mb-6 relative z-10">
                      {category.difficulty ? (
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getDifficultyColor(category.difficulty)}`}>
                          {category.difficulty}
                        </div>
                      ) : <div />}
                      <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700">
                        <span className="drop-shadow-sm text-sm">🏆</span>
                        <span className="text-amber-400 font-bold text-sm tracking-wide">{category.xp} XP</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-extrabold text-white mb-3 flex items-center gap-3 relative z-10 group-hover:text-indigo-300 transition-colors">
                      <span className="text-3xl drop-shadow-md bg-white/5 p-2 rounded-xl">{category.icon}</span>
                      {category.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed relative z-10 font-medium line-clamp-3">
                      {category.description}
                    </p>
                  </div>
                  <div className="p-6 bg-slate-900/60 flex flex-col gap-6 relative z-10 hover:bg-slate-900/80 transition-colors">
                    <div className="flex justify-between items-center text-sm text-slate-400 font-semibold bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-400 text-base">🧠</span>
                        <span>{category.questions} <span className="hidden sm:inline">Questions</span> <span className="sm:hidden">Qs</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400 text-base">⏱️</span>
                        <span>{category.questions * 2} min</span>
                      </div>
                    </div>
                    <button className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/25 transition-all group-hover:scale-[1.02]">
                      <span className="text-lg">🚀</span> Start Quest
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Features highlight */}
          {quizzes.length > 0 && (
            <div className="mt-16 bg-slate-800/80 rounded-3xl border border-slate-700 p-10 lg:p-14 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
              <h3 className="text-center text-3xl font-extrabold text-white mb-12 relative z-10">Why Take These Quests?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                <div className="text-center group">
                  <div className="text-5xl mb-4 text-blue-400 group-hover:scale-110 transition-transform drop-shadow-lg">🎯</div>
                  <h4 className="text-lg font-bold text-slate-100 mb-2">Targeted Learning</h4>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">Questions designed for specific skill levels and technologies.</p>
                </div>
                <div className="text-center group">
                  <div className="text-5xl mb-4 text-amber-400 group-hover:scale-110 transition-transform drop-shadow-lg">⚡</div>
                  <h4 className="text-lg font-bold text-slate-100 mb-2">Instant Feedback</h4>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">Get immediate results and detailed post-quiz explanations.</p>
                </div>
                <div className="text-center group">
                  <div className="text-5xl mb-4 text-emerald-400 group-hover:scale-110 transition-transform drop-shadow-lg">🏆</div>
                  <h4 className="text-lg font-bold text-slate-100 mb-2">Earn Rewards</h4>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">Collect XP points and unlock achievements for your profile.</p>
                </div>
                <div className="text-center group">
                  <div className="text-5xl mb-4 text-indigo-400 group-hover:scale-110 transition-transform drop-shadow-lg">📈</div>
                  <h4 className="text-lg font-bold text-slate-100 mb-2">Track Progress</h4>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">Monitor your learning journey and constant improvement.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Quiz Complete Screen (Results)
  if (quizComplete && results) {
    const getPerformanceMessage = (score) => {
      if (score >= 90) return { message: "Outstanding! 🏆", color: "text-emerald-400" };
      if (score >= 80) return { message: "Excellent! 🌟", color: "text-blue-400" };
      if (score >= 70) return { message: "Good job! 👍", color: "text-amber-400" };
      if (score >= 60) return { message: "Not bad! 📚", color: "text-amber-500" };
      return { message: "Keep practicing! 💪", color: "text-red-400" };
    };

    const performance = getPerformanceMessage(results.score);

    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 lg:p-12 pb-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="text-6xl lg:text-7xl mb-6 animate-bounce drop-shadow-xl inline-block">🎉</div>
            <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">Test Completed</h1>
            <p className={`text-2xl font-bold bg-slate-800/80 inline-block px-6 py-2 rounded-full border border-slate-700 shadow-inner ${performance.color}`}>
              {performance.message}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-slate-800/80 p-8 rounded-3xl text-center border border-slate-700 shadow-xl backdrop-blur-sm pointer-events-none hover:border-emerald-500/30 transition-colors">
              <div className={`text-5xl font-extrabold mb-2 ${performance.color} drop-shadow-md`}>{results.score}%</div>
              <div className="text-slate-400 font-bold uppercase tracking-wider text-xs">Final Score</div>
            </div>
            <div className="bg-slate-800/80 p-8 rounded-3xl text-center border border-slate-700 shadow-xl backdrop-blur-sm pointer-events-none hover:border-blue-500/30 transition-colors">
              <div className="text-5xl font-extrabold mb-2 text-white drop-shadow-md">{results.correctAnswers}<span className="text-3xl text-slate-500">/{results.totalQuestions}</span></div>
              <div className="text-slate-400 font-bold uppercase tracking-wider text-xs">Correct</div>
            </div>
            <div className="bg-slate-800/80 p-8 rounded-3xl text-center border border-slate-700 shadow-xl backdrop-blur-sm pointer-events-none hover:border-amber-500/30 transition-colors">
              <div className="text-5xl font-extrabold mb-2 text-amber-400 drop-shadow-md">+{results.pointsEarned}</div>
              <div className="text-slate-400 font-bold uppercase tracking-wider text-xs">XP Earned</div>
            </div>
            <div className="bg-slate-800/80 p-8 rounded-3xl text-center border border-slate-700 shadow-xl backdrop-blur-sm pointer-events-none hover:border-indigo-500/30 transition-colors">
              <div className="text-5xl font-extrabold mb-2 text-indigo-400 drop-shadow-md">{results.streak || 0}</div>
              <div className="text-slate-400 font-bold uppercase tracking-wider text-xs">Best Streak</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <button 
              onClick={() => { setSelectedQuiz(null); setShowFullReview(false); }} 
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <span>🔄</span> Next Quest
            </button>
            <button 
              onClick={() => navigate('/profile')} 
              className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <span>👤</span> View Profile
            </button>
            <button 
              onClick={() => navigate('/leaderboard')} 
              className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <span>🏆</span> Leaderboard
            </button>
          </div>

          {/* Performance Detailed */}
          <div className="bg-slate-800/80 rounded-3xl p-8 lg:p-12 border border-slate-700 shadow-2xl mb-12">
            <h2 className="text-2xl font-bold text-white mb-8 text-center bg-slate-900/50 -mx-8 lg:-mx-12 -mt-8 lg:-mt-12 p-6 lg:p-8 rounded-t-3xl border-b border-slate-700">Detailed Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4 p-5 bg-slate-900/50 rounded-2xl border border-slate-700/50">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-2xl">🎯</div>
                <div>
                  <div className="text-indigo-200 font-bold">Accuracy</div>
                  <div className="text-indigo-100 text-sm font-medium">{Math.round((results.correctAnswers / results.totalQuestions) * 100)}% correct rate</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 bg-slate-900/50 rounded-2xl border border-slate-700/50">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-2xl">⚡</div>
                <div>
                  <div className="text-blue-200 font-bold">Speed</div>
                  <div className="text-blue-100 text-sm font-medium">{Math.round(results.timeTaken / 60)} min {results.timeTaken % 60} sec taken</div>
                </div>
              </div>
            </div>
          </div>

          {/* Full Review Toggle */}
          {Array.isArray(results.review) && results.review.length > 0 && (
            <div className="bg-slate-800/50 rounded-3xl border border-slate-700 p-8 shadow-xl">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                <h2 className="text-2xl font-bold text-white m-0">Question Review</h2>
                <button 
                  onClick={() => setShowFullReview(!showFullReview)} 
                  className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-lg font-bold transition-colors border border-slate-600"
                >
                  {showFullReview ? '🙈 Hide Explanations' : '👀 Review All Answers'}
                </button>
              </div>

              {showFullReview && (
                <div className="space-y-6">
                  {results.review.map((item, idx) => (
                    <div key={item.questionId || idx} className={`p-6 lg:p-8 rounded-2xl border ${item.isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${item.isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                          {item.isCorrect ? '✓' : '✗'}
                        </div>
                        <div className="text-lg font-bold text-slate-100 mt-1 leading-snug">
                          {idx + 1}. {item.question}
                        </div>
                      </div>
                      
                      <div className="ml-12 space-y-3">
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                          <div className="text-sm font-medium text-slate-400 mb-1">Your answer:</div>
                          <div className={`font-bold ${item.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                            {item.selectedAnswer || 'Left blank'}
                          </div>
                        </div>
                        
                        {!item.isCorrect && (
                          <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                            <div className="text-sm font-medium text-emerald-500/80 mb-1">Correct answer:</div>
                            <div className="font-bold text-emerald-400">
                              {item.correctAnswer}
                            </div>
                          </div>
                        )}
                        
                        {item.explanation && (
                          <div className="mt-4 p-5 bg-slate-800 rounded-xl border border-slate-700 text-slate-300 text-sm leading-relaxed font-medium shadow-inner">
                            <strong className="text-slate-100 block mb-2">Explanation:</strong> 
                            {item.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active Quiz View
  const currentQuestion = selectedQuiz?.questions?.[currentQuizIndex];

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100 selection:bg-indigo-500/30">
      <style>{`
        .navbar, nav, .nav, [class*="nav"], [class*="Navbar"] { 
          display: none !important; 
        }
        body { 
          padding-top: 0 !important; 
        }
      `}</style>

      {/* Main Grid Layout for Exam */}
      <div className="flex flex-col lg:flex-row h-screen max-w-[1600px] mx-auto overflow-hidden">
        
        {/* Left Sidebar - Quiz Info & Navigation */}
        <aside className="w-full lg:w-80 lg:shrink-0 bg-slate-900 border-r border-slate-800 p-6 flex flex-col h-auto lg:h-full lg:overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-white mb-4 tracking-tight leading-tight">{selectedQuiz.title}</h2>
            <div className="flex items-center gap-6 text-sm font-semibold">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                <span className="text-slate-400">Attempted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-700 rounded-sm"></div>
                <span className="text-slate-400">Todo</span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-1">Questions</div>
            <div className="text-4xl font-extrabold text-white">
              {Object.keys(selectedAnswers).length} <span className="text-xl text-slate-500">/ {selectedQuiz.questions.length}</span>
            </div>
          </div>

          <div className="mb-10">
            <div className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-3 flex justify-between">
              Progress <span>{quizProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300" 
                style={{ width: `${quizProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-4">Navigation</div>
          <div className="grid grid-cols-5 gap-3 mb-8">
            {selectedQuiz.questions.map((q, idx) => {
              const active = idx === currentQuizIndex;
              const attempted = !!selectedAnswers[q.id];
              return (
                <button
                  key={q.id || idx}
                  onClick={() => setCurrentQuizIndex(idx)}
                  className={`h-11 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                    attempted 
                      ? active ? 'bg-emerald-600 text-white border-2 border-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                      : active ? 'bg-indigo-600 text-white border-2 border-indigo-400 shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-6 lg:border-t lg:border-slate-800">
            <button 
              onClick={handleSubmit} 
              disabled={submitting} 
              className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-red-500/20 active:scale-95 text-lg"
            >
              {submitting ? 'Submitting...' : 'End Assignment'}
            </button>
          </div>
        </aside>

        {/* Right Area - Question Active Area */}
        <main className="flex-1 bg-slate-900 flex items-center justify-center p-4 lg:p-8 xl:p-12 h-screen overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-800/80 backdrop-blur-md rounded-3xl border border-slate-700 shadow-2xl flex flex-col min-h-[600px] xl:min-h-[700px]">
            
            {/* Question Header */}
            <div className="p-6 lg:p-10 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50 rounded-t-3xl">
              <div className="text-sm font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-4 py-1.5 rounded-lg border border-indigo-500/20">
                Question {currentQuizIndex + 1}
              </div>
              <div className={`font-mono text-2xl font-bold px-5 py-2 rounded-xl flex items-center gap-3 border shadow-inner ${
                timeLeft < 300 ? 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse' : 'bg-slate-900 text-slate-200 border-slate-700'
              }`}>
                <span>⏱️</span> {formatTime(timeLeft)}
              </div>
            </div>

            {/* Question Body */}
            <div className="p-6 lg:p-10 flex-1 flex flex-col">
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-10 leading-snug">
                {currentQuestion.question}
              </h2>
              
              <div className="grid gap-4 mb-8">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === option;
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                      className={`text-left w-full rounded-2xl p-5 flex items-center gap-5 font-semibold text-lg transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/20 group ${
                        isSelected 
                          ? 'bg-indigo-500/10 border-2 border-indigo-500 text-indigo-200 shadow-md shadow-indigo-500/10' 
                          : 'bg-slate-900/50 border-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-white'
                      }`}
                    >
                      <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0 transition-colors ${
                        isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>

              {/* Action Bar Footer */}
              <div className="mt-auto pt-8 border-t border-slate-700/50 flex flex-wrap gap-4 items-center justify-between">
                <button 
                  onClick={clearCurrentSelection} 
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 px-6 py-3 rounded-xl font-bold transition-all active:scale-95"
                >
                  Clear Selection
                </button>
                <div className="flex gap-4 w-full sm:w-auto mt-4 sm:mt-0">
                  <button 
                    onClick={handleSkip} 
                    className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 px-8 py-3 rounded-xl font-bold transition-all active:scale-95"
                  >
                    Skip
                  </button>
                  <button
                    onClick={currentQuizIndex === selectedQuiz.questions.length - 1 ? handleSubmit : handleNext}
                    disabled={!selectedAnswers[currentQuestion.id] && currentQuizIndex !== selectedQuiz.questions.length - 1}
                    className={`flex-1 sm:flex-none px-10 py-3 rounded-xl font-bold transition-all active:scale-95 ${
                      !selectedAnswers[currentQuestion.id] && currentQuizIndex !== selectedQuiz.questions.length - 1
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : currentQuizIndex === selectedQuiz.questions.length - 1
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    }`}
                  >
                    {currentQuizIndex === selectedQuiz.questions.length - 1 ? (submitting ? 'Submitting...' : 'Finish') : 'Next'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default memo(Quiz);