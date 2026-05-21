import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container row space-between items-center text-secondary" style={{ fontSize: '13.5px' }}>
        <div className="row items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
            <path d="M12 22v-6"></path>
            <path d="M16 11l-4-4-4 4"></path>
            <path d="M12 2v5"></path>
            <path d="M6 16v-4"></path>
            <path d="M18 16v-4"></path>
          </svg>
          <span>© 2025 ResumeTree · IEEE Research Project</span>
        </div>
        <div className="row gap-6">
          <a href="#" className="footer-link">GitHub</a>
          <a href="#" className="footer-link">Research Paper</a>
          <a href="#" className="footer-link">Contact</a>
        </div>
      </div>
    </footer>
  );
}
