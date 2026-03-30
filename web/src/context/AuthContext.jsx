import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { getErrorMessage, unwrapResponse } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(unwrapResponse(response));
      } catch (error) {
        setUser(null);
        console.error('Session check failed:', getErrorMessage(error, 'Unauthorized'));
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const nextUser = unwrapResponse(response);
    setUser(nextUser);
    return nextUser;
  };

  const register = async (username, email, password, name) => {
    const response = await api.post('/auth/register', { username, email, password, name });
    const nextUser = unwrapResponse(response);
    setUser(nextUser);
    return nextUser;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', getErrorMessage(error, 'Logout failed'));
    } finally {
      setUser(null);
    }
  };

  const updateUser = (updates) => {
    setUser((current) => ({ ...(current || {}), ...(updates || {}) }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
