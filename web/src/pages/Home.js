import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { SkeletonCard, SkeletonStat } from '../components/SkeletonLoader';

// Memoized sub-components to prevent re-renders
const QuickStatCard = React.memo(({ label, value, emoji, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fbbf24' }}>
      {value}
    </div>
    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{label}</div>
  </div>
));

const StatCard = React.memo(({ title, value, subtitle, icon, gradient, borderColor, textColor, bgColor, subtitleColor }) => (
  <div style={{
    backgroundColor: '#111827',
    borderRadius: '1rem',
    padding: '2rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
    border: '1px solid #1f2937',
    background: gradient,
    borderColor
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
      <h3 style={{ margin: 0, color: textColor, fontSize: '1rem', fontWeight: '600' }}>{title}</h3>
      <span style={{ fontSize: '1.5rem', color: textColor }}>{icon}</span>
    </div>
    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: bgColor, marginBottom: '0.5rem' }}>
      {value}
    </div>
    <p style={{ margin: 0, fontSize: '0.875rem', color: subtitleColor, opacity: 0.8 }}>{subtitle}</p>
  </div>
));

const RecentQuestItem = React.memo(({ attempt, idx }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.25rem',
    borderRadius: '0.75rem',
    border: '1px solid #1f2937',
    background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.08))',
    transition: 'all 0.2s ease'
  }}>
    <div style={{ flex: 1, marginRight: '1rem' }}>
      <h4 style={{
        margin: '0 0 0.5rem 0',
        fontSize: '1rem',
        fontWeight: '600',
        color: '#e5e7eb'
      }}>
        {(attempt.quizTitle || attempt.category || 'Quiz Attempt')} • {new Date(attempt.attemptedAt).toLocaleDateString()}
      </h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
        {attempt.category ? (
          <span style={{
            backgroundColor: '#1f2937',
            color: '#cbd5e1',
            padding: '0.15rem 0.6rem',
            borderRadius: '9999px'
          }}>{attempt.category}</span>
        ) : null}
        <span>Score: {attempt.score}%</span>
        <span>•</span>
        <span>{attempt.correctAnswers}/{attempt.totalQuestions} correct</span>
        <span>•</span>
        <span>{attempt.pointsEarned} XP</span>
      </div>
    </div>
    <button style={{
      backgroundColor: '#1f2937',
      color: '#94a3b8',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      border: 'none',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'not-allowed',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap'
    }}>
      ✅ Completed
    </button>
  </div>
));

const AchievementItem = React.memo(({ achievement }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.25rem',
    borderRadius: '0.75rem',
    border: '1px solid #1f2937',
    background: achievement.unlocked ? 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.15) 100%)' : '#0f172a',
    opacity: achievement.unlocked ? 1 : 0.7,
    transition: 'all 0.2s ease'
  }}>
    <div style={{ 
      fontSize: '2rem',
      color: achievement.unlocked ? '#f59e0b' : '#9ca3af'
    }}>
      {achievement.icon}
    </div>
    <div style={{ flex: 1 }}>
      <h4 style={{ 
        margin: '0 0 0.25rem 0', 
        fontSize: '1rem', 
        fontWeight: '600', 
        color: achievement.unlocked ? '#fde68a' : '#cbd5e1'
      }}>
        {achievement.title}
      </h4>
      <p style={{ 
        margin: 0, 
        fontSize: '0.875rem', 
        color: achievement.unlocked ? '#fbbf24' : '#94a3b8',
        fontWeight: achievement.unlocked ? '600' : '400'
      }}>
        {achievement.unlocked ? '🎉 Unlocked!' : '🔒 Locked'}
      </p>
    </div>
  </div>
));

