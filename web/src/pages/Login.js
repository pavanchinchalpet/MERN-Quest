import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans text-slate-100">
      {/* Main Login Card */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        
        {/* Left Branding Panel */}
        <div className="hidden md:flex flex-1 flex-col justify-center items-center p-12 bg-gradient-to-br from-indigo-700 to-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="text-4xl">📚</span>
              <span className="font-game font-bold text-3xl">MERN Quest</span>
            </div>
            <h1 className="text-3xl font-bold mb-4">Unlock Your Learning Potential</h1>
            <p className="text-indigo-200 text-lg max-w-sm mx-auto leading-relaxed">
              Master the MERN stack through interactive challenges, real-world projects, and comprehensive learning paths designed for developers of all levels.
            </p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 p-8 md:p-12 lg:px-16 flex flex-col justify-center bg-slate-800 relative">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome 👋</h2>
            <p className="text-slate-400">Let's Login To Your Account</p>
          </div>

          {/* Login Method Toggle */}
          <div className="flex bg-slate-900 rounded-lg p-1 mb-6 border border-slate-700 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('password');
                setOtpSent(false);
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md font-medium text-sm transition-all outline-none ${
                loginMethod === 'password'
                  ? 'bg-slate-700 text-white shadow shadow-black/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
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
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md font-medium text-sm transition-all outline-none ${
                loginMethod === 'otp'
                  ? 'bg-slate-700 text-white shadow shadow-black/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              📱 OTP Login
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-400 w-full animate-fade-in">
              <span>⚠️</span>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Password Login Form */}
          {loginMethod === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-500">✉️</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-500">🔒</span>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500/50 cursor-pointer" id="remember" />
                  <label htmlFor="remember" className="text-sm text-slate-400 cursor-pointer hover:text-slate-300 select-none">Remember Me</label>
                </div>
                <button type="button" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">Forgot Password?</button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/25 transition-all outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    Sign In
                  </>
                )}
              </button>
            </form>
          ) : (
            /* OTP Login Form */
            <div className="animate-fade-in relative">
              {/* Success Popup */}
              {showOtpSuccess && (
                <div className="absolute top-0 left-0 right-0 -mt-16 p-4 bg-green-500/20 border border-green-500/50 text-green-400 rounded-xl flex items-center gap-3 backdrop-blur-sm z-10 animate-fade-in shadow-xl">
                  <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm shrink-0">✓</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-green-300">OTP Sent Successfully!</h3>
                    <p className="text-xs opacity-90">Check your email inbox for the 6-digit code</p>
                  </div>
                  <button 
                    className="text-green-400 hover:text-green-300 p-1"
                    onClick={() => setShowOtpSuccess(false)}
                  >
                    ✕
                  </button>
                </div>
              )}
              
              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-slate-500">✉️</span>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/25 transition-all outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
                <form onSubmit={handleOTPVerification} className="space-y-5">
                  <div className="text-center mb-6">
                    <p className="text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 py-2 px-4 rounded-lg inline-block text-sm">
                      Enter the 6-digit code sent to your email
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 text-center">Enter 6-digit OTP</label>
                    <input
                      type="text"
                      name="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      placeholder="123456"
                      maxLength="6"
                      className="w-full py-4 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      style={{
                        fontSize: '2rem',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        letterSpacing: '0.75rem',
                        fontWeight: 'bold'
                      }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/25 transition-all outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <span>✅</span>
                        Verify OTP
                      </>
                    )}
                  </button>

                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={resendOTP}
                      disabled={otpTimer > 0 || loading}
                      className={`text-sm font-medium flex items-center justify-center gap-2 mx-auto transition-colors ${
                        otpTimer > 0 || loading 
                          ? 'text-slate-500 cursor-not-allowed' 
                          : 'text-indigo-400 hover:text-indigo-300 cursor-pointer'
                      }`}
                    >
                      {otpTimer > 0 ? (
                        <><span>⏰</span> Resend in {otpTimer}s</>
                      ) : (
                        <><span>🔄</span> Resend OTP</>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Sign Up Link */}
          <div className="mt-8 text-center text-slate-400 border-t border-slate-700/50 pt-6">
            <p>
              New to MERN Quest?{' '}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
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
