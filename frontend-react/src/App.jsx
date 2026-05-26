import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Landing from './pages/Landing';
import Upload from './pages/Upload';
import Results from './pages/Results';
import Visualizer from './pages/Visualizer';
import Auth from './pages/Auth';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import HowItWorks from './pages/HowItWorks';
import Feedback from './pages/Feedback';
import Research from './pages/Research';

// Import design-system CSS in correct order
import './css/design-system.css';
import './css/layout.css';
import './css/components.css';
import './css/animations.css';
import './css/global.css';

export default function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('resumetree-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('resumetree-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <Router>
      <ScrollToTop />
      <div className="bg-base text-primary font-body antialiased min-h-screen col transition-colors">
        <div className="noise-overlay"></div>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        
        <div className="flex-1 w-full relative z-10 page-transition" style={{ paddingTop: '64px' }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/results" element={<Results />} />
            <Route path="/visualizer" element={<Visualizer />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/howitworks" element={<HowItWorks />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/research" element={<Research />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </Router>
  );
}
