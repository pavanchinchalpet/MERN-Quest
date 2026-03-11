import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle resize for mobile menu
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navLinks = (
    <>
      <Link to="/home" className="text-slate-300 hover:text-white font-semibold transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5" onClick={() => setMenuOpen(false)}>
        <span>🏠</span> Home
      </Link>
      <Link to="/quiz" className="text-slate-300 hover:text-white font-semibold transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5" onClick={() => setMenuOpen(false)}>
        <span>🎯</span> Quests
      </Link>
      <Link to="/leaderboard" className="text-slate-300 hover:text-white font-semibold transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5" onClick={() => setMenuOpen(false)}>
        <span>🏆</span> Leaderboard
      </Link>
      <Link to="/profile" className="text-slate-300 hover:text-white font-semibold transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5" onClick={() => setMenuOpen(false)}>
        <span>👤</span> Profile
      </Link>
      {user?.role === 'admin' && (
        <Link to="/admin" className="text-amber-400 hover:text-amber-300 font-bold transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-amber-400/10 border border-transparent hover:border-amber-400/20" onClick={() => setMenuOpen(false)}>
          <span>⚙️</span> Admin
        </Link>
      )}
    </>
  );

  const userSection = (
    <>
      {user ? (
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-700/50">
          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-600/50 shadow-inner">
            <span className="text-white font-bold">{user.username}</span>
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide shadow-sm">
              {user.points || 0} XP
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 font-bold px-4 py-2 rounded-xl transition-all border border-transparent hover:border-red-500/20 flex items-center gap-2"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      ) : (
        location.pathname !== '/login' && (
          <div className="mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-700/50 w-full md:w-auto">
            <Link 
              to="/login" 
              className="w-full md:w-auto flex justify-center bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 active:scale-95 border border-indigo-400/20"
              onClick={() => setMenuOpen(false)}
            >
              🔑 Login
            </Link>
          </div>
        )
      )}
    </>
  );

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
        scrolled 
          ? 'bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-lg shadow-black/20 py-2' 
          : 'bg-transparent border-transparent py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12 w-full">
            
            {/* Logo / Brand */}
            <div className="shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-xl shadow-lg border border-indigo-400/30 group-hover:scale-105 transition-transform">
                  📚
                </div>
                <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                  MERN Quest
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-1 items-center justify-center gap-2 lg:gap-6 bg-slate-800/40 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/5 mx-8 shrink-0 w-auto">
              {navLinks}
            </div>

            {/* Desktop User Section */}
            <div className="hidden md:flex items-center shrink-0">
              {userSection}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {!menuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile Drawer Content */}
      <div className={`fixed top-0 right-0 w-[280px] h-full bg-slate-800 border-l border-slate-700 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
        menuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6 overflow-y-auto flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-8 border-b border-slate-700/50 pb-6">
             <span className="font-extrabold text-lg text-white">Menu</span>
             <button onClick={() => setMenuOpen(false)} className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600 transition-colors">
               <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            {navLinks}
          </div>
          <div className="mt-auto">
            {userSection}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
