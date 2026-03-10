import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { SkeletonCard, SkeletonStat } from '../components/SkeletonLoader';

const QuickStatCard = React.memo(({ label, value, emoji }) => (
  <div className="text-center transform hover:scale-105 transition-transform duration-300">
    <div className="text-3xl md:text-5xl font-extrabold text-amber-400 mb-2 drop-shadow-md flex items-center justify-center gap-3">
      {value} <span className="text-2xl md:text-4xl drop-shadow-lg">{emoji}</span>
    </div>
    <div className="text-xs md:text-sm opacity-90 text-slate-300 font-bold tracking-widest uppercase letter-spacing-2">{label}</div>
  </div>
));

const StatCard = React.memo(({ title, value, subtitle, icon, gradientClass, borderClass, textClass, valueClass, subtitleClass }) => (
  <div className={`rounded-3xl p-8 shadow-2xl border backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-indigo-500/10 ${gradientClass} ${borderClass}`}>
    <div className="flex justify-between items-center mb-6">
      <h3 className={`m-0 text-sm font-bold tracking-wider uppercase ${textClass}`}>{title}</h3>
      <div className={`text-2xl p-3 rounded-xl bg-slate-900/40 backdrop-blur-md shadow-inner ${textClass}`}>{icon}</div>
    </div>
    <div className={`text-5xl font-extrabold mb-3 tracking-tight drop-shadow-sm ${valueClass}`}>
      {value}
    </div>
    <p className={`m-0 text-sm font-medium ${subtitleClass}`}>{subtitle}</p>
  </div>
));

const RecentQuestItem = React.memo(({ attempt }) => (
  <div className="group flex flex-col sm:flex-row items-center justify-between p-6 rounded-2xl border border-slate-700/60 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5">
    <div className="flex-1 mr-4 w-full mb-4 sm:mb-0">
      <h4 className="m-0 mb-3 text-lg font-bold text-slate-100 flex items-center gap-3">
        {(attempt.quizTitle || attempt.category || 'Quiz Attempt')}
        <span className="text-slate-500 font-medium text-xs bg-slate-800/50 px-2 py-1 rounded-md border border-slate-700/50 shadow-inner">
          {new Date(attempt.attemptedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </h4>
      <div className="flex flex-wrap items-center gap-3 text-slate-400 text-sm font-semibold">
        {attempt.category && (
          <span className="bg-gradient-to-r from-slate-800 to-slate-800/80 text-slate-200 px-3 py-1.5 rounded-lg text-xs border border-slate-600 shadow-sm">
            {attempt.category}
          </span>
        )}
        <span className="text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-md border border-emerald-400/20 shadow-sm">
          Score: {attempt.score}%
        </span>
        <span className="hidden sm:inline text-slate-700">•</span>
        <span className="text-slate-300 bg-slate-800/50 px-2.5 py-1 rounded-md">
          {attempt.correctAnswers}/{attempt.totalQuestions} correct
        </span>
        <span className="hidden sm:inline text-slate-700">•</span>
        <span className="text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20 shadow-sm">
          +{attempt.pointsEarned} XP
        </span>
      </div>
    </div>
    <div className="bg-slate-900/60 text-emerald-400/80 px-6 py-3.5 rounded-xl border border-emerald-500/20 text-sm font-bold cursor-default transition-all whitespace-nowrap w-full sm:w-auto flex items-center justify-center gap-2 shadow-inner group-hover:bg-slate-900/80 group-hover:text-emerald-400 group-hover:border-emerald-500/40">
      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center"><span className="text-xs">✓</span></div> 
      Completed
    </div>
  </div>
));

const AchievementItem = React.memo(({ achievement }) => (
  <div className={`group flex items-center gap-6 p-6 rounded-2xl border transition-all duration-300 ${
    achievement.unlocked 
      ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-700/5 to-slate-900 shadow-xl shadow-amber-500/5 hover:-translate-y-1 hover:shadow-amber-500/10' 
      : 'border-slate-800 bg-slate-900/40 opacity-70 grayscale-[50%] hover:grayscale-0 hover:bg-slate-800/60'
  }`}>
    <div className={`text-4xl flex items-center justify-center w-20 h-20 rounded-2xl transition-all duration-300 ${
      achievement.unlocked 
        ? 'bg-gradient-to-br from-amber-400/20 to-orange-500/10 text-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.2)] border border-amber-400/20 group-hover:scale-110' 
        : 'bg-slate-800 text-slate-500 border border-slate-700'
    }`}>
      {achievement.icon}
    </div>
    <div className="flex-1">
      <h4 className={`m-0 mb-2 text-xl font-extrabold tracking-tight ${
        achievement.unlocked ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-100 to-amber-300' : 'text-slate-300'
      }`}>
        {achievement.title}
      </h4>
      <div className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
        achievement.unlocked 
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
          : 'bg-slate-800/50 text-slate-500 border-slate-700/50'
      }`}>
        {achievement.unlocked ? <><span className="text-orange-400 animate-pulse">🎉</span> Unlocked</> : <><span>🔒</span> Locked</>}
      </div>
    </div>
  </div>
));

const Home = () => {
  const { user } = useAuth();
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
          api.get('/user/stats'),
          api.get('/user/achievements'),
          api.get('/user/leaderboard')
        ];

        const [statsRes, achievementsRes, leaderboardRes] = await Promise.allSettled(requests);

        if (statsRes.status === 'fulfilled') {
          const s = statsRes.value.data || null;
          setStats(s);
          setRecentAttempts((s?.recentScores || []).slice(0, 4));
        }

        if (achievementsRes.status === 'fulfilled') {
          const raw = achievementsRes.value.data || [];
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
      setLoading(false);
    }
  }, [user]);

  const questStats = useMemo(() => {
    const completed = stats?.totalQuizzes ?? 0;
    const total = Math.max(completed, 20);
    const streak = stats?.streak ?? user?.streak ?? 0;
    const level = stats?.level ?? user?.level ?? 1;
    return { completed, total, streak, level };
  }, [stats, user]);

  const totalPoints = stats?.points ?? user?.points ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-0 font-sans">
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 text-white p-16 md:p-24 text-center min-h-[400px] flex items-center justify-center relative overflow-hidden border-b border-indigo-500/10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
          <div className="w-full max-w-6xl relative z-10">
            <div className="w-96 h-14 bg-white/5 rounded-xl mx-auto mb-6 animate-pulse backdrop-blur-sm border border-white/10" />
            <div className="w-72 h-8 bg-white/5 rounded-lg mx-auto animate-pulse backdrop-blur-sm" />
          </div>
        </div>
        <div className="p-8 md:p-12 max-w-7xl mx-auto -mt-10 relative z-20">
          <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border border-white/5 mb-12 min-h-[180px] shadow-2xl">
            <div className="w-64 h-10 bg-slate-700/50 rounded-lg mx-auto animate-pulse mb-6" />
            <div className="w-full max-w-2xl h-4 bg-slate-700/30 rounded-full mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-800/50 rounded-3xl p-8 border border-white/5 h-48 animate-pulse flex flex-col justify-between">
                <div className="flex justify-between items-center"><div className="w-24 h-6 bg-slate-700/50 rounded-md"/><div className="w-10 h-10 bg-slate-700/50 rounded-xl"/></div>
                <div className="w-32 h-12 bg-slate-700/50 rounded-lg"/>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-slate-800/50 rounded-3xl p-8 border border-white/5 h-96 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 grid place-items-center font-sans">
        <div className="text-center bg-slate-800/50 p-12 rounded-3xl border border-red-500/20 shadow-2xl max-w-md w-full mx-4 backdrop-blur-xl">
          <div className="text-6xl mb-6 drop-shadow-lg">⚠️</div>
          <div className="font-bold text-xl mb-8 text-slate-100">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:from-indigo-400 hover:to-blue-500 transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95 border border-indigo-400/20"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 font-sans selection:bg-indigo-500/30">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 text-white text-center relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32 border-b border-indigo-500/10">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold text-sm mb-8 backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Dashboard Active
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 tracking-tight drop-shadow-sm flex flex-col sm:block">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 drop-shadow-md">{user?.username || 'Learner'}</span>! <span className="inline-block hover:animate-bounce mt-2 sm:mt-0">🎮</span>
          </h1>
          <p className="text-xl lg:text-2xl opacity-90 mb-12 max-w-2xl mx-auto text-indigo-100/80 font-medium leading-relaxed">
            Continue your MERN stack learning journey and level up your developer skills today.
          </p>
          
          {/* Quick Stats */}
          <div className="flex justify-center gap-8 lg:gap-16 mt-8 flex-wrap bg-slate-900/40 p-8 rounded-3xl backdrop-blur-md border border-white/5 shadow-2xl shadow-black/50 mx-auto max-w-4xl">
            <QuickStatCard label="Total XP" value={totalPoints} emoji="⚡" />
            <div className="w-px h-20 bg-gradient-to-b from-transparent via-slate-700 to-transparent hidden sm:block"></div>
            <QuickStatCard label="Current Level" value={`Level ${questStats.level}`} emoji="🏆" />
            <div className="w-px h-20 bg-gradient-to-b from-transparent via-slate-700 to-transparent hidden sm:block"></div>
            <QuickStatCard label="Day Streak" value={questStats.streak} emoji="🔥" />
          </div>

          {/* Quick Navigation Links */}
          <div className="flex justify-center gap-4 mt-12 flex-wrap">
            <Link 
              to="/quiz" 
              className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all hover:from-indigo-500 hover:to-blue-500 shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-1 group border border-indigo-400/20"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">🎯</span>
              Start New Quest
            </Link>
            <Link 
              to="/leaderboard" 
              className="bg-slate-800/80 backdrop-blur-md text-slate-100 px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all hover:bg-slate-700/80 shadow-xl shadow-black/20 hover:shadow-black/40 border border-slate-600/50 hover:border-slate-500 hover:-translate-y-1 group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">📊</span>
              Global Rankings
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 md:p-12 max-w-7xl mx-auto -mt-8 relative z-20">
        
        {/* Progress Overview */}
        <div className="bg-slate-800/95 backdrop-blur-xl rounded-3xl p-8 lg:p-12 shadow-2xl shadow-black/40 mb-12 border border-slate-700/50 relative overflow-hidden group hover:border-indigo-500/30 transition-colors duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
          
          <div className="text-center relative z-10">
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-4xl lg:text-5xl drop-shadow-lg">✨</span>
              <h2 className="m-0 text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-blue-300 to-indigo-300">
                Level {questStats.level} Developer
              </h2>
            </div>
            
            <div className="w-full max-w-3xl mx-auto h-5 bg-slate-900/80 rounded-full overflow-hidden mb-4 border border-slate-700/50 shadow-inner p-1 pl-1">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-400 rounded-full transition-all duration-1000 ease-out flex items-center justify-end px-2"
                style={{ width: `${Math.max(5, (questStats.completed / (questStats.total || 1)) * 100)}%` }}
              >
                <div className="w-2 h-2 rounded-full bg-white/50 animate-pulse"></div>
              </div>
            </div>
            
            <p className="m-0 text-slate-400 text-lg font-bold tracking-wide">
              <span className="text-indigo-300">{questStats.completed}</span> / {questStats.total} quests completed to next level
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
          <StatCard 
            title="Total XP"
            value={totalPoints}
            subtitle={stats?.pointsEarnedThisWeek ? `+${stats.pointsEarnedThisWeek} this week` : 'Start learning to earn XP!'}
            icon="⚡"
            gradientClass="bg-gradient-to-br from-emerald-900/40 to-emerald-900/10"
            borderClass="border-emerald-500/20"
            textClass="text-emerald-400"
            valueClass="text-emerald-300"
            subtitleClass="text-emerald-500/80"
          />

          <StatCard 
            title="Current Streak"
            value={`${questStats.streak} Days`}
            subtitle="Keep the fire burning!"
            icon="🔥"
            gradientClass="bg-gradient-to-br from-amber-900/40 to-amber-900/10"
            borderClass="border-amber-500/20"
            textClass="text-amber-400"
            valueClass="text-amber-300"
            subtitleClass="text-amber-500/80"
          />

          <StatCard 
            title="Global Rank"
            value={rank ? `#${rank}` : '-'}
            subtitle="Among all developers"
            icon="🌍"
            gradientClass="bg-gradient-to-br from-indigo-900/40 to-indigo-900/10"
            borderClass="border-indigo-500/20"
            textClass="text-indigo-400"
            valueClass="text-indigo-300"
            subtitleClass="text-indigo-500/80"
          />
        </div>

        {/* Recent Quests and Achievements */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Recent Attempts */}
          <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden flex flex-col hover:border-slate-600 transition-colors">
            <div className="p-8 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-800/40">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="flex items-center gap-3 m-0 text-indigo-300 text-2xl font-extrabold tracking-tight">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-2xl">📚</div>
                    Recent Quests
                  </h3>
                  <p className="mt-2 text-slate-400 text-sm font-medium">Continue your learning adventure</p>
                </div>
                <Link to="/quiz" className="text-sm font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-lg transition-colors border border-indigo-500/20">
                  View All
                </Link>
              </div>
            </div>
            <div className="p-8 flex-1 bg-slate-900/20">
              <div className="flex flex-col gap-4">
                {recentAttempts.length === 0 ? (
                  <div className="text-center p-12 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                    <div className="text-5xl mb-4 opacity-50">🧭</div>
                    <div className="text-slate-300 font-bold mb-2">No quests completed yet</div>
                    <div className="text-slate-500 text-sm mb-6">Take your first MERN quiz to get started!</div>
                    <Link to="/quiz" className="inline-block bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
                      Explore Quests
                    </Link>
                  </div>
                ) : (
                  recentAttempts.map((attempt, idx) => (
                    <RecentQuestItem key={attempt.attemptedAt || idx} attempt={attempt} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden flex flex-col hover:border-slate-600 transition-colors">
            <div className="p-8 border-b border-slate-700/50 bg-gradient-to-r from-amber-900/20 to-slate-800/40">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="flex items-center gap-3 m-0 text-amber-400 text-2xl font-extrabold tracking-tight">
                    <div className="p-2 bg-amber-500/10 rounded-lg text-2xl drop-shadow-md">🏆</div>
                    Achievements
                  </h3>
                  <p className="mt-2 text-amber-500/70 text-sm font-medium">Your learning milestones</p>
                </div>
                <div className="text-sm font-bold text-slate-400 border border-slate-700 px-4 py-2 rounded-lg bg-slate-800 shadow-inner">
                  {achievements.filter(a => a.unlocked).length} / {achievements.length} Unlocked
                </div>
              </div>
            </div>
            <div className="p-8 flex-1 bg-slate-900/20">
              <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {achievements.length === 0 ? (
                    <div className="text-center p-12 text-slate-500 font-medium bg-slate-800/30 rounded-2xl">
                        Keep learning to unlock achievements!
                    </div>
                ) : (
                    achievements.map((achievement) => (
                    <AchievementItem key={achievement.id} achievement={achievement} />
                    ))
                )}
                
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 rounded-3xl p-12 lg:p-16 shadow-2xl border border-indigo-500/30 text-center relative overflow-hidden group hover:border-indigo-400/50 transition-colors duration-500">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/30 transition-colors duration-700"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-indigo-200 to-blue-200 drop-shadow-lg">
              Ready to Level Up? 🚀
            </h2>
            <p className="text-lg md:text-xl text-indigo-100/90 mb-10 leading-relaxed font-medium px-4">
              Take on new coding challenges, master the stack, and forge your path to becoming a top-tier MERN stack developer.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link 
                to="/quiz" 
                className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-10 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:from-indigo-400 hover:to-blue-400 shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 border border-indigo-400/30 group/btn"
              >
                <span className="text-2xl group-hover/btn:scale-110 transition-transform">⚔️</span>
                Embark on a Quest
              </Link>
              <Link 
                to="/leaderboard" 
                className="bg-slate-900/60 backdrop-blur-md text-slate-100 px-10 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:bg-slate-800 border-2 border-slate-700/80 hover:border-slate-500 shadow-xl hover:shadow-2xl hover:-translate-y-1 group/btn2"
              >
                <span className="text-2xl group-hover/btn2:scale-110 transition-transform">🥇</span>
                View Hall of Fame
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom Scrollbar CSS for achievements list */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.5);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(71, 85, 105, 0.5);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(71, 85, 105, 0.8);
        }
      `}} />
    </div>
  );
};

export default Home;