import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';

export default function Upload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [jdText, setJdText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(-1);

  const steps = [
    { text: "Parsing resume...", pct: 20 },
    { text: "Building career tree", pct: 45 },
    { text: "Analysing job description", pct: 65 },
    { text: "Reasoning about fit", pct: 85 },
    { text: "Finalising scores", pct: 100 }
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleEvaluate = async () => {
    if (!file || jdText.trim().length < 50) return;
    setIsEvaluating(true);
    setProgress(5);
    setActiveStepIndex(0);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jd_text', jdText);

    // Call evaluate API
    apiCall('/evaluate', 'POST', formData)
      .then((data) => {
        localStorage.setItem('lastResult', JSON.stringify(data));
        localStorage.setItem('lastFilename', file.name);
        localStorage.setItem('lastJD', jdText);
        setProgress(100);
        setActiveStepIndex(steps.length - 1);
        setTimeout(() => {
          setIsEvaluating(false);
          navigate('/results');
        }, 800);
      })
      .catch((err) => {
        console.error(err);
        setIsEvaluating(false);
        alert("Evaluation failed: " + (err.message || "Please make sure your FastAPI backend is running."));
      });
  };

  // Simulate progress step updates
  useEffect(() => {
    if (!isEvaluating) return;

    const interval = setInterval(() => {
      setActiveStepIndex((prevIdx) => {
        const nextIdx = prevIdx + 1;
        if (nextIdx < steps.length - 1) {
          setProgress(steps[nextIdx].pct);
          return nextIdx;
        }
        clearInterval(interval);
        return prevIdx;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isEvaluating]);

  return (
    <div className="col items-center pt-8 px-4" style={{ maxWidth: '640px', width: '100%', margin: '40px auto 120px auto', minHeight: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px', fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
        <span className="text-brand">① Upload</span>
        <span className="text-tertiary">────</span>
        <span className="text-tertiary">② Evaluate</span>
        <span className="text-tertiary">────</span>
        <span className="text-tertiary">③ Results</span>
      </div>

      <div className="w-full text-left mb-4">
        <h2 className="text-xl mb-1" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--t1)' }}>Resume Document</h2>
      </div>

      <div 
        id="upload-zone" 
        className={`upload-zone w-full col items-center justify-center text-center mb-8 cursor-pointer relative ${dragActive ? 'drag-active' : ''} ${file ? 'success' : ''}`}
        onClick={() => fileInputRef.current.click()}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        style={{ height: '200px' }}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          id="resume-input" 
          style={{ display: 'none' }}
          accept=".pdf,.docx"
          onChange={handleFileChange}
        />
        {file ? (
          <>
            <div style={{ background: 'rgba(16,185,129,0.05)', color: 'var(--excellent)', padding: '12px', borderRadius: '50%', marginBottom: '12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"></path>
              </svg>
            </div>
            <h3 className="text-primary mb-1 mono-text" style={{ fontSize: '14px', fontWeight: 500 }}>{file.name}</h3>
            <p className="text-tertiary text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready</p>
          </>
        ) : (
          <>
            <svg id="upload-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-tertiary mb-4 transition-transform"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            <h3 id="upload-title" className="text-primary mb-1" style={{ fontSize: '15px', fontWeight: 600 }}>
              {dragActive ? "Drop file now" : "Drop resume here or click to browse"}
            </h3>
            <p id="upload-desc" className="text-tertiary text-sm">PDF or DOCX · Max 10MB</p>
          </>
        )}
      </div>

      <div className="w-full text-left mb-4 row space-between">
        <h2 className="text-xl mb-1" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--t1)' }}>Job Description</h2>
      </div>
      
      <div className="w-full mb-8">
        <textarea 
          id="jd-input" 
          rows="8" 
          className="w-full font-mono text-sm textarea" 
          placeholder="Paste job description text here..."
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          style={{ minHeight: '160px' }}
        />
      </div>

      <button 
        id="evaluate-btn" 
        className="btn btn-primary w-full justify-center text-base py-4 font-600" 
        disabled={!file || jdText.trim().length < 50}
        onClick={handleEvaluate}
      >
        Evaluate Candidate &rarr;
      </button>

      {/* Progress Overlay */}
      <div id="progress-overlay" className={`processing-overlay ${isEvaluating ? 'active' : ''}`}>
        <div className="card flex-col items-center justify-center p-8 w-full max-w-lg shadow-2xl relative overflow-hidden bg-surface border border-border">
          <div className="relative w-full h-[6px] bg-border-hi rounded-full overflow-hidden mb-8" style={{ width: '100%', height: '6px', background: 'var(--border-hi)', borderRadius: '3px', position: 'relative' }}>
            <div 
              id="progress-fill" 
              className="absolute left-0 top-0 h-full bg-brand transition-all" 
              style={{ 
                width: `${progress}%`,
                height: '100%',
                position: 'absolute',
                left: 0,
                top: 0,
                transition: 'width 300ms ease'
              }}
            />
          </div>

          <h3 className="font-display text-2xl mb-2 text-primary font-400" style={{ fontSize: '22px', fontWeight: 600 }}>Evaluating Resume Compatibility</h3>
          <p id="time-est" className="text-sm text-secondary mb-8">
            Please wait while the AI analyzes compatibility...
          </p>

          <div id="progress-steps" className="flex-col gap-4 w-full text-left" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {steps.map((stepObj, idx) => {
              const isActive = activeStepIndex === idx;
              const isDone = activeStepIndex > idx;
              return (
                <div key={idx} className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: activeStepIndex >= idx ? 1 : 0.3 }}>
                  {isDone ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--excellent)" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                  ) : isActive ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" className="animate-spin">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--border-hi)" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  )}
                  <span className={`step-text ${isActive ? 'text-brand font-500' : 'text-t1'}`} style={{ fontSize: '14px' }}>
                    {stepObj.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
