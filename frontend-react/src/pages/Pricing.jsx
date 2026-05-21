import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Pricing() {
  const [billing, setBilling] = useState('monthly');

  return (
    <div className="min-h-screen bg-base pt-20 px-4">
      <div className="container max-w-5xl mx-auto text-center col items-center pb-32">
        <div className="pill pill-green mb-6 border border-border" style={{ background: 'var(--surface)' }}>
          Pricing
        </div>
        <h1 className="display-title mb-6">Simple, Developer-Friendly Plans</h1>
        <p className="text-secondary mb-12 max-w-xl mx-auto text-lg leading-relaxed">
          Start for free to test single matches, and upgrade to scan multiple candidates simultaneously or integrate APIs.
        </p>

        {/* Billing Switcher */}
        <div className="row gap-2 mb-16 p-1 bg-surface border border-border rounded-full" style={{ width: 'max-content' }}>
          <button 
            className={`btn ${billing === 'monthly' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ borderRadius: '999px', padding: '6px 20px', fontSize: '13px' }}
            onClick={() => setBilling('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`btn ${billing === 'yearly' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ borderRadius: '999px', padding: '6px 20px', fontSize: '13px' }}
            onClick={() => setBilling('yearly')}
          >
            Yearly (Save 20%)
          </button>
        </div>

        {/* Pricing Grid */}
        <div className="grid-3 gap-8 text-left w-full items-stretch">
          
          {/* Tier 1: Free */}
          <div className="card p-8 col justify-between">
            <div>
              <h3 className="text-lg font-600 mb-2 text-primary">Developer</h3>
              <p className="text-tertiary text-xs mb-6">For personal projects & matching.</p>
              <div className="row items-baseline mb-6">
                <span className="text-4xl font-700 text-primary">$0</span>
                <span className="text-secondary text-sm">/month</span>
              </div>
              <ul className="col gap-3 text-secondary text-sm" style={{ listStyle: 'none', padding: 0 }}>
                <li>✓ 5 scans per month</li>
                <li>✓ Basic matching tree</li>
                <li>✓ Actionable gaps report</li>
                <li>✗ API Access</li>
              </ul>
            </div>
            <Link to="/upload" className="btn btn-ghost w-full justify-center mt-8">Get Started</Link>
          </div>

          {/* Tier 2: Pro */}
          <div className="card p-8 col justify-between border-blue-500/50" style={{ transform: 'scale(1.03)', boxShadow: '0 10px 30px rgba(37,99,235,0.06)' }}>
            <div>
              <div className="pill pill-green mb-4 border border-border" style={{ width: 'max-content', fontSize: '10px', background: 'var(--brand-soft)', color: 'var(--brand)', borderColor: 'rgba(37,99,235,0.1)' }}>
                Popular
              </div>
              <h3 className="text-lg font-600 mb-2 text-primary">Professional</h3>
              <p className="text-tertiary text-xs mb-6">For power users and recruiters.</p>
              <div className="row items-baseline mb-6">
                <span className="text-4xl font-700 text-primary">
                  {billing === 'monthly' ? '$29' : '$23'}
                </span>
                <span className="text-secondary text-sm">/month</span>
              </div>
              <ul className="col gap-3 text-secondary text-sm" style={{ listStyle: 'none', padding: 0 }}>
                <li>✓ 200 scans per month</li>
                <li>✓ Interactive annotated resume</li>
                <li>✓ Priority processing queue</li>
                <li>✓ Excel/JSON downloads</li>
              </ul>
            </div>
            <Link to="/upload" className="btn btn-primary w-full justify-center mt-8 shadow-glow">Start Free Trial</Link>
          </div>

          {/* Tier 3: Enterprise */}
          <div className="card p-8 col justify-between">
            <div>
              <h3 className="text-lg font-600 mb-2 text-primary">Enterprise</h3>
              <p className="text-tertiary text-xs mb-6">For hiring teams & large scale.</p>
              <div className="row items-baseline mb-6">
                <span className="text-4xl font-700 text-primary">Custom</span>
              </div>
              <ul className="col gap-3 text-secondary text-sm" style={{ listStyle: 'none', padding: 0 }}>
                <li>✓ Unlimited evaluations</li>
                <li>✓ API Integrations</li>
                <li>✓ Custom schema builds</li>
                <li>✓ Dedicated server support</li>
              </ul>
            </div>
            <a href="mailto:support@resumetree.com" className="btn btn-ghost w-full justify-center mt-8">Contact Sales</a>
          </div>

        </div>
      </div>
    </div>
  );
}
