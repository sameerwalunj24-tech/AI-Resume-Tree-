import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Feedback() {
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState('yes');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Feedback saved successfully! Thank you.");
      navigate('/results');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-base pt-20 px-4">
      <div className="container max-w-xl mx-auto col pb-32">
        <h1 className="display-title mb-2 text-center">Log Candidate Evaluation</h1>
        <p className="text-secondary text-sm text-center mb-12">
          Save hiring recommendations and final feedback notes for this profile.
        </p>

        <form className="card p-8 col gap-6 bg-surface border border-border" onSubmit={handleSubmit}>
          {/* Recommendation */}
          <div className="col gap-2">
            <label className="text-sm font-600 text-primary">Hiring Recommendation</label>
            <div className="row gap-4 mt-2">
              <button 
                type="button" 
                className={`btn flex-1 justify-center py-3 ${recommendation === 'yes' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setRecommendation('yes')}
              >
                ✓ Recommended
              </button>
              <button 
                type="button" 
                className={`btn flex-1 justify-center py-3 ${recommendation === 'no' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ 
                  background: recommendation === 'no' ? 'rgba(239, 68, 68, 0.1)' : '',
                  color: recommendation === 'no' ? '#ef4444' : '',
                  borderColor: recommendation === 'no' ? '#ef4444' : ''
                }}
                onClick={() => setRecommendation('no')}
              >
                ✗ Do Not Hire
              </button>
            </div>
          </div>

          {/* Feedback comments */}
          <div className="col gap-2">
            <label className="text-sm font-600 text-primary">Interview / Evaluation Notes</label>
            <textarea 
              rows="6"
              className="textarea w-full font-body text-sm mt-1" 
              placeholder="Enter details on technical expertise, cultural fit, or notes..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              required
            />
          </div>

          {/* Actions */}
          <div className="row gap-4 mt-4">
            <button type="button" className="btn btn-ghost flex-1 justify-center" onClick={() => navigate('/results')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1 justify-center" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Recommendation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
