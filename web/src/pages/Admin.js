import React, { useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage, unwrapResponse } from '../services/api';

const initialQuestion = {
  title: '',
  description: '',
  question_text: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  answer: '',
  explanation: '',
  difficulty: 'Easy',
  points: 10,
  time_limit: 30,
  category_id: ''
};

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(initialQuestion);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadAdminData = async () => {
    try {
      const [usersResponse, quizzesResponse, categoriesResponse] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/quizzes'),
        api.get('/quiz/categories')
      ]);

      setUsers(unwrapResponse(usersResponse) || []);
      setQuestions(unwrapResponse(quizzesResponse) || []);
      setCategories(unwrapResponse(categoriesResponse) || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load admin workspace'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const questionSummary = useMemo(() => {
    return questions.reduce((accumulator, item) => {
      const key = item.category_id || 'uncategorized';
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});
  }, [questions]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/admin/quizzes', {
        title: formData.title,
        description: formData.description,
        question_text: formData.question_text,
        options: [formData.optionA, formData.optionB, formData.optionC, formData.optionD],
        answer: formData.answer,
        explanation: formData.explanation,
        difficulty: formData.difficulty,
        points: Number(formData.points),
        time_limit: Number(formData.time_limit),
        category_id: formData.category_id
      });
      setFormData(initialQuestion);
      setSuccess('Quiz question created successfully.');
      loadAdminData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to create quiz question'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[70vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-dark-border border-t-brand-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 animate-fade-in text-text-primary">
      {/* Header Section */}
      <section className="glass-panel overflow-hidden relative mb-8 bg-white shadow-sm border border-dark-border">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-primary/10 to-transparent z-0"></div>
        <div className="relative z-10 p-8 lg:p-12">
          <div className="badge badge-success mb-4 flex items-center gap-2 w-max shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            System Administration
          </div>
          <h1 className="heading-1">Platform Control Center</h1>
          <p className="text-muted text-lg mt-4 max-w-3xl">
            Manage the user base, orchestrate learning modules, and curate challenges for the community.
          </p>
          
          {error && (
            <div className="mt-6 rounded border border-brand-danger/30 bg-brand-danger/5 p-4 w-fit flex items-center gap-3 text-brand-danger text-sm font-bold">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}
          {success && (
            <div className="mt-6 rounded border border-emerald-500/30 bg-emerald-500/5 p-4 w-fit flex items-center gap-3 text-emerald-600 text-sm font-bold shadow-sm">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              {success}
            </div>
          )}
        </div>
      </section>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="glass-card p-6 flex items-center justify-between group hover:border-brand-primary transition-colors bg-white shadow-sm border-dark-border">
          <div>
            <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Total Users</div>
            <div className="text-3xl font-black text-text-primary group-hover:text-brand-primary transition-colors">{users.length}</div>
          </div>
          <div className="w-12 h-12 rounded border-2 border-dark-border bg-dark-surface text-text-secondary flex items-center justify-center group-hover:border-brand-primary group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
        </div>
        
        <div className="glass-card p-6 flex items-center justify-between group hover:border-brand-primary transition-colors bg-white shadow-sm border-dark-border">
          <div>
            <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Total Challenges</div>
            <div className="text-3xl font-black text-text-primary group-hover:text-brand-primary transition-colors">{questions.length}</div>
          </div>
          <div className="w-12 h-12 rounded border-2 border-dark-border bg-dark-surface text-text-secondary flex items-center justify-center group-hover:border-brand-primary group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
        </div>
        
        <div className="glass-card p-6 flex items-center justify-between group hover:border-brand-primary transition-colors bg-white shadow-sm border-dark-border">
          <div>
            <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Modules</div>
            <div className="text-3xl font-black text-text-primary group-hover:text-brand-primary transition-colors">{categories.length}</div>
          </div>
          <div className="w-12 h-12 rounded border-2 border-dark-border bg-dark-surface text-text-secondary flex items-center justify-center group-hover:border-brand-primary group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between group hover:border-brand-danger transition-colors bg-white shadow-sm border-dark-border">
          <div>
            <div className="text-xs font-bold text-brand-danger uppercase tracking-wider mb-2">Admins</div>
            <div className="text-3xl font-black text-brand-danger">{users.filter((item) => item.role === 'admin').length}</div>
          </div>
          <div className="w-12 h-12 rounded border-2 border-brand-danger/30 bg-brand-danger/10 text-brand-danger flex items-center justify-center group-hover:border-brand-danger group-hover:bg-brand-danger group-hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        
        {/* Left Column: Form */}
        <div className="glass-card p-6 md:p-8 bg-white shadow-sm border border-dark-border">
          <div className="flex items-center gap-3 mb-6 border-b border-dark-border pb-4">
            <div className="w-10 h-10 rounded border border-dark-border bg-dark-surface flex items-center justify-center text-text-primary shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </div>
            <div>
              <h2 className="heading-3 mb-0 text-text-primary">Create Challenge</h2>
              <p className="text-sm font-bold text-text-tertiary">Add a new question to the practice pool.</p>
            </div>
          </div>
          
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="form-group">
                <label className="form-label text-text-primary text-xs uppercase tracking-wider font-bold">Challenge Title</label>
                <input className="input-field bg-white" placeholder="e.g. React Component Logic" value={formData.title} onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))} required />
              </div>
              
              <div className="form-group">
                <label className="form-label text-text-primary text-xs uppercase tracking-wider font-bold">Module Link</label>
                <div className="relative">
                  <select className="input-field appearance-none w-full bg-white" value={formData.category_id} onChange={(event) => setFormData((current) => ({ ...current, category_id: event.target.value }))} required>
                    <option value="" disabled>Select target module...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.title || category.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-text-secondary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
              
              <div className="form-group md:col-span-2">
                <label className="form-label text-text-primary text-xs uppercase tracking-wider font-bold">Context / Description (Optional)</label>
                <textarea className="input-field bg-white min-h-[80px]" placeholder="Brief background for the challenge..." value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} rows={2} />
              </div>
              
              <div className="form-group md:col-span-2">
                <label className="form-label text-brand-primary text-xs uppercase tracking-wider font-bold">Question Prompt</label>
                <textarea className="input-field bg-white min-h-[120px] font-mono text-sm border-brand-primary/30 focus:border-brand-primary" placeholder="The actual problem statement..." value={formData.question_text} onChange={(event) => setFormData((current) => ({ ...current, question_text: event.target.value }))} rows={4} required />
              </div>

              {/* Options Grid */}
              <div className="md:col-span-2 bg-dark-surface border border-dark-border rounded p-6 shadow-sm">
                <label className="form-label text-text-primary text-xs uppercase tracking-wider font-bold mb-4 block">Possible Answers</label>
                <div className="grid gap-4 md:grid-cols-2 w-full">
                  <div className="flex relative items-center">
                    <span className="absolute left-4 font-bold font-mono text-text-secondary">A</span>
                    <input className="input-field pl-10 bg-white shadow-sm" placeholder="Option A" value={formData.optionA} onChange={(event) => setFormData((current) => ({ ...current, optionA: event.target.value }))} required />
                  </div>
                  <div className="flex relative items-center">
                    <span className="absolute left-4 font-bold font-mono text-text-secondary">B</span>
                    <input className="input-field pl-10 bg-white shadow-sm" placeholder="Option B" value={formData.optionB} onChange={(event) => setFormData((current) => ({ ...current, optionB: event.target.value }))} required />
                  </div>
                  <div className="flex relative items-center">
                    <span className="absolute left-4 font-bold font-mono text-text-secondary">C</span>
                    <input className="input-field pl-10 bg-white shadow-sm" placeholder="Option C" value={formData.optionC} onChange={(event) => setFormData((current) => ({ ...current, optionC: event.target.value }))} required />
                  </div>
                  <div className="flex relative items-center">
                    <span className="absolute left-4 font-bold font-mono text-text-secondary">D</span>
                    <input className="input-field pl-10 bg-white shadow-sm" placeholder="Option D" value={formData.optionD} onChange={(event) => setFormData((current) => ({ ...current, optionD: event.target.value }))} required />
                  </div>
                </div>
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label text-emerald-600 text-xs uppercase tracking-wider font-bold">Correct Answer (Exact Match)</label>
                <input className="input-field bg-white border-emerald-500 shadow-sm focus:border-emerald-600" placeholder="Must exactly match one of the options above" value={formData.answer} onChange={(event) => setFormData((current) => ({ ...current, answer: event.target.value }))} required />
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label text-text-primary text-xs uppercase tracking-wider font-bold">Post-Answer Explanation</label>
                <textarea className="input-field bg-white min-h-[80px]" placeholder="Explain why the answer is correct..." value={formData.explanation} onChange={(event) => setFormData((current) => ({ ...current, explanation: event.target.value }))} rows={2} />
              </div>

              <div className="form-group">
                <label className="form-label text-text-primary text-xs uppercase tracking-wider font-bold">Difficulty</label>
                <div className="relative">
                  <select className="input-field appearance-none w-full bg-white shadow-sm" value={formData.difficulty} onChange={(event) => setFormData((current) => ({ ...current, difficulty: event.target.value }))}>
                    <option value="Easy">Beginner (Easy)</option>
                    <option value="Medium">Intermediate (Medium)</option>
                    <option value="Hard">Expert (Hard)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-text-secondary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label text-text-primary text-xs uppercase tracking-wider font-bold">XP Points</label>
                  <input className="input-field bg-white shadow-sm" type="number" placeholder="10" value={formData.points} onChange={(event) => setFormData((current) => ({ ...current, points: event.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label text-text-primary text-xs uppercase tracking-wider font-bold">Time (sec)</label>
                  <input className="input-field bg-white shadow-sm" type="number" placeholder="30" value={formData.time_limit} onChange={(event) => setFormData((current) => ({ ...current, time_limit: event.target.value }))} />
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-dark-border mt-8">
              <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm font-black text-sm tracking-widest uppercase">
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Deploying...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Deploy Challenge
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-8">
          
          {/* Content Coverage */}
          <div className="glass-card flex flex-col h-[400px] bg-white shadow-sm border border-dark-border">
            <div className="p-6 border-b border-dark-border shrink-0 bg-dark-surface">
              <h2 className="heading-3 mb-1 text-text-primary">Module Coverage</h2>
              <p className="text-xs font-bold text-text-tertiary">Distribution of questions across roadmaps.</p>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {categories.map((category) => {
                const count = questionSummary[category.id] || 0;
                // Just a visual percentage to make it look cool, capping at 50 questions
                const fillPercent = Math.min((count / 50) * 100, 100);
                
                return (
                  <div key={category.id} className="relative rounded border border-dark-border bg-white p-4 overflow-hidden group shadow-sm">
                    <div className="absolute left-0 top-0 bottom-0 bg-brand-primary/10 transition-all w-full" style={{ width: `${fillPercent}%` }}></div>
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="font-bold text-text-primary group-hover:text-brand-primary transition-colors">{category.title || category.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-brand-primary">{count}</span>
                        <span className="text-xs font-bold text-text-tertiary uppercase">Questions</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {categories.length === 0 && (
                <div className="text-sm font-bold text-text-tertiary text-center py-4">No modules found</div>
              )}
            </div>
          </div>

          {/* User Roster */}
          <div className="glass-card flex flex-col h-[400px] bg-white shadow-sm border border-dark-border">
            <div className="p-6 border-b border-dark-border shrink-0 bg-dark-surface">
              <h2 className="heading-3 mb-1 text-text-primary">Active Roster</h2>
              <p className="text-xs font-bold text-text-tertiary">Recent platform registrations and admin users.</p>
            </div>
            
            <div className="flex-grow overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-white sticky top-0 z-10 border-b border-dark-border">
                  <tr className="text-xs font-black tracking-wider text-text-tertiary uppercase bg-dark-surface">
                    <th className="px-6 py-4 border-b border-dark-border">Developer</th>
                    <th className="px-6 py-4 border-b border-dark-border text-right">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {users.slice(0, 10).map((item) => (
                    <tr key={item.id} className="hover:bg-dark-surface transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-text-primary">{item.username || item.name}</div>
                        <div className="text-xs font-medium text-text-tertiary truncate max-w-[150px]">{item.email}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex px-3 py-1 rounded text-xs font-black uppercase tracking-wider shadow-sm border
                          ${item.role === 'admin' 
                            ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/30' 
                            : 'bg-white text-text-secondary border-dark-border'}
                        `}>
                          {item.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="2" className="px-6 py-8 text-center font-medium text-text-tertiary">No users found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Admin;
