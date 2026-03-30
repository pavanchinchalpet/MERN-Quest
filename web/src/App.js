import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingRedirect from './components/LandingRedirect';

const Home = lazy(() => import('./pages/Home'));
const Quiz = lazy(() => import('./pages/Quiz'));
const Profile = lazy(() => import('./pages/Profile'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Admin = lazy(() => import('./pages/Admin'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const AdminRoute = lazy(() => import('./components/AdminRoute'));
const Navbar = lazy(() => import('./components/Navbar'));
const Practice = lazy(() => import('./pages/Practice'));
const Assessments = lazy(() => import('./pages/Assessments'));
const PracticeWorkspace = lazy(() => import('./pages/PracticeWorkspace'));

function AppShell() {
  const location = useLocation();
  const isAuth = location.pathname === '/login' || location.pathname === '/register';
  const isLanding = location.pathname === '/';
  const hideNavbar = isAuth || isLanding;

  return (
    <div className="min-h-screen bg-dark-bg text-text-primary flex flex-col">
      {!hideNavbar && <Navbar />}
      <main className={`flex-grow flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${hideNavbar ? '' : 'pt-20 pb-8'}`}>
        <Suspense
          fallback={
            <div className="flex-grow grid place-items-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-dark-border border-t-brand-primary" />
            </div>
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
