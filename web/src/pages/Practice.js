import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { unwrapResponse } from '../services/api';

const Practice = () => {
  const [practices, setPractices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPractices = async () => {
      try {
        const res = await api.get('/practices');
        setPractices(unwrapResponse(res));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPractices();
  }, []);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-dark-border border-t-brand-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-black text-text-primary mb-3">Practice Algorithms</h1>
        <p className="text-text-secondary max-w-2xl mx-auto">
          Master Data Structures and Algorithms with these hand-picked challenges. Solving these will improve your problem-solving skills for interviews.
        </p>
      </header>

      <div className="grid gap-6">
        {practices.map((item) => (
          <div key={item.id} className="glass-panel p-6 hover:border-brand-primary/50 transition-all group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className={`mt-1 h-12 w-12 rounded-lg flex items-center justify-center shrink-0 border-2 border-white shadow-sm ${
                  item.difficulty === 'easy' ? 'bg-brand-primary/10 text-brand-primary' : 
                  item.difficulty === 'medium' ? 'bg-brand-warning/10 text-brand-warning' : 
                  'bg-brand-danger/10 text-brand-danger'
                }`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary group-hover:text-brand-primary transition-colors underline-offset-4 decoration-2">{item.title}</h2>
                  <p className="text-text-secondary mt-1 text-sm line-clamp-2 max-w-xl">{item.description}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-text-tertiary">
                    <span className="flex items-center gap-1">
                      <span className={`h-2 w-2 rounded-full ${
                        item.difficulty === 'easy' ? 'bg-brand-primary' : 
                        item.difficulty === 'medium' ? 'bg-brand-warning' : 
                        'bg-brand-danger'
                      }`} />
                      {item.difficulty}
                    </span>
                    <span>{item.points} Points</span>
                  </div>
                </div>
              </div>
              <Link to={`/practice/${item.id}`} className="btn-primary whitespace-nowrap">Solve Challenge</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Practice;
