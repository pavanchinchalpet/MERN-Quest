import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('points'); // 'points' | 'streak' | 'level'
  const [activeTab, setActiveTab] = useState('global'); // 'global' | 'friends' (placeholder)
  const { user: currentUser } = useAuth();

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/user/leaderboard');
      const leaderboardData = response.data;

      // Add isCurrentUser flag to the leaderboard data using auth context
      const leaderboardWithCurrentUser = leaderboardData.map(user => ({
        ...user,
        isCurrentUser: currentUser && (user._id === currentUser.id || user.id === currentUser.id)
      }));

      setLeaderboard(leaderboardWithCurrentUser);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  if (loading) {
    return (
      <div className="text-center" style={{ padding: '4rem' }}>
        <div className="spinner" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }}></div>
        <h3 style={{ marginTop: '1.5rem', color: 'var(--gray-700)' }}>Loading Leaderboard...</h3>
        <p style={{ color: 'var(--gray-500)', marginTop: '0.5rem' }}>Fetching the top performers</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center" style={{ padding: '4rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
        <h3 style={{ color: 'var(--red-600)', marginBottom: '1rem' }}>Error Loading Leaderboard</h3>
        <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>{error}</p>
        <button 
          onClick={loadLeaderboard}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          Try Again
        </button>
      </div>
    );
  }


  // Derived list with search and sort
  const filtered = leaderboard
    .filter(u => u.username.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'points') return (b.totalPoints || b.points || 0) - (a.totalPoints || a.points || 0);
      if (sortBy === 'streak') return (b.streak || 0) - (a.streak || 0);
      if (sortBy === 'level') return (b.level || 0) - (a.level || 0);
      return 0;
    });

  return (
    <div className="leaderboard-page" style={{ background: '#0f172a', color: '#e5e7eb' }}>
      <div className="leaderboard-content">
        {/* Header */}
        <div className="page-header" style={{ background: 'linear-gradient(135deg, #111827, #0b1220)', borderBottom: '1px solid #1f2937', padding: '3rem 2rem' }}>
          <h1 style={{ color: '#f8fafc', fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>🏆 Global Leaderboard</h1>
          <p style={{ color: '#cbd5e1' }}>See how you rank among MERN stack learners worldwide</p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid #1f2937', background: '#0b1220' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: '#111827', border: '1px solid #1f2937', borderRadius: '0.5rem', overflow: 'hidden' }}>
            {['global','friends'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.5rem 1rem',
                  background: activeTab === tab ? '#1f2937' : 'transparent',
                  color: '#e5e7eb',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab ? 700 : 500
                }}
              >
                {tab === 'global' ? '🌍 Global' : '👥 Friends'}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search user..."
            style={{ flex: 1, background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: '0.5rem', padding: '0.6rem 0.75rem' }}
          />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: '0.5rem', padding: '0.6rem 0.75rem' }}
          >
            <option value="points">Sort: Points</option>
            <option value="streak">Sort: Streak</option>
            <option value="level">Sort: Level</option>
          </select>
        </div>

        {leaderboard.length === 0 ? (
          <div className="card text-center">
            <div className="card-content">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
              <h3 style={{ color: 'var(--gray-700)', marginBottom: '1rem' }}>No data available</h3>
              <p style={{ color: 'var(--gray-500)', fontSize: '1.1rem' }}>Be the first to take a quiz and appear on the leaderboard!</p>
            </div>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="podium-section" style={{ padding: '2rem' }}>
              <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#f8fafc' }}>Top 3</h2>
              <div className="podium-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {/* 2nd Place */}
                {leaderboard[1] && (
                  <div className="podium-card second-place" style={{ position: 'relative', padding: '2rem', background: '#111827', border: '1px solid #1f2937', borderRadius: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.35)', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#374151', color: '#e5e7eb', borderRadius: '9999px', padding: '0.25rem 0.6rem', fontWeight: 700 }}>#2</div>
                    <div className="podium-icon" style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>🥈</div>
                    <div className="podium-avatar" style={{ width: 96, height: 96, margin: '0 auto 1rem', borderRadius: '9999px', display: 'grid', placeItems: 'center', color: 'white', fontSize: '2rem', fontWeight: 800, background: 'radial-gradient(100% 100% at 30% 30%, #8b5cf6, #6366f1)' }}>
                      {leaderboard[1].avatar === 'default' ? leaderboard[1].username.charAt(0).toUpperCase() : leaderboard[1].avatar}
                    </div>
                    <h3 className="podium-name" style={{ margin: 0, color: '#f8fafc', fontSize: '1.25rem', fontWeight: 800 }}>{leaderboard[1].username}</h3>
                    <div className="podium-points" style={{ marginTop: '0.5rem', fontSize: '1.5rem', fontWeight: 900, background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{leaderboard[1].totalPoints?.toLocaleString() || leaderboard[1].points?.toLocaleString() || '0'} pts</div>
                    <div className="podium-details" style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Level {leaderboard[1].level} • {leaderboard[1].streak || 0} day streak</div>
                  </div>
                )}

                {/* 1st Place */}
                {leaderboard[0] && (
                  <div className="podium-card first-place" style={{ position: 'relative', padding: '2.25rem', background: '#0b1220', border: '1px solid #1f2937', borderRadius: '1.25rem', boxShadow: '0 16px 40px rgba(99,102,241,0.25)', textAlign: 'center', transform: 'translateY(-8px)' }}>
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#374151', color: '#f8fafc', borderRadius: '9999px', padding: '0.25rem 0.6rem', fontWeight: 800 }}>#1</div>
                    <div className="podium-icon" style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>👑</div>
                    <div className="podium-avatar" style={{ width: 112, height: 112, margin: '0 auto 1rem', borderRadius: '9999px', display: 'grid', placeItems: 'center', color: 'white', fontSize: '2.25rem', fontWeight: 900, background: 'radial-gradient(100% 100% at 30% 30%, #a78bfa, #4f46e5)' }}>
                      {leaderboard[0].avatar === 'default' ? leaderboard[0].username.charAt(0).toUpperCase() : leaderboard[0].avatar}
                    </div>
                    <h3 className="podium-name" style={{ margin: 0, color: '#f8fafc', fontSize: '1.4rem', fontWeight: 900 }}>{leaderboard[0].username}</h3>
                    <div className="podium-points" style={{ marginTop: '0.5rem', fontSize: '1.75rem', fontWeight: 900, background: 'linear-gradient(90deg,#fde68a,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{leaderboard[0].totalPoints?.toLocaleString() || leaderboard[0].points?.toLocaleString() || '0'} pts</div>
                    <div className="podium-details" style={{ color: '#cbd5e1', marginTop: '0.5rem' }}>Level {leaderboard[0].level} • {leaderboard[0].streak || 0} day streak</div>
                  </div>
                )}

                {/* 3rd Place */}
                {leaderboard[2] && (
                  <div className="podium-card third-place" style={{ position: 'relative', padding: '2rem', background: '#111827', border: '1px solid #1f2937', borderRadius: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.35)', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#374151', color: '#e5e7eb', borderRadius: '9999px', padding: '0.25rem 0.6rem', fontWeight: 700 }}>#3</div>
                    <div className="podium-icon" style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>🥉</div>
                    <div className="podium-avatar" style={{ width: 96, height: 96, margin: '0 auto 1rem', borderRadius: '9999px', display: 'grid', placeItems: 'center', color: 'white', fontSize: '2rem', fontWeight: 800, background: 'radial-gradient(100% 100% at 30% 30%, #8b5cf6, #6366f1)' }}>
                      {leaderboard[2].avatar === 'default' ? leaderboard[2].username.charAt(0).toUpperCase() : leaderboard[2].avatar}
                    </div>
                    <h3 className="podium-name" style={{ margin: 0, color: '#f8fafc', fontSize: '1.25rem', fontWeight: 800 }}>{leaderboard[2].username}</h3>
                    <div className="podium-points" style={{ marginTop: '0.5rem', fontSize: '1.5rem', fontWeight: 900, background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{leaderboard[2].totalPoints?.toLocaleString() || leaderboard[2].points?.toLocaleString() || '0'} pts</div>
                    <div className="podium-details" style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Level {leaderboard[2].level} • {leaderboard[2].streak || 0} day streak</div>
                  </div>
                )}
              </div>
            </div>

            {/* Complete Rankings */}
            <div className="complete-rankings">
              <div className="card" style={{ border: '1px solid #1f2937', background: '#111827' }}>
                <div className="card-header" style={{ background: 'linear-gradient(135deg, #0b1220, #0f172a)', borderBottom: '1px solid #1f2937' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#f8fafc' }}>
                    🏆 Complete Rankings
                  </h3>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8' }}>All participants ranked by total points earned</p>
                </div>
                <div className="card-content" style={{ padding: 0 }}>
                  {filtered.map((user, index) => {
                    const rank = index + 1;
                    const isCurrentUser = user.isCurrentUser;
                    return (
                      <div
                        key={user._id || user.id}
                        className={`leaderboard-item ${isCurrentUser ? 'current-user' : ''}`}
                        style={{
                          border: '1px solid #1f2937',
                          borderRadius: '0.75rem',
                          overflow: 'hidden',
                          background: '#0b1220',
                          margin: '0.5rem 1rem'
                        }}
                      >
                        <div className="leaderboard-rank" style={{ color: '#cbd5e1' }}>#{rank}</div>
                        <div className="leaderboard-user">
                          <div className="avatar avatar-md" style={{ background: '#0b1220', border: '1px solid #1f2937', color: '#e5e7eb' }}>
                            {user.avatar === 'default' ? user.username.charAt(0).toUpperCase() : user.avatar}
                          </div>
                          <div className="leaderboard-user-info">
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#f8fafc' }}>
                              {user.username}
                              {isCurrentUser && (
                                <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                                  You
                                </span>
                              )}
                            </h4>
                            <p style={{ margin: 0, color: '#94a3b8' }}>Level {user.level}</p>
                          </div>
                        </div>
                        <div className="leaderboard-score">
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#f8fafc' }}>
                              {(user.totalPoints || user.points || 0).toLocaleString()} pts
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                              {user.streak || 0} day streak
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tips Card */}
        <div className="card mt-3" style={{ border: '1px solid #1f2937', background: '#111827' }}>
          <div className="card-content">
            <h3 style={{ marginBottom: '1rem', color: '#f8fafc' }}>How to climb the leaderboard:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '1.5rem' }}>📚</div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: '#e5e7eb' }}>Take quizzes regularly</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>Earn points with each quiz attempt</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '1.5rem' }}>🎯</div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: '#e5e7eb' }}>Answer correctly</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>Higher accuracy = more points</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '1.5rem' }}>🔥</div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: '#e5e7eb' }}>Maintain streaks</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>Daily practice earns bonus points</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '1.5rem' }}>🏆</div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: '#e5e7eb' }}>Complete challenges</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>Unlock achievements for extra points</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
