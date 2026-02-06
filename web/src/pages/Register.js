import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../components/Login.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading, register, error, setError } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    // Register user directly - backend will handle duplicate checking
    const result = await register(formData.username, formData.email, formData.password);
    
    if (result.success) {
      console.log('✅ [REGISTER] Registration successful (redirect when user is set)');
    }
    
    setLoading(false);
  };

  // If already logged in or just registered, redirect to home
  if (user && !authLoading) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="login-container">
      {/* Main Register Card */}
      <div className="login-card">
        {/* Left Branding Panel */}
        <div className="login-branding">
          <div className="branding-content">
            <div className="brand-logo">
              <div className="brand-icon">📚</div>
              <div className="brand-text">MERN Quest</div>
            </div>
            <h1 className="brand-heading">Start Your Coding Journey</h1>
            <p className="brand-description">
              Join our community of developers and master the MERN stack through 
              interactive challenges, real-world projects, and comprehensive learning paths.
            </p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="login-form-panel" style={{ paddingTop: '1.5rem' }}>
          <div className="form-header">
            <h2 className="form-welcome">
              🎯 Join Us
            </h2>
            <p className="form-subtitle">Create Your Account Today</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-with-icon">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Choose your username"
                  autoComplete="username"
                  required
                  minLength="3"
                  maxLength="30"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  required
                  minLength="6"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-with-icon">
                <span className="input-icon">🔐</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="signup-link">
            <p>
              Already have an account?{' '}
              <Link to="/login">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;