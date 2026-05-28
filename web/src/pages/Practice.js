import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageError, PageSpinner } from '../components/PageState';
import { fetchCached, getErrorMessage } from '../services/api';
import { PRACTICE_CATEGORIES } from '../utils/constants';
import { AppIcon } from '../utils/icons';

const normalizeValue = (value) => (value || '').toString().trim().toLowerCase();

const Practice = () => {
  const [practices, setPractices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState('all');

  useEffect(() => {
    let isMounted = true;

    const loadPractices = async () => {
      try {
        const data = await fetchCached('/practices');
        if (isMounted) {
          setPractices(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err, 'Unable to load practice challenges'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPractices();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentCategory = useMemo(
    () => PRACTICE_CATEGORIES.find((category) => category.id === activeCategory),
    [activeCategory]
  );

  const filteredPractices = useMemo(() => {
    const selectedCategory = normalizeValue(activeCategory);
    const selectedSubcategory = normalizeValue(activeSubcategory);

    return practices.filter((practice) => {
      const practiceCategory = normalizeValue(practice.category);
      const practiceSubcategory = normalizeValue(practice.subcategory);
      const matchCategory = selectedCategory === 'all' || practiceCategory === selectedCategory;
      const matchSubcategory = selectedSubcategory === 'all' || practiceSubcategory === selectedSubcategory;
      return matchCategory && matchSubcategory;
    });
  }, [activeCategory, activeSubcategory, practices]);

  if (loading) {
    return <PageSpinner message="Loading practice tracks..." compact />;
  }

  if (error) {
    return <PageError message={error} onAction={() => window.location.reload()} />;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-text-primary mb-3">Practice Workspace</h1>
        <p className="text-text-secondary max-w-2xl">
          Master interview-critical skills by solving hand-picked challenges across different domains and categories.
        </p>
      </header>

      <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar mb-8">
        {PRACTICE_CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => {
              setActiveCategory(category.id);
              setActiveSubcategory('all');
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all whitespace-nowrap border-2 ${
              activeCategory === category.id
                ? 'bg-brand-primary border-brand-primary text-white shadow-glow-primary'
                : 'bg-white border-dark-border text-text-secondary hover:border-brand-primary/50'
            }`}
          >
            <AppIcon name={category.icon} className="h-4 w-4" />
            {category.name}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="glass-panel p-6 sticky top-24">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter by Topic
            </h3>

            <div className="flex flex-wrap lg:flex-col gap-2">
              <button
                onClick={() => setActiveSubcategory('all')}
                className={`text-left px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeSubcategory === 'all'
                    ? 'bg-brand-primary/10 text-brand-primary border-l-4 border-brand-primary'
                    : 'text-text-tertiary hover:bg-dark-surface hover:text-text-secondary'
                }`}
              >
                All Topics
              </button>

              {currentCategory?.subcategories?.map((subcategory) => (
                <button
                  key={subcategory}
                  onClick={() => setActiveSubcategory(subcategory)}
                  className={`text-left px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeSubcategory === subcategory
                      ? 'bg-brand-primary/10 text-brand-primary border-l-4 border-brand-primary'
                      : 'text-text-tertiary hover:bg-dark-surface hover:text-text-secondary'
                  }`}
                >
                  {subcategory}
                </button>
              ))}
            </div>

            {!currentCategory?.subcategories && (
              <p className="text-xs text-text-tertiary italic mt-4">Select a category to see specific topics.</p>
            )}
          </div>
        </aside>

        <div className="lg:col-span-3">
          {filteredPractices.length > 0 ? (
            <div className="grid gap-4">
              {filteredPractices.map((item) => (
                <div key={item.id} className="glass-panel p-5 sm:p-6 hover:border-brand-primary/50 transition-all group relative overflow-hidden bg-white shadow-sm hover:shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border-2 border-white shadow-sm ${
                        item.difficulty === 'easy'
                          ? 'bg-brand-primary/10 text-brand-primary'
                          : item.difficulty === 'medium'
                            ? 'bg-brand-warning/10 text-brand-warning'
                            : 'bg-brand-danger/10 text-brand-danger'
                      }`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                      <div className="flex flex-col items-center md:items-start">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-dark-surface text-text-tertiary border border-dark-border">
                            {item.category || 'General'}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-brand-primary/5 text-brand-primary border border-brand-primary/10">
                            {item.subcategory || 'Basics'}
                          </span>
                        </div>
                        <h2 className="text-xl font-black text-text-primary group-hover:text-brand-primary transition-colors">{item.title}</h2>
                        <p className="text-text-secondary mt-1 text-sm line-clamp-2 max-w-xl font-medium">{item.description}</p>
                        <div className="mt-4 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">
                          <span className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${
                              item.difficulty === 'easy'
                                ? 'bg-brand-primary'
                                : item.difficulty === 'medium'
                                  ? 'bg-brand-warning'
                                  : 'bg-brand-danger'
                            }`} />
                            {item.difficulty}
                          </span>
                          <span>{item.points} Points</span>
                        </div>
                      </div>
                    </div>
                    <Link to={`/practice/${item.id}`} className="w-full md:w-auto btn-primary py-3 px-8 text-xs font-black uppercase tracking-widest text-center shadow-lg shadow-brand-primary/10 hover:shadow-none transition-all">
                      Solve Challenge
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 text-center">
              <div className="w-16 h-16 bg-dark-surface rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">No challenges found</h3>
              <p className="text-text-secondary">We&apos;re still adding challenges for this category. Check back soon!</p>
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setActiveSubcategory('all');
                }}
                className="mt-6 text-brand-primary font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Practice;
