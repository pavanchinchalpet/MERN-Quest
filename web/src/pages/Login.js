import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });

  if (authLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-dark-border border-t-brand-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
      navigate(location.state?.from?.pathname || '/home', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white border border-dark-border rounded-xl overflow-hidden grid md:grid-cols-2 shadow-xl animate-slide-up">
        {/* Left Side: Brand/Marketing (Hidden on mobile) */}
        <div className="hidden md:flex flex-col justify-between bg-dark-surface/50 p-12 relative overflow-hidden border-r border-dark-border">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-brand-primary/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-brand-accent/10 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary text-white font-black text-2xl shadow-sm mb-8">
              C
            </div>
            <h1 className="heading-2 text-text-primary">Master the Logic.</h1>
            <p className="text-text-secondary mt-4 font-medium leading-relaxed">
              Join the elite community of developers. Practice real-world structural challenges, track your progress, and level up your skills.
            </p>
          </div>
          
          <div className="relative z-10 mt-12">
            <div className="flex items-center gap-4 text-text-secondary">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-10 w-10 rounded-full border-2 border-white bg-dark-surface flex items-center justify-center text-xs font-bold text-text-primary shadow-sm`}>
                    U{i}
                  </div>
                ))}
              </div>
              <p className="text-sm font-bold text-text-primary">Join 10,000+ developers</p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-12 relative bg-white">
          <div className="max-w-md mx-auto">
            <div className="text-sm font-black uppercase tracking-widest text-brand-primary mb-2">Welcome Back</div>
            <h2 className="heading-2 text-text-primary">Sign in to workspace</h2>
            <p className="text-text-secondary mt-2 font-medium">Enter your credentials to access the platform.</p>

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

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
              <div className="form-group">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="form-label mb-0 text-text-primary font-bold text-xs uppercase tracking-wider" htmlFor="password">Password</label>
                  <Link to="#" className="text-xs font-bold text-brand-primary hover:text-brand-primary-hover">Forgot password?</Link>
                </div>
                <input
                  id="password"
                  className="input-field bg-white shadow-sm"
                  type="password"
                  value={formData.password}
                  onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                  placeholder="••••••••"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center py-3 mt-6 disabled:opacity-70 disabled:cursor-not-allowed shadow-none font-black text-sm uppercase tracking-wider">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-dark-border text-center">
              <p className="text-sm font-medium text-text-secondary">
                Don't have an account?{' '}
                <Link to="/register" className="font-bold text-brand-primary hover:text-brand-primary-hover transition-colors">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
