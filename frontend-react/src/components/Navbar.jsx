import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function Navbar({ theme, toggleTheme }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar" style={{ height: '60px', zIndex: 100 }}>
      <div className="nav-container row space-between items-center px-lg h-16 w-full max-w-7xl mx-auto">
        <Link to="/" className="logo row items-center gap-2 text-primary font-600 font-body">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--blue-500)" strokeWidth="2">
            <path d="M12 22v-6"></path>
            <path d="M16 11l-4-4-4 4"></path>
            <path d="M12 2v5"></path>
            <path d="M6 16v-4"></path>
            <path d="M18 16v-4"></path>
          </svg>
          ResumeTree
        </Link>
        <div className="nav-links row gap-8 display-md">
          <NavLink to="/howitworks" className={({ isActive }) => `text-secondary hover-primary ${isActive ? 'active' : ''}`}>How It Works</NavLink>
          <NavLink to="/research" className={({ isActive }) => `text-secondary hover-primary ${isActive ? 'active' : ''}`}>Research</NavLink>
          <NavLink to="/upload" className={({ isActive }) => `text-secondary hover-primary ${isActive ? 'active' : ''}`}>Upload</NavLink>
        </div>
        <div className="nav-actions row items-center gap-4">
          <button id="theme-toggle" className="icon-btn text-secondary hover-primary" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? (
              <svg id="sun-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg id="moon-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
          <Link to="/upload" className="btn btn-primary">Try Free</Link>
        </div>
      </div>
    </nav>
  );
}
