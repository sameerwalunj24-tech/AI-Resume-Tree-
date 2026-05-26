import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';

export default function Upload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [jdText, setJdText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(-1);

  // Employee-specific dashboard states
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'resumes' | 'history'
  const [savedResumes, setSavedResumes] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem('auth_user');
    if (!raw) { navigate('/login'); return; }
    const parsed = JSON.parse(raw);
    setUser(parsed);
    
    if (parsed.role === 'employee') {
      const storedRes = localStorage.getItem('employee_saved_resumes');
      if (storedRes) setSavedResumes(JSON.parse(storedRes));
      
      const storedHistory = localStorage.getItem('employee_scan_history');
      if (storedHistory) setScanHistory(JSON.parse(storedHistory));
    }
  }, [navigate]);

  const isCompany = user?.role === 'company';

  // Base64 helper to convert dataURI back to Blob/File
  const dataURItoBlob = (dataURI) => {
    const parts = dataURI.split(',');
    const byteString = atob(parts[1]);
    const mimeString = parts[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {type: mimeString});
  };

  const handleAddResumeProfile = (e) => {
    const fileObj = e.target.files[0];
    if (!fileObj) return;
    if (savedResumes.length >= 3) {
      alert("You can save a maximum of 3 resumes.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64Data = evt.target.result;
      const newResume = {
        id: `res_${Date.now()}`,
        nickname: fileObj.name.replace(/\.[^/.]+$/, ""),
        filename: fileObj.name,
        base64: base64Data,
        mime: fileObj.type,
        size: fileObj.size,
        timestamp: Date.now()
      };
      const updated = [...savedResumes, newResume];
      setSavedResumes(updated);
      localStorage.setItem('employee_saved_resumes', JSON.stringify(updated));
    };
    reader.readAsDataURL(fileObj);
    e.target.value = '';
  };

  const handleUseResume = (res) => {
    const blob = dataURItoBlob(res.base64);
    const fileObj = new File([blob], res.filename, { type: res.mime });
    setFiles([fileObj]);
    setActiveTab('scan');
  };

  const handleDeleteSavedResume = (id) => {
    const updated = savedResumes.filter(r => r.id !== id);
    setSavedResumes(updated);
    localStorage.setItem('employee_saved_resumes', JSON.stringify(updated));
  };

  const handleViewHistoryDetail = (scan) => {
    localStorage.setItem('lastResult', JSON.stringify(scan.result));
    localStorage.setItem('lastFilename', scan.filename);
    localStorage.setItem('lastJD', scan.result.jd_text || scan.role || "Job Description");
    navigate('/results');
  };

  const handleDeleteHistoryItem = (id) => {
    const updated = scanHistory.filter(item => item.id !== id);
    setScanHistory(updated);
    localStorage.setItem('employee_scan_history', JSON.stringify(updated));
  };

  const steps = [
    { text: 'Parsing resume(s)…',        pct: 20 },
    { text: 'Building career trees',      pct: 40 },
    { text: 'Analysing job description',  pct: 60 },
    { text: 'Reasoning about fit',        pct: 80 },
    { text: 'Finalising results',         pct: 100 },
  ];

  // ── Drag & Drop ──
  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    const added = Array.from(e.dataTransfer.files || []).filter(f =>
      f.name.endsWith('.pdf') || f.name.endsWith('.docx'));
    if (!isCompany) setFiles(added.slice(0, 1));
    else setFiles(prev => [...prev, ...added]);
  };
  const handleFileChange = (e) => {
    const added = Array.from(e.target.files || []);
    if (!isCompany) setFiles(added.slice(0, 1));
    else setFiles(prev => [...prev, ...added]);
    e.target.value = '';
  };
  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  // ── Evaluate ──
  const handleEvaluate = async () => {
    if (files.length === 0 || jdText.trim().length < 30) return;
    setIsEvaluating(true); setProgress(5); setActiveStepIndex(0);
    localStorage.removeItem('lastResult');
    localStorage.removeItem('lastCompareResults');

    if (files.length === 1) {
      const fd = new FormData();
      fd.append('resume', files[0]);
      fd.append('jd_text', jdText);
      apiCall('/evaluate', 'POST', fd)
        .then(data => {
          localStorage.setItem('lastResult', JSON.stringify(data));
          localStorage.setItem('lastFilename', files[0].name);
          localStorage.setItem('lastJD', jdText);

          // Save to employee history!
          if (user && user.role === 'employee') {
            const historyRaw = localStorage.getItem('employee_scan_history') || '[]';
            const history = JSON.parse(historyRaw);
            const roleMatch = jdText.match(/(?:title|role|position|job)\s*:\s*([^\n\r]+)/i) 
              || jdText.match(/([a-zA-Z\s]{5,30}\s+(?:Engineer|Developer|Manager|Analyst|Specialist|Designer))/i);
            const roleName = roleMatch ? roleMatch[1].trim() : "Target Position";
            
            const newScan = {
              id: `eval_${Date.now()}`,
              timestamp: Date.now(),
              filename: files[0].name,
              role: roleName,
              score: data.overall_score || data.ats_score || 75,
              result: data
            };
            history.unshift(newScan);
            localStorage.setItem('employee_scan_history', JSON.stringify(history));
          }

          setProgress(100); setActiveStepIndex(steps.length - 1);
          setTimeout(() => { setIsEvaluating(false); navigate('/results'); }, 700);
        })
        .catch(err => { setIsEvaluating(false); alert('Evaluation failed: ' + (err.message || 'Backend unreachable.')); });
    } else {
      // Parallel multi-candidate
      Promise.all(files.map(file => {
        const fd = new FormData();
        fd.append('resume', file);
        fd.append('jd_text', jdText);
        return apiCall('/evaluate', 'POST', fd);
      }))
        .then(results => {
          localStorage.setItem('lastCompareResults', JSON.stringify({
            results, filenames: files.map(f => f.name), jd_text: jdText,
          }));
          setProgress(100); setActiveStepIndex(steps.length - 1);
          setTimeout(() => { setIsEvaluating(false); navigate('/results'); }, 700);
        })
        .catch(err => { setIsEvaluating(false); alert('Comparison failed: ' + (err.message || 'One or more resumes failed.')); });
    }
  };

  // Animated step ticker
  useEffect(() => {
    if (!isEvaluating) return;
    const iv = setInterval(() => {
      setActiveStepIndex(prev => {
        const next = prev + 1;
        if (next < steps.length - 1) { setProgress(steps[next].pct); return next; }
        clearInterval(iv); return prev;
      });
    }, 2200);
    return () => clearInterval(iv);
  }, [isEvaluating]);

  const canEvaluate = files.length > 0 && jdText.trim().length >= 30;

  return (
    <div style={{ maxWidth: '660px', width: '100%', margin: '40px auto 120px auto', padding: '0 20px', minHeight: 'calc(100vh - 180px)' }}>

      {/* Role-aware header */}
      <div style={{ marginBottom: '32px', animation: 'fadeUp 0.4s var(--out) both' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '22px' }}>{isCompany ? '🏢' : '👤'}</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {isCompany ? 'Recruiter Dashboard' : 'Job Seeker Dashboard'}
            </span>
          </div>
        )}
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--t1)', margin: 0, letterSpacing: '-0.03em' }}>
          {isCompany ? 'Screen Candidates' : 'Analyse Your Resume'}
        </h1>
        <p style={{ color: 'var(--t2)', marginTop: '6px', fontSize: '14px' }}>
          {isCompany
            ? 'Upload multiple resumes and compare them against a job description with AI.'
            : 'Upload your resume and get a detailed fit score with improvement tips.'}
        </p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '28px', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
        <span style={{ color: 'var(--brand)' }}>① Upload</span>
        <span style={{ color: 'var(--t3)' }}>────</span>
        <span style={{ color: 'var(--t3)' }}>② Evaluate</span>
        <span style={{ color: 'var(--t3)' }}>────</span>
        <span style={{ color: 'var(--t3)' }}>③ Results</span>
      </div>

      {/* Tabs navigation for Employee */}
      {!isCompany && user && (
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '28px' }}>
          <button 
            onClick={() => setActiveTab('scan')}
            className={`btn ${activeTab === 'scan' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '10px' }}
          >
            🔍 New Scan
          </button>
          <button 
            onClick={() => setActiveTab('resumes')}
            className={`btn ${activeTab === 'resumes' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '10px' }}
          >
            📁 Saved Resumes ({savedResumes.length}/3)
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '10px' }}
          >
            📜 Scan History ({scanHistory.length})
          </button>
        </div>
      )}

      {activeTab === 'scan' ? (
        <>
          {/* Drop Zone */}
          <div
            id="upload-zone"
            className={`upload-zone w-full col items-center justify-center text-center cursor-pointer relative ${dragActive ? 'drag-active' : ''} ${files.length > 0 ? 'success' : ''}`}
            onClick={() => files.length === 0 && fileInputRef.current.click()}
            onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
            style={{ height: files.length > 0 ? 'auto' : '190px', padding: files.length > 0 ? '20px' : '0', marginBottom: '28px' }}
          >
            <input
              ref={fileInputRef} type="file" id="resume-input"
              style={{ display: 'none' }} accept=".pdf,.docx"
              multiple={isCompany}
              onChange={handleFileChange}
            />

            {files.length > 0 ? (
              <div className="w-full" onClick={e => e.stopPropagation()} style={{ cursor: 'default' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                  {files.map((f, idx) => (
                    <div key={idx} className="file-card" style={{ animation: `fadeUp 0.3s ${idx * 60}ms var(--out) both` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '22px' }}>📄</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--t1)' }}>{f.name}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--t3)' }}>
                            {(f.size / 1024 / 1024).toFixed(2)} MB ·
                            {isCompany ? ` Candidate ${idx + 1}` : ' Your Resume'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--poor)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: '4px 8px' }}
                      >Remove</button>
                    </div>
                  ))}
                </div>

                {/* Add more (company only) */}
                {isCompany && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    style={{
                      width: '100%', marginTop: '12px', padding: '10px',
                      background: 'transparent', border: '1.5px dashed var(--border-hi)',
                      borderRadius: '10px', color: 'var(--brand)', fontSize: '13px', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--brand-soft)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    + Add Another Candidate
                  </button>
                )}
              </div>
            ) : (
              <>
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  style={{ color: 'var(--t3)', marginBottom: '14px' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="18" x2="12" y2="12"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--t1)', margin: '0 0 6px 0' }}>
                  {dragActive ? 'Drop to upload' : isCompany ? 'Drop candidate resumes here' : 'Drop your resume here'}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--t3)', margin: 0 }}>PDF or DOCX · Max 10 MB each</p>
              </>
            )}
          </div>

          {/* Job Description */}
          <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--t1)', margin: 0 }}>Job Description</h2>
            <span style={{ fontSize: '12px', color: jdText.trim().length >= 30 ? 'var(--excellent)' : 'var(--t3)' }}>
              {jdText.trim().length} chars {jdText.trim().length >= 30 ? '✓' : '(min 30)'}
            </span>
          </div>
          <textarea
            id="jd-input" rows="8"
            className="w-full font-mono text-sm textarea"
            placeholder="Paste the job description here…"
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            style={{ minHeight: '160px', marginBottom: '24px' }}
          />

          {/* CTA Button */}
          <button
            id="evaluate-btn"
            className="btn btn-primary w-full justify-center py-4 font-600"
            disabled={!canEvaluate}
            onClick={handleEvaluate}
            style={{ fontSize: '15px', opacity: canEvaluate ? 1 : 0.5, transition: 'opacity 0.25s, transform 0.18s' }}
          >
            {files.length > 1
              ? `🔍 Evaluate All ${files.length} Candidates →`
              : isCompany ? '🔍 Screen Candidate →' : '🔍 Analyse My Resume →'}
          </button>
        </>
      ) : activeTab === 'resumes' ? (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--t1)', margin: 0 }}>Saved Resume Profiles</h2>
            {savedResumes.length < 3 && (
              <label className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer' }}>
                + Add Profile
                <input type="file" style={{ display: 'none' }} accept=".pdf,.docx" onChange={handleAddResumeProfile} />
              </label>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {savedResumes.length > 0 ? (
              savedResumes.map((res) => (
                <div key={res.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border-hi)', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '24px' }}>📄</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--t1)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{res.nickname}</div>
                      <div style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {res.filename} · {(res.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}
                      onClick={() => handleUseResume(res)}
                    >
                      Use Resume
                    </button>
                    <button 
                      className="btn btn-ghost" 
                      style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', color: 'var(--poor)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                      onClick={() => handleDeleteSavedResume(res.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--surface)', borderRadius: '18px', border: '1px dashed var(--border-hi)' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>📁</span>
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--t2)' }}>
                  No saved resume profiles. Upload your main resumes here to quickly match them against different job descriptions.
                </p>
                <label className="btn btn-primary" style={{ display: 'inline-flex', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer' }}>
                  Upload First Resume Profile
                  <input type="file" style={{ display: 'none' }} accept=".pdf,.docx" onChange={handleAddResumeProfile} />
                </label>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--t1)', margin: 0, textAlign: 'left' }}>Your Scan History</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {scanHistory.length > 0 ? (
              scanHistory.map((scan) => {
                const scoreColor = scan.score >= 80 ? 'var(--excellent)' : scan.score >= 60 ? 'var(--brand)' : scan.score >= 40 ? 'var(--average)' : 'var(--poor)';
                const dateStr = new Date(scan.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={scan.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border-hi)', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '50%',
                        background: 'var(--elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '14px', color: scoreColor, border: `1.5px solid ${scoreColor}`, flexShrink: 0
                      }}>
                        {scan.score}%
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--t1)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {scan.role}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--t3)', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {scan.filename} · {dateStr}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}
                        onClick={() => handleViewHistoryDetail(scan)}
                      >
                        View Report
                      </button>
                      <button 
                        className="btn btn-ghost" 
                        style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', color: 'var(--poor)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                        onClick={() => handleDeleteHistoryItem(scan.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--surface)', borderRadius: '18px', border: '1px dashed var(--border-hi)' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>📜</span>
                <p style={{ margin: '0', fontSize: '14px', color: 'var(--t2)' }}>
                  No scan history found. Try scanning your resume against a job description to build your tracking timeline!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Overlay */}
      {isEvaluating && createPortal(
        <div className="processing-overlay active" id="progress-overlay">
          <div className="card flex-col items-center p-8 w-full max-w-md shadow-2xl relative overflow-hidden bg-surface border border-border"
            style={{ gap: '0', borderRadius: '20px' }}>
            {/* Animated progress bar */}
            <div style={{ width: '100%', height: '5px', background: 'var(--border-hi)', borderRadius: '3px', marginBottom: '28px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: 'linear-gradient(90deg, var(--brand), var(--brand-hi))',
                borderRadius: '3px', width: `${progress}%`,
                transition: 'width 600ms cubic-bezier(0.25, 1, 0.5, 1)',
                boxShadow: '0 0 12px var(--brand-glow)'
              }} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--t1)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
              {isCompany ? 'Screening Candidates…' : 'Analysing Resume…'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--t2)', marginBottom: '28px' }}>
              AI is working · this takes about 30–60 seconds
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', textAlign: 'left' }}>
              {steps.map((s, idx) => {
                const isDone   = activeStepIndex > idx;
                const isActive = activeStepIndex === idx;
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: activeStepIndex >= idx ? 1 : 0.3, transition: 'opacity 0.4s' }}>
                    {isDone ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--excellent)" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5"></path>
                      </svg>
                    ) : isActive ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5"
                        style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--border-hi)" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                      </svg>
                    )}
                    <span style={{ fontSize: '13.5px', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--brand)' : 'var(--t1)' }}>
                      {s.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .file-card {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-radius: 12px;
          background: var(--elevated); border: 1px solid var(--border-hi);
          transition: border-color 0.2s;
        }
        .file-card:hover { border-color: var(--brand); }
      `}</style>
    </div>
  );
}
