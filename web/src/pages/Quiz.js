import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageError, PageSpinner } from '../components/PageState';
import api, { fetchCached, getErrorMessage } from '../services/api';

const Quiz = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('none');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState('catalog');
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [showMobileNav, setShowMobileNav] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadQuizCenter = async () => {
      try {
        const [categoryData, questionData] = await Promise.all([
          fetchCached('/quiz/categories'),
          fetchCached('/quiz?limit=200')
        ]);

        if (!isMounted) {
          return;
        }

        setCategories(categoryData || []);
        setQuestions(questionData || []);
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err, 'Unable to load practice modules'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadQuizCenter();
    return () => {
      isMounted = false;
    };
  }, []);

  const startQuiz = useCallback((categoryId) => {
    const pool = questions.filter((item) => categoryId === 'all' || item.category_id === categoryId);
    const nextQuestions = pool.slice(0, 10);

    if (nextQuestions.length === 0) {
      setError('No challenges available for that module yet.');
      return;
    }

    setSelectedCategory(categoryId);
    setSelectedQuestions(nextQuestions);
    setAnswers({});
    setCurrentIndex(0);
    setResults(null);
    setTimeLeft(Math.max(nextQuestions.length * 45, 120));
    setPhase('active');
    setError('');
  }, [questions]);

  // Handle deep-linking to a specific quiz or category via ?id=... or ?categoryId=...
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const quizId = params.get('id');
    const categoryId = params.get('categoryId');

    if (questions.length > 0 && phase === 'catalog') {
      if (quizId) {
        const question = questions.find(q => q.id === quizId);
        if (question) {
          setSelectedCategory(question.category_id || 'all');
        }
      } else if (categoryId) {
        setSelectedCategory(categoryId);
      }
    }
  }, [questions, phase, location.search]);

  const handleReturnToDashboard = () => {
    setPhase('catalog');
    navigate('/assessments', { replace: true });
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedQuestions.length || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      // Exit fullscreen if in it
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      const payload = selectedQuestions.map((question) => ({
        questionId: question.id,
        selectedAnswer: answers[question.id] || ''
      }));
      const response = await api.post('/quiz/submit', {
        answers: payload,
        timeTaken: 0
      });
      setResults(response.data);
      setPhase('results');
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to submit practice session'));
    } finally {
      setSubmitting(false);
    }
  }, [answers, selectedQuestions, submitting]);

  // Security Logic: Auto-submit on tab switch or fullscreen exit
  useEffect(() => {
    if (phase !== 'active') return;

    const handleSecurityViolation = () => {
      console.warn('Security violation detected! Auto-submitting assessment.');
      handleSubmit();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleSecurityViolation();
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && phase === 'active') {
        handleSecurityViolation();
      }
    };

    const handleBlur = () => {
      handleSecurityViolation();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [phase, handleSubmit]);

  const startExamWithSecurity = useCallback(async (categoryId) => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      startQuiz(categoryId);
    } catch (err) {
      setError('Fullscreen is required to take the assessment. Please enable it.');
    }
  }, [startQuiz]);

  useEffect(() => {
    if (phase !== 'active' || timeLeft <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => current - 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase === 'active' && timeLeft === 0 && selectedQuestions.length > 0) {
      handleSubmit();
    }
  }, [handleSubmit, phase, timeLeft, selectedQuestions.length]);

  const categoryCards = useMemo(() => {
    const groupedCounts = questions.reduce((accumulator, item) => {
      const key = item.category_id || 'uncategorized';
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    return categories.map((category) => ({
      ...category,
      questionCount: groupedCounts[category.id] || 0
    }));
  }, [categories, questions]);

  const visibleCategories = categoryCards.filter((category) => category.questionCount > 0);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <PageSpinner message="Loading exam center..." />;
  }

  if (error && phase === 'catalog') {
    return <PageError message={error} onAction={() => window.location.reload()} />;
  }

  // --- CATALOG PHASE ---
  if (phase === 'catalog') {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-16 animate-fade-in text-text-primary">
        {/* Pre-Exam Modal */}
        {selectedCategory !== 'none' && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-10 text-center shadow-2xl animate-scale-in">
              <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary mx-auto mb-8">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-text-primary mb-4">Exam Mode</h2>
              <p className="text-text-secondary mb-8 leading-relaxed">
                This assessment is conducted in a secure environment. <br/>
                <span className="font-bold text-brand-primary">Rules:</span>
                <ul className="text-sm mt-4 space-y-2 text-left bg-dark-surface p-4 rounded-xl">
                  <li>• System will switch to <strong>Fullscreen</strong> automatically.</li>
                  <li>• <strong>DO NOT</strong> switch tabs or minimize.</li>
                  <li>• <strong>DO NOT</strong> click outside the window.</li>
                  <li className="text-brand-danger font-black uppercase text-[10px]">• Violations will trigger immediate auto-submission.</li>
                </ul>
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setSelectedCategory('none')} 
                  className="btn-secondary flex-1 py-4 font-bold border-2"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => startExamWithSecurity(selectedCategory)} 
                  className="btn-primary flex-1 py-4 font-bold bg-brand-primary border-0"
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="glass-panel overflow-hidden relative mb-8">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-dark-surface to-transparent z-0"></div>
          <div className="relative z-10 p-8 lg:p-12">
            <div className="badge badge-success mb-4 flex items-center gap-2 w-max">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
              </span>
              Exam Center
            </div>
            <h1 className="heading-1 max-w-2xl">Validate your skills.</h1>
            <p className="text-muted text-lg mt-4 max-w-3xl leading-relaxed">
              Take a professional assessment to test your logic and algorithmic knowledge. 
              Earn points and boost your rank in the global leaderboard.
            </p>
            {error && (
              <div className="mt-6 rounded-lg border border-brand-danger/30 bg-brand-danger/10 p-4 w-fit">
                <p className="text-sm font-bold text-brand-danger">{error}</p>
              </div>
            )}
          </div>
        </section>

        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-2xl font-black text-text-primary mb-0 flex items-center gap-3">
             <span className="w-2 h-8 bg-brand-primary rounded-full"></span>
             Available Roadmaps
          </h2>
        </div>

        <section className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <button 
            type="button" 
            onClick={() => setSelectedCategory('all')} 
            className="text-left glass-card p-10 border-2 border-transparent hover:border-brand-primary group flex flex-col justify-between shadow-sm bg-white hover:shadow-xl transition-all duration-300"
          >
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="w-16 h-16 rounded-2xl bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-black uppercase tracking-widest">Comprehensive</div>
              </div>
              <h3 className="text-2xl font-black text-text-primary group-hover:text-brand-primary transition-colors">Full Stack Exam</h3>
              <p className="mt-4 text-sm text-text-secondary leading-relaxed font-medium">A blend of questions covering algorithms, data structures, and the complete MERN ecosystem.</p>
            </div>
            <div className="mt-10 flex items-center justify-between border-t border-dark-border pt-6">
              <span className="text-xs font-black text-text-tertiary uppercase tracking-widest leading-none">{Math.min(questions.length, 10)} Challenges</span>
              <span className="text-brand-primary text-xs font-black flex items-center gap-1 opacity-100 transition-all uppercase tracking-widest">
                Start Exam <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </span>
            </div>
          </button>

          {visibleCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className="text-left glass-card p-10 border-2 border-transparent hover:border-brand-primary group flex flex-col justify-between shadow-sm bg-white hover:shadow-xl transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="w-16 h-16 rounded-2xl border border-dark-border bg-dark-surface flex items-center justify-center text-text-primary group-hover:bg-brand-primary/10 group-hover:text-brand-primary group-hover:border-brand-primary/30 transition-all duration-300">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div className="px-3 py-1 bg-dark-surface text-text-secondary rounded-full text-[10px] font-black uppercase tracking-widest group-hover:bg-brand-primary group-hover:text-white transition-all">{category.name || category.title || 'Module'}</div>
                </div>
                <h3 className="text-2xl font-black text-text-primary group-hover:text-brand-primary transition-colors">{category.title || category.name}</h3>
                <p className="mt-4 text-sm text-text-secondary font-medium line-clamp-2 leading-relaxed">
                  {category.description || `Validate your expert knowledge in ${category.title} through this technical assessment.`}
                </p>
              </div>
              <div className="mt-10 flex items-center justify-between border-t border-dark-border pt-6">
                <span className="text-xs font-black text-text-tertiary uppercase tracking-widest leading-none">{category.questionCount} Questions</span>
                <span className="text-brand-primary text-xs font-black flex items-center gap-1 opacity-100 transition-all uppercase tracking-widest">
                  Start Exam <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </span>
              </div>
            </button>
          ))}
        </section>
      </div>
    );
  }

  // --- RESULTS PHASE ---
  if (phase === 'results' && results) {
    const isSuccess = results.score >= 75;
    
    return (
      <div className="mx-auto max-w-5xl px-4 flex flex-col items-center justify-center min-h-[85vh] py-10 animate-fade-in">
        <div className="w-full glass-panel overflow-hidden border-t-8 border-t-brand-primary">
          <div className="p-10 md:p-14 text-center bg-white">
            <div className={`mx-auto w-20 h-20 rounded shadow flex items-center justify-center mb-6 border ${isSuccess ? 'bg-brand-primary text-white border-transparent' : 'bg-brand-warning text-white border-transparent'}`}>
              {isSuccess ? (
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-4">
              {isSuccess ? 'Assessment Passed' : 'Assessment Failed'}
            </h1>
            <p className="text-lg text-text-secondary max-w-xl mx-auto mb-10 font-medium">
              {isSuccess 
                ? 'Excellent work. Your coding concepts are sharp.' 
                : 'Keep practicing. Review the logic breakdown below.'}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="glass-card bg-dark-surface p-6 rounded-md border-dark-border shadow-sm">
                <div className="text-sm font-bold text-text-tertiary uppercase tracking-wider mb-2">Score</div>
                <div className={`text-4xl font-black ${isSuccess ? 'text-brand-primary' : 'text-brand-warning'}`}>{results.score}%</div>
              </div>
              <div className="glass-card bg-dark-surface p-6 rounded-md border-dark-border shadow-sm">
                <div className="text-sm font-bold text-text-tertiary uppercase tracking-wider mb-2">Accuracy</div>
                <div className="text-4xl font-black text-text-primary">{results.correctAnswers}<span className="text-lg text-text-tertiary font-bold">/{results.totalQuestions}</span></div>
              </div>
              <div className="glass-card bg-dark-surface p-6 rounded-md border-dark-border shadow-sm">
                <div className="text-sm font-bold text-text-tertiary uppercase tracking-wider mb-2">XP Earned</div>
                <div className="text-4xl font-black text-brand-primary">+{results.pointsEarned}</div>
              </div>
              <div className="glass-card bg-dark-surface p-6 rounded-md border-dark-border shadow-sm">
                <div className="text-sm font-bold text-text-tertiary uppercase tracking-wider mb-2">Streak</div>
                <div className="text-4xl font-black text-text-primary flex justify-center items-center gap-1">
                  {results.streak} <svg className="w-6 h-6 text-brand-warning" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button type="button" onClick={handleReturnToDashboard} className="btn-secondary w-full sm:w-auto px-8">Return to Dashboard</button>
              <button type="button" onClick={() => startQuiz(selectedCategory)} className="btn-primary w-full sm:w-auto px-8">Try Again</button>
            </div>
          </div>
          
          {/* Detailed Review Section */}
          {Array.isArray(results.review) && results.review.length > 0 && (
            <div className="bg-dark-surface border-t border-dark-border p-8 md:p-12">
              <h3 className="heading-3 mb-6">Execution Breakdown</h3>
              <div className="space-y-6">
                {results.review.map((item, index) => {
                  const isCorrect = item.selectedAnswer === item.correctAnswer;
                  return (
                    <div key={item.questionId || index} className={`rounded border p-6 bg-white shadow-sm ${isCorrect ? 'border-dark-border' : 'border-brand-danger'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`mt-0.5 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded text-white ${isCorrect ? 'bg-brand-primary' : 'bg-brand-danger'}`}>
                          {isCorrect ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          )}
                        </div>
                        <div className="flex-grow">
                          <div className="text-sm font-bold text-text-tertiary tracking-wider uppercase mb-1">Question {index + 1}</div>
                          <h4 className="text-lg font-bold text-text-primary mb-4 leading-relaxed">{item.question}</h4>
                          
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="rounded border border-dark-border p-4 bg-dark-surface">
                              <span className="block text-xs font-bold text-text-tertiary uppercase mb-2">Your Output</span>
                              <span className={`text-sm font-bold font-mono ${isCorrect ? 'text-brand-primary' : 'text-brand-danger'}`}>
                                {item.selectedAnswer || 'Compilation Error (No Answer)'}
                              </span>
                            </div>
                            {!isCorrect && (
                              <div className="rounded border border-brand-primary p-4 bg-brand-primary/5">
                                <span className="block text-xs font-bold text-brand-primary uppercase mb-2">Expected Output</span>
                                <span className="text-sm font-bold font-mono text-text-primary">{item.correctAnswer}</span>
                              </div>
                            )}
                          </div>
                          
                          {item.explanation && (
                            <div className="mt-4 p-4 rounded bg-dark-surface border border-dark-border text-sm text-text-secondary leading-relaxed font-medium">
                              <strong className="text-brand-primary mr-2 uppercase tracking-wider text-xs">Explanation:</strong>
                              {item.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- ACTIVE QUIZ PHASE ---
  const currentQuestion = selectedQuestions[currentIndex];
  const completionPercentage = Math.round((Object.keys(answers).length / selectedQuestions.length) * 100);

  return (
    <div className="fixed inset-0 bg-[#F8F9FA] flex flex-col z-50 overflow-hidden font-sans">
      
      {/* 0. Mobile Sidebar Overlay */}
      {showMobileNav && (
        <div className="fixed inset-0 bg-black/50 z-[60] lg:hidden" onClick={() => setShowMobileNav(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900 uppercase tracking-widest text-xs">Navigation</h3>
              <button onClick={() => setShowMobileNav(false)} className="p-2 -mr-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {selectedQuestions.map((q, idx) => (
                <button 
                  key={q.id}
                  onClick={() => { setCurrentIndex(idx); setShowMobileNav(false); }}
                  className={`h-10 rounded-lg flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    idx === currentIndex ? 'border-green-600 text-green-600 bg-green-50' : answers[q.id] ? 'border-gray-200 bg-gray-100 text-gray-600' : 'border-gray-100 text-gray-400'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* 1. Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-6 w-auto sm:w-1/3">
          <div className="flex items-center gap-2 sm:gap-4">
             <span className="font-bold text-gray-900 text-sm sm:text-lg whitespace-nowrap">Q {currentIndex + 1}/{selectedQuestions.length}</span>
             <div className="hidden sm:block h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
                <div 
                   className="h-full bg-green-600 transition-all duration-300" 
                   style={{ width: `${((currentIndex + 1) / selectedQuestions.length) * 100}%` }}
                />
             </div>
          </div>
        </div>

        <div className="flex-grow flex justify-center px-4">
           {/* Progress bar for mobile */}
           <div className="sm:hidden h-1.5 w-full max-w-[100px] bg-gray-100 rounded-full overflow-hidden">
                <div 
                   className="h-full bg-green-600 transition-all duration-300" 
                   style={{ width: `${((currentIndex + 1) / selectedQuestions.length) * 100}%` }}
                />
           </div>
        </div>

        <div className="flex items-center justify-end gap-3 sm:gap-6 w-auto sm:w-1/3 text-[10px] sm:text-sm font-semibold text-gray-700">
           <span className="hidden xs:block">{completionPercentage}%</span>
           <div className="flex items-center gap-1.5 sm:gap-2">
             <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <span className="whitespace-nowrap">{formatTime(timeLeft)}</span>
           </div>
        </div>
      </header>

      {/* 2. Main Layout Area */}
      <div className="flex-grow flex overflow-hidden">
        
        {/* Left: Content Area */}
        <main className="flex-grow overflow-y-auto bg-white p-8 md:p-12 lg:p-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-xs font-bold text-green-600 uppercase tracking-widest mb-4">
              Full Stack Developer (MERN) · Role Assessment
            </div>
            
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-6 leading-tight whitespace-pre-line">
              {currentQuestion?.question_text?.split('```')[0]}
            </h2>

            {currentQuestion?.question_text?.includes('```') && (
              <div className="mb-8 p-6 bg-gray-900 text-green-400 rounded-xl font-mono text-sm border border-gray-800 shadow-inner overflow-x-auto">
                <pre>{currentQuestion.question_text.split('```')[1]}</pre>
              </div>
            )}

            <div className="space-y-4 mb-12">
              {(currentQuestion?.options || []).map((option, index) => {
                const isSelected = answers[currentQuestion.id] === option;
                const alphaLabel = String.fromCharCode(65 + index);
                
                return (
                  <button
                    key={`${option}-${index}`}
                    onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }))}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-center gap-5 group ${
                      isSelected 
                        ? 'border-green-600 bg-green-50/30' 
                        : 'border-gray-100 hover:border-green-600 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 font-bold text-sm transition-colors ${
                      isSelected 
                        ? 'bg-green-600 border-green-600 text-white' 
                        : 'border-gray-200 text-gray-500 group-hover:border-green-600 group-hover:text-green-600'
                    }`}>
                      {alphaLabel}
                    </div>
                    <span className="text-base font-medium text-gray-700">
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => setAnswers(prev => {
                const newAns = { ...prev };
                delete newAns[currentQuestion.id];
                return newAns;
              })}
              className="w-full py-4 bg-[#2D3134] text-white font-bold rounded-lg uppercase tracking-widest hover:bg-black transition-colors"
            >
              I Don't Know - Skip Question
            </button>
          </div>
        </main>

        {/* Right: Sidebar Navigation */}
        <aside className="w-[320px] shrink-0 border-l border-gray-200 bg-white flex flex-col p-6 hidden lg:flex">
          <div className="flex items-center justify-between mb-4 px-2">
            <button className="text-gray-400 hover:text-gray-900 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Questions
            </button>
            <span className="text-[10px] font-bold text-gray-900">1/1</span>
            <button className="text-gray-400 hover:text-gray-900 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
              Questions
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-auto">
            {selectedQuestions.map((q, idx) => (
              <button 
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-10 rounded-lg flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  idx === currentIndex 
                    ? 'border-green-600 text-green-600 bg-green-50/50' 
                    : answers[q.id] 
                      ? 'border-gray-200 bg-gray-100 text-gray-600'
                      : 'border-gray-100 text-gray-400 hover:border-gray-300'
                } ${flaggedQuestions[q.id] ? 'relative' : ''}`}
              >
                {idx + 1}
                {flaggedQuestions[q.id] && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6">
             <div className="flex justify-between items-center mb-3">
               <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Difficulty</span>
               <span className="text-[10px] font-bold uppercase tracking-widest text-gray-900">LVL {currentQuestion?.difficulty === 'easy' ? 1 : currentQuestion?.difficulty === 'medium' ? 3 : 5}</span>
             </div>
             <div className="flex gap-1 h-1.5">
               {[1, 2, 3, 4, 5].map((level) => {
                 const currentLevel = currentQuestion?.difficulty === 'easy' ? 1 : currentQuestion?.difficulty === 'medium' ? 3 : 5;
                 return (
                   <div 
                     key={level}
                     className={`flex-grow rounded-full transition-colors ${level <= currentLevel ? 'bg-green-600' : 'bg-gray-100'}`}
                   />
                 );
               })}
             </div>
          </div>
        </aside>
      </div>

      {/* 3. Footer Actions */}
      <footer className="h-20 bg-white border-t border-gray-200 flex items-center justify-between px-4 sm:px-8 shrink-0 z-20">
        <div className="flex items-center gap-4 sm:gap-8">
           <button 
             onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
             disabled={currentIndex === 0}
             className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-colors"
           >
             <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
             <span className="hidden xs:block">Prev</span>
           </button>
           <button 
             onClick={() => setFlaggedQuestions(prev => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }))}
             className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors ${flaggedQuestions[currentQuestion?.id] ? 'text-red-500' : 'text-gray-500 hover:text-gray-900'}`}
           >
             <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${flaggedQuestions[currentQuestion?.id] ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
             <span className="hidden xs:block">Flag</span>
           </button>
        </div>

        <div className="flex items-center gap-3 sm:gap-8">
           <button 
             onClick={() => setShowMobileNav(true)}
             className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors lg:hidden"
           >
             <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
             <span className="hidden xs:block">Review</span>
           </button>
           <button 
             onClick={() => setCurrentIndex(p => Math.min(selectedQuestions.length - 1, p + 1))}
             className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
           >
             <span className="hidden xs:block">Skip</span>
             <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
           </button>
           
           {currentIndex < selectedQuestions.length - 1 ? (
             <button 
                onClick={() => setCurrentIndex(p => p + 1)}
                className="px-4 sm:px-8 py-2.5 sm:py-3 bg-green-700 text-white text-[10px] sm:text-xs font-bold rounded-lg uppercase tracking-widest hover:bg-green-800 transition-all shadow-lg shadow-green-900/10"
             >
                Next <span className="hidden sm:inline">Question</span>
             </button>
           ) : (
             <button 
                onClick={handleSubmit} 
                disabled={submitting} 
                className="px-4 sm:px-8 py-2.5 sm:py-3 bg-green-700 text-white text-[10px] sm:text-xs font-bold rounded-lg uppercase tracking-widest hover:bg-green-800 transition-all shadow-lg shadow-green-900/10 disabled:opacity-70"
             >
                {submitting ? '...' : 'Complete'}
             </button>
           )}
        </div>
      </footer>

    </div>
  );
};

export default Quiz;
