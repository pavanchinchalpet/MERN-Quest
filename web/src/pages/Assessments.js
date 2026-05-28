import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageError, PageSpinner } from '../components/PageState';
import { fetchCached, getErrorMessage } from '../services/api';
import { ASSESSMENT_ICON_MAP } from '../utils/constants';
import { AppIcon } from '../utils/icons';

const Assessments = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadAssessments = async () => {
      try {
        const [quizData, categoryData] = await Promise.all([
          fetchCached('/quiz?limit=200'),
          fetchCached('/quiz/categories'),
        ]);

        if (isMounted) {
          setQuizzes(Array.isArray(quizData) ? quizData : []);
          setCategories(Array.isArray(categoryData) ? categoryData : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err, 'Unable to load assessments'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAssessments();
    return () => {
      isMounted = false;
    };
  }, []);

  const assessments = useMemo(() => {
    const quizzesByCategory = quizzes.reduce((accumulator, quiz) => {
      const key = quiz.category_id || 'uncategorized';
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(quiz);
      return accumulator;
    }, {});

    return categories
      .map((category) => {
        const categoryQuizzes = quizzesByCategory[category.id] || [];
        return {
          ...category,
          questionCount: categoryQuizzes.length,
          difficulty: categoryQuizzes[0]?.difficulty || 'medium',
          points: categoryQuizzes.reduce((sum, quiz) => sum + (quiz.points || 0), 0) || 100,
          timeLimit: categoryQuizzes.reduce((sum, quiz) => sum + (quiz.time_limit || 0), 0) || 30,
        };
      })
      .filter((assessment) => assessment.questionCount > 0);
  }, [categories, quizzes]);

  const getIconName = (name) => {
    const normalized = (name || '').toLowerCase();
    const match = Object.keys(ASSESSMENT_ICON_MAP).find((key) => normalized.includes(key));
    return match ? ASSESSMENT_ICON_MAP[match] : 'Target';
  };

  if (loading) {
    return <PageSpinner message="Loading assessments..." compact />;
  }

  if (error) {
    return <PageError message={error} onAction={() => window.location.reload()} />;
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <header className="mb-14">
        <div className="inline-block px-4 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-widest mb-4">
          Professional Certifications
        </div>
        <h1 className="text-5xl font-black text-text-primary mb-5 tracking-tight">Exam Center</h1>
        <p className="text-text-secondary text-lg max-w-2xl leading-relaxed">
          Validate your professional expertise through our curated certification exams.
          Each exam is conducted in a <span className="text-brand-primary font-bold">secure proctored environment</span>.
        </p>
      </header>

      <div className="grid gap-6">
        {assessments.map((item) => (
          <div
            key={item.id}
            className="glass-panel p-8 hover:border-brand-primary/50 transition-all group relative overflow-hidden bg-white shadow-sm hover:shadow-xl duration-300"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-8 relative z-10 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-dark-surface border-2 border-white shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <AppIcon name={getIconName(item.name || item.title)} className="h-8 w-8 md:h-10 md:w-10" />
                </div>

                <div className="flex flex-col items-center md:items-start">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 md:px-2.5 md:py-1 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                      Certification
                    </span>
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 md:px-2.5 md:py-1 rounded bg-dark-surface text-text-tertiary border border-dark-border">
                      {item.questionCount} Questions
                    </span>
                  </div>

                  <h2 className="text-xl md:text-2xl font-black text-text-primary mb-2 group-hover:text-brand-primary transition-colors">
                    {item.title || item.name} Assessment
                  </h2>

                  <p className="text-text-secondary text-sm md:text-base max-w-2xl leading-relaxed mb-4 md:mb-6 font-medium">
                    {item.description || `Comprehensive technical assessment covering ${item.title || item.name} core concepts, best practices, and advanced implementation patterns.`}
                  </p>

                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 md:gap-6 text-[10px] md:text-xs font-black uppercase tracking-widest text-text-tertiary">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full ${
                        item.difficulty === 'easy' ? 'bg-green-500' : item.difficulty === 'medium' ? 'bg-orange-500' : 'bg-red-500'
                      }`} />
                      {item.difficulty}
                    </div>
                    <span>{item.points} XP</span>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {item.timeLimit}m
                    </div>
                  </div>
                </div>
              </div>

              <Link
                to={`/quiz?categoryId=${item.id}`}
                className="w-full md:w-auto btn-primary py-3 md:py-4 px-8 md:px-10 text-xs md:text-sm bg-brand-primary hover:bg-black border-0 shadow-lg shadow-brand-primary/20 hover:shadow-none transition-all duration-300 font-black uppercase tracking-widest text-center"
              >
                Start Exam
              </Link>
            </div>

            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl group-hover:bg-brand-primary/10 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Assessments;
