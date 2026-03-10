import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [formData, setFormData] = useState({
    username: user?.username || '',
    avatar: user?.avatar || 'default'
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const achievementsResponse = await api.get('/user/achievements');
      setAchievements(achievementsResponse.data);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSave = async () => {
    try {
      const response = await api.put('/user/profile', formData);
      updateUser(response.data.user);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      username: user.username,
      avatar: user.avatar
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'quiz': return '📚';
      case 'achievement': return '🏆';
      case 'level': return '📈';
      default: return '⭐';
    }
  };

  const skillProgress = [
    { skill: 'React', progress: 75, level: 'Advanced' },
    { skill: 'Node.js', progress: 60, level: 'Intermediate' },
    { skill: 'MongoDB', progress: 45, level: 'Beginner' },
    { skill: 'Express', progress: 55, level: 'Intermediate' },
    { skill: 'JavaScript', progress: 80, level: 'Advanced' },
  ];

  const recentActivity = [
    { id: 1, type: 'quiz', title: 'React Hooks Mastery', xp: 150, date: '2 hours ago', completed: true },
    { id: 2, type: 'achievement', title: 'Speed Runner', date: '1 day ago' },
    { id: 3, type: 'quiz', title: 'Node.js Fundamentals', xp: 100, date: '2 days ago', completed: true },
    { id: 4, type: 'level', title: 'Reached Level 3', date: '3 days ago' },
    { id: 5, type: 'quiz', title: 'JavaScript Basics', xp: 80, date: '5 days ago', completed: true },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
        <h3 className="text-2xl font-bold text-slate-100 mb-2">Loading Profile...</h3>
        <p className="text-slate-400 font-medium">Fetching your learning data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-24">
      {/* Background Effect */}
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10 lg:pt-12">
        {/* Main Profile Card */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden mb-8 group hover:border-slate-600 transition-colors">
          <div className="h-32 bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 relative border-b border-indigo-500/20">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          </div>
          
          <div className="px-6 lg:px-12 pb-10 relative">
            <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 mb-8">
              <div className="w-32 h-32 rounded-3xl bg-slate-800 border-4 border-slate-900 shadow-xl flex items-center justify-center text-5xl font-black shrink-0 relative overflow-hidden group/avatar">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
                <span className="relative z-10 drop-shadow-md">
                  {user.avatar === 'default' ? user.username.charAt(0).toUpperCase() : user.avatar}
                </span>
              </div>
              <div className="flex-1 pb-2">
                <h1 className="text-4xl font-extrabold text-white mb-1 drop-shadow-sm">{user.username}</h1>
                <p className="text-lg font-semibold text-indigo-300">Level {user.level || 1} MERN Stack Developer</p>
              </div>
              <div className="pb-2">
                 <button 
                  onClick={() => setEditing(!editing)} 
                  className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2 border ${
                    editing 
                      ? 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500'
                  }`}
                >
                  {editing ? (
                    <><span>❌</span> Cancel Edit</>
                  ) : (
                    <><span>✏️</span> Edit Profile</>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-4 transition-all hover:bg-slate-800 shadow-inner">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl drop-shadow-md">⚡</div>
                <div>
                  <div className="text-xl font-black text-blue-300">{user.points || 0}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Total XP</div>
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-4 transition-all hover:bg-slate-800 shadow-inner">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-2xl drop-shadow-md">🎯</div>
                <div>
                  <div className="text-xl font-black text-amber-400">{user.streak || 0}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Day Streak</div>
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-4 transition-all hover:bg-slate-800 shadow-inner">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-2xl drop-shadow-md">🏆</div>
                <div>
                  <div className="text-xl font-black text-purple-400">#--</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Global Rank</div>
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-4 transition-all hover:bg-slate-800 shadow-inner">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl drop-shadow-md">📅</div>
                <div>
                  <div className="text-sm font-bold text-emerald-400 line-clamp-1">Current</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Member Since</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-700/30">
              <div className="flex justify-between items-end mb-3">
                <div className="text-slate-400 font-bold uppercase tracking-wider text-xs">Quest Completion Progress</div>
                <div className="text-xl font-black text-white">{user.totalQuizzes || 0}<span className="text-lg text-slate-500">/20</span></div>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-400 rounded-full transition-all duration-1000 relative"
                  style={{ width: `${Math.min(((user.totalQuizzes || 0) / 20) * 100, 100)}%` }}
                >
                  <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white/20 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {editing && (
          <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl border border-indigo-500/30 shadow-2xl overflow-hidden mb-8 transform origin-top animate-slideDown">
            <div className="bg-indigo-900/20 border-b border-indigo-500/20 px-8 py-5">
              <h3 className="text-xl font-extrabold text-white flex items-center gap-3"><span className="text-2xl">⚙️</span> Edit Profile</h3>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="username">Display Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-bold transition-all"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="avatar">Profile Avatar</label>
                  <select
                    id="avatar"
                    name="avatar"
                    className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-bold transition-all appearance-none cursor-pointer"
                    value={formData.avatar}
                    onChange={handleChange}
                  >
                    <option value="default">Default Letter</option>
                    <option value="🎮">🎮 Gamer</option>
                    <option value="👨‍💻">👨‍💻 Coder</option>
                    <option value="👩‍💻">👩‍💻 Dev</option>
                    <option value="🚀">🚀 Rocket</option>
                    <option value="⚡">⚡ Bolt</option>
                    <option value="🔥">🔥 Fire</option>
                    <option value="💻">💻 Laptop</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2">
                  <span>💾</span> Save Changes
                </button>
                <button onClick={handleCancel} className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 px-8 py-3 rounded-xl font-bold transition-all active:scale-95">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Tabs */}
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 shadow-xl rounded-3xl overflow-hidden flex flex-col xl:flex-row min-h-[500px]">
          {/* Tab Navigation Menu */}
          <div className="w-full xl:w-64 bg-slate-900/50 border-b xl:border-b-0 xl:border-r border-slate-700/50 p-4 xl:p-6 flex xl:flex-col gap-2 overflow-x-auto custom-scrollbar">
            <button
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              <span className="text-xl">📊</span> Overview
            </button>
            <button
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === 'achievements' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              onClick={() => setActiveTab('achievements')}
            >
              <span className="text-xl">🏆</span> Achievements
            </button>
            <button
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === 'skills' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              onClick={() => setActiveTab('skills')}
            >
              <span className="text-xl">🎯</span> Skills Map
            </button>
            <button
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === 'activity' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              onClick={() => setActiveTab('activity')}
            >
              <span className="text-xl">📈</span> Recent Activity
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 p-6 lg:p-10 bg-slate-800/20">
            
            {/* Overview Tab Content */}
            {activeTab === 'overview' && (
              <div className="animate-fadeIn">
                <h3 className="text-2xl font-extrabold text-white mb-6">Learning Dashboard</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/30 transition-colors shadow-inner flex flex-col justify-between group">
                    <div>
                      <div className="text-emerald-400 font-bold uppercase tracking-wider text-xs mb-2">Total Progress</div>
                      <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 drop-shadow-sm mb-4">
                        {user.points || 0} <span className="text-2xl font-bold text-emerald-500/50">XP</span>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-emerald-400/80 bg-emerald-500/10 inline-block px-3 py-1.5 rounded-lg w-max border border-emerald-500/20">
                      +120 earned this week 📈
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-700 hover:border-indigo-500/30 transition-colors shadow-inner flex flex-col justify-between group">
                    <div>
                      <div className="text-indigo-400 font-bold uppercase tracking-wider text-xs mb-2">Level Status</div>
                      <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400 drop-shadow-sm mb-4">
                        <span className="text-2xl font-bold text-indigo-500/50">Lvl</span> {user.level || 1}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-indigo-400/80 bg-indigo-500/10 inline-block px-3 py-1.5 rounded-lg w-max border border-indigo-500/20">
                      150 XP needed for next level ⚡
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-700 hover:border-amber-500/30 transition-colors shadow-inner flex flex-col justify-between group">
                    <div>
                      <div className="text-amber-400 font-bold uppercase tracking-wider text-xs mb-2">Consistency</div>
                      <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 drop-shadow-sm mb-4">
                        {user.streak || 0} <span className="text-2xl font-bold text-amber-500/50">Days</span>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-amber-400/80 bg-amber-500/10 inline-block px-3 py-1.5 rounded-lg w-max border border-amber-500/20">
                      Keep it up! Active streak 🔥
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-700 hover:border-blue-500/30 transition-colors shadow-inner flex flex-col justify-between group">
                    <div>
                      <div className="text-blue-400 font-bold uppercase tracking-wider text-xs mb-2">Global Standing</div>
                      <div className="text-5xl font-black text-white drop-shadow-sm mb-4">
                        <span className="text-3xl font-bold text-slate-500">#</span>--
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-blue-400/80 bg-blue-500/10 inline-block px-3 py-1.5 rounded-lg w-max border border-blue-500/20">
                      Top 15% of all learners 🌍
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Achievements Tab Content */}
            {activeTab === 'achievements' && (
              <div className="animate-fadeIn">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h3 className="text-2xl font-extrabold text-white mb-2">Unlocked Badges</h3>
                    <p className="text-slate-400 font-medium text-sm">Collect achievements by completing specific learning milestones.</p>
                  </div>
                  <div className="text-sm font-bold bg-slate-900 px-4 py-2 rounded-xl border border-slate-700 text-amber-400 shadow-inner">
                    {achievements.filter(a => a.earned).length} / {achievements.length} Unlocked
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {achievements.length > 0 ? achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-6 rounded-2xl border flex gap-5 transition-all duration-300 ${
                        achievement.earned 
                          ? 'bg-slate-900/80 border-amber-500/30 hover:-translate-y-1 hover:shadow-lg shadow-inner' 
                          : 'bg-slate-900/30 border-slate-800 opacity-60 grayscale-[50%]'
                      }`}
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${
                        achievement.earned 
                          ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 shadow-[0_0_15px_rgba(251,191,36,0.15)]' 
                          : 'bg-slate-800 border border-slate-700'
                      }`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-lg font-bold mb-1 ${achievement.earned ? 'text-white drop-shadow-sm' : 'text-slate-300'}`}>
                          {achievement.name}
                        </h4>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed mb-3">
                          {achievement.description}
                        </p>
                        {achievement.earned ? (
                          <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">
                            🎉 Unlocked
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-slate-800 text-slate-500 border border-slate-700 rounded-md text-[10px] font-black uppercase tracking-widest">
                            🔒 Locked
                          </span>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full text-center py-10 text-slate-500 font-medium bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                      Keep learning to unlock your first achievements!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Skills Tab Content */}
            {activeTab === 'skills' && (
              <div className="animate-fadeIn">
                <h3 className="text-2xl font-extrabold text-white mb-2">Technology Mastery</h3>
                <p className="text-slate-400 font-medium text-sm mb-8">Your estimated proficiency across the MERN stack.</p>
                
                <div className="grid gap-6 max-w-3xl">
                  {skillProgress.map((skill) => (
                    <div key={skill.skill} className="bg-slate-900/60 p-5 rounded-2xl border border-slate-700/50 shadow-inner hover:border-indigo-500/30 transition-colors group">
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors drop-shadow-sm">{skill.skill}</span>
                        <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-lg bg-slate-800 border border-slate-600 text-slate-300">
                          {skill.level}
                        </span>
                      </div>
                      <div className="h-3 bg-slate-800 rounded-full border border-slate-700/80 overflow-hidden mb-2 shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full"
                          style={{ width: `${skill.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs font-bold text-slate-500 text-right">
                        <span className="text-indigo-400">{skill.progress}%</span> mastery
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Tab Content */}
            {activeTab === 'activity' && (
              <div className="animate-fadeIn">
                <h3 className="text-2xl font-extrabold text-white mb-2">Recent Timeline</h3>
                <p className="text-slate-400 font-medium text-sm mb-8">Your latest learning achievements and platform engagement.</p>
                
                <div className="relative pl-4 space-y-6 lg:space-y-8 before:absolute before:inset-0 before:ml-10 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                  {recentActivity.map((activity, index) => (
                    <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 bg-indigo-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-lg group-hover:scale-110 transition-transform">
                        {getActivityIcon(activity.type)}
                      </div>
                      
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-900/80 p-5 rounded-2xl border border-slate-700 shadow-lg text-left transition-all hover:-translate-y-1 hover:border-indigo-500/30">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="m-0 font-bold text-white text-base leading-snug">{activity.title}</h4>
                          {activity.xp && (
                            <span className="ml-2 shrink-0 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase px-2 py-1 rounded border border-emerald-500/20">
                              +{activity.xp} XP
                            </span>
                          )}
                        </div>
                        <time className="text-xs font-bold text-slate-500">{activity.date}</time>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-slideDown {
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .custom-scrollbar::-webkit-scrollbar {
            height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.5);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(71, 85, 105, 0.5);
            border-radius: 10px;
        }
      `}} />
    </div>
  );
};

export default Profile;
