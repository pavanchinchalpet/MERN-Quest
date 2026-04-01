import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api, { unwrapResponse } from '../services/api';

const Assessments = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizRes, catRes] = await Promise.all([
          api.get('/quiz?limit=200'),
          api.get('/quiz/categories')
        ]);
        setQuizzes(unwrapResponse(quizRes) || []);
        setCategories(unwrapResponse(catRes) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const assessments = useMemo(() => {
    return categories.map(cat => {
      const catQuizzes = quizzes.filter(q => q.category_id === cat.id);
      return {
        ...cat,
        questionCount: catQuizzes.length,
        difficulty: catQuizzes.length > 0 ? catQuizzes[0].difficulty : 'medium',
        points: catQuizzes.reduce((acc, q) => acc + (q.points || 0), 0) || 100,
        time_limit: catQuizzes.reduce((acc, q) => acc + (q.time_limit || 0), 0) || 30
      };
    }).filter(a => a.questionCount > 0);
  }, [categories, quizzes]);

  const getIcon = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('react')) return '⚛️';
    if (n.includes('javascript') || n.includes('js')) return '📜';
    if (n.includes('node')) return '🟢';
    if (n.includes('sql')) return '🗄️';
    if (n.includes('python')) return '🐍';
    if (n.includes('git')) return '📂';
    return '🎯';
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-dark-border border-t-brand-primary" />
      </div>
    );
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
              <div className="flex items-start gap-6">
                <div className="h-16 w-16 rounded-2xl bg-dark-surface border-2 border-white shadow-sm flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                  {getIcon(item.name || item.title)}
                </div>
                
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                      Certification
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-dark-surface text-text-tertiary border border-dark-border">
                      {item.questionCount} Questions
                    </span>
                  </div>
                  
                  <h2 className="text-2xl font-black text-text-primary mb-2 group-hover:text-brand-primary transition-colors">
                    {item.title || item.name} Assessment
                  </h2>
                  
                  <p className="text-text-secondary text-base max-w-2xl leading-relaxed mb-6 font-medium">
                    {item.description || `Comprehensive technical assessment covering ${item.title || item.name} core concepts, best practices, and advanced implementation patterns.`}
                  </p>
                  
                  <div className="flex items-center gap-6 text-xs font-black uppercase tracking-widest text-text-tertiary">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${
                        item.difficulty === 'easy' ? 'bg-green-500' : 
                        item.difficulty === 'medium' ? 'bg-orange-500' : 
                        'bg-red-500'
                      }`} />
                      {item.difficulty}
                    </div>
                    <span>{item.points} XP Available</span>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {item.time_limit}m
                    </div>
                  </div>
                </div>
              </div>
              
              <Link 
                to={`/quiz?categoryId=${item.id}`} 
                className="btn-primary py-4 px-10 text-sm bg-brand-primary hover:bg-black border-0 shadow-lg shadow-brand-primary/20 hover:shadow-none transition-all duration-300 font-black uppercase tracking-widest whitespace-nowrap"
              >
                Start Exam
              </Link>
            </div>
            
            {/* Background Accent */}
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl group-hover:bg-brand-primary/10 transition-colors"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Assessments;
