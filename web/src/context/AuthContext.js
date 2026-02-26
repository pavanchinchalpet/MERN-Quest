import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback
} from "react";

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

  const apiUrl =
    process.env.REACT_APP_API_URL || "http://localhost:5000";

  // ✅ Check authentication via cookie
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/auth/profile`, {
          method: "GET",
          credentials: "include"
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.log("Auth check error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [apiUrl]);

  // ✅ Login
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      setUser(data.user);

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // ✅ Register
  const register = useCallback(async (username, email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setUser(data.user);

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // ✅ Send OTP
  const sendOTP = useCallback(async (email) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [apiUrl]);

  // ✅ Verify OTP
  const verifyOTP = useCallback(async (email, otp) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      // Cookie is automatically set by backend
      setUser(data.user);

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [apiUrl]);

  // ✅ Logout
  const logout = useCallback(async () => {
    try {
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (err) {
      console.log("Logout error:", err);
    } finally {
      setUser(null);
      setError(null);
    }
  }, [apiUrl]);

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