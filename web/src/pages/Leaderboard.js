import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage, unwrapResponse } from '../services/api';

const Leaderboard = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const response = await api.get('/user/leaderboard');
        setEntries(unwrapResponse(response) || []);
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to load leaderboard'));
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) =>
        entry.username?.toLowerCase().includes(search.toLowerCase())
      ),
    [entries, search]
  );

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[70vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-dark-border border-t-brand-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 animate-fade-in text-text-primary">
      {/* Header Section */}
      <section className="glass-panel overflow-hidden relative mb-10 bg-white">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-brand-primary/10 to-transparent z-0"></div>
        <div className="relative z-10 p-8 sm:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="badge badge-primary mb-4 flex items-center gap-2 w-max shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Global Rankings
            </div>
            <h1 className="heading-1">Top Performers</h1>
            <p className="text-muted text-lg mt-3">
              See how you stack up against the community. Rankings are based on total XP earned from modules and challenges.
            </p>
          </div>
          
          <div className="w-full md:w-auto md:min-w-[300px]">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-tertiary">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                className="input-field pl-12 bg-dark-surface focus:bg-white border-2 border-dark-border shadow-sm"
                placeholder="Search competitors..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-8 rounded-lg border border-brand-danger/30 bg-brand-danger/10 p-4">
          <p className="text-sm font-medium text-brand-danger">{error}</p>
        </div>
      )}

      {/* Podium Section (Top 3) */}
      {!search && filteredEntries.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 px-4 md:px-0">
          {[1, 0, 2].map((podiumIndex) => {
            const entry = filteredEntries[podiumIndex];
            if (!entry) return null;
            
            const isFirst = podiumIndex === 0;
            const rank = podiumIndex + 1;
            
            return (
              <div 
                key={entry.id} 
                className={`glass-card relative flex flex-col items-center p-6 text-center transform transition-all hover:-translate-y-1 bg-white
                  ${isFirst ? 'md:-mt-6 border-brand-primary shadow-glow-primary md:scale-110 z-10 order-first md:order-none' : 'border-dark-border shadow-sm'}
                `}
              >
                <div className={`absolute -top-5 flex items-center justify-center w-10 h-10 rounded-full font-black text-lg border-2 bg-white shadow-sm
                  ${rank === 1 ? 'border-brand-primary text-brand-primary' : rank === 2 ? 'border-slate-400 text-slate-500' : 'border-amber-600 text-amber-600'}
                `}>
                  {rank}
                </div>
                
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-4 mt-6 border-2
                  ${rank === 1 ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' : 'bg-dark-surface text-text-secondary border-dark-border'}
                `}>
                  <span className="text-2xl sm:text-3xl font-black">{entry.username.charAt(0).toUpperCase()}</span>
                </div>
                
                <h3 className="text-xl font-bold text-text-primary mb-1">{entry.username}</h3>
                <div className="badge badge-neutral mb-4 text-xs font-bold border-dark-border bg-dark-surface">Level {entry.level || 1}</div>
                
                <div className="w-full grid grid-cols-2 gap-2 border-t border-dark-border pt-4 mt-2">
                  <div>
                    <div className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider mb-1">XP</div>
                    <div className="text-lg font-black text-brand-primary">{entry.points || 0}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider mb-1">Streak</div>
                    <div className="text-lg font-black text-brand-warning flex items-center justify-center gap-1">
                      {entry.streak || 0}
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Leaderboard Table */}
      <div className="glass-panel overflow-hidden bg-white shadow-sm border border-dark-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-surface border-b border-dark-border text-xs font-bold tracking-wider text-text-tertiary uppercase">
                <th className="px-6 py-4 w-20 text-center">Rank</th>
                <th className="px-6 py-4">Developer</th>
                <th className="px-6 py-4 text-center">Level</th>
                <th className="px-6 py-4 text-center hidden sm:table-cell">Fire Streak</th>
                <th className="px-6 py-4 text-right">Total XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {filteredEntries.map((entry, index) => {
                const isCurrentUser = entry.id === user?.id;
                
                return (
                  <tr 
                    key={entry.id} 
                    className={`transition-colors hover:bg-dark-surface/50 ${isCurrentUser ? 'bg-brand-primary/5 hover:bg-brand-primary/10' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span className={`w-8 h-8 flex items-center justify-center rounded font-bold text-sm border-2
                          ${index === 0 ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary' : 
                            index === 1 ? 'bg-slate-100 border-slate-300 text-slate-500' : 
                            index === 2 ? 'bg-amber-50 border-amber-300 text-amber-600' : 
                            'text-text-secondary bg-white border-dark-border group-hover:bg-dark-surface'}
                        `}>
                          #{index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded shadow-sm bg-dark-surface border border-dark-border flex items-center justify-center text-text-primary font-black shrink-0">
                          {entry.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className={`font-bold text-base ${isCurrentUser ? 'text-brand-primary' : 'text-text-primary'}`}>
                            {entry.username} {isCurrentUser && <span className="text-[10px] uppercase font-bold ml-2 text-white bg-brand-primary px-2 py-0.5 rounded shadow-sm">You</span>}
                          </div>
                          <div className="text-xs text-text-tertiary block sm:hidden mt-0.5 font-medium">{entry.streak || 0} day streak</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded border-2 bg-white text-sm font-bold text-text-secondary border-dark-border shadow-sm">
                        {entry.level || 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-1.5 text-brand-warning font-bold">
                        {entry.streak || 0}
                        <svg className="w-5 h-5 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-lg font-black text-brand-primary drop-shadow-sm">
                        {entry.points?.toLocaleString() || 0}
                      </span>
                    </td>
                  </tr>
                );
              })}
              
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-text-secondary font-medium">
                    No competitors found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
