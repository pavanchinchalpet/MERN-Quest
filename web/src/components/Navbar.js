import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  // Close mobile menu on route change or resize to desktop
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navLinks = (
    <>
      <Link to="/home" className="nav-link-custom" onClick={() => setMenuOpen(false)}>🏠 Home</Link>
      <Link to="/quiz" className="nav-link-custom" onClick={() => setMenuOpen(false)}>🎯 Quiz</Link>
      <Link to="/leaderboard" className="nav-link-custom" onClick={() => setMenuOpen(false)}>🏆 Leaderboard</Link>
      <Link to="/profile" className="nav-link-custom" onClick={() => setMenuOpen(false)}>👤 Profile</Link>
      {user?.isAdmin && (
        <Link to="/admin" className="nav-link-custom" onClick={() => setMenuOpen(false)}>⚙️ Admin</Link>
      )}
    </>
  );

  const userSection = (
    <>
      {user ? (
        <>
          <div className="nav-user-badge">
            <span className="text-white font-semibold">👤 {user.username}</span>
            <span className="bg-quest-gradient-gold text-white px-2 py-1 rounded-lg text-sm font-bold">💰 {user.points} pts</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="nav-logout-btn"
          >
            🚪 Logout
          </button>
        </>
      ) : (
        location.pathname !== '/login' && (
          <Link to="/login" className="nav-link-custom" onClick={() => setMenuOpen(false)}>🔑 Login</Link>
        )
      )}
    </>
  );

  return (
    <nav className="navbar-custom">
      <div className="navbar-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 w-full">
          {/* Desktop: Left nav */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {navLinks}
          </div>

          {/* Mobile: Hamburger */}
          <button
            type="button"
            className="navbar-toggle md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <span className="text-xl font-bold">✕</span>
            ) : (
              <span className="text-xl">☰</span>
            )}
          </button>

          {/* Desktop: Right user section */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            {userSection}
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={`navbar-mobile-menu ${menuOpen ? 'navbar-mobile-menu-open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <div className="navbar-mobile-content">
          <div className="navbar-mobile-links">{navLinks}</div>
          <div className="navbar-mobile-user">{userSection}</div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
