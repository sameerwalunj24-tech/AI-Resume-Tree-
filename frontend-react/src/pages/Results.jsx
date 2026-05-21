import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../css/pages/results.css';

export default function Results() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [filename, setFilename] = useState('resume.pdf');
  const [jdTitle, setJdTitle] = useState('Job Description');
  const [activeSection, setActiveSection] = useState('overall');
  const [expandedReqs, setExpandedReqs] = useState({});

  useEffect(() => {
    const raw = localStorage.getItem('lastResult');
    if (!raw) {
      navigate('/upload');
      return;
    }
    const parsed = JSON.parse(raw);
    setData(parsed);
    setFilename(localStorage.getItem('lastFilename') || 'resume.pdf');
    const rawJd = localStorage.getItem('lastJD') || 'Job Description';
    setJdTitle(rawJd.replace(/\s+/g, ' ').trim().substring(0, 30) + (rawJd.length > 30 ? '...' : ''));

    // Handle scroll spy to highlight sidebar nav links
    const handleScroll = () => {
      const sections = ['overall', 'jdcompat', 'suggestions'];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 150) {
          setActiveSection(id);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navigate]);

  if (!data) return null;

  const score = data.overall_score || 0;
  let colorClass = "badge-red";
  let hexColor = "var(--poor)";
  let statusLabel = "Needs Work";
  
  if (score >= 85) { colorClass = "badge-green"; hexColor = "var(--excellent)"; statusLabel = "Excellent Match"; }
  else if (score >= 70) { colorClass = "badge-blue"; hexColor = "var(--brand)"; statusLabel = "Good Match"; }
  else if (score >= 50) { colorClass = "badge-amber"; hexColor = "var(--average)"; statusLabel = "Average Match"; }

  const totalReqs = (data.matched_requirements?.length || 0) + (data.unmatched_requirements?.length || 0);
  const gapsCount = data.gaps?.length || 0;

  const toggleReq = (id) => {
    setExpandedReqs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const circumference = 2 * Math.PI * 120; // r=120
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const dims = data.dimension_scores || {};
  const r = data.resume_json || {};

  // Find missing skill words helper
  const getMissingSkills = () => {
    const missing = [];
    const skillsLower = (r.skills || []).map(s => s.toLowerCase());
    (data.gaps || []).forEach(gap => {
      const words = gap.match(/\b[A-Z][a-zA-Z+#.\/]{1,}\b/g);
      if (words) {
        words.forEach(w => {
          if (!skillsLower.includes(w.toLowerCase()) && !missing.includes(w)) {
            missing.push(w);
          }
        });
      }
    });
    return missing;
  };

  const missingSkills = getMissingSkills();

  return (
    <div className="min-h-screen col bg-base">
      {/* Top sticky bar */}
      <div className="top-bar-sticky scrolled" id="top-bar">
        <div className="container row space-between items-center py-4 px-lg max-w-7xl mx-auto h-16">
          <div className="row items-center gap-4">
            <Link to="/" className="btn btn-ghost" style={{ padding: '8px 12px' }}>
              &larr; Back
            </Link>
            <div style={{ height: '24px', width: '1px', background: 'var(--border)' }}></div>
            <span id="display-filename" className="pill mono-text text-t2" style={{ background: 'var(--elevated)', border: 'none' }}>
              {filename}
            </span>
            <span className="text-t3">&rarr;</span>
            <span id="display-jd-title" className="pill mono-text" style={{ color: 'var(--brand)', background: 'var(--brand-soft)', border: 'none' }}>
              {jdTitle}
            </span>
          </div>
          <div className="row items-center gap-4">
            <button className="btn btn-ghost" onClick={() => navigate('/upload')}>Scan Again</button>
            <button className="btn btn-primary shadow-glow" onClick={() => window.print()}>Download Report</button>
          </div>
        </div>
      </div>

      <main className="container mt-8 mb-32 max-w-7xl mx-auto px-4">
        <div className="dashboard-layout">
          
          {/* 1. Left Sidebar Navigation */}
          <aside className="sidebar">
            <div style={{ position: 'sticky', top: '100px' }}>
              <nav>
                <a href="#overall" className={`nav-link ${activeSection === 'overall' ? 'active' : ''}`} onClick={() => setActiveSection('overall')}>
                  <div className="flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg> 
                    Overall Score
                  </div>
                  <span id="nav-score-badge" className={`nav-badge ${colorClass}`}>{score}</span>
                </a>
                <a href="#jdcompat" className={`nav-link ${activeSection === 'jdcompat' ? 'active' : ''}`} onClick={() => setActiveSection('jdcompat')}>
                  <div className="flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg> 
                    Requirements
                  </div>
                  <span id="nav-match-badge" className="nav-badge badge-amber">
                    {data.matched_requirements?.length || 0}/{totalReqs}
                  </span>
                </a>
                <a href="#suggestions" className={`nav-link ${activeSection === 'suggestions' ? 'active' : ''}`} onClick={() => setActiveSection('suggestions')}>
                  <div className="flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                    </svg> 
                    Gaps & Strengths
                  </div>
                  <span id="nav-gap-badge" className="nav-badge badge-red">{gapsCount}</span>
                </a>
              </nav>
              
              <div className="mt-8 p-4 rounded bg-surface border border-border">
                <p className="text-t3" style={{ fontSize: '12px', marginBottom: '4px' }}>Matched against:</p>
                <p id="sidebar-role-name" className="font-500 text-sm mb-4">{jdTitle}</p>
                <Link to="/upload" className="text-brand text-sm hover-underline">Change JD &rarr;</Link>
              </div>
            </div>
          </aside>

          {/* 2. Center Main Panel */}
          <div className="center-content">
            
            {/* Score & Gauge Section */}
            <section id="overall" className="mb-20 pt-4">
              <div className="row flex-wrap gap-8 items-stretch">
                
                {/* Gauge widget */}
                <div className="card col items-center justify-center p-8 flex-1" style={{ minWidth: '260px' }}>
                  <div className="relative" style={{ width: '240px', height: '240px' }}>
                    <svg viewBox="0 0 260 260" className="w-full h-full transform -rotate-90">
                      {/* Background circle */}
                      <circle cx="130" cy="130" r="120" fill="none" stroke="var(--border)" strokeWidth="12" />
                      {/* Active arc */}
                      <circle 
                        id="gauge-circle" 
                        cx="130" 
                        cy="130" 
                        r="120" 
                        fill="none" 
                        stroke={hexColor} 
                        strokeWidth="12" 
                        strokeLinecap="round"
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={strokeDashoffset}
                        style={{ 
                          transition: 'stroke-dashoffset 1.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
                          filter: `drop-shadow(0 0 12px ${hexColor}40)` 
                        }}
                      />
                    </svg>
                    <div className="absolute top-0 left-0 w-full h-full col items-center justify-center">
                      <span id="gauge-score" className="display-title font-700" style={{ fontSize: '56px', lineHeight: '1', color: hexColor }}>
                        {score}
                      </span>
                      <span id="gauge-label" className="text-xs font-600 tracking-wider uppercase mt-2 text-secondary">
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dimension scores */}
                <div className="card flex-1 col justify-center py-8 px-10 gap-6" style={{ minWidth: '320px' }}>
                  <h3 className="display-title-normal mb-0" style={{ fontSize: '20px' }}>Dimension Analysis</h3>
                  
                  <div className="col gap-5">
                    {/* Skill Match */}
                    <div className="dim-bar-wrapper">
                      <div className="dim-bar-title">
                        <span className="text-t2">Keyword Alignment</span> 
                        <span className="mono-text text-t1 font-600">{dims.skill_match || 0}%</span>
                      </div>
                      <div className="dim-bar-track">
                        <div className="dim-bar-fill" style={{ width: `${dims.skill_match || 0}%`, background: 'var(--brand)' }}></div>
                      </div>
                    </div>

                    {/* Experience Quality */}
                    <div className="dim-bar-wrapper">
                      <div className="dim-bar-title">
                        <span className="text-t2">Experience Quality</span> 
                        <span className="mono-text text-t1 font-600">{dims.experience_quality || 0}%</span>
                      </div>
                      <div className="dim-bar-track">
                        <div className="dim-bar-fill" style={{ width: `${dims.experience_quality || 0}%`, background: 'var(--brand)' }}></div>
                      </div>
                    </div>

                    {/* Career Progression */}
                    <div className="dim-bar-wrapper">
                      <div className="dim-bar-title">
                        <span className="text-t2">Career Progression</span> 
                        <span className="mono-text text-t1 font-600">{dims.career_progression || 0}%</span>
                      </div>
                      <div className="dim-bar-track">
                        <div className="dim-bar-fill" style={{ width: `${dims.career_progression || 0}%`, background: 'var(--brand)' }}></div>
                      </div>
                    </div>

                    {/* Context Fit */}
                    <div className="dim-bar-wrapper">
                      <div className="dim-bar-title">
                        <span className="text-t2">Context Fit</span> 
                        <span className="mono-text text-t1 font-600">{dims.context_fit || 0}%</span>
                      </div>
                      <div className="dim-bar-track">
                        <div className="dim-bar-fill" style={{ width: `${dims.context_fit || 0}%`, background: 'var(--brand)' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Insight Chips */}
                  <div id="insight-chips" className="flex-col mt-4 gap-2">
                    {data.strengths?.length > 0 && (
                      <div className="insight-chip green">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-1">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg> 
                        <span><strong>Strength:</strong> {data.strengths[0].split('.')[0]}.</span>
                      </div>
                    )}
                    {data.gaps?.length > 0 && (
                      <div className="insight-chip red">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-1">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg> 
                        <span><strong>Critical Gap:</strong> {data.gaps[0].split('.')[0]}.</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </section>

            {/* Detailed Requirement Match */}
            <section id="jdcompat" className="mb-20 pt-4">
              <h2 className="display-title-normal mb-8">Detailed Requirement Match</h2>
              <div id="accordion-container" className="flex-col gap-2">
                
                {/* Matched Requirements */}
                {(data.matched_requirements || []).map((m, idx) => {
                  const isFull = m.match_type === 'full';
                  const reqId = m.req_id || `REQ_${idx}`;
                  const isOpen = !!expandedReqs[reqId];
                  return (
                    <div 
                      key={reqId} 
                      className={`accordion-card ${isOpen ? 'expanded' : ''}`}
                      onClick={() => toggleReq(reqId)}
                    >
                      <div className="accordion-header">
                        <div className="flex items-center gap-4">
                          <span className="pill mono-text" style={{ fontSize: '11px', background: 'var(--surface)', border: '1px solid var(--border)' }}>REQ</span>
                          <span className="font-500 text-t1">{reqId}</span>
                        </div>
                        <span className={`pill ${isFull ? 'badge-green' : 'badge-amber'} border-none`} style={{ fontSize: '11px' }}>
                          {isFull ? '✓ Found' : '◐ Partial'}
                        </span>
                        <svg className="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                      <div className="accordion-content text-t2 text-sm">
                        {m.reasoning}
                      </div>
                    </div>
                  );
                })}

                {/* Unmatched Requirements */}
                {(data.unmatched_requirements || []).map((u, idx) => {
                  const reqId = typeof u === 'string' ? u : `UNREQ_${idx}`;
                  const isOpen = !!expandedReqs[reqId];
                  return (
                    <div 
                      key={reqId} 
                      className={`accordion-card ${isOpen ? 'expanded' : ''}`}
                      onClick={() => toggleReq(reqId)}
                    >
                      <div className="accordion-header">
                        <div className="flex items-center gap-4">
                          <span className="pill mono-text" style={{ fontSize: '11px', background: 'var(--surface)', border: '1px solid var(--border)' }}>REQ</span>
                          <span className="font-500 text-t1">{reqId}</span>
                        </div>
                        <span className="pill badge-red border-none" style={{ fontSize: '11px' }}>✗ Missing</span>
                        <svg className="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                      <div className="accordion-content text-t2 text-sm">
                        This requirement was not detected anywhere in your resume structure.
                      </div>
                    </div>
                  );
                })}

              </div>
            </section>

            {/* Actionable Insights */}
            <section id="suggestions" className="mb-20 pt-4">
              <h2 className="display-title-normal mb-2">Actionable Insights</h2>
              <p className="text-t3 mb-8 text-sm">Critical improvements to pass the ATS filter.</p>
              
              <div className="grid-2 gap-8">
                <div className="flex-col">
                  <h3 className="text-poor font-600 mb-4 flex items-center gap-2">
                    <div className="dot red"></div> Critical Gaps
                  </h3>
                  <div id="gaps-container" className="flex-col gap-2">
                    {(data.gaps || []).map((gap, i) => (
                      <div key={i} className="gs-item gs-gap">
                        <span className="text-t2">{gap.split('.')[0]}.</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex-col">
                  <h3 className="text-excellent font-600 mb-4 flex items-center gap-2">
                    <div className="dot green"></div> Your Strengths
                  </h3>
                  <div id="strengths-container" className="flex-col gap-2">
                    {(data.strengths || []).map((s, i) => (
                      <div key={i} className="gs-item gs-strength">
                        <span className="text-t2">{s.split('.')[0]}.</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* 3. Right Sidebar: Resume Visualizer */}
          <aside className="resume-visualizer">
            <div style={{ position: 'sticky', top: '100px' }}>
              <h2 className="display-title-normal mb-6">Annotated Resume</h2>
              <div id="rdoc" className="rdoc-container card bg-surface">
                
                {/* Personal Info Header */}
                <p className="rdoc-name">{r.personal_info?.name || 'Candidate'}</p>
                {r.experience?.[0]?.title && <p className="rdoc-title">{r.experience[0].title}</p>}
                
                {/* Contact Row */}
                {([r.personal_info?.email, r.personal_info?.location, r.personal_info?.linkedin].filter(Boolean).length > 0) && (
                  <div className="rdoc-contact">
                    {[r.personal_info?.email, r.personal_info?.location, r.personal_info?.linkedin].filter(Boolean).map((c, i) => (
                      <span key={i} style={{ marginRight: '10px' }}>{c}</span>
                    ))}
                  </div>
                )}

                {/* 2-Columns */}
                <div className="rdoc-cols">
                  {/* Left Column: Exp, Edu */}
                  <div className="rdoc-left">
                    {r.experience?.length > 0 && (
                      <>
                        <div className="rdoc-sh">Experience</div>
                        {r.experience.map((exp, idx) => {
                          const d = [exp.start_year, exp.end_year || 'Present'].filter(Boolean).join(' – ');
                          const bullets = [...(exp.responsibilities || []), ...(exp.outcomes || [])];
                          return (
                            <div key={idx} className="rdoc-exp">
                              <p className="rdoc-exp-role">{exp.title}</p>
                              <p className="rdoc-exp-co">{exp.company}</p>
                              {d && <p className="rdoc-exp-date">📅 {d}</p>}
                              {bullets.length > 0 && (
                                <ul>
                                  {bullets.map((bullet, bIdx) => (
                                    <li key={bIdx}>{bullet}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}

                    {r.education?.length > 0 && (
                      <>
                        <div className="rdoc-sh">Education</div>
                        {r.education.map((edu, idx) => {
                          const meta = [edu.year ? '📅 ' + edu.year : '', edu.cgpa ? 'CGPA: ' + edu.cgpa : ''].filter(Boolean).join('  ·  ');
                          return (
                            <div key={idx} className="rdoc-edu">
                              <p className="rdoc-edu-deg">{edu.degree}</p>
                              <p className="rdoc-edu-inst">{edu.institution}</p>
                              {meta && <p className="rdoc-edu-meta">{meta}</p>}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>

                  {/* Right Column: Skills, Projects, Certs */}
                  <div className="rdoc-right">
                    {r.skills?.length > 0 && (
                      <>
                        <div className="rdoc-sh">Skills</div>
                        <div className="rdoc-tags">
                          {r.skills.map((s, idx) => (
                            <span key={idx} className="rdoc-tag">{s}</span>
                          ))}
                          {/* Missing Skill Tags rendered with text-decoration: line-through */}
                          {missingSkills.map((w, idx) => (
                            <span key={`missing-${idx}`} className="rdoc-tag missing">{w}</span>
                          ))}
                        </div>
                      </>
                    )}

                    {r.projects?.length > 0 && (
                      <>
                        <div className="rdoc-sh">Projects</div>
                        {r.projects.map((proj, idx) => (
                          <div key={idx} className="rdoc-exp">
                            <p className="rdoc-exp-role">{proj.title}</p>
                            {proj.description && <p style={{ fontSize: '10.5px', color: '#555', margin: '2px 0' }}>{proj.description}</p>}
                            {proj.outcome && <p style={{ fontSize: '10.5px', color: '#555', margin: '2px 0' }}>▸ {proj.outcome}</p>}
                            {proj.tech_stack?.length > 0 && (
                              <div className="rdoc-tags" style={{ marginTop: '4px' }}>
                                {proj.tech_stack.map((t, tIdx) => (
                                  <span key={tIdx} className="rdoc-tag">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}

                    {r.certifications?.length > 0 && (
                      <>
                        <div className="rdoc-sh">Certifications</div>
                        {r.certifications.map((c, idx) => (
                          <p key={idx} style={{ fontSize: '10.5px', margin: '3px 0' }}>• {c}</p>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Strengths Found */}
                {data.strengths?.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div className="rdoc-sh" style={{ borderColor: '#10b981', color: '#10b981' }}>✓ Strengths Found</div>
                    {data.strengths.map((s, idx) => (
                      <div key={idx} className="rdoc-good"><p>{s}</p></div>
                    ))}
                  </div>
                )}

                {/* Areas to Improve */}
                {data.gaps?.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div className="rdoc-sh" style={{ borderColor: '#ef4444', color: '#ef4444' }}>✗ Areas to Improve</div>
                    {data.gaps.map((g, idx) => (
                      <div key={idx} className="rdoc-bad"><p>{g}</p></div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}
