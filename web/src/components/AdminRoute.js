import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--color-bg)] text-[var(--color-text)]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[var(--color-accent)]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return user.role === 'admin' ? children : <Navigate to="/home" replace />;
};

export default AdminRoute;
