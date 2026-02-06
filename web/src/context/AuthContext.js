import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../config/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in via our custom JWT system
    const checkAuthStatus = async () => {
      try {
        // Check if we have a token first (from localStorage or cookies)
        const token = localStorage.getItem('token');
        const hasCookie = document.cookie.includes('token=');
        
        if (!token && !hasCookie) {
          // No token found, skip API call
          if (process.env.NODE_ENV === 'development') {
            console.log('ℹ️ [AUTH CONTEXT] No token found, skipping auth check');
          }
          setUser(null);
          setLoading(false);
          return;
        }

        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log('🔵 [AUTH CONTEXT] Checking authentication status...');
        }
        
        // Try to get user profile from our backend - use the correct endpoint
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/auth/profile`, {
          method: 'GET',
          credentials: 'include', // Include cookies
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ [AUTH CONTEXT] User authenticated:', data.user?.username);
          }
          setUser(data.user);
          
          // Ensure token is in localStorage if we got a valid response
          if (data.token && !localStorage.getItem('token')) {
            localStorage.setItem('token', data.token);
          }
        } else if (response.status === 401) {
          // Try refresh token if we have one
          if (token || hasCookie) {
            try {
              const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
              const refreshResponse = await fetch(`${apiUrl}/api/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token && { 'Authorization': `Bearer ${token}` })
                },
              });
              
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                if (process.env.NODE_ENV === 'development') {
                  console.log('✅ [AUTH CONTEXT] Token refreshed successfully');
                }
                localStorage.setItem('token', refreshData.token);
                setUser(refreshData.user);
                setLoading(false);
                return;
              }
            } catch (refreshError) {
              console.log('🔴 [AUTH CONTEXT] Refresh failed:', refreshError);
            }
          }
          
          // 401 is expected when user is not logged in - this is normal behavior
          if (process.env.NODE_ENV === 'development') {
            console.log('ℹ️ [AUTH CONTEXT] No active session found');
          }
          // Clear any invalid tokens from localStorage
          localStorage.removeItem('token');
          setUser(null);
        } else {
          console.log('🔴 [AUTH CONTEXT] Unexpected auth error:', response.status);
          // Clear any invalid tokens from localStorage
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (error) {
        console.log('🔴 [AUTH CONTEXT] Auth check error:', error);
        // Clear any invalid tokens from localStorage
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);


  const checkUserExists = useCallback(async (email) => {
    try {
      console.log('🔵 [AUTH CONTEXT] Checking if user exists:', email);
      
      // Use our backend API to check if user exists
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email })
      });

      console.log('🔵 [AUTH CONTEXT] Check user exists response status:', response.status);
      
      const data = await response.json();
      console.log('🔵 [AUTH CONTEXT] Check user exists response data:', data);
      
      if (response.status === 404) {
        console.log('🔴 [AUTH CONTEXT] User not found');
        return { exists: false, user: null };
      }
      
      if (response.ok) {
        console.log('✅ [AUTH CONTEXT] User exists');
        return { exists: true, user: { email } };
      }
      
      // If we get here, there was an error but user might exist
      return { exists: false, user: null };
    } catch (error) {
      console.log('🔴 [AUTH CONTEXT] Error checking user existence:', error.message);
      return { exists: false, user: null };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      console.log('🔵 [AUTH CONTEXT] Starting login for:', email);
      setError(null);
      setLoading(true);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ email, password })
      });

      console.log('🔵 [AUTH CONTEXT] Login response status:', response.status);
      
      const data = await response.json();
      console.log('🔵 [AUTH CONTEXT] Login response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      if (data.user) {
        console.log('✅ [AUTH CONTEXT] Login successful, setting user:', data.user.username);
        setUser(data.user);
        
        // Store token in localStorage for persistence across page refreshes
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        
        // Show email confirmation notice if needed
        if (data.requiresEmailConfirmation) {
          console.log('📧 [AUTH CONTEXT] Email confirmation required');
        }
      }
      
      return { success: true };
    } catch (error) {
      console.log('🔴 [AUTH CONTEXT] Login error:', error.message);
      let message = 'Login failed';
      
      if (error.message) {
        message = error.message;
      }
      
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (username, email, password) => {
    try {
      console.log('🔵 [AUTH CONTEXT] Starting registration for:', email);
      setError(null);
      setLoading(true);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ username, email, password })
      });

      console.log('🔵 [AUTH CONTEXT] Register response status:', response.status);
      
      const data = await response.json();
      console.log('🔵 [AUTH CONTEXT] Register response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      if (data.user) {
        console.log('✅ [AUTH CONTEXT] Registration successful, setting user:', data.user.username);
        setUser(data.user);
        
        // Store token in localStorage for persistence across page refreshes
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        
        // Show email confirmation notice if needed
        if (data.requiresEmailConfirmation) {
          console.log('📧 [AUTH CONTEXT] Email confirmation required');
        }
      }
      
      return { success: true, message: data.message || 'Registration successful!' };
    } catch (error) {
      console.log('🔴 [AUTH CONTEXT] Registration error:', error.message);
      let message = 'Registration failed';
      
      if (error.message) {
        message = error.message;
      }
      
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const sendOTP = useCallback(async (email) => {
    try {
      console.log('🔵 [AUTH CONTEXT] Sending OTP for:', email);
      setError(null);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email })
      });

      console.log('🔵 [AUTH CONTEXT] Send OTP response status:', response.status);
      
      const data = await response.json();
      console.log('🔵 [AUTH CONTEXT] Send OTP response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }
      
      return { success: true, message: data.message || 'OTP sent successfully' };
    } catch (error) {
      console.log('🔴 [AUTH CONTEXT] Send OTP error:', error.message);
      let message = 'Failed to send OTP';
      
      if (error.message) {
        message = error.message;
      }
      
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const verifyOTP = useCallback(async (email, otp) => {
    try {
      console.log('🔵 [AUTH CONTEXT] Verifying OTP for:', email);
      setError(null);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, otp: String(otp || '').trim() })
      });

      const data = await response.json().catch(() => ({}));
      console.log('🔵 [AUTH CONTEXT] Verify OTP response status:', response.status, 'data:', data);
      
      if (!response.ok) {
        const message = data.message || data.error || 'OTP verification failed';
        throw new Error(message);
      }
      
      // Always store token when present so auth persists across refresh
      if (data.token) {
        localStorage.setItem('token', data.token);
        console.log('✅ [AUTH CONTEXT] Token stored after OTP verify');
      }
      if (data.user) {
        console.log('✅ [AUTH CONTEXT] OTP verification successful, setting user:', data.user.username);
        setUser(data.user);
      } else if (data.token) {
        // Token but no user: fetch profile so we have user in state
        try {
          const profileRes = await fetch(`${apiUrl}/api/auth/profile`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.token}`
            }
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.user) setUser(profileData.user);
          }
        } catch (profileErr) {
          console.log('🔴 [AUTH CONTEXT] Profile fetch after OTP failed:', profileErr);
        }
      }
      
      return { success: true, message: data.message || 'OTP verified successfully' };
    } catch (error) {
      console.log('🔴 [AUTH CONTEXT] Verify OTP error:', error.message);
      const message = error.message || 'OTP verification failed';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('🔵 [AUTH CONTEXT] Logging out...');
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      console.log('🔵 [AUTH CONTEXT] Logout response status:', response.status);
      // Clear local state regardless of HTTP status to avoid UX noise
      console.log('✅ [AUTH CONTEXT] Clearing local session');
      setUser(null);
      setError(null);
      // Clear token from localStorage
      localStorage.removeItem('token');
    } catch (error) {
      console.log('🔴 [AUTH CONTEXT] Logout error:', error.message);
      // Even if logout fails on backend, clear local state
      setUser(null);
      setError(null);
      // Clear token from localStorage
      localStorage.removeItem('token');
    }
  }, []);

  const updateUser = useCallback(async (updates) => {
    try {
      if (!user) return;
      
      const { data, error } = await db.updateUserProfile(user.id, updates);
      
      if (error) throw error;
      
      setUser(data);
    } catch (error) {
      console.error('Update user error:', error);
      setError('Failed to update profile');
    }
  }, [user]);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    setError,
    sendOTP,
    verifyOTP,
    checkUserExists
  }), [user, loading, error, login, register, logout, updateUser, sendOTP, verifyOTP, checkUserExists]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
