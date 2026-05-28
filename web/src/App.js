import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingRedirect from './components/LandingRedirect';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { PageSpinner } from './components/PageState';

const Home = lazy(() => import('./pages/Home'));
const Quiz = lazy(() => import('./pages/Quiz'));
const Profile = lazy(() => import('./pages/Profile'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Admin = lazy(() => import('./pages/Admin'));
const Practice = lazy(() => import('./pages/Practice'));
const Assessments = lazy(() => import('./pages/Assessments'));
const PracticeWorkspace = lazy(() => import('./pages/PracticeWorkspace'));

function AppShell() {
  const location = useLocation();
  const isAuth = location.pathname === '/login' || location.pathname === '/register';
  const isLanding = location.pathname === '/';
  const hideNavbar = isAuth || isLanding;

  const mainClassName = hideNavbar
    ? 'flex-grow w-full'
    : 'flex-grow flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8';

  return (
    <div className="min-h-screen bg-dark-bg text-text-primary flex flex-col">
      {!hideNavbar && <Navbar />}
      <main className={mainClassName}>
        <Suspense
          fallback={
            <PageSpinner message={null} compact />
          }
        >
          <Routes>
            <Route path="/" element={<LandingRedirect />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
            <Route path="/practice/:id" element={<ProtectedRoute><PracticeWorkspace /></ProtectedRoute>} />
            <Route path="/assessments" element={<ProtectedRoute><Assessments /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppShell />
      </Router>
    </AuthProvider>
  );
}

export default App;
