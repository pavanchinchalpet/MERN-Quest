import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { unwrapResponse } from '../services/api';

const Assessments = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await api.get('/quiz'); // Reusing existing quiz fetcher
        setQuizzes(unwrapResponse(res));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
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
        <h1 className="text-3xl font-black text-text-primary mb-3">Skill Assessments</h1>
        <p className="text-text-secondary max-w-2xl mx-auto">
          Validate your expertise in various tech stacks. Earn certificates and badges to showcase on your profile.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        {quizzes.map((item) => (
          <div key={item.id} className="glass-panel p-8 hover:shadow-lg transition-all flex flex-col items-center text-center">
            <div className="h-16 w-16 mb-6 rounded-2xl bg-white border-2 border-brand-primary/20 flex items-center justify-center text-brand-primary shadow-sm">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">{item.title}</h2>
            <p className="text-text-secondary text-sm mb-6 flex-grow">{item.description}</p>
            <div className="w-full pt-6 border-t border-dark-border flex items-center justify-between">
              <div className="text-xs font-bold text-text-tertiary uppercase tracking-widest">{item.difficulty} • {item.points} XP</div>
              <Link to={`/quiz?id=${item.id}`} className="font-bold text-sm text-brand-primary hover:underline">Get Certified &rarr;</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Assessments;
