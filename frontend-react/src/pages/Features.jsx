import React from 'react';
import { Link } from 'react-router-dom';

export default function Features() {
  return (
    <div className="min-h-screen bg-base pt-20 px-4">
      <div className="container max-w-5xl mx-auto text-center col items-center pb-32">
        <div className="pill pill-green mb-6 border border-border" style={{ background: 'var(--surface)' }}>
          Capabilities
        </div>
        <h1 className="display-title mb-6">Advanced ATS Matching Engine</h1>
        <p className="text-secondary mb-16 max-w-xl mx-auto text-lg leading-relaxed">
          ResumeTree parses, maps, and scores candidate compatibility using deep tree representations of skills, experience, and career progress.
        </p>

        <div className="grid-3 gap-8 text-left w-full">
          <div className="card p-8 hover-scale">
            <div className="mb-6 text-brand" style={{ background: 'var(--brand-soft)', width: '48px', height: '48px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22V2M16 11l-4-4-4 4M6 16v-4M18 16v-4"></path>
              </svg>
            </div>
            <h3 className="text-lg font-600 mb-3 text-primary">Hierarchical Parsing</h3>
            <p className="text-secondary text-sm leading-relaxed">
              We decompose resumes into standard schema trees containing personal info, nested roles, projects, and segmented skill blocks.
            </p>
          </div>

          <div className="card p-8 hover-scale">
            <div className="mb-6 text-excellent" style={{ background: 'rgba(16, 185, 129, 0.1)', width: '48px', height: '48px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <h3 className="text-lg font-600 mb-3 text-primary">Requirement Scoring</h3>
            <p className="text-secondary text-sm leading-relaxed">
              Aligning job requirement trees with candidate profiles to check for full keyword, context, and duration matches.
            </p>
          </div>

          <div className="card p-8 hover-scale">
            <div className="mb-6 text-amber" style={{ background: 'rgba(245, 158, 11, 0.1)', width: '48px', height: '48px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h3 className="text-lg font-600 mb-3 text-primary">Interactive Highlight</h3>
            <p className="text-secondary text-sm leading-relaxed">
              Instantly view critical strengths and structural experience gaps color-annotated directly on a clean mockup of your resume.
            </p>
          </div>
        </div>

        <div className="mt-20 card p-10 w-full bg-surface border border-border text-center max-w-3xl">
          <h2 className="display-title-normal mb-4">Start Matching Resumes Today</h2>
          <p className="text-secondary mb-8 text-sm max-w-md mx-auto">
            Test candidate compliance against customized criteria. Get details on experience alignments in seconds.
          </p>
          <Link to="/upload" className="btn btn-primary shadow-glow">Evaluate Now &rarr;</Link>
        </div>
      </div>
    </div>
  );
}
