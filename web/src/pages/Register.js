import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, getErrorMessage } from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  if (authLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-dark-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-dark-border border-t-brand-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Adjusted the API call according to AuthContext signatures.
      // Expected args: const register = async (username, email, password, name)
      // Sending `username` into the `name` argument so user displays correctly
      await register(formData.username, formData.email, formData.password, formData.username);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${API_BASE_URL}/auth/google?returnTo=${encodeURIComponent('/home')}`;
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white border border-dark-border rounded-xl overflow-hidden grid md:grid-cols-2 shadow-xl animate-slide-up">
        {/* Left Side: Brand/Marketing (Hidden on mobile) */}
        <div className="hidden md:flex flex-col justify-between bg-dark-surface/50 p-12 relative overflow-hidden border-r border-dark-border">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-brand-secondary/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-brand-primary/10 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary text-white font-black text-2xl shadow-sm mb-8">
              C
            </div>
            <h1 className="heading-2 text-text-primary">Start your Journey.</h1>
            <p className="text-text-secondary mt-4 font-medium leading-relaxed">
              Create an account to track your progress, practice coding challenges, and compete on the global leaderboard.
            </p>
          </div>
          
          <div className="relative z-10 mt-12 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded border border-dark-border bg-white flex items-center justify-center text-text-primary shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-bold text-text-primary">Curated learning paths</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded border border-dark-border bg-white flex items-center justify-center text-text-primary shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-text-primary">Interactive coding challenges</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded border border-dark-border bg-white flex items-center justify-center text-text-primary shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4a3 3 0 01-3-3V5a3 3 0 00-3 3 3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-text-primary">Global developer rankings</p>
            </div>
          </div>
        </div>

        {/* Right Side: Register Form */}
        <div className="p-8 md:p-10 relative overflow-y-auto max-h-[90vh] bg-white">
          <div className="max-w-md mx-auto">
            <div className="text-sm font-black uppercase tracking-widest text-brand-primary mb-2">New Learner</div>
            <h2 className="heading-2 text-text-primary">Create an account</h2>

            {error && (
              <div className="mt-6 rounded border border-brand-danger/30 bg-brand-danger/5 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="text-brand-danger">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-brand-danger">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="form-group">
                <label className="form-label text-text-primary font-bold text-xs uppercase tracking-wider" htmlFor="username">Username</label>
                <input
                  id="username"
                  className="input-field bg-white shadow-sm"
                  type="text"
                  value={formData.username}
                  onChange={(event) => setFormData((current) => ({ ...current, username: event.target.value }))}
                  placeholder="johndoe123"
                  minLength={3}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label text-text-primary font-bold text-xs uppercase tracking-wider" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  className="input-field bg-white shadow-sm"
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                  placeholder="name@company.com"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label text-text-primary font-bold text-xs uppercase tracking-wider" htmlFor="password">Password</label>
                  <input
                    id="password"
                    className="input-field bg-white shadow-sm"
                    type="password"
                    value={formData.password}
                    onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Min 6 characters"
                    minLength={6}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label text-text-primary font-bold text-xs uppercase tracking-wider" htmlFor="confirmPassword">Confirm</label>
                  <input
                    id="confirmPassword"
                    className="input-field bg-white shadow-sm"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))}
                    placeholder="Repeat password"
                    minLength={6}
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center py-3 mt-4 disabled:opacity-70 disabled:cursor-not-allowed shadow-none font-black text-sm uppercase tracking-wider">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>
            </form>

            <div className="mt-5">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-x-0 top-1/2 border-t border-dark-border" />
                <span className="relative bg-white px-3 text-xs font-bold uppercase tracking-wider text-text-secondary">or</span>
              </div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="mt-5 flex w-full items-center justify-center gap-3 rounded border border-dark-border bg-white px-4 py-3 text-sm font-black uppercase tracking-wider text-text-primary shadow-sm transition-colors hover:bg-dark-surface disabled:opacity-70"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-black text-brand-primary">G</span>
                Continue with Google
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-dark-border text-center">
              <p className="text-sm font-medium text-text-secondary">
                Already registered?{' '}
                <Link to="/login" className="font-bold text-brand-primary hover:text-brand-primary-hover transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
