import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CanvasBackground from '../components/CanvasBackground';
import { apiCall } from '../utils/api';

export default function Landing() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Flow State
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [step, setStep] = useState(1); // 1 = Upload, 2 = JD
  const [jdText, setJdText] = useState('');
  
  // Processing Overlay
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [remainingTime, setRemainingTime] = useState(18);
  const [apiFinished, setApiFinished] = useState(false);
  const [apiError, setApiError] = useState(null);

  const steps = [
    "Resume structure detected — 6 sections found",
    "Job description parsed — 23 requirements",
    "Matching keywords against JD...",
    "Scoring ATS compatibility",
    "Generating improvement suggestions"
  ];

  // Drag and Drop
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
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = (uploadedFile) => {
    if (uploadedFile.size > 5 * 1024 * 1024) {
      alert("Only PDF or DOCX, max 5MB");
      return;
    }
    setFile(uploadedFile);
    setStep(2);
  };

  // Run the AI analysis
  const handleAnalyze = async () => {
    if (!file || jdText.length < 100) return;
    setIsProcessing(true);
    setRemainingTime(18);
    setApiFinished(false);
    setApiError(null);
    setActiveStepIndex(0);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jd_text', jdText);

    // Call FastAPI backend in the background
    apiCall('/evaluate', 'POST', formData)
      .then((data) => {
        localStorage.setItem('lastResult', JSON.stringify(data));
        localStorage.setItem('lastFilename', file.name);
        localStorage.setItem('lastJD', jdText);
        setApiFinished(true);
      })
      .catch((err) => {
        console.error(err);
        setApiError(err.message || "Analysis failed");
        setIsProcessing(false);
        alert("Analysis failed: " + (err.message || "Please make sure your FastAPI backend is running."));
      });
  };

  // Processing Step Animations
  useEffect(() => {
    if (!isProcessing) return;

    const timings = [500, 1700, 2900, 4100, 5300];
    const timers = timings.map((t, idx) => {
      return setTimeout(() => {
        setActiveStepIndex(idx);
      }, t);
    });

    return () => timers.forEach(clearTimeout);
  }, [isProcessing]);

  // Countdown timer
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isProcessing]);

  // Check when evaluation is finished to navigate
  useEffect(() => {
    if (isProcessing && apiFinished && activeStepIndex === steps.length - 1) {
      const navigateTimer = setTimeout(() => {
        setIsProcessing(false);
        navigate('/results');
      }, 1000);
      return () => clearTimeout(navigateTimer);
    }
  }, [isProcessing, apiFinished, activeStepIndex, navigate]);

  return (
    <>
      <main className="hero-section" style={{ minHeight: 'calc(100vh - 60px)', position: 'relative' }}>
        <CanvasBackground />

        <div className="container text-center flex-col items-center" style={{ position: 'relative', zIndex: 10, padding: '80px 24px' }}>
          
          <div className="pill pill-green mb-6 hero-stagger-1 border border-border" style={{ background: 'var(--surface)' }}>
            <span className="animate-pulse-dot" style={{ marginRight: '6px' }}></span>
            AI-Powered Resume Matching · Free
          </div>

          <h1 className="display-title hero-stagger-2 mb-6" style={{ letterSpacing: '-0.04em' }}>
            Your resume has<br />
            <span className="text-brand" style={{ fontStyle: 'italic', position: 'relative' }}>3 seconds
              <svg style={{ position: 'absolute', bottom: '-4px', left: 0, width: '100%' }} viewBox="0 0 200 8" fill="none">
                <path className="path-draw" d="M0 5 Q 100 0, 200 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span> to impress.
          </h1>
          
          <p className="text-secondary mb-12 hero-stagger-3 mx-auto text-center" style={{ maxWidth: '560px', fontSize: '18px', lineHeight: 1.6 }}>
            75% of resumes never reach a human.<br />
            Find out if yours makes it through —<br />
            matched against the specific job you want.
          </p>

          <div className="hero-scale w-full mb-8 max-w-3xl mx-auto">
            {/* Step Indicators */}
            <div id="step-indicators" className="step-indicator">
              <span className={`step-pill ${step === 1 ? 'step-active' : 'step-inactive'}`}>① Upload your resume</span>
              <svg id="step-connector" width="40" height="12" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path id="step-line" d="M0 6H38M38 6L33 1M38 6L33 11" stroke={file ? "var(--excellent)" : "var(--border-hi)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className={`step-pill ${step === 2 ? 'step-active' : 'step-inactive'}`}>② Job Description</span>
            </div>

            {/* Container Flow */}
            <div id="flow-container" className={`flow-container text-left mt-4 ${step === 2 ? 'state-jd' : ''}`} style={{ justifyContent: 'center' }}>
              
              {/* Left Panel: Upload Zone */}
              <div id="panel-left" className="panel panel-left w-full flex justify-center">
                {!file ? (
                  <div 
                    id="state-idle" 
                    className={`upload-zone mx-auto w-full ${dragActive ? 'drag-active' : ''}`}
                    onClick={() => fileInputRef.current.click()}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".pdf,.docx" 
                      style={{ display: 'none' }} 
                      onChange={handleFileChange}
                    />
                    <svg className="huge-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    <h3 style={{ fontFamily: 'var(--font-ui)', fontSize: '15px', fontWeight: 600, marginBottom: '2px' }}>① Upload your resume</h3>
                    <p className="text-t3 mono-text" style={{ fontSize: '12px', marginTop: '4px' }}>PDF or DOCX · Max 5MB</p>
                    <p className="text-t3" style={{ fontSize: '12px', marginTop: '8px' }}>
                      {dragActive ? "Release to upload" : "Click to browse or drag and drop"}
                    </p>
                  </div>
                ) : (
                  <div id="state-done" style={{ padding: '24px', width: '100%' }}>
                    <div className="flex items-center gap-3">
                      <div style={{ background: 'rgba(16,185,129,0.05)', color: 'var(--excellent)', padding: '10px', borderRadius: '8px', border: '1.5px solid var(--excellent)' }}>
                        <svg id="upload-check-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path id="check-path" d="M20 6L9 17l-5-5" style={{ strokeDasharray: '30', strokeDashoffset: '0' }}></path>
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 className="font-600 mb-0 mono-text" style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                          {file.name}
                        </h4>
                        <p className="text-t3 mono-text" style={{ fontSize: '12px', marginTop: '2px' }}>
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                      <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => { setFile(null); setStep(1); }}>
                        Change file
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel: JD Textarea */}
              <div id="panel-right" className="panel panel-right flex-col">
                <h3 className="mb-2 text-brand" style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '13px' }}>
                  ② Now add the job description
                </h3>
                <p className="text-t2 mb-6" style={{ fontSize: '13px', lineHeight: 1.6 }}>
                  Without a job description, your score is just a formatting grade. Add the JD to see your REAL match percentage.
                </p>

                <div className="input-wrapper mb-4">
                  <textarea 
                    id="jd-textarea" 
                    className="textarea mono-text" 
                    style={{ height: '180px', fontSize: '13px' }} 
                    placeholder="Paste job description text here..." 
                    spellcheck="false"
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                  />
                  <span id="char-counter" className="char-counter" style={{ color: jdText.length >= 100 ? 'var(--excellent)' : 'var(--t3)' }}>
                    {jdText.length} / 2000+
                  </span>
                </div>

                {jdText.length >= 100 && (
                  <div id="auto-detect-strip" className="auto-detect-strip mb-4">
                    📋 Detected: Job Description match mode enabled · {Math.floor(jdText.length / 50)} requirements estimated
                  </div>
                )}

                <button 
                  id="analyze-btn" 
                  className={`analyze-btn w-full mt-auto ${jdText.length >= 100 ? 'active' : ''}`}
                  title={jdText.length < 100 ? "Required — tells us what to match your resume against" : ""}
                  disabled={jdText.length < 100}
                  onClick={handleAnalyze}
                >
                  {jdText.length >= 100 ? 'Analyze ATS Match →' : 'Add job description to continue'}
                </button>
              </div>

            </div>
          </div>

          <div className="text-t3 hero-stagger-4 mono-text" style={{ fontSize: '12px' }}>
            No signup required · Results in 30 seconds · Your resume is never stored
          </div>

        </div>
      </main>

      {/* Processing Animation Overlay */}
      <div className={`processing-overlay ${isProcessing ? 'active' : ''}`} id="processing-overlay">
        <div className="card flex-col items-center justify-center p-8 w-full max-w-lg shadow-2xl relative overflow-hidden bg-surface border border-border">
          <div className="relative w-full h-[6px] bg-border-hi rounded-full overflow-hidden mb-8">
            <div 
              id="progress-bar" 
              className="absolute left-0 top-0 h-full bg-brand transition-all" 
              style={{ 
                width: `${Math.min(100, ((activeStepIndex + 1) / steps.length) * 100)}%`,
                transitionDuration: '500ms'
              }}
            />
          </div>

          <h3 className="font-display text-2xl mb-2 text-primary font-400">Evaluating Resume Compatibility</h3>
          <p id="time-est" className="text-sm text-secondary mb-8">
            {remainingTime > 0 ? `${remainingTime}s remaining` : "Processing with AI... (this may take up to 2 mins)"}
          </p>

          <div id="progress-steps" className="flex-col gap-4 w-full">
            {steps.map((msg, i) => {
              const isFinished = activeStepIndex > i;
              const isActive = activeStepIndex === i;
              return (
                <div key={i} className="flex items-center gap-3" style={{ opacity: activeStepIndex >= i ? 1 : 0.3 }}>
                  {isFinished ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--excellent)" strokeWidth="2" className="step-icon">
                      <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                  ) : isActive ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" className="animate-spin step-icon">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--border-hi)" strokeWidth="2" className="step-icon">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  )}
                  <span className={`step-text ${isActive ? 'text-brand font-500' : 'text-t1'}`} style={{ fontSize: '14px' }}>
                    {msg}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
