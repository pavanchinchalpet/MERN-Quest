import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback
} from "react";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Check authentication via cookie
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
      } catch (err) {
        console.log("Auth check error:", err?.response?.data || err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // ✅ Login
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/login', { email, password });
      setUser(response.data.user);
      return { success: true };

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Register
  const register = useCallback(async (username, email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/register', { username, email, password });
      setUser(response.data.user);
      return { success: true };

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Registration failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Send OTP
  const sendOTP = useCallback(async (email) => {
    try {
      setLoading(true);
      setError(null);

      await api.post('/auth/request-otp', { email });
      return { success: true };

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to send OTP";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Verify OTP
  const verifyOTP = useCallback(async (email, otp) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/verify-otp', { email, otp });
      setUser(response.data.user);
      return { success: true };

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "OTP verification failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Logout
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.log("Logout error:", err);
    } finally {
      setUser(null);
      setError(null);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    login,
    register,
    logout,
    sendOTP,
    verifyOTP,
    setError
  }), [user, loading, error, login, register, logout, sendOTP, verifyOTP]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
