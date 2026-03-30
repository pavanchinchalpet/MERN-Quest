import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    { to: '/home', label: 'Dashboard' },
    { to: '/practice', label: 'Practice' },
    { to: '/assessments', label: 'Assessments' },
    { to: '/leaderboard', label: 'Leaderboard' }
  ];

  if (user?.role === 'admin') {
    links.push({ to: '/admin', label: 'Admin Panel' });
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${isActive
      ? 'bg-brand-primary/10 text-brand-primary'
      : 'text-text-secondary hover:bg-dark-surface hover:text-text-primary'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block px-4 py-3 rounded-md text-base font-semibold transition-colors ${isActive
      ? 'bg-brand-primary/10 text-brand-primary'
      : 'text-text-secondary hover:bg-dark-surface hover:text-text-primary'
    }`;

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-b border-dark-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/home" className="flex items-center gap-2 group">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-primary text-white font-black text-lg shadow-sm group-hover:bg-brand-primary-hover transition-colors">
                  C
                </div>
                <div className="hidden sm:block">
                  <div className="text-xl font-bold tracking-tight text-brand-secondary">CodeSprint</div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-2 ml-10">
              {links.map((link) => (
                <NavLink key={link.to} to={link.to} className={navLinkClass}>
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* User Profile & Actions (Desktop) */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center gap-3 bg-dark-surface rounded-full pl-4 pr-1 py-1 border border-dark-border">
                <div className="text-right">
                  <div className="text-xs font-bold text-text-primary">{user?.username || 'Guest'}</div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary">
                    {user?.role === 'admin' ? 'Admin' : 'Student'}
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {(user?.username || 'G').charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="h-6 w-px bg-dark-border"></div>
              <button onClick={handleLogout} className="text-sm font-semibold text-text-secondary hover:text-brand-danger transition-colors">
                Log Out
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setOpen(!open)}
                className="btn-icon p-2 border border-dark-border"
                aria-expanded={open}
              >
                <span className="sr-only">Open main menu</span>
                <div className="flex flex-col gap-1 w-5">
                  <span className={`h-0.5 w-full bg-text-primary transform transition duration-300 ${open ? 'rotate-45 translate-y-1.5' : ''}`} />
                  <span className={`h-0.5 w-full bg-text-primary transition duration-300 ${open ? 'opacity-0' : ''}`} />
                  <span className={`h-0.5 w-full bg-text-primary transform transition duration-300 ${open ? '-rotate-45 -translate-y-1.5' : ''}`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden fixed inset-x-0 top-16 z-40 bg-white border-b border-dark-border shadow-xl">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={mobileNavLinkClass}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="px-4 py-4 border-t border-dark-border bg-dark-surface">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold">
                {(user?.username || 'G').charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <div className="text-base font-bold text-text-primary">{user?.username || 'Guest'}</div>
                <div className="text-xs font-semibold text-text-secondary uppercase mt-0.5">{user?.email || ''}</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => { setOpen(false); handleLogout(); }}
                className="w-full text-center px-4 py-2 border border-brand-danger text-brand-danger rounded-md font-semibold hover:bg-brand-danger hover:text-white transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
