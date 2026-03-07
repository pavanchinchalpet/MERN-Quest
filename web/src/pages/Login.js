import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../components/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [showOtpSuccess, setShowOtpSuccess] = useState(false);
  const { user, loading: authLoading, login, sendOTP, verifyOTP, error, setError } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    console.log('🔵 [FRONTEND LOGIN] Starting password login for:', formData.email);
    setLoading(true);
    setError(null);

    console.log('🔵 [FRONTEND LOGIN] Attempting login...');
    const result = await login(formData.email, formData.password);
    console.log('🔵 [FRONTEND LOGIN] Login result:', result);
    
    if (result.success) {
      console.log('✅ [FRONTEND LOGIN] Login successful, redirecting to /home');
    } else {
      console.log('🔴 [FRONTEND LOGIN] Login failed:', result.error);
    }
    
    setLoading(false);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await sendOTP(formData.email);
    
    if (result.success) {
      setOtpSent(true);
      setShowOtpSuccess(true);
      setOtpTimer(300); // 300 seconds (5 minutes) timer to match Supabase OTP expiration
      const timer = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Hide success message after 5 seconds
      setTimeout(() => setShowOtpSuccess(false), 5000);
    } else {
      // Show error if OTP sending failed
      setError(result.error || 'Failed to send OTP');
    }
    
    setLoading(false);
  };

  const handleOTPVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await verifyOTP(formData.email, formData.otp);
    
    if (result.success) {
      console.log('✅ [FRONTEND OTP] OTP verified, redirecting to /home');
      navigate('/home');
    }
    
    setLoading(false);
  };

  const resendOTP = async () => {
    if (otpTimer > 0) return;
    
    setLoading(true);
    setError(null);

    const result = await sendOTP(formData.email);
    
    if (result.success) {
      setOtpTimer(60);
      const timer = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    setLoading(false);
  };

  // If already logged in, redirect to home (avoids showing login form briefly)
  if (authLoading) {
    return null; // or loading spinner
  }
  
  if (user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="login-container">
      {/* Main Login Card */}
      <div className="login-card">
        {/* Left Branding Panel */}
        <div className="login-branding">
          <div className="branding-content">
            <div className="brand-logo">
              <div className="brand-icon">📚</div>
              <div className="brand-text">MERN Quest</div>
            </div>
            <h1 className="brand-heading">Unlock Your Learning Potential</h1>
            <p className="brand-description">
              Master the MERN stack through interactive challenges, real-world projects, and comprehensive learning paths designed for developers of all levels.
            </p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="login-form-panel">
          <div className="form-header">
            <h2 className="form-welcome">
               Welcome 👋
            </h2>
            <p className="form-subtitle">Let's Login To Your Account</p>
          </div>

          {/* Login Method Toggle */}
          <div className="login-method-toggle">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('password');
                setOtpSent(false);
                setError(null);
              }}
              className={`toggle-button ${loginMethod === 'password' ? 'active' : ''}`}
            >
              🔑 Password
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('otp');
                setOtpSent(false);
                setError(null);
              }}
              className={`toggle-button ${loginMethod === 'otp' ? 'active' : ''}`}
            >
              📱 OTP Login
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Password Login Form */}
          {loginMethod === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="login-form">
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
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <div className="form-checkbox">
                <input type="checkbox" className="checkbox-input" id="remember" />
                <label htmlFor="remember" className="checkbox-label">Remember Me</label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    Sign In
                  </>
                )}
              </button>

              <button type="button" className="forgot-password">Forgot Password?</button>
            </form>
          ) : (
            /* OTP Login Form */
            <div>
              {/* Success Popup */}
              {showOtpSuccess && (
                <div className="otp-success-popup">
                  <div className="otp-success-icon">✓</div>
                  <div className="otp-success-content">
                    <h3>OTP Sent Successfully!</h3>
                    <p>Check your email inbox for the 6-digit code</p>
                  </div>
                  <button 
                    className="otp-close-btn"
                    onClick={() => setShowOtpSuccess(false)}
                  >
                    ×
                  </button>
                </div>
              )}
              
              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="login-form">
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
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <span>📧</span>
                        Send OTP
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleOTPVerification} className="login-form">
                  <div className="otp-verification-header">
                    <p className="otp-verification-text">
                      Enter the 6-digit code sent to your email
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Enter 6-digit OTP</label>
                    <input
                      type="text"
                      name="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      placeholder="123456"
                      maxLength="6"
                      className="form-input"
                      style={{
                        fontSize: '1.5rem',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        letterSpacing: '0.5rem'
                      }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <span>✅</span>
                        Verify OTP
                      </>
                    )}
                  </button>

                  <div style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={resendOTP}
                      disabled={otpTimer > 0 || loading}
                      className="forgot-password"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: otpTimer > 0 || loading ? 'not-allowed' : 'pointer',
                        color: otpTimer > 0 || loading ? '#9ca3af' : 'var(--primary-blue)',
                        fontSize: '0.875rem',
                        padding: '0.5rem'
                      }}
                    >
                      {otpTimer > 0 ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                          <span>⏰</span>
                          Resend in {otpTimer}s
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                          <span>🔄</span>
                          Resend OTP
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Sign Up Link */}
          <div className="signup-link">
            <p>
              New to MERN Quest?{' '}
              <Link to="/register">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
