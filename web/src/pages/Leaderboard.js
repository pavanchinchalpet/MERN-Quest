import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('points'); // 'points' | 'streak' | 'level'
  const [activeTab, setActiveTab] = useState('global'); // 'global' | 'friends'
  const { user: currentUser } = useAuth();

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/user/leaderboard');
      const leaderboardData = response.data;

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
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
        <h3 className="text-2xl font-bold text-slate-100 mb-2">Loading Leaderboard...</h3>
        <p className="text-slate-400 font-medium">Fetching the top performers</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-6">⚠️</div>
        <h3 className="text-2xl font-bold text-red-400 mb-4">{error}</h3>
        <button 
          onClick={loadLeaderboard}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95"
        >
          Try Again
        </button>
      </div>
    );
  }

  const filtered = leaderboard
    .filter(u => u.username.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'points') return (b.totalPoints || b.points || 0) - (a.totalPoints || a.points || 0);
      if (sortBy === 'streak') return (b.streak || 0) - (a.streak || 0);
      if (sortBy === 'level') return (b.level || 0) - (a.level || 0);
      return 0;
    });

  return (
    <div className="min-h-screen bg-slate-900 font-sans pb-24 text-slate-100">
      
      {/* Header Layout */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border-b border-indigo-500/10 p-12 lg:p-16 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -mr-48 -mt-48"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -ml-48 -mt-48"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight drop-shadow-md flex items-center justify-center gap-4">
            <span className="text-6xl drop-shadow-xl animate-bounce">🏆</span> Global Leaderboard
          </h1>
          <p className="text-xl text-indigo-200/80 font-medium">See how you rank among MERN stack learners worldwide</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-20 -mt-10">
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-4 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-4 items-center align-middle justify-between">
          <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-slate-700 w-full md:w-auto">
            {['global','friends'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab 
                    ? 'bg-indigo-500 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab === 'global' ? '🌍 Global' : '👥 Friends'}
              </button>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search user..."
                className="w-full sm:w-64 bg-slate-900/80 border border-slate-700 text-slate-100 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium placeholder:text-slate-500"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full sm:w-auto bg-slate-900/80 border border-slate-700 text-slate-100 rounded-xl py-3 px-5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-bold cursor-pointer appearance-none pr-10 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:24px_24px] bg-[right_8px_center] bg-no-repeat"
            >
              <option value="points">Sort: Total Points</option>
              <option value="streak">Sort: Daily Streak</option>
              <option value="level">Sort: Current Level</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {leaderboard.length === 0 ? (
          <div className="text-center p-16 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl max-w-3xl mx-auto mt-8">
            <div className="text-6xl mb-6 opacity-80">📊</div>
            <h3 className="text-2xl font-bold text-slate-200 mb-3">No data available</h3>
            <p className="text-slate-400 font-medium">Be the first to take a quiz and conquer the leaderboard!</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="py-12 mt-4">
              <h2 className="text-center text-3xl font-extrabold text-white mb-16 tracking-wide uppercase drop-shadow-md">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">Hall of Fame</span>
              </h2>
              
              <div className="flex flex-col lg:flex-row justify-center items-end gap-6 max-w-5xl mx-auto px-4">
                
                {/* 2nd Place */}
                {leaderboard[1] && (
                  <div className="w-full lg:w-1/3 order-2 lg:order-1 relative bg-slate-800/80 border border-slate-700/50 rounded-3xl p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.5)] transform hover:-translate-y-2 transition-all duration-300">
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-700 text-slate-200 px-4 py-1.5 rounded-full font-black text-sm border border-slate-600 shadow-md">#2</div>
                    <div className="text-4xl mb-4 drop-shadow-xl">🥈</div>
                    <div className="w-24 h-24 mx-auto mb-5 rounded-full flex items-center justify-center text-white text-3xl font-black bg-gradient-to-tr from-slate-500 to-slate-400 shadow-[0_0_20px_rgba(148,163,184,0.3)] border-4 border-slate-800">
                      {leaderboard[1].avatar === 'default' ? leaderboard[1].username.charAt(0).toUpperCase() : leaderboard[1].avatar}
                    </div>
                    <h3 className="text-xl font-extrabold text-white mb-2 line-clamp-1">{leaderboard[1].username}</h3>
                    <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-200 mb-2 drop-shadow-sm">
                      {(leaderboard[1].totalPoints || leaderboard[1].points || 0).toLocaleString()} <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">pts</span>
                    </div>
                    <div className="text-sm font-bold text-slate-400 bg-slate-900/50 py-2 rounded-xl mt-4 border border-slate-700/50">
                      Lvl {leaderboard[1].level || 1} • <span className="text-orange-400">{leaderboard[1].streak || 0}🔥</span>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {leaderboard[0] && (
                  <div className="w-full lg:w-[40%] order-1 lg:order-2 relative bg-gradient-to-b from-indigo-900/80 to-slate-900 border border-indigo-500/30 rounded-t-3xl rounded-b-xl lg:rounded-b-3xl p-10 text-center shadow-[0_0_40px_rgba(79,70,229,0.25)] transform hover:-translate-y-2 lg:-translate-y-8 transition-all duration-300 z-10">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-70"></div>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-5 py-2 rounded-full font-black text-sm border-2 border-slate-900 shadow-xl shadow-amber-500/20">#1</div>
                    <div className="text-5xl mb-5 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] animate-pulse">👑</div>
                    <div className="w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center text-white text-5xl font-black bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 shadow-[0_0_30px_rgba(251,191,36,0.4)] border-4 border-slate-900">
                      {leaderboard[0].avatar === 'default' ? leaderboard[0].username.charAt(0).toUpperCase() : leaderboard[0].avatar}
                    </div>
                    <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 mb-2 line-clamp-1">{leaderboard[0].username}</h3>
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 mb-3 drop-shadow-md">
                      {(leaderboard[0].totalPoints || leaderboard[0].points || 0).toLocaleString()} <span className="text-lg font-bold text-amber-500/60 uppercase tracking-widest">pts</span>
                    </div>
                    <div className="text-sm font-bold text-indigo-200 bg-indigo-950/50 py-2.5 rounded-xl border border-indigo-500/20 mt-6 shadow-inner">
                      Level {leaderboard[0].level || 1} • <span className="text-orange-400">{leaderboard[0].streak || 0} Streak 🔥</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {leaderboard[2] && (
                  <div className="w-full lg:w-1/3 order-3 lg:order-3 relative bg-slate-800/80 border border-slate-700/50 rounded-3xl p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.5)] transform hover:-translate-y-2 transition-all duration-300">
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-700 text-slate-200 px-4 py-1.5 rounded-full font-black text-sm border border-slate-600 shadow-md">#3</div>
                    <div className="text-4xl mb-4 drop-shadow-xl">🥉</div>
                    <div className="w-24 h-24 mx-auto mb-5 rounded-full flex items-center justify-center text-white text-3xl font-black bg-gradient-to-tr from-orange-800 to-orange-700 shadow-[0_0_20px_rgba(194,65,12,0.3)] border-4 border-slate-800">
                      {leaderboard[2].avatar === 'default' ? leaderboard[2].username.charAt(0).toUpperCase() : leaderboard[2].avatar}
                    </div>
                    <h3 className="text-xl font-extrabold text-white mb-2 line-clamp-1">{leaderboard[2].username}</h3>
                    <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-orange-400 mb-2 drop-shadow-sm">
                      {(leaderboard[2].totalPoints || leaderboard[2].points || 0).toLocaleString()} <span className="text-sm font-bold text-orange-900/60 uppercase tracking-widest">pts</span>
                    </div>
                    <div className="text-sm font-bold text-slate-400 bg-slate-900/50 py-2 rounded-xl mt-4 border border-slate-700/50">
                      Lvl {leaderboard[2].level || 1} • <span className="text-orange-400">{leaderboard[2].streak || 0}🔥</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Complete Rankings List */}
            <div className="mt-12">
              <div className="bg-slate-800/50 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700/80 p-6 lg:p-8">
                  <h3 className="text-2xl font-extrabold text-white m-0 flex items-center gap-3 tracking-tight">
                    <span className="text-3xl drop-shadow-md">📊</span> Complete Rankings
                  </h3>
                  <p className="text-slate-400 font-medium mt-2">All participants ranked globally</p>
                </div>
                
                <div className="p-4 lg:p-6 flex flex-col gap-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                  {filtered.map((user, index) => {
                    const rank = index + 1;
                    const isCurrentUser = user.isCurrentUser;
                    return (
                      <div
                        key={user._id || user.id}
                        className={`flex items-center gap-4 lg:gap-6 p-4 lg:p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group ${
                          isCurrentUser 
                            ? 'bg-indigo-900/20 border-indigo-500/50 shadow-indigo-500/5' 
                            : 'bg-slate-900/60 border-slate-700 hover:bg-slate-800/80 hover:border-slate-600'
                        }`}
                      >
                        <div className={`text-xl font-black shrink-0 w-12 text-center ${
                          rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-slate-300' : rank === 3 ? 'text-orange-400' : 'text-slate-500 group-hover:text-slate-400'
                        }`}>
                          #{rank}
                        </div>
                        
                        <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full flex shrink-0 items-center justify-center font-black text-xl bg-slate-800 border-2 border-slate-700 shadow-inner text-slate-300">
                          {user.avatar === 'default' ? user.username.charAt(0).toUpperCase() : user.avatar}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="m-0 text-lg lg:text-xl font-bold text-slate-100 truncate flex items-center gap-3">
                            {user.username}
                            {isCurrentUser && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500 text-white shadow-md">
                                You
                              </span>
                            )}
                          </h4>
                          <p className="m-0 mt-0.5 text-sm font-semibold text-slate-500">Level {user.level || 1}</p>
                        </div>
                        
                        <div className="text-right shrink-0">
                          <div className={`text-lg lg:text-xl font-extrabold ${isCurrentUser ? 'text-indigo-300' : 'text-slate-200'}`}>
                            {(user.totalPoints || user.points || 0).toLocaleString()} <span className="text-xs font-bold uppercase tracking-widest text-slate-500">pts</span>
                          </div>
                          <div className="text-sm font-semibold text-orange-400/80 mt-0.5">
                            {user.streak || 0} day streak 🔥
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div className="text-center py-12 text-slate-500 font-medium">
                      No users found matching your search.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tips Section */}
        <div className="mt-12 lg:mt-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700 p-8 lg:p-10 shadow-xl overflow-hidden relative group">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-700"></div>
          <h3 className="text-2xl font-extrabold text-white mb-8 relative z-10 flex items-center gap-3">
            <span>🚀</span> How to climb the ranks
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative z-10">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 transform transition-all group-hover:-translate-y-1">
              <div className="text-3xl mb-3 drop-shadow-md">📚</div>
              <h4 className="font-bold text-slate-200 mb-1 text-lg">Take Quizzes</h4>
              <p className="text-slate-400 text-sm font-medium">Earn points with every quest attempt and completion.</p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 transform transition-all group-hover:-translate-y-1 delay-75">
              <div className="text-3xl mb-3 drop-shadow-md">🎯</div>
              <h4 className="font-bold text-slate-200 mb-1 text-lg">Be Accurate</h4>
              <p className="text-slate-400 text-sm font-medium">Higher accuracy and speed equals massive point multipliers.</p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 transform transition-all group-hover:-translate-y-1 delay-150">
              <div className="text-3xl mb-3 drop-shadow-md">🔥</div>
              <h4 className="font-bold text-slate-200 mb-1 text-lg">Keep Streaks</h4>
              <p className="text-slate-400 text-sm font-medium">Learning daily unlocks streak bonuses and exclusive badges.</p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 transform transition-all group-hover:-translate-y-1 delay-200">
              <div className="text-3xl mb-3 drop-shadow-md">🏆</div>
              <h4 className="font-bold text-slate-200 mb-1 text-lg">Earn Badges</h4>
              <p className="text-slate-400 text-sm font-medium">Complete milestone challenges for massive XP dumps.</p>
            </div>
          </div>
        </div>

      </div>

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
            border: 2px solid rgba(15, 23, 42, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(99, 102, 241, 0.5);
        }
      `}} />
    </div>
  );
};

export default Leaderboard;
