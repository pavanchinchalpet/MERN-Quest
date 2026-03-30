import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage, unwrapResponse } from '../services/api';

const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsResponse, achievementsResponse, leaderboardResponse] = await Promise.all([
          api.get('/user/stats'),
          api.get('/user/achievements'),
          api.get('/user/leaderboard')
        ]);

        setStats(unwrapResponse(statsResponse));
        setAchievements(unwrapResponse(achievementsResponse) || []);
        setLeaderboard(unwrapResponse(leaderboardResponse) || []);
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to load dashboard'));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const currentRank = useMemo(() => {
    const rankIndex = leaderboard.findIndex((entry) => entry.id === user?.id);
    return rankIndex >= 0 ? rankIndex + 1 : null;
  }, [leaderboard, user]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[70vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-dark-border border-t-brand-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto py-10">
        <div className="glass-card p-6 border-brand-danger/30 bg-brand-danger/5 text-brand-danger">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-brand-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const quickStats = [
    { label: 'Total XP', value: stats?.points ?? user?.points ?? 0, icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'text-brand-warning', bg: 'bg-brand-warning/10' },
    { label: 'Current Level', value: stats?.level ?? user?.level ?? 1, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
    { label: 'Day Streak', value: stats?.streak ?? user?.streak ?? 0, icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z', color: 'text-brand-danger', bg: 'bg-brand-danger/10' },
    { label: 'Global Rank', value: currentRank ? `#${currentRank}` : 'Unranked', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3', color: 'text-brand-accent', bg: 'bg-brand-accent/10' }
  ];

  return (
    <div className="w-full pb-16 animate-fade-in text-text-primary">
      {/* Welcome Banner */}
      <section className="glass-panel overflow-hidden relative mb-8">
        <div className="absolute inset-0 bg-dark-bg z-0"></div>
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-dark-surface to-transparent z-0"></div>
        
        <div className="relative z-10 p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <h1 className="heading-1 mb-2">
              Welcome back, <span className="text-brand-primary">{user?.username || 'Developer'}</span>!
            </h1>
            <p className="text-muted text-lg mt-2">
              Continue honing your skills. Complete coding challenges to master new frameworks and climb the global rankings.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/quiz" className="btn-primary flex items-center gap-2">
                Evaluate Skills
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link to="/leaderboard" className="btn-secondary">Global Standings</Link>
            </div>
          </div>
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 md:min-w-[320px]">
            {quickStats.map((item) => (
              <div key={item.label} className="glass-card p-5 flex flex-col items-center justify-center text-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.bg} mb-3`}>
                  <svg className={`w-5 h-5 ${item.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <div className="text-2xl font-black text-text-primary">{item.value}</div>
                <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content Area: Recent Activity */}
        <section className="lg:col-span-2 space-y-6">
          <div className="glass-panel">
            <div className="flex items-center justify-between border-b border-dark-border px-8 py-5">
              <div>
                <h2 className="heading-3 mb-0">Recent Submissions</h2>
              </div>
              <Link to="/quiz" className="text-sm font-bold text-brand-primary hover:underline transition-colors">
                View All
              </Link>
            </div>
            
            <div className="divide-y divide-dark-border">
              {(stats?.recentScores || []).length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-dark-surface flex items-center justify-center mb-4 border border-dark-border">
                    <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-text-primary">No submissions found</h3>
                  <p className="text-text-secondary mt-1 max-w-sm">Complete your first coding challenge to establish your baseline score.</p>
                  <Link to="/quiz" className="btn-primary mt-6">Solve Challenge</Link>
                </div>
              ) : (
                (stats?.recentScores || []).map((attempt) => (
                  <div key={attempt.id} className="p-6 hover:bg-dark-surface transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${attempt.score >= 80 ? 'bg-brand-primary/10 text-brand-primary' : attempt.score >= 50 ? 'bg-brand-warning/10 text-brand-warning' : 'bg-brand-danger/10 text-brand-danger'}`}>
                        {attempt.score >= 80 ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-text-primary">{attempt.quizTitle}</h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary">
                          <span className="font-mono bg-dark-surface px-1.5 py-0.5 rounded text-xs border border-dark-border">
                            {attempt.correctAnswers}/{attempt.totalQuestions} Passed
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center px-2">
                      <div className={`text-xl font-black ${attempt.score >= 80 ? 'text-brand-primary' : attempt.score >= 50 ? 'text-brand-warning' : 'text-brand-danger'}`}>
                        {attempt.score}%
                      </div>
                      <div className="text-xs font-bold text-text-secondary mt-1">
                        +{attempt.pointsEarned} XP
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
        
        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Action Items Widget */}
          <div className="glass-panel">
            <div className="border-b border-dark-border px-6 py-4 bg-dark-surface/50">
              <h2 className="text-base font-bold uppercase tracking-wider text-text-secondary">Next Steps</h2>
            </div>
            <div className="p-4 space-y-3">
              {[
                { title: 'Solve Algorithms', desc: 'Sharpen your logic', action: '/quiz', type: 'primary' },
                { title: 'Global Rankings', desc: 'See where you stand', action: '/leaderboard', type: 'secondary' }
              ].map((step, idx) => (
                <div key={idx} className="group p-4 rounded-lg bg-dark-bg border border-dark-border hover:shadow-sm transition-all flex items-center justify-between gap-4 cursor-pointer">
                  <div>
                    <div className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors">{step.title}</div>
                    <div className="text-xs font-medium text-text-tertiary mt-1">{step.desc}</div>
                  </div>
                  <Link to={step.action} className={`btn-icon bg-white border border-dark-border shadow-sm group-hover:bg-dark-bg ${step.type === 'primary' ? 'text-brand-primary' : ''}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements Widget */}
          <div className="glass-panel flex flex-col">
            <div className="border-b border-dark-border px-6 py-4 bg-dark-surface/50">
              <h2 className="text-base font-bold uppercase tracking-wider text-text-secondary">Skills & Certs</h2>
            </div>
            <div className="p-5 space-y-4">
              {achievements.length === 0 ? (
                <div className="text-center py-4 text-sm font-medium text-text-tertiary">No skills validated yet.</div>
              ) : (
                achievements.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className={`mt-1 w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border-2 ${item.unlocked || item.earned ? 'bg-white border-brand-primary text-brand-primary shadow-sm' : 'bg-dark-surface border-dark-border text-text-tertiary grayscale opacity-50'}`}>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-text-primary line-clamp-1">{item.title || item.name}</div>
                      <div className="text-xs font-medium text-text-secondary line-clamp-2 mt-1 leading-relaxed">{item.description}</div>
                    </div>
                  </div>
                ))
              )}
              {achievements.length > 3 && (
                <div className="pt-2 border-t border-dark-border text-center">
                  <Link to="/profile" className="text-sm font-bold text-brand-primary hover:underline transition-colors w-full inline-block">
                    View All Transcript
                  </Link>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Home;
