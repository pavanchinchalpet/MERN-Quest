import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Landing from '../pages/Landing';

const LandingRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Landing />;
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return <Landing />;
};

export default LandingRedirect;
