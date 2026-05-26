import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import '../css/pages/results.css';

// Helper to check if a tree node has a descendant with a specific node_id
function hasDescendant(node, nodeId) {
  if (node.node_id === nodeId) return true;
  if (node.children) {
    return node.children.some(child => hasDescendant(child, nodeId));
  }
  return false;
}

// TreeNodeView recursive component for the career tree explorer
function TreeNodeView({ node, depth = 0, activeNodeId = null }) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isHighlighted = node.node_id === activeNodeId;
  const containsActive = activeNodeId && hasDescendant(node, activeNodeId);

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
            <TreeNodeView key={idx} node={child} depth={depth + 1} activeNodeId={activeNodeId} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── AI Optimizer Tab (needs its own hooks so must be a real component) ──
function OptimizerTab({ data, setData, compareData, activeCandidateIdx }) {
  const tips     = data.feedback?.improvement_tips || [];
  const rewrites = data.feedback?.resume_rewrites  || [];
  const advice   = data.feedback?.overall_advice   || '';
  const hasFeedback = tips.length > 0 || rewrites.length > 0 || !!advice;

  const user = localStorage.getItem('auth_user') ? JSON.parse(localStorage.getItem('auth_user')) : null;
  const isLoggedIn = user !== null;

  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError]         = useState(null);
  const [editingRewrite, setEditingRewrite] = useState(null);
  const [editedText, setEditedText] = useState('');

  const retryFeedback = async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await fetch('http://localhost:8000/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const fb = await res.json();
      const updated = { ...data, feedback: fb };
      setData(updated);
      if (compareData) {
        const cp = { ...compareData };
        cp.results[activeCandidateIdx] = updated;
        localStorage.setItem('lastCompareResults', JSON.stringify(cp));
      } else {
        localStorage.setItem('lastResult', JSON.stringify(updated));
      }
    } catch (err) {
      setGenError(err.message || 'Failed to generate feedback. Make sure the backend is running.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="text-left mb-4">
        <h2 className="display-title-normal mb-1" style={{ fontSize: '22px' }}>AI Resume Optimizer</h2>
        <p className="text-t3 text-sm">Personalised tips and bullet rewrites generated by AI to boost your match score.</p>
      </div>

      {/* Loading skeletons */}
      {isGenerating && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {[1,2,3].map(i => (
            <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '12px', animationDelay: `${i * 120}ms` }} />
          ))}
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--t3)', marginTop: '8px' }}>
            ✨ Generating improvement suggestions…
          </p>
        </div>
      )}

      {/* Error banner */}
      {genError && !isGenerating && (
        <div style={{ padding: '16px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--poor)', margin: '0 0 4px 0' }}>Feedback generation failed</p>
            <p style={{ fontSize: '12px', color: 'var(--t2)', margin: 0 }}>{genError}</p>
          </div>
        </div>
      )}

      {/* Empty state with retry */}
      {!hasFeedback && !isGenerating && (
        <div style={{ textAlign: 'center', padding: '48px 32px', background: 'var(--surface)', border: '1.5px dashed var(--border-hi)', borderRadius: '16px', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🤖</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--t1)', margin: '0 0 8px 0' }}>No suggestions yet</h3>
          <p style={{ fontSize: '13px', color: 'var(--t2)', maxWidth: '320px', margin: '0 auto 24px auto' }}>
            The AI couldn't generate feedback during evaluation. Click below to generate it now — takes ~20 seconds.
          </p>
          <button className="btn btn-primary" onClick={retryFeedback} style={{ fontSize: '14px', padding: '10px 28px' }}>
            ✨ Generate Improvement Suggestions
          </button>
        </div>
      )}

      {/* Retry button even when feedback exists */}
      {hasFeedback && !isGenerating && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button className="btn btn-ghost" onClick={retryFeedback} style={{ fontSize: '12px', padding: '6px 14px' }}>
            🔄 Regenerate
          </button>
        </div>
      )}

      {/* Overall advice */}
      {advice && !isGenerating && (
        <div style={{ background: 'var(--brand-soft)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>💡</span>
          <div className="text-left">
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px 0' }}>Overall Strategy</p>
            <p style={{ fontSize: '13.5px', color: 'var(--t1)', lineHeight: 1.6, margin: 0 }}>{advice}</p>
          </div>
        </div>
      )}

      {/* Improvement tips */}
      {tips.length > 0 && !isGenerating && (
        <div className="mb-6 text-left">
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--t1)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
            🎯 Improvement Tips ({tips.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tips.map((tip, idx) => {
              const c  = tip.impact === 'high' ? 'var(--poor)' : tip.impact === 'medium' ? 'var(--average)' : 'var(--brand)';
              const bg = tip.impact === 'high' ? 'rgba(220,38,38,0.07)' : tip.impact === 'medium' ? 'rgba(217,119,6,0.07)' : 'rgba(99,102,241,0.07)';
              return (
                <div key={idx} style={{ background: 'var(--surface)', border: `1.5px solid ${c}33`, borderLeft: `4px solid ${c}`, borderRadius: '12px', padding: '16px 18px', animation: `fadeUp 0.35s ${idx * 60}ms var(--out) both` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '999px', background: bg, color: c, letterSpacing: '0.05em' }}>
                      {(tip.impact || 'medium').toUpperCase()} IMPACT
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>{tip.node_id}</span>
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)', margin: '0 0 6px 0' }}>
                    Gap: <span style={{ fontWeight: 400, color: 'var(--t2)' }}>{tip.gap}</span>
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--t2)', margin: 0, lineHeight: 1.6 }}>
                    <span style={{ fontWeight: 600, color: 'var(--t1)' }}>Fix: </span>{tip.tip}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bullet rewrites */}
      {rewrites.length > 0 && !isGenerating && (
        <div className="text-left">
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--t1)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
            ✍️ Suggested Bullet Rewrites ({rewrites.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {rewrites.map((rw, idx) => (
              <div key={idx} style={{ background: 'var(--surface)', border: '1px solid var(--border-hi)', borderRadius: '14px', padding: '18px 20px', animation: `fadeUp 0.35s ${idx * 80}ms var(--out) both` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--brand)', background: 'var(--brand-soft)', padding: '3px 9px', borderRadius: '6px' }}>{rw.node_id}</span>
                  <span style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 500 }}>Bullet Transformation</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Before</p>
                    <div style={{ padding: '10px 12px', background: 'var(--elevated)', border: '1px solid var(--border-hi)', borderRadius: '8px', fontSize: '12px', color: 'var(--t3)', textDecoration: 'line-through', lineHeight: 1.5 }}>
                      {rw.original_summary}
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--excellent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>After ✓</p>
                    <div style={{ padding: '10px 12px', background: 'rgba(5,150,105,0.06)', border: '1.5px solid rgba(5,150,105,0.25)', borderRadius: '8px', fontSize: '12px', color: 'var(--excellent)', lineHeight: 1.5 }}>
                      {rw.improved_summary}
                    </div>
                  </div>
                </div>
                <div style={{ padding: '10px 14px', background: 'var(--brand-soft)', borderRadius: '8px', fontSize: '12px', color: 'var(--t2)', lineHeight: 1.55, marginBottom: '12px' }}>
                  <strong style={{ color: 'var(--brand)' }}>Why it works: </strong>{rw.reason}
                </div>
                
                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                  <button 
                    className="btn btn-ghost" 
                    style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 600 }}
                    onClick={() => {
                      navigator.clipboard.writeText(rw.improved_summary);
                      alert("Suggested rewrite copied to clipboard!");
                    }}
                  >
                    📋 Copy Suggestion
                  </button>
                  {isLoggedIn ? (
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 600 }}
                      onClick={() => {
                        setEditingRewrite(rw);
                        setEditedText(rw.improved_summary);
                      }}
                    >
                      ✍️ Edit & Apply
                    </button>
                  ) : (
                    <button 
                      className="btn btn-ghost" 
                      style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11.5px', color: 'var(--t3)', border: '1px solid var(--border-hi)', cursor: 'not-allowed' }}
                      onClick={() => alert("Log in to edit and apply suggestions directly!")}
                    >
                      🔒 Edit & Apply
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Bullet Editor Modal */}
      {editingRewrite && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(3, 4, 8, 0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200
        }}>
          <div className="card flex-col p-6 w-full max-w-lg shadow-2xl relative overflow-hidden bg-surface border border-border"
            style={{ borderRadius: '20px', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Interactive Bullet Editor</h3>
            <p style={{ fontSize: '12px', color: 'var(--t3)', margin: 0 }}>Fine-tune the AI suggestion before adding it to your resume.</p>
            
            <div style={{ textAlign: 'left', width: '100%' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase' }}>Original Bullet</span>
              <div style={{ padding: '10px', background: 'var(--elevated)', border: '1px solid var(--border-hi)', borderRadius: '8px', fontSize: '12px', color: 'var(--t3)', marginTop: '4px', textDecoration: 'line-through' }}>
                {editingRewrite.original_summary}
              </div>
            </div>

            <div style={{ textAlign: 'left', width: '100%' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--excellent)', textTransform: 'uppercase' }}>Optimized Bullet</span>
              <textarea 
                className="w-full textarea font-mono text-xs"
                rows="4"
                style={{ marginTop: '4px', padding: '10px', borderRadius: '8px', fontSize: '12px', color: 'var(--t1)', width: '100%' }}
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', width: '100%' }}>
              <button 
                className="btn btn-ghost" 
                style={{ padding: '8px 16px', borderRadius: '8px' }}
                onClick={() => setEditingRewrite(null)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ padding: '8px 16px', borderRadius: '8px' }}
                onClick={() => {
                  navigator.clipboard.writeText(editedText);
                  alert("Copied customized bullet to clipboard!");
                  setEditingRewrite(null);
                }}
              >
                📋 Copy & Apply
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function Results() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [filename, setFilename] = useState('resume.pdf');
  const [jdTitle, setJdTitle] = useState('Job Description');
  const [activeSection, setActiveSection] = useState('overall');
  
  const user = localStorage.getItem('auth_user') ? JSON.parse(localStorage.getItem('auth_user')) : null;
  const isLoggedIn = user !== null;
  const [showPdfPaywall, setShowPdfPaywall] = useState(false);
  const [expandedReqs, setExpandedReqs] = useState({});
  const [visualizerTab, setVisualizerTab] = useState('resume');
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(true);
  
  // Comparison States
  const [compareData, setCompareData] = useState(null);
  const [compareFilenames, setCompareFilenames] = useState([]);
  const [activeCandidateIdx, setActiveCandidateIdx] = useState(0);
  const [hoveredCol, setHoveredCol] = useState(null);
  const [focusedCol, setFocusedCol] = useState(null);

  useEffect(() => {
    const rawCompare = localStorage.getItem('lastCompareResults');
    if (rawCompare) {
      const parsedCompare = JSON.parse(rawCompare);
      setCompareData(parsedCompare);
      setCompareFilenames(parsedCompare.filenames || ['Candidate A', 'Candidate B']);
      setActiveSection('compare'); // Show comparison default

      // Default the active detailed view details to Candidate A
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

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const dims = data.dimension_scores || {};
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
        <div className="results-layout-container row space-between items-center py-4 h-16">
          <div className="row items-center gap-4">
            <Link to="/" className="btn btn-ghost" style={{ padding: '8px 12px' }}>
              &larr; Back
            </Link>
            <div style={{ height: '24px', width: '1px', background: 'var(--border)' }}></div>
            <span className="pill mono-text text-t2" style={{ background: 'var(--elevated)', border: 'none' }}>
              {filename}
            </span>
            <span className="text-t3">&rarr;</span>
            <span className="pill mono-text" style={{ color: 'var(--brand)', background: 'var(--brand-soft)', border: 'none' }}>
              {jdTitle}
            </span>
          </div>
          <div className="row items-center gap-3">
            <button 
              className="btn btn-ghost" 
              style={{
                background: isVisualizerOpen ? 'var(--brand-soft)' : 'var(--surface)',
                color: isVisualizerOpen ? 'var(--brand)' : 'var(--t2)',
                borderColor: isVisualizerOpen ? 'var(--brand)' : 'var(--border)',
                fontWeight: '600',
                padding: '8px 16px'
              }}
              onClick={() => setIsVisualizerOpen(!isVisualizerOpen)}
            >
              {isVisualizerOpen ? '👁 Hide Resume' : '👁 Show Resume'}
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/upload')}>Scan Again</button>
            <button 
              className="btn btn-primary shadow-glow" 
              onClick={() => {
                if (isLoggedIn) {
                  window.print();
                } else {
                  setShowPdfPaywall(true);
                }
              }}
            >
              {isLoggedIn ? "Download Report" : "Download Report 🔒"}
            </button>
          </div>
        </div>
      </div>

      <main className="results-layout-container mb-32">
        <div className={`dashboard-grid ${isVisualizerOpen ? '' : 'collapsed-visualizer'}`}>
          
          {/* 1. Left Sidebar panel */}
          <aside className="sidebar-panel">
            <nav className="sidebar-nav">
              {compareData && (
                <button className={`sidebar-nav-link ${activeSection === 'compare' ? 'active' : ''}`} onClick={() => setActiveSection('compare')}>
                  <div className="flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg> 
                    Compare Candidates
                  </div>
                  <span className="sidebar-badge badge-blue">VS</span>
                </button>
              )}

              <button className={`sidebar-nav-link ${activeSection === 'overall' ? 'active' : ''}`} onClick={() => setActiveSection('overall')}>
                <div className="flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg> 
                  Overall Score
                </div>
                <span id="nav-score-badge" className={`sidebar-badge ${colorClass}`}>{score}</span>
              </button>
              
              <button className={`sidebar-nav-link ${activeSection === 'jdcompat' ? 'active' : ''}`} onClick={() => setActiveSection('jdcompat')}>
                <div className="flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg> 
                  Requirements
                </div>
                <span id="nav-match-badge" className="sidebar-badge badge-amber">
                  {data.matched_requirements?.length || 0}/{totalReqs}
                </span>
              </button>
              
              <button className={`sidebar-nav-link ${activeSection === 'suggestions' ? 'active' : ''}`} onClick={() => setActiveSection('suggestions')}>
                <div className="flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                  </svg> 
                  Gaps & Strengths
                </div>
                <span id="nav-gap-badge" className="sidebar-badge badge-red">{gapsCount}</span>
              </button>
              
              <button className={`sidebar-nav-link ${activeSection === 'optimizer' ? 'active' : ''}`} onClick={() => setActiveSection('optimizer')}>
                <div className="flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg> 
                  AI Optimizer
                </div>
                <span id="nav-optimize-badge" className="sidebar-badge badge-green" style={{ background: 'var(--excellent-soft)', color: 'var(--excellent)' }}>AI</span>
              </button>
            </nav>

            {compareData && (
              <div className="p-3 rounded bg-elevated border border-border text-left mt-2 mb-2">
                <p className="text-t3 mb-2" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Active Detailed View</p>
                <div className="flex-col gap-1.5" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {compareFilenames.map((name, idx) => (
                    <button
                      key={idx}
                      className={`btn ${activeCandidateIdx === idx ? 'btn-primary' : 'btn-ghost'} w-full text-left justify-start px-3 py-2 text-xs`}
                      onClick={() => {
                        setActiveCandidateIdx(idx);
                        setData(compareData.results[idx]);
                        setFilename(compareData.filenames[idx]);
                      }}
                      style={{ 
                        fontWeight: 600, 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        display: 'block' 
                      }}
                    >
                      👤 {name} ({compareData.results[idx].overall_score}%)
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="p-4 rounded bg-surface border border-border text-left">
              <p className="text-t3" style={{ fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Matched against</p>
              <p className="font-600 text-sm mb-4 text-t1">{jdTitle}</p>
              <Link to="/upload" className="text-brand text-sm hover-underline font-500">Change JD &rarr;</Link>
            </div>
          </aside>

          {/* 2. Center Main Panel */}
          <div className="main-content-panel">

            {/* Tab 0: Comparison Dashboard */}
            {activeSection === 'compare' && compareData && (() => {
              const sorted = [...compareData.results]
                .map((r, i) => ({ ...r, _origIdx: i, _name: compareFilenames[i] }))
                .sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0));
              const maxScore = sorted[0]?.overall_score || 1;
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div className="animate-fade-in">
                  <div className="text-left mb-6">
                    <h2 className="display-title-normal mb-1" style={{ fontSize: '22px' }}>Candidate Comparison</h2>
                    <p className="text-t3 text-sm">AI-ranked leaderboard · {compareData.results.length} candidates screened against "{jdTitle}"</p>
                  </div>

                  {/* ── Leaderboard ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                    {sorted.map((res, rank) => {
                      const score    = res.overall_score || 0;
                      const isTop    = rank === 0;
                      const barPct   = (score / maxScore) * 100;
                      const color    = score >= 80 ? 'var(--excellent)' : score >= 60 ? 'var(--brand)' : score >= 40 ? 'var(--average)' : 'var(--poor)';
                      const origIdx  = res._origIdx;
                      return (
                        <div
                          key={origIdx}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '16px',
                            padding: '16px 20px',
                            background: isTop ? 'var(--brand-soft)' : 'var(--surface)',
                            border: `1.5px solid ${isTop ? 'var(--brand)' : 'var(--border-hi)'}`,
                            borderRadius: '14px',
                            animation: `fadeUp 0.4s ${rank * 80}ms var(--out) both`,
                            cursor: 'pointer',
                            transition: 'box-shadow 0.2s, transform 0.18s',
                          }}
                          onClick={() => {
                            setActiveCandidateIdx(origIdx);
                            setData(compareData.results[origIdx]);
                            setFilename(compareFilenames[origIdx]);
                            setActiveSection('overall');
                          }}
                          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
                        >
                          {/* Rank medal */}
                          <span style={{ fontSize: '26px', flexShrink: 0 }}>{medals[rank] || `#${rank + 1}`}</span>

                          {/* Name + bar */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {res._name}
                              </span>
                              <span style={{ fontWeight: 800, fontSize: '16px', color, flexShrink: 0, marginLeft: '12px' }}>{score}%</span>
                            </div>
                            <div style={{ height: '6px', background: 'var(--border-hi)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', width: `${barPct}%`,
                                background: `linear-gradient(90deg, ${color}, ${color}bb)`,
                                borderRadius: '3px',
                                transition: 'width 1s cubic-bezier(0.25,1,0.5,1)',
                                boxShadow: `0 0 8px ${color}55`
                              }} />
                            </div>
                            <div style={{ marginTop: '5px', fontSize: '11.5px', color: 'var(--t3)' }}>
                              {res.matched_requirements?.length || 0} reqs matched ·{' '}
                              {(res.strengths || []).slice(0, 2).join(' · ')}
                            </div>
                          </div>

                          {/* CTA */}
                          <span style={{ fontSize: '12px', color: 'var(--brand)', fontWeight: 600, flexShrink: 0 }}>View →</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Fit Comparison Matrix ── */}
                  <div className="card p-6 text-left border border-border animate-fade-up" style={{ overflowX: 'auto', position: 'relative', animationDelay: '200ms' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <h3 className="font-600 text-base text-t1" style={{ margin: 0 }}>Fit Comparison Matrix</h3>
                        <p className="text-t3 text-xs" style={{ margin: '4px 0 0 0' }}>Click a candidate column header to lock focus, or hover to compare values side-by-side.</p>
                      </div>
                      {focusedCol !== null && (
                        <button className="btn btn-ghost" onClick={() => setFocusedCol(null)} style={{ fontSize: '11px', padding: '4px 10px' }}>
                          Clear Locked Column
                        </button>
                      )}
                    </div>
                    
                    <table className="compare-table" style={{ width: '100%', minWidth: `${200 + compareData.results.length * 170}px`, borderCollapse: 'separate', borderSpacing: '0' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '180px', padding: '12px 16px', background: 'var(--elevated)', borderBottom: '1.5px solid var(--border)', textAlign: 'left' }}>Dimension</th>
                          {compareFilenames.map((name, idx) => {
                            const isFocused = focusedCol === idx;
                            const isHovered = hoveredCol === idx;
                            return (
                              <th 
                                key={idx} 
                                onClick={() => setFocusedCol(focusedCol === idx ? null : idx)}
                                onMouseEnter={() => setHoveredCol(idx)}
                                onMouseLeave={() => setHoveredCol(null)}
                                style={{ 
                                  minWidth: '160px', 
                                  padding: '14px 16px',
                                  background: isFocused ? 'var(--brand-soft)' : isHovered ? 'var(--elevated-hi)' : 'var(--elevated)',
                                  color: isFocused ? 'var(--brand)' : 'var(--t1)',
                                  borderBottom: isFocused ? '2px solid var(--brand)' : '1.5px solid var(--border)',
                                  transition: 'all 0.22s ease',
                                  cursor: 'pointer',
                                  position: 'relative',
                                  textAlign: 'left'
                                }}
                              >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: isFocused ? 'var(--brand)' : 'var(--t3)' }}>
                                    {medals[sorted.findIndex(s => s._origIdx === idx)] || `#${idx + 1}`} Candidate
                                  </span>
                                  <span style={{ fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '140px' }}>
                                    {name}
                                  </span>
                                  {isFocused && (
                                    <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '8px', background: 'var(--brand)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, letterSpacing: '0.04em' }}>
                                      LOCKED
                                    </span>
                                  )}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ transition: 'background-color 0.2s' }}>
                          <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>Match Score</td>
                          {compareData.results.map((res, idx) => {
                            const s = res.overall_score || 0;
                            const c = s >= 80 ? 'var(--excellent)' : s >= 60 ? 'var(--brand)' : s >= 40 ? 'var(--average)' : 'var(--poor)';
                            const isFocused = focusedCol === idx;
                            return (
                              <td 
                                key={idx}
                                onMouseEnter={() => setHoveredCol(idx)}
                                onMouseLeave={() => setHoveredCol(null)}
                                onClick={() => setFocusedCol(focusedCol === idx ? null : idx)}
                                style={{ 
                                  padding: '14px 16px',
                                  borderBottom: isFocused ? '1.5px solid var(--brand)' : '1px solid var(--border)',
                                  fontWeight: 800, 
                                  color: c, 
                                  fontSize: '15px',
                                  background: isFocused ? 'rgba(99,102,241,0.06)' : hoveredCol === idx ? 'rgba(99,102,241,0.02)' : 'transparent',
                                  transition: 'all 0.22s ease',
                                  cursor: 'pointer'
                                }}
                              >
                                {s}%
                              </td>
                            );
                          })}
                        </tr>
                        {['skill_match','experience_quality','career_progression','context_fit'].map(dim => (
                          <tr key={dim}>
                            <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>
                              {dim.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </td>
                            {compareData.results.map((res, idx) => {
                              const s = res.dimension_scores?.[dim] || 0;
                              const isFocused = focusedCol === idx;
                              return (
                                <td 
                                  key={idx}
                                  onMouseEnter={() => setHoveredCol(idx)}
                                  onMouseLeave={() => setHoveredCol(null)}
                                  onClick={() => setFocusedCol(focusedCol === idx ? null : idx)}
                                  style={{ 
                                    padding: '14px 16px',
                                    borderBottom: isFocused ? '1.5px solid var(--brand)' : '1px solid var(--border)',
                                    background: isFocused ? 'rgba(99,102,241,0.06)' : hoveredCol === idx ? 'rgba(99,102,241,0.02)' : 'transparent',
                                    transition: 'all 0.22s ease',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ flex: 1, height: '5px', background: 'var(--border-hi)', borderRadius: '3px', overflow: 'hidden' }}>
                                      <div className="bar-grow" style={{ width: `${s}%`, height: '100%', background: 'var(--brand)', borderRadius: '3px' }} />
                                    </div>
                                    <span style={{ fontSize: '11px', color: 'var(--t2)', fontWeight: 600, width: '28px', textAlign: 'right' }}>{s}%</span>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        <tr>
                          <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>Key Strengths</td>
                          {compareData.results.map((res, idx) => {
                            const isFocused = focusedCol === idx;
                            return (
                              <td 
                                key={idx} 
                                onMouseEnter={() => setHoveredCol(idx)}
                                onMouseLeave={() => setHoveredCol(null)}
                                onClick={() => setFocusedCol(focusedCol === idx ? null : idx)}
                                style={{ 
                                  verticalAlign: 'top',
                                  padding: '14px 16px',
                                  borderBottom: isFocused ? '1.5px solid var(--brand)' : '1px solid var(--border)',
                                  background: isFocused ? 'rgba(99,102,241,0.06)' : hoveredCol === idx ? 'rgba(99,102,241,0.02)' : 'transparent',
                                  transition: 'all 0.22s ease',
                                  cursor: 'pointer'
                                }}
                              >
                                <ul style={{ margin: 0, paddingLeft: '14px', textAlign: 'left' }}>
                                  {(res.strengths || []).slice(0, 3).map((s, i) => (
                                    <li key={i} className="text-xs text-t2 mb-1.5" style={{ listStyleType: 'disc', lineHeight: 1.4 }}>{s}</li>
                                  ))}
                                </ul>
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>Key Gaps</td>
                          {compareData.results.map((res, idx) => {
                            const isFocused = focusedCol === idx;
                            return (
                              <td 
                                key={idx} 
                                onMouseEnter={() => setHoveredCol(idx)}
                                onMouseLeave={() => setHoveredCol(null)}
                                onClick={() => setFocusedCol(focusedCol === idx ? null : idx)}
                                style={{ 
                                  verticalAlign: 'top',
                                  padding: '14px 16px',
                                  borderBottom: isFocused ? '1.5px solid var(--brand)' : '1px solid var(--border)',
                                  background: isFocused ? 'rgba(99,102,241,0.06)' : hoveredCol === idx ? 'rgba(99,102,241,0.02)' : 'transparent',
                                  transition: 'all 0.22s ease',
                                  cursor: 'pointer'
                                }}
                              >
                                {(res.gaps || []).length === 0
                                  ? <span className="text-xs font-600" style={{ color: 'var(--excellent)' }}>✓ No gaps</span>
                                  : <ul style={{ margin: 0, paddingLeft: '14px', textAlign: 'left' }}>
                                      {(res.gaps || []).slice(0, 3).map((g, i) => (
                                        <li key={i} className="text-xs text-t2 mb-1.5" style={{ listStyleType: 'disc', color: 'var(--t2)', lineHeight: 1.4 }}>{g}</li>
                                      ))}
                                    </ul>
                                }
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td style={{ padding: '14px 16px', borderBottom: 'none', fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>Fit Reasoning</td>
                          {compareData.results.map((res, idx) => {
                            const isFocused = focusedCol === idx;
                            return (
                              <td 
                                key={idx} 
                                onMouseEnter={() => setHoveredCol(idx)}
                                onMouseLeave={() => setHoveredCol(null)}
                                onClick={() => setFocusedCol(focusedCol === idx ? null : idx)}
                                className="text-xs text-t2 leading-relaxed" 
                                style={{ 
                                  verticalAlign: 'top',
                                  padding: '14px 16px',
                                  background: isFocused ? 'rgba(99,102,241,0.06)' : hoveredCol === idx ? 'rgba(99,102,241,0.02)' : 'transparent',
                                  transition: 'all 0.22s ease',
                                  cursor: 'pointer',
                                  textAlign: 'left'
                                }}
                              >
                                {res.overall_reasoning}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}


            {/* Tab 1: Overall Score Gauge */}
            {activeSection === 'overall' && (
              <div key={`${activeCandidateIdx}-overall`} className="animate-fade-in">
                <div className="text-left mb-2">
                  <h2 className="display-title-normal mb-1" style={{ fontSize: '22px' }}>Match Score</h2>
                  <p className="text-t3 text-sm">Overall candidate matching analytics and score breakdowns.</p>
                </div>
                <div className="row flex-wrap gap-8 items-stretch">
                  <div className="gauge-card flex-1" style={{ minWidth: '260px' }}>
                    <div className="relative" style={{ width: '240px', height: '240px' }}>
                      <svg viewBox="0 0 260 260" className="w-full h-full transform -rotate-90">
                        <circle cx="130" cy="130" r="120" fill="none" stroke="var(--border)" strokeWidth="12" />
                        <circle 
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
                        <span className="display-title font-700" style={{ fontSize: '56px', lineHeight: '1', color: hexColor }}>
                          {score}
                        </span>
                        <span className="text-xs font-600 tracking-wider uppercase mt-2 text-secondary">
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="dimension-card flex-1" style={{ minWidth: '320px' }}>
                    <h3 className="display-title-normal text-left mb-0" style={{ fontSize: '18px' }}>Dimension Analysis</h3>
                    
                    <div className="dimension-list">
                      <div className="dimension-item">
                        <div className="dimension-header">
                          <span className="dimension-title">Keyword Alignment</span> 
                          <span className="dimension-score">{dims.skill_match || 0}%</span>
                        </div>
                        <div className="dimension-track">
                          <div className="dimension-fill" style={{ width: `${dims.skill_match || 0}%`, background: 'var(--brand)' }}></div>
                        </div>
                      </div>

                      <div className="dimension-item">
                        <div className="dimension-header">
                          <span className="dimension-title">Experience Quality</span> 
                          <span className="dimension-score">{dims.experience_quality || 0}%</span>
                        </div>
                        <div className="dimension-track">
                          <div className="dimension-fill" style={{ width: `${dims.experience_quality || 0}%`, background: 'var(--brand)' }}></div>
                        </div>
                      </div>

                      <div className="dimension-item">
                        <div className="dimension-header">
                          <span className="dimension-title">Career Progression</span> 
                          <span className="dimension-score">{dims.career_progression || 0}%</span>
                        </div>
                        <div className="dimension-track">
                          <div className="dimension-fill" style={{ width: `${dims.career_progression || 0}%`, background: 'var(--brand)' }}></div>
                        </div>
                      </div>

                      <div className="dimension-item">
                        <div className="dimension-header">
                          <span className="dimension-title">Context Fit</span> 
                          <span className="dimension-score">{dims.context_fit || 0}%</span>
                        </div>
                        <div className="dimension-track">
                          <div className="dimension-fill" style={{ width: `${dims.context_fit || 0}%`, background: 'var(--brand)' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {data.overall_reasoning && (
                  <div className="dashboard-card text-left mb-4" style={{ background: 'var(--surface)', borderLeft: '4px solid var(--brand)' }}>
                    <h3 className="font-600 text-brand mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      Reasoning about Fit
                    </h3>
                    <p className="text-t1 text-sm leading-relaxed font-500">{data.overall_reasoning}</p>
                  </div>
                )}

                {data.feedback?.overall_advice && (
                  <div className="dashboard-card text-left" style={{ background: 'var(--surface)' }}>
                    <h3 className="font-600 text-brand mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                      Overall Strategy
                    </h3>
                    <p className="text-t2 text-sm leading-relaxed">{data.feedback.overall_advice}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Detailed Requirement Match */}
            {activeSection === 'jdcompat' && (
              <div key={`${activeCandidateIdx}-jdcompat`} className="animate-fade-in">
                <div className="text-left mb-2">
                  <h2 className="display-title-normal mb-1" style={{ fontSize: '22px' }}>Detailed Requirement Match</h2>
                  <p className="text-t3 text-sm">Detailed breakdown of how the candidate matches the specific job description requirements.</p>
                </div>
                <div className="match-accordion-container">
                  {(data.matched_requirements || []).map((m, idx) => {
                    const isFull = m.match_type === 'full';
                    const reqId = m.req_id || `REQ_${idx}`;
                    const isOpen = !!expandedReqs[reqId];
                    return (
                      <div key={reqId} className={`match-card ${isOpen ? 'expanded' : ''}`}>
                        <div className="match-header" onClick={() => toggleReq(reqId)}>
                          <div className="row items-center gap-3">
                            <span className="pill mono-text" style={{ fontSize: '10px', background: 'var(--surface)', border: '1px solid var(--border)' }}>REQ</span>
                            <span className="font-600 text-t1">{reqId}</span>
                          </div>
                          <div className="row items-center gap-3">
                            <span className={`pill ${isFull ? 'badge-green' : 'badge-amber'} border-none`} style={{ fontSize: '10px' }}>
                              {isFull ? '✓ Found' : '◐ Partial'}
                            </span>
                            <svg className="match-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </div>
                        </div>
                        {isOpen && (
                          <div className="match-content">
                            <p>{m.reasoning}</p>
                            {m.resume_node_id && (
                              <button 
                                className="btn btn-ghost mt-3" 
                                style={{ padding: '4px 10px', fontSize: '11px', alignSelf: 'flex-start', background: 'var(--brand-soft)', color: 'var(--brand)', borderColor: 'rgba(99,102,241,0.2)' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveNodeId(m.resume_node_id);
                                  setVisualizerTab('tree');
                                  const visualizerEl = document.querySelector('.visualizer-panel');
                                  if (visualizerEl) {
                                    visualizerEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                  }
                                }}
                              >
                                🔍 Highlight Node "{m.resume_node_id}" in Career Tree
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {(data.unmatched_requirements || []).map((u, idx) => {
                    const reqId = typeof u === 'string' ? u : `UNREQ_${idx}`;
                    const isOpen = !!expandedReqs[reqId];
                    return (
                      <div key={reqId} className={`match-card ${isOpen ? 'expanded' : ''}`}>
                        <div className="match-header" onClick={() => toggleReq(reqId)}>
                          <div className="row items-center gap-3">
                            <span className="pill mono-text" style={{ fontSize: '10px', background: 'var(--surface)', border: '1px solid var(--border)' }}>REQ</span>
                            <span className="font-600 text-t1">{reqId}</span>
                          </div>
                          <div className="row items-center gap-3">
                            <span className="pill badge-red border-none" style={{ fontSize: '10px' }}>✗ Missing</span>
                            <svg className="match-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </div>
                        </div>
                        {isOpen && (
                          <div className="match-content">
                            This job requirement was not detected anywhere in your resume structure.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Actionable Insights */}
            {activeSection === 'suggestions' && (
              <div key={`${activeCandidateIdx}-suggestions`} className="animate-fade-in">
                <div className="text-left mb-2">
                  <h2 className="display-title-normal mb-1" style={{ fontSize: '22px' }}>Actionable Insights</h2>
                  <p className="text-t3 text-sm">Critical gaps and strengths identified in your profile.</p>
                </div>
                <div className="insights-grid">
                  <div className="flex-col text-left">
                    <h3 className="text-poor font-600 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--poor)' }}></span>
                      Critical Gaps
                    </h3>
                    <div className="insight-list">
                      {(data.gaps || []).map((gap, i) => (
                        <div key={i} className="insight-item gap">
                          {gap}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex-col text-left">
                    <h3 className="text-excellent font-600 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--excellent)' }}></span>
                      Your Strengths
                    </h3>
                    <div className="insight-list">
                      {(data.strengths || []).map((s, i) => (
                        <div key={i} className="insight-item strength">
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: AI Optimizer */}
            {activeSection === 'optimizer' && (
              <OptimizerTab
                key={`${activeCandidateIdx}-optimizer`}
                data={data}
                setData={setData}
                compareData={compareData}
                activeCandidateIdx={activeCandidateIdx}
              />
            )}



          </div>

          {/* 3. Right Sidebar panel: Resume Visualizer */}
          <aside className={`visualizer-panel ${isVisualizerOpen ? '' : 'collapsed'}`}>
            <div className="tab-switcher">
              <button 
                className={`tab-btn ${visualizerTab === 'resume' ? 'active' : ''}`}
                onClick={() => setVisualizerTab('resume')}
              >
                📄 Document View
              </button>
              <button 
                className={`tab-btn ${visualizerTab === 'tree' ? 'active' : ''}`}
                onClick={() => setVisualizerTab('tree')}
              >
                🌳 Career Tree
              </button>
            </div>

            <div className="row space-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-xs text-t3 font-500">Workspace Mode</span>
              <Link to="/visualizer" className="text-brand text-xs hover-underline font-600 flex items-center gap-1">
                ↗ Open Full Screen
              </Link>
            </div>

            {visualizerTab === 'resume' ? (
              <div key={`${activeCandidateIdx}-resume-paper`} className="cv-paper animate-fade-in">
                <p className="cv-name">{r.personal_info?.name || 'Candidate'}</p>
                {r.experience?.[0]?.title && <p className="cv-title">{r.experience[0].title}</p>}
                
                {([r.personal_info?.email, r.personal_info?.location, r.personal_info?.linkedin].filter(Boolean).length > 0) && (
                  <div className="cv-contact-row">
                    {[r.personal_info?.email, r.personal_info?.location, r.personal_info?.linkedin].filter(Boolean).map((c, i) => (
                      <span key={i}>{c}</span>
                    ))}
                  </div>
                )}

                <div className="cv-grid-columns">
                  <div className="cv-left-col">
                    {r.experience?.length > 0 && (
                      <>
                        <div className="cv-sh">Experience</div>
                        {r.experience.map((exp, idx) => {
                          const dateRange = [exp.start_year, exp.end_year || 'Present'].filter(Boolean).join(' – ');
                          const bullets = [...(exp.responsibilities || []), ...(exp.outcomes || [])];
                          return (
                            <div key={idx} className="cv-block">
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
                        <div className="cv-sh">Education</div>
                        {r.education.map((edu, idx) => {
                          const meta = [edu.year ? '📅 ' + edu.year : '', edu.cgpa ? 'CGPA: ' + edu.cgpa : ''].filter(Boolean).join('  ·  ');
                          return (
                            <div key={idx} className="cv-block">
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
                        <div className="cv-sh">Skills</div>
                        <div className="cv-tags">
                          {r.skills.map((s, idx) => (
                            <span key={idx} className="cv-tag">{s}</span>
                          ))}
                          {missingSkills.map((w, idx) => (
                            <span key={`missing-${idx}`} className="cv-tag missing">{w}</span>
                          ))}
                        </div>
                      </>
                    )}

                    {r.projects?.length > 0 && (
                      <>
                        <div className="cv-sh">Projects</div>
                        {r.projects.map((proj, idx) => (
                          <div key={idx} className="cv-block">
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
            ) : (
              <div key={`${activeCandidateIdx}-tree-paper`} className="cv-paper animate-fade-in" style={{ padding: '24px' }}>
                <div className="text-left mb-6">
                  <h3 className="text-sm font-600 text-brand">🌳 Hierarchical Career Tree</h3>
                  <p className="text-t3" style={{ fontSize: '11px', marginTop: '2px' }}>Explore how ResumeTree parsed and summarized the resume's structured sections.</p>
                </div>
                <div className="flex-col gap-3">
                  <TreeNodeView node={data.resume_tree} depth={0} activeNodeId={activeNodeId} />
                </div>
              </div>
            )}
          </aside>

        </div>
      </main>

      {/* PDF Export Paywall Modal */}
      {showPdfPaywall && createPortal(
        <div className="processing-overlay active" id="pdf-paywall-overlay" style={{ zIndex: 1100 }}>
          <div className="card flex-col items-center justify-center p-8 w-full max-w-md shadow-2xl relative overflow-hidden bg-surface border border-border"
            style={{ borderRadius: '24px', textAlign: 'center', gap: '20px' }}>
            
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', 
              background: 'var(--brand-soft)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', fontSize: '32px',
              border: '1.5px solid var(--brand)', boxShadow: '0 0 20px var(--brand-glow)'
            }}>
              📄
            </div>

            <h2 className="font-display text-2xl text-primary font-700" style={{ letterSpacing: '-0.02em', margin: '0' }}>
              PDF Export Locked
            </h2>
            
            <p className="text-secondary text-sm" style={{ lineHeight: '1.6', margin: '0' }}>
              Downloading high-fidelity PDF reports of resume trees and ATS analytics is a premium feature. Create a free Job Seeker account to unlock it!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '10px' }}>
              <button 
                className="btn btn-primary justify-center py-3" 
                style={{ fontWeight: 600, width: '100%' }}
                onClick={() => {
                  setShowPdfPaywall(false);
                  navigate('/login');
                }}
              >
                Sign Up / Log In →
              </button>
              <button 
                className="btn btn-ghost" 
                style={{ fontWeight: 600, width: '100%', color: 'var(--t3)' }}
                onClick={() => setShowPdfPaywall(false)}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
