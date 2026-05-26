import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/pages/auth.css';

const ROLES = [
  {
    key: 'company',
    icon: '🏢',
    title: 'Company / Recruiter',
    desc: 'Screen multiple candidates, compare resumes side-by-side, and get AI-powered hiring recommendations.',
    color: '#6366F1',
    glow: 'rgba(99,102,241,0.18)',
  },
  {
    key: 'employee',
    icon: '👤',
    title: 'Job Seeker / Employee',
    desc: 'Analyse your resume against any job description and get personalised improvement tips.',
    color: '#059669',
    glow: 'rgba(5,150,105,0.18)',
  },
];

export default function Auth() {
  const navigate = useNavigate();
  const [step, setStep] = useState('role'); // 'role' | 'form'
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem('auth_user');
    if (existing) navigate('/upload');
  }, [navigate]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setAnimating(true);
    setTimeout(() => {
      setStep('form');
      setAnimating(false);
    }, 320);
  };

  const handleBack = () => {
    setAnimating(true);
    setTimeout(() => {
      setStep('role');
      setError('');
      setAnimating(false);
    }, 220);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all required fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return; }
    if (!isLogin && !name) { setError('Please enter your full name.'); return; }

    const userPayload = {
      email,
      name: isLogin ? email.split('@')[0] : name,
      role: selectedRole,
      token: 'mock-jwt-token-xyz',
    };
    localStorage.setItem('auth_user', JSON.stringify(userPayload));
    setToastMsg(isLogin ? 'Welcome back!' : 'Account created!');
    setTimeout(() => {
      setToastMsg(null);
      window.dispatchEvent(new Event('storage'));
      navigate('/upload');
    }, 1400);
  };

  const roleInfo = ROLES.find(r => r.key === selectedRole);

  return (
    <div className="auth-wrapper bg-base">
      <div className="auth-glow-1"></div>
      <div className="auth-glow-2"></div>

      {toastMsg && (
        <div className="auth-toast animate-slide-down">
          <span style={{ fontSize: '18px' }}>✨</span>
          <span className="text-t1 font-600 text-sm">{toastMsg}</span>
        </div>
      )}

      <div className={`auth-card ${animating ? 'auth-card-exit' : 'auth-card-enter'}`}>

        {/* Logo */}
        <div className="auth-logo-section">
          <div className="auth-logo-circle">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22v-6"></path><path d="M16 11l-4-4-4 4"></path>
              <path d="M12 2v5"></path><path d="M6 16v-4"></path><path d="M18 16v-4"></path>
            </svg>
          </div>
          <h2 className="auth-title">ResumeTree</h2>
          <p className="auth-subtitle">
            {step === 'role' ? 'Choose how you want to get started' : `${isLogin ? 'Sign in' : 'Sign up'} as ${roleInfo?.title}`}
          </p>
        </div>

        {/* STEP 1: Role Selector */}
        {step === 'role' && (
          <div className="role-selector-grid">
            {ROLES.map((r) => (
              <button
                key={r.key}
                className="role-card"
                onClick={() => handleRoleSelect(r.key)}
                style={{ '--role-color': r.color, '--role-glow': r.glow }}
              >
                <span className="role-card-icon">{r.icon}</span>
                <span className="role-card-title">{r.title}</span>
                <span className="role-card-desc">{r.desc}</span>
                <span className="role-card-arrow">→</span>
              </button>
            ))}
          </div>
        )}

        {/* STEP 2: Login/Signup Form */}
        {step === 'form' && (
          <>
            {/* Role badge */}
            <div className="role-badge-row">
              <button className="role-back-btn" onClick={handleBack}>← Back</button>
              <span className="role-badge" style={{ background: roleInfo?.glow, color: roleInfo?.color, border: `1px solid ${roleInfo?.color}33` }}>
                {roleInfo?.icon} {roleInfo?.title}
              </span>
            </div>

            {error && (
              <div className="p-3 rounded text-xs text-danger bg-danger-soft border border-danger mb-4 text-left"
                style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="auth-field">
                  <label className="auth-label">Full Name</label>
                  <div className="auth-input-container">
                    <span className="auth-input-icon">👤</span>
                    <input type="text" placeholder="John Doe" className="auth-input"
                      value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                </div>
              )}
              <div className="auth-field">
                <label className="auth-label">Email Address</label>
                <div className="auth-input-container">
                  <span className="auth-input-icon">✉️</span>
                  <input type="email" placeholder="you@example.com" className="auth-input"
                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Password</label>
                <div className="auth-input-container">
                  <span className="auth-input-icon">🔒</span>
                  <input type="password" placeholder="••••••••" className="auth-input"
                    value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full py-3 mt-2"
                style={{ height: '48px', background: roleInfo?.color }}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p className="auth-switch-text">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button type="button" className="auth-switch-link"
                onClick={() => { setIsLogin(!isLogin); setError(''); }}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
