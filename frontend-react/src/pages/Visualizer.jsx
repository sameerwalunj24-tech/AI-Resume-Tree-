import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../css/pages/results.css';
import '../css/pages/visualizer.css';

// Helper to check if a tree node has a descendant matching query or active id
function hasDescendantMatch(node, query, activeId) {
  if (activeId && node.node_id === activeId) return true;
  if (query) {
    const q = query.toLowerCase();
    const titleMatch = node.title && node.title.toLowerCase().includes(q);
    const summaryMatch = node.summary && node.summary.toLowerCase().includes(q);
    const idMatch = node.node_id && node.node_id.toLowerCase().includes(q);
    if (titleMatch || summaryMatch || idMatch) return true;
  }
  if (node.children) {
    return node.children.some(child => hasDescendantMatch(child, query, activeId));
  }
  return false;
}

// TreeNodeView recursive component with search query and active highlighting
function TreeNodeView({ node, depth = 0, activeNodeId = null, searchQuery = '' }) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  
  // Highlight match conditions
  const isDirectActive = node.node_id === activeNodeId;
  const isSearchMatch = searchQuery && (
    (node.title && node.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (node.summary && node.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (node.node_id && node.node_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const isHighlighted = isDirectActive || isSearchMatch;
  const containsActive = (activeNodeId || searchQuery) && hasDescendantMatch(node, searchQuery, activeNodeId);

  useEffect(() => {
    if (containsActive || isHighlighted) {
      setIsOpen(true);
    }
  }, [containsActive, isHighlighted]);

  const icon = node.type === 'root' ? '👤' : 
               node.type === 'section' ? '📁' : 
               node.type === 'experience' ? '💼' : 
               node.type === 'project' ? '🚀' : 
               node.type === 'education' ? '🎓' : '🛠️';

  const typeClass = node.type === 'root' ? 'tree-node-root' : 
                    node.type === 'section' ? 'tree-node-section' : 
                    node.type === 'experience' ? 'tree-node-experience' : 
                    node.type === 'project' ? 'tree-node-project' : 
                    node.type === 'education' ? 'tree-node-education' : 'tree-node-other';

  return (
    <div className="tree-node-branch">
      <div 
        className={`tree-node-card ${typeClass} ${isHighlighted ? 'active' : ''}`}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        style={{
          boxShadow: isDirectActive ? '0 0 12px var(--brand-glow)' : 'none'
        }}
      >
        <div className="tree-node-card-header">
          <div className="row items-center gap-3">
            <span className="tree-node-icon">{icon}</span>
            <div className="tree-node-title-group">
              <span className="tree-node-title">{node.title || node.node_id}</span>
              <span className="tree-node-type-pill">{node.type}</span>
            </div>
          </div>
          {hasChildren && (
            <span className={`tree-node-arrow-icon ${isOpen ? 'open' : ''}`} style={{ fontSize: '10px' }}>
              ▶
            </span>
          )}
        </div>

        {isOpen && (node.summary || (node.metadata && Object.keys(node.metadata).length > 0)) && (
          <div className="tree-node-card-body">
            {node.summary && <p className="tree-node-summary">{node.summary}</p>}
            {node.metadata && Object.keys(node.metadata).length > 0 && (
              <div className="tree-node-meta-grid">
                {Object.entries(node.metadata).map(([key, value]) => {
                  if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) return null;
                  return (
                    <span key={key} className="tree-node-meta-tag">
                      <strong>{key.replace('_', ' ')}:</strong> {Array.isArray(value) ? value.join(', ') : String(value)}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {isOpen && hasChildren && (
        <div className="tree-node-children-container">
          {node.children.map((child, idx) => (
            <TreeNodeView key={idx} node={child} depth={depth + 1} activeNodeId={activeNodeId} searchQuery={searchQuery} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Visualizer() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [filename, setFilename] = useState('resume.pdf');
  const [jdTitle, setJdTitle] = useState('Job Description');
  const [viewMode, setViewMode] = useState('split'); // 'split', 'document', 'tree'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNodeId, setActiveNodeId] = useState(null);

  // Comparison States
  const [compareData, setCompareData] = useState(null);
  const [compareFilenames, setCompareFilenames] = useState([]);
  const [activeCandidateIdx, setActiveCandidateIdx] = useState(0);

  useEffect(() => {
    const rawCompare = localStorage.getItem('lastCompareResults');
    if (rawCompare) {
      const parsedCompare = JSON.parse(rawCompare);
      setCompareData(parsedCompare);
      setCompareFilenames(parsedCompare.filenames || ['Candidate A', 'Candidate B']);
      
      // Default to Candidate A initially
      setData(parsedCompare.results[0]);
      setFilename(parsedCompare.filenames[0]);
      const rawJd = parsedCompare.jd_text || 'Job Description';
      setJdTitle(rawJd.replace(/\s+/g, ' ').trim().substring(0, 30) + (rawJd.length > 30 ? '...' : ''));
      return;
    }

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
  }, [navigate]);

  if (!data) return null;

  const r = data.resume_json || {};

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
      {/* Sticky top-bar layout */}
      <div className="results-top-bar" id="top-bar">
        <div className="visualizer-page-container row space-between items-center py-4 h-16">
          <div className="row items-center gap-4">
            <Link to="/results" className="btn btn-ghost" style={{ padding: '8px 12px' }}>
              &larr; Back to Results
            </Link>
            <div style={{ height: '24px', width: '1px', background: 'var(--border)' }}></div>
            {compareData ? (
              <select 
                className="select" 
                value={activeCandidateIdx} 
                onChange={(e) => {
                  const idx = parseInt(e.target.value);
                  setActiveCandidateIdx(idx);
                  setData(compareData.results[idx]);
                  setFilename(compareData.filenames[idx]);
                }}
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  background: 'var(--elevated)', 
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--t1)',
                  cursor: 'pointer'
                }}
              >
                {compareFilenames.map((name, idx) => (
                  <option key={idx} value={idx}>
                    👤 {name} ({compareData.results[idx].overall_score}%)
                  </option>
                ))}
              </select>
            ) : (
              <span className="pill mono-text text-t2" style={{ background: 'var(--elevated)', border: 'none' }}>
                {filename}
              </span>
            )}
          </div>

          {/* View Modes Selector */}
          <div className="view-control-bar">
            <button 
              className={`view-control-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
            >
              📊 Split View
            </button>
            <button 
              className={`view-control-btn ${viewMode === 'document' ? 'active' : ''}`}
              onClick={() => setViewMode('document')}
            >
              📄 Document Only
            </button>
            <button 
              className={`view-control-btn ${viewMode === 'tree' ? 'active' : ''}`}
              onClick={() => setViewMode('tree')}
            >
              🌳 Career Tree Only
            </button>
          </div>

          <div className="row items-center gap-3">
            <button className="btn btn-primary" onClick={() => window.print()}>Print Layout</button>
          </div>
        </div>
      </div>

      <main className="visualizer-page-container">
        <div key={`${activeCandidateIdx}-${viewMode}`} className={`visualizer-workspace ${viewMode === 'split' ? 'split-view' : 'single-view'} animate-fade-in`}>
          
          {/* Document View Pane */}
          {(viewMode === 'split' || viewMode === 'document') && (
            <div className="visualizer-card-pane">
              <div className="pane-header">
                <h3 className="pane-title">📄 Document View</h3>
                <span className="text-xs text-t3">Click section headings to view tree node</span>
              </div>
              <div className="pane-content-scrollable">
                <div className="visualizer-cv-paper">
                  {/* CV Header */}
                  <p 
                    className="cv-name cursor-pointer hover-text-brand"
                    onClick={() => setActiveNodeId('root')}
                  >
                    {r.personal_info?.name || 'Candidate'}
                  </p>
                  {r.experience?.[0]?.title && <p className="cv-title">{r.experience[0].title}</p>}
                  
                  {([r.personal_info?.email, r.personal_info?.location, r.personal_info?.linkedin].filter(Boolean).length > 0) && (
                    <div className="cv-contact-row">
                      {[r.personal_info?.email, r.personal_info?.location, r.personal_info?.linkedin].filter(Boolean).map((c, i) => (
                        <span key={i}>{c}</span>
                      ))}
                    </div>
                  )}

                  <div className="cv-grid-columns" style={{ gridTemplateColumns: viewMode === 'document' ? '1.6fr 1fr' : '1fr' }}>
                    <div className="cv-left-col">
                      {r.experience?.length > 0 && (
                        <>
                          <div 
                            className="cv-sh cursor-pointer hover-text-brand"
                            onClick={() => setActiveNodeId('experience')}
                          >
                            Experience
                          </div>
                          {r.experience.map((exp, idx) => {
                            const dateRange = [exp.start_year, exp.end_year || 'Present'].filter(Boolean).join(' – ');
                            const bullets = [...(exp.responsibilities || []), ...(exp.outcomes || [])];
                            return (
                              <div 
                                key={idx} 
                                className="cv-block cursor-pointer hover-bg-elevated p-2 rounded"
                                onClick={() => setActiveNodeId(`exp_${idx}`)}
                              >
                                <p className="cv-block-role">{exp.title}</p>
                                <p className="cv-block-company">{exp.company}</p>
                                {dateRange && <p className="cv-block-date">{dateRange}</p>}
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
                          <div 
                            className="cv-sh cursor-pointer hover-text-brand"
                            onClick={() => setActiveNodeId('education')}
                          >
                            Education
                          </div>
                          {r.education.map((edu, idx) => {
                            const meta = [edu.year ? '📅 ' + edu.year : '', edu.cgpa ? 'CGPA: ' + edu.cgpa : ''].filter(Boolean).join('  ·  ');
                            return (
                              <div 
                                key={idx} 
                                className="cv-block cursor-pointer hover-bg-elevated p-2 rounded"
                                onClick={() => setActiveNodeId(`edu_${idx}`)}
                              >
                                <p className="cv-block-role" style={{ fontSize: '13px' }}>{edu.degree}</p>
                                <p className="cv-block-company" style={{ fontSize: '12px' }}>{edu.institution}</p>
                                {meta && <p className="cv-block-date">{meta}</p>}
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>

                    <div className="cv-right-col">
                      {r.skills?.length > 0 && (
                        <>
                          <div 
                            className="cv-sh cursor-pointer hover-text-brand"
                            onClick={() => setActiveNodeId('skills')}
                          >
                            Skills
                          </div>
                          <div className="cv-tags">
                            {r.skills.map((s, idx) => (
                              <span 
                                key={idx} 
                                className="cv-tag cursor-pointer hover-bg-brand-soft"
                                onClick={() => {
                                  setSearchQuery(s);
                                  setActiveNodeId('skills');
                                }}
                              >
                                {s}
                              </span>
                            ))}
                            {missingSkills.map((w, idx) => (
                              <span key={`missing-${idx}`} className="cv-tag missing">{w}</span>
                            ))}
                          </div>
                        </>
                      )}

                      {r.projects?.length > 0 && (
                        <>
                          <div 
                            className="cv-sh cursor-pointer hover-text-brand"
                            onClick={() => setActiveNodeId('projects')}
                          >
                            Projects
                          </div>
                          {r.projects.map((proj, idx) => (
                            <div 
                              key={idx} 
                              className="cv-block cursor-pointer hover-bg-elevated p-2 rounded"
                              onClick={() => setActiveNodeId(`proj_${idx}`)}
                            >
                              <p className="cv-block-role" style={{ fontSize: '13px' }}>{proj.title}</p>
                              {proj.description && <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0 0' }}>{proj.description}</p>}
                              {proj.outcome && <p style={{ fontSize: '11px', color: '#4F46E5', margin: '2px 0 0 0' }}>▸ {proj.outcome}</p>}
                              {proj.tech_stack?.length > 0 && (
                                <div className="cv-tags" style={{ marginTop: '4px' }}>
                                  {proj.tech_stack.map((t, tIdx) => (
                                    <span key={tIdx} className="cv-tag" style={{ fontSize: '10px' }}>{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </>
                      )}

                      {r.certifications?.length > 0 && (
                        <>
                          <div className="cv-sh">Certifications</div>
                          {r.certifications.map((c, idx) => (
                            <p key={idx} style={{ fontSize: '11px', margin: '3px 0', textAlign: 'left', color: '#334155' }}>• {c}</p>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Career Tree Pane */}
          {(viewMode === 'split' || viewMode === 'tree') && (
            <div className="visualizer-card-pane">
              <div className="pane-header">
                <h3 className="pane-title">🌳 Hierarchical Career Tree</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="🔍 Search tree..." 
                    className="input" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '4px 10px', fontSize: '12px', height: '28px', width: '160px', background: 'var(--elevated)', border: '1px solid var(--border)' }}
                  />
                  {searchQuery && (
                    <button 
                      className="btn btn-ghost" 
                      onClick={() => setSearchQuery('')}
                      style={{ padding: '0 4px', height: '28px', fontSize: '11px' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div className="pane-content-scrollable">
                <div className="flex-col gap-3">
                  <TreeNodeView node={data.resume_tree} depth={0} activeNodeId={activeNodeId} searchQuery={searchQuery} />
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