const Home = () => {
  const { user } = useAuth();

  // Live data state
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [rank, setRank] = useState(null);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const requests = [
          api.get('/api/user/stats'),
          api.get('/api/user/achievements'),
          api.get('/api/user/leaderboard')
        ];

        const [statsRes, achievementsRes, leaderboardRes] = await Promise.allSettled(requests);

        if (statsRes.status === 'fulfilled') {
          const s = statsRes.value.data || null;
          setStats(s);
          setRecentAttempts((s?.recentScores || []).slice(0, 4));
        }

        if (achievementsRes.status === 'fulfilled') {
          const raw = achievementsRes.value.data || [];
          // Normalize fields used by UI
          const mapped = raw.map(a => ({
            id: a.id,
            title: a.name || a.title || 'Achievement',
            icon: a.icon || '⭐',
            unlocked: Boolean(a.isEarned ?? a.unlocked ?? false)
          }));
          setAchievements(mapped);
        }

        if (leaderboardRes.status === 'fulfilled') {
          const lb = leaderboardRes.value.data || [];
          const currentId = user?.id;
          const me = lb.find(u => (u.id || u._id) === currentId);
          setRank(me?.rank || null);
        }
      } catch (err) {
        setError('Failed to load your dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    } else {
      // If not logged in, stop loading so page still renders with prompts
      setLoading(false);
    }
  }, [user]);

  // Derive quest progress bar numbers
  const questStats = useMemo(() => {
    const completed = stats?.totalQuizzes ?? 0;
    const total = Math.max(completed, 20);
    const streak = stats?.streak ?? user?.streak ?? 0;
    const level = stats?.level ?? user?.level ?? 1;
    return { completed, total, streak, level };
  }, [stats, user]);

  const totalPoints = stats?.points ?? user?.points ?? 0;

  // Show skeleton loaders to prevent layout shift
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#0f172a',
        padding: '0'
      }}>
        {/* Hero Section with reserved space */}
        <div style={{
          background: 'linear-gradient(135deg, #111827 0%, #0b1220 100%)',
          color: 'white',
          padding: '4rem 2rem',
          textAlign: 'center',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ maxWidth: '1200px', width: '100%' }}>
            <div style={{ 
              width: '400px', 
              height: '48px', 
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: '8px',
              margin: '0 auto 1rem',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
            <div style={{ 
              width: '300px', 
              height: '24px', 
              background: 'rgba(255,255,255,0.08)', 
              borderRadius: '8px',
              margin: '0 auto',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
          </div>
        </div>

        {/* Main Content with skeletons */}
        <div style={{ padding: '3rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            backgroundColor: '#111827',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid #1f2937',
            marginBottom: '3rem',
            minHeight: '150px'
          }}>
            <div style={{ 
              width: '200px', 
              height: '32px', 
              background: '#1f2937', 
              borderRadius: '4px',
              margin: '0 auto',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            <SkeletonCard height="400px" />
            <SkeletonCard height="400px" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e5e7eb', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
          <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{error}</div>
          <button onClick={() => window.location.reload()} style={{ background: '#4f46e5', color: 'white', padding: '0.6rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page-wrapper" style={{ 
      minHeight: '100vh', 
      background: '#0f172a',
      padding: '0'
    }}>
      {/* Hero Section */}
      <div className="home-hero-section" style={{
        background: 'linear-gradient(135deg, #111827 0%, #0b1220 100%)',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
          `,
          pointerEvents: 'none'
        }}></div>
        
        <div className="home-hero-inner" style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <h1 className="home-hero-title" style={{ 
            fontWeight: '800', 
            marginBottom: '1rem',
            lineHeight: '1.1'
          }}>
            Welcome back, <span style={{ color: '#fbbf24' }}>{user?.username || 'Learner'}</span>! 🎮
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            opacity: 0.9, 
            marginBottom: '1.5rem',
            maxWidth: '600px',
            margin: '0 auto 2rem'
          }}>
            Continue your MERN stack learning journey and level up your skills
          </p>
          
          {/* Quick Stats */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '3rem',
            marginTop: '2rem',
            flexWrap: 'wrap'
          }}>
            <QuickStatCard label="Total XP" value={totalPoints} emoji="⚡" />
            <QuickStatCard label="Current Level" value={`Level ${questStats.level}`} emoji="🏆" />
            <QuickStatCard label="Day Streak" value={questStats.streak} emoji="🔥" />
          </div>

          {/* Quick Navigation Links */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            marginTop: '2rem',
            flexWrap: 'wrap'
          }}>
            <Link 
              to="/quiz" 
              style={{
                backgroundColor: '#4f46e5',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)'
              }}
            >
              <span>🎯</span>
              Start Quiz
            </Link>
            <Link 
              to="/leaderboard" 
              style={{
                backgroundColor: 'transparent',
                color: '#e5e7eb',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                border: '2px solid #374151',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}
            >
              <span>🏆</span>
              View Leaderboard
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '3rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Progress Overview */}
        <div style={{
          backgroundColor: '#111827',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          marginBottom: '3rem',
          border: '1px solid #1f2937'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>🏆</span>
              <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '700', color: '#93c5fd' }}>
                Level {questStats.level} Developer
              </h2>
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              backgroundColor: '#1f2937',
              borderRadius: '6px',
              overflow: 'hidden',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: `${(questStats.completed / (questStats.total || 1)) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #4f46e5, #4338ca)',
                borderRadius: '6px',
                transition: 'width 0.5s ease'
              }}></div>
            </div>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '1rem', fontWeight: '500' }}>
              {questStats.completed}/{questStats.total} quests completed
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          <StatCard 
            title="Total XP"
            value={totalPoints}
            subtitle={stats?.pointsEarnedThisWeek ? `+${stats.pointsEarnedThisWeek} this week` : ''}
            icon="⚡"
            gradient="linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.15) 100%)"
            borderColor="#064e3b"
            textColor="#34d399"
            bgColor="#a7f3d0"
            subtitleColor="#34d399"
          />

          <StatCard 
            title="Streak"
            value={`${questStats.streak} days`}
            subtitle="Keep it up!"
            icon="🎯"
            gradient="linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.15) 100%)"
            borderColor="#92400e"
            textColor="#fbbf24"
            bgColor="#fbbf24"
            subtitleColor="#fbbf24"
          />

          <StatCard 
            title="Rank"
            value={rank ? `#${rank}` : '-'}
            subtitle="Global leaderboard"
            icon="👥"
            gradient="linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(79,70,229,0.15) 100%)"
            borderColor="#4338ca"
            textColor="#93c5fd"
            bgColor="#c7d2fe"
            subtitleColor="#a5b4fc"
          />
        </div>

        {/* Recent Quests and Achievements */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {/* Recent Attempts */}
          <div style={{
            backgroundColor: '#111827',
            borderRadius: '1rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            border: '1px solid #1f2937',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '2rem 2rem 1rem',
              borderBottom: '1px solid #1f2937',
              background: 'linear-gradient(135deg, #0b1220 0%, #0f172a 100%)'
            }}>
              <h3 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                margin: 0, 
                color: '#93c5fd',
                fontSize: '1.25rem',
                fontWeight: '700'
              }}>
                <span style={{ fontSize: '1.5rem' }}>📚</span>
                Recent Quests
              </h3>
              <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
                Continue your learning adventure
              </p>
            </div>
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentAttempts.length === 0 ? (
                  <div style={{ color: '#94a3b8' }}>No recent activity. Take a quiz to get started!</div>
                ) : (
                  recentAttempts.map((attempt, idx) => (
                    <RecentQuestItem key={attempt.attemptedAt || idx} attempt={attempt} idx={idx} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div style={{
            backgroundColor: '#111827',
            borderRadius: '1rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            border: '1px solid #1f2937',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '2rem 2rem 1rem',
              borderBottom: '1px solid #1f2937',
              background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.15) 100%)'
            }}>
              <h3 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                margin: 0, 
                color: '#fbbf24',
                fontSize: '1.25rem',
                fontWeight: '700'
              }}>
                <span style={{ fontSize: '1.5rem' }}>🏆</span>
                Achievements
              </h3>
              <p style={{ margin: '0.5rem 0 0 0', color: '#fbbf24', fontSize: '0.875rem', opacity: 0.8 }}>
                Your learning milestones
              </p>
            </div>
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {achievements.map((achievement) => (
                  <AchievementItem key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div style={{
          backgroundColor: '#111827',
          borderRadius: '1rem',
          padding: '3rem 2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          border: '1px solid #1f2937',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #0b1220 0%, #0f172a 100%)'
        }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            marginBottom: '1rem', 
            background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent', 
            backgroundClip: 'text',
            fontWeight: '800'
          }}>
            Ready to Level Up? 🚀
          </h2>
          <p style={{ 
            color: '#cbd5e1', 
            fontSize: '1.25rem', 
            marginBottom: '2.5rem', 
            maxWidth: '700px', 
            margin: '0 auto 2.5rem',
            lineHeight: '1.6'
          }}>
            Take on new challenges, earn XP, and climb the leaderboard. Your MERN stack mastery journey continues here!
          </p>
          <div style={{ 
            display: 'flex', 
            gap: '1.5rem', 
            justifyContent: 'center', 
            flexWrap: 'wrap' 
          }}>
            <Link 
              to="/quiz" 
              style={{
                backgroundColor: '#4f46e5',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '0.75rem',
                textDecoration: 'none',
                fontSize: '1.1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)'
              }}
            >
              <span>🎯</span>
              Start Quiz
            </Link>
            <Link 
              to="/leaderboard" 
              style={{
                backgroundColor: 'transparent',
                color: '#e5e7eb',
                padding: '1rem 2rem',
                borderRadius: '0.75rem',
                textDecoration: 'none',
                fontSize: '1.1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                border: '2px solid #374151',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}
            >
              <span>🏆</span>
              View Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;