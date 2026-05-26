import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

const ROLE_META = {
  company:  { label: 'Recruiter',   color: '#6366F1', icon: '🏢' },
  employee: { label: 'Job Seeker',  color: '#059669', icon: '👤' },
};

export default function Navbar({ theme, toggleTheme }) {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    const checkUser = () => {
      const raw = localStorage.getItem('auth_user');
      setUser(raw ? JSON.parse(raw) : null);
    };
    checkUser();
    window.addEventListener('storage', checkUser);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', checkUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('lastResult');
    localStorage.removeItem('lastCompareResults');
    setUser(null);
    window.dispatchEvent(new Event('storage'));
  };

  const roleMeta = user?.role ? ROLE_META[user.role] : null;

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar" style={{ height: '60px', zIndex: 100 }}>
      <div className="nav-container row space-between items-center px-lg h-16 w-full max-w-7xl mx-auto">

        {/* Logo */}
        <Link to="/" className="logo row items-center gap-2 text-primary font-600 font-body">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
            <path d="M12 22v-6"></path><path d="M16 11l-4-4-4 4"></path>
            <path d="M12 2v5"></path><path d="M6 16v-4"></path><path d="M18 16v-4"></path>
          </svg>
          ResumeTree
        </Link>

        {/* Links */}
        <div className="nav-links row gap-8 display-md">
          <NavLink to="/howitworks" className={({ isActive }) => `text-secondary hover-primary ${isActive ? 'active' : ''}`}>How It Works</NavLink>
          <NavLink to="/research"   className={({ isActive }) => `text-secondary hover-primary ${isActive ? 'active' : ''}`}>Research</NavLink>
          {user && <NavLink to="/upload" className={({ isActive }) => `text-secondary hover-primary ${isActive ? 'active' : ''}`}>
            {user.role === 'company' ? '📋 Screen Candidates' : '📄 My Resume'}
          </NavLink>}
          {user && <NavLink to="/results" className={({ isActive }) => `text-secondary hover-primary ${isActive ? 'active' : ''}`}>
            Results
          </NavLink>}
        </div>

        {/* Actions */}
        <div className="nav-actions row items-center gap-4">
          {/* Theme toggle */}
          <button id="theme-toggle" className="icon-btn text-secondary hover-primary" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>

          {user ? (
            <div className="row items-center gap-3">
              {roleMeta && (
                <span className="nav-role-badge" style={{ background: `${roleMeta.color}18`, color: roleMeta.color, border: `1px solid ${roleMeta.color}33` }}>
                  {roleMeta.icon} {roleMeta.label}
                </span>
              )}
              <span className="text-secondary text-sm font-500 display-md" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: roleMeta?.color || '#10b981', flexShrink: 0 }}></span>
                {user.name}
              </span>
              <button className="btn btn-ghost" onClick={handleLogout}
                style={{ padding: '6px 12px', fontSize: '13px', border: '1px solid var(--border)' }}>
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-secondary hover-primary text-sm font-600">Sign In</Link>
              <Link to="/login" className="btn btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>Get Started</Link>
            </>
          )}
        </div>
      </div>

      {/* Role-specific greeting banner (first login only) */}
      {user && roleMeta && (
        <style>{`
          .nav-role-badge {
            font-size: 11.5px; font-weight: 600;
            padding: 3px 10px; border-radius: 999px;
            display: flex; align-items: center; gap: 5px;
            animation: fadeIn 0.4s ease both;
          }
        `}</style>
      )}
    </nav>
  );
}
