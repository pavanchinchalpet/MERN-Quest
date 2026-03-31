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

  const groupedQuizzes = useMemo(() => {
    const groups = {};
    categories.forEach(cat => {
      groups[cat.id] = {
        title: cat.title || cat.name,
        quizzes: quizzes.filter(q => q.category_id === cat.id)
      };
    });
    return Object.values(groups).filter(g => g.quizzes.length > 0);
  }, [categories, quizzes]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-dark-border border-t-brand-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <header className="mb-14 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-widest mb-4">
          Professional Certifications
        </div>
        <h1 className="text-5xl font-black text-text-primary mb-5 tracking-tight">Exam Center</h1>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
          Select a domain to begin your professional assessment. Exams are conducted in a 
          <span className="text-brand-primary font-bold"> secure environment </span> 
          with fullscreen enforcement.
        </p>
      </header>

      <div className="space-y-16">
        {groupedQuizzes.map((group) => (
          <section key={group.title} className="animate-fade-in">
            <div className="flex items-center justify-between mb-8 px-2">
              <h2 className="text-2xl font-black text-text-primary flex items-center gap-3">
                <span className="w-2 h-8 bg-brand-primary rounded-full"></span>
                {group.title}
              </h2>
              <div className="text-sm font-bold text-text-tertiary">
                {group.quizzes.length} Assessments
              </div>
            </div>

            <div className="relative group">
              <div className="flex overflow-x-auto gap-6 pb-8 px-2 -mx-2 scrollbar-hide snap-x">
                {group.quizzes.map((item) => (
                  <div 
                    key={item.id} 
                    className="min-w-[320px] md:min-w-[380px] snap-start glass-panel p-8 bg-white border-2 border-transparent hover:border-brand-primary transition-all duration-300 flex flex-col relative overflow-hidden group/card shadow-sm hover:shadow-xl"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/card:opacity-10 transition-opacity">
                      <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                      <div className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
                        item.difficulty === 'easy' ? 'bg-green-50 text-green-600 border-green-200' :
                        item.difficulty === 'medium' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                        'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {item.difficulty}
                      </div>
                      <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                        {item.points} XP
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-text-primary mb-3 group-hover/card:text-brand-primary transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-text-secondary text-sm mb-8 flex-grow line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-dark-border mt-auto">
                      <div className="flex items-center gap-2 text-xs font-bold text-text-tertiary">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {item.time_limit || 30}m
                      </div>
                      <Link 
                        to={`/quiz?id=${item.id}`} 
                        className="btn-primary py-2 px-6 text-xs bg-brand-primary hover:bg-black border-0 shadow-none"
                      >
                        Start Exam
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Optional: Add gradient overlays for scroll hint */}
              <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default Assessments;
