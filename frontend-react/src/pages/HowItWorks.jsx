import React from 'react';
import { Link } from 'react-router-dom';

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-base pt-20 px-4">
      <div className="container max-w-4xl mx-auto text-center col items-center pb-32">
        <div className="pill pill-green mb-6 border border-border" style={{ background: 'var(--surface)' }}>
          Architecture
        </div>
        <h1 className="display-title mb-6">How ResumeTree Works</h1>
        <p className="text-secondary mb-16 max-w-xl mx-auto text-lg leading-relaxed">
          Our parser maps candidate credentials and job requirements into deep hierarchical nodes, matching details using state-of-the-art LLMs.
        </p>

        {/* Timeline Pipeline */}
        <div className="col gap-12 text-left w-full relative">
          {/* Vertical connecting line */}
          <div style={{ position: 'absolute', left: '27px', top: '24px', bottom: '24px', width: '2px', background: 'var(--border)', zIndex: 0 }}></div>

          {/* Step 1 */}
          <div className="row gap-6 relative z-10">
            <div className="flex-shrink-0" style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--surface)', border: '2px solid var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: 'var(--brand)' }}>
              1
            </div>
            <div className="card p-6 flex-1">
              <h3 className="text-lg font-600 mb-2 text-primary">Resume Parsing (Module M1)</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Extracts raw text and maps it into clean JSON representing experiences, education, certifications, and skills.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="row gap-6 relative z-10">
            <div className="flex-shrink-0" style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--surface)', border: '2px solid var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: 'var(--brand)' }}>
              2
            </div>
            <div className="card p-6 flex-1">
              <h3 className="text-lg font-600 mb-2 text-primary">Resume Tree Builder (Module M2)</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Organizes JSON entries into a directed hierarchical tree, nesting roles and projects to compute progression levels.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="row gap-6 relative z-10">
            <div className="flex-shrink-0" style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--surface)', border: '2px solid var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: 'var(--brand)' }}>
              3
            </div>
            <div className="card p-6 flex-1">
              <h3 className="text-lg font-600 mb-2 text-primary">Job Description Parsing (Module M3)</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Dissects job description texts into modular requirement sets with duration parameters.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="row gap-6 relative z-10">
            <div className="flex-shrink-0" style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--surface)', border: '2px solid var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: 'var(--brand)' }}>
              4
            </div>
            <div className="card p-6 flex-1">
              <h3 className="text-lg font-600 mb-2 text-primary">Evaluation Agent (Module M4)</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Applies reasoning models (using Google Gemini) to align parsed requirement sets with the candidate's experience tree, outputting detailed compatibility grades.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <Link to="/upload" className="btn btn-primary shadow-glow">Test Your Resume Now &rarr;</Link>
        </div>
      </div>
    </div>
  );
}
