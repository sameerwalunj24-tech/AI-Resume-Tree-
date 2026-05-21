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
    <div className="col items-center max-w-md mx-auto pt-8 px-4" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <div className="row gap-4 items-center mb-12 text-sm font-mono font-600">
        <span className="text-blue">① Upload</span>
        <span className="text-tertiary">────</span>
        <span className="text-tertiary">② Evaluate</span>
        <span className="text-tertiary">────</span>
        <span className="text-tertiary">③ Results</span>
      </div>

      <div className="w-full text-left mb-4">
        <h2 className="text-xl font-600 mb-1">Resume Document</h2>
      </div>

      <div 
        id="upload-zone" 
        className={`drop-zone w-full rounded-lg p-8 col items-center justify-center text-center mb-8 cursor-pointer relative ${dragActive ? 'drag-active' : ''} ${file ? 'success' : ''}`}
        onClick={() => fileInputRef.current.click()}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
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
            <h3 className="text-base font-500 text-primary mb-1 mono-text">{file.name}</h3>
            <p className="text-tertiary text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready</p>
          </>
        ) : (
          <>
            <svg id="upload-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-tertiary mb-4 transition-transform"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            <h3 id="upload-title" class="text-base font-500 text-primary mb-1">
              {dragActive ? "Drop file now" : "Drop resume here or click to browse"}
            </h3>
            <p id="upload-desc" class="text-tertiary text-sm">PDF or DOCX · Max 10MB</p>
          </>
        )}
      </div>

      <div className="w-full text-left mb-4 row space-between">
        <h2 className="text-xl font-600 mb-1">Job Description</h2>
      </div>
      
      <div className="w-full mb-8">
        <textarea 
          id="jd-input" 
          rows="8" 
          className="w-full font-mono text-sm textarea" 
          placeholder="Paste job description text here..."
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
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
      {isEvaluating && (
        <div id="progress-overlay" className="progress-overlay" style={{ display: 'flex' }}>
          <div className="progress-panel col">
            <h3 className="text-xl font-600 mb-6">Evaluating Candidate Fit</h3>
            <div id="progress-steps" className="col gap-3 text-secondary text-sm font-mono animate-on-scroll">
              {steps.map((stepObj, idx) => {
                const isActive = activeStepIndex === idx;
                const isDone = activeStepIndex > idx;
                return (
                  <div key={idx} className={`step ${isActive ? 'text-brand font-600' : ''} ${!isActive && !isDone ? 'opacity-50' : ''}`}>
                    {isDone ? "✓" : isActive ? "▶" : "○"} {stepObj.text}
                  </div>
                );
              })}
            </div>
            <div className="progress-bar">
              <div id="progress-fill" className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
