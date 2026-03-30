import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage, unwrapResponse } from '../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: user?.username || '',
    avatar: user?.avatar || 'default'
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [statsResponse, achievementsResponse] = await Promise.all([
          api.get('/user/stats'),
          api.get('/user/achievements')
        ]);
        setStats(unwrapResponse(statsResponse));
        setAchievements(unwrapResponse(achievementsResponse) || []);
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to load profile'));
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    setFormData({
      username: user?.username || '',
      avatar: user?.avatar || 'default'
    });
  }, [user]);

  const unlockedCount = useMemo(
    () => achievements.filter((item) => item.unlocked || item.earned).length,
    [achievements]
  );

  const handleSave = async () => {
    if (!formData.username.trim()) {
      setError('Username cannot be empty');
      return;
    }
    
    setSaving(true);
    setError('');
    try {
      const response = await api.put('/user/profile', formData);
      updateUser(response.data.user);
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update profile'));
    } finally {
      setSaving(false);
    }
  };

  const getAvatarLetter = () => {
    if (user?.avatar && user.avatar !== 'default') return user.avatar;
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 animate-fade-in text-text-primary">
      {/* Header Banner */}
      <div className="w-full h-48 rounded-t-lg bg-gradient-to-r from-brand-primary to-green-400 relative overflow-hidden shrink-0 mt-6 md:mt-10 shadow-sm border border-dark-border border-b-0">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/20 blur-3xl"></div>
      </div>

      <section className="glass-panel relative -mt-16 mx-4 sm:mx-8 mb-8 z-10 p-6 sm:p-10 flex flex-col md:flex-row gap-8 items-start bg-white shadow-sm border border-dark-border">
        {/* Profile Info Sidebar */}
        <div className="w-full md:w-1/3 flex flex-col items-center md:items-start shrink-0">
          <div className="w-32 h-32 rounded bg-white border border-dark-border flex items-center justify-center text-6xl font-black text-brand-primary shadow-sm -mt-20 sm:-mt-24 mb-6 relative z-20 group">
            <span className="relative z-10">{getAvatarLetter()}</span>
          </div>

          <h1 className="text-3xl font-black text-text-primary text-center md:text-left">{user?.username || 'Learner'}</h1>
          <p className="text-text-secondary mt-1 text-center md:text-left bg-dark-surface px-3 py-1 rounded text-sm font-bold border border-dark-border inline-block md:block mb-8">{user?.email}</p>

          <div className="w-full space-y-3">
            <div className="glass-card p-4 flex items-center justify-between group hover:border-brand-primary transition-colors bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded border border-dark-border bg-dark-surface text-brand-primary flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Level</div>
                  <div className="text-lg font-black text-text-primary">{stats?.level || user?.level || 1}</div>
                </div>
              </div>
            </div>

            <div className="glass-card p-4 flex items-center justify-between group hover:border-brand-primary transition-colors bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded border border-dark-border bg-dark-surface text-brand-warning flex items-center justify-center group-hover:bg-brand-warning group-hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Total XP</div>
                  <div className="text-lg font-black text-text-primary">{stats?.points || user?.points || 0}</div>
                </div>
              </div>
            </div>

            <div className="glass-card p-4 flex items-center justify-between group hover:border-brand-primary transition-colors bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded border border-dark-border bg-dark-surface text-brand-danger flex items-center justify-center group-hover:bg-brand-danger group-hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Fire Streak</div>
                  <div className="text-lg font-black text-text-primary">{stats?.streak || user?.streak || 0} Days</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="w-full md:w-2/3 flex flex-col gap-8">
          
          {/* Settings / Edit Mode */}
          <div className="glass-card p-6 md:p-8 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="heading-3 mb-1">Account Configuration</h2>
                <p className="text-sm font-medium text-text-tertiary">Manage your personal information and preferences.</p>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  if (editing) {
                    setFormData({ username: user?.username || '', avatar: user?.avatar || 'default' });
                  }
                  setEditing(!editing);
                }} 
                className={`btn-icon ${editing ? 'bg-dark-surface text-text-primary' : 'text-brand-primary border border-brand-primary/30 hover:bg-brand-primary/10'}`}
              >
                {editing ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                )}
              </button>
            </div>

            {error && (
              <div className="mb-6 rounded border border-brand-danger/30 bg-brand-danger/10 p-4">
                <p className="text-sm font-bold text-brand-danger">{error}</p>
              </div>
            )}

            {editing ? (
              <div className="animate-slide-up">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="form-group">
                    <label className="form-label text-text-secondary font-bold text-xs uppercase tracking-wider">Username Display</label>
                    <input
                      className="input-field bg-white"
                      value={formData.username}
                      onChange={(event) => setFormData((current) => ({ ...current, username: event.target.value }))}
                      placeholder="Your alias"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-text-secondary font-bold text-xs uppercase tracking-wider">Profile Icon Initial</label>
                    <div className="relative">
                      <select
                        className="input-field appearance-none w-full bg-white"
                        value={formData.avatar}
                        onChange={(event) => setFormData((current) => ({ ...current, avatar: event.target.value }))}
                      >
                        <option value="default">Default Initial</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="M">M</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-text-secondary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button type="button" onClick={handleSave} disabled={saving} className="btn-primary w-full sm:w-auto disabled:opacity-70 shadow-none">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => {
                    setFormData({ username: user?.username || '', avatar: user?.avatar || 'default' });
                    setEditing(false);
                  }} className="btn-secondary w-full sm:w-auto shadow-none">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-dark-surface border border-dark-border rounded p-5 flex items-start sm:items-center gap-4 text-sm font-medium text-text-secondary shadow-sm">
                <div className="w-8 h-8 rounded bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/20">
                  <svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p>Your profile is currently public on the leaderboard. Click the edit icon to change your username or avatar initial.</p>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Learning Summary */}
            <div className="glass-card p-6 flex flex-col justify-center bg-white shadow-sm border border-dark-border">
              <h3 className="heading-3 mb-4">Module Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded bg-dark-surface border border-dark-border shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white border border-dark-border text-text-primary flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                    </div>
                    <span className="font-bold text-text-secondary">Total Submissions</span>
                  </div>
                  <span className="font-black text-2xl text-text-primary">{stats?.totalQuizzes || 0}</span>
                </div>
                <div className="text-sm font-medium text-text-tertiary px-2">
                  Complete more modules to unlock specialized badges and increase your global ranking.
                </div>
              </div>
            </div>

            {/* Achievements Snippet */}
            <div className="glass-card p-6 flex flex-col bg-white shadow-sm border border-dark-border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="heading-3 mb-0">Trophy Room</h3>
                <span className="text-xs font-bold bg-dark-surface px-2 py-1 rounded text-text-secondary border border-dark-border">
                  {unlockedCount} / {Math.max(achievements.length, 1)}
                </span>
              </div>
              
              <div className="w-full bg-dark-surface h-2 rounded-full overflow-hidden mb-6 border border-dark-border">
                <div 
                  className="bg-brand-primary h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0}%` }}
                ></div>
              </div>

              <div className="flex-grow space-y-3 overflow-y-auto pr-2 max-h-[220px] custom-scrollbar">
                {achievements.length === 0 ? (
                  <div className="text-sm font-medium text-text-tertiary text-center py-4">No badges available</div>
                ) : (
                  achievements.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 p-3 rounded border border-dark-border bg-dark-surface hover:bg-white transition-colors">
                      <div className={`mt-0.5 w-10 h-10 shrink-0 rounded flex items-center justify-center border-2 
                        ${item.unlocked || item.earned 
                          ? 'border-brand-primary/30 bg-brand-primary text-white shadow-sm' 
                          : 'border-dark-border bg-white text-text-tertiary grayscale'}`}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                      </div>
                      <div className="flex-grow">
                        <div className={`font-bold text-sm mb-1 ${item.unlocked || item.earned ? 'text-brand-primary' : 'text-text-secondary'}`}>
                          {item.title || item.name}
                        </div>
                        <div className="text-xs font-medium text-text-tertiary leading-relaxed">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;
