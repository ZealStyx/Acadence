'use client';

import { useState } from 'react';

export default function Login({ onDemo }: { onDemo: (role: 'student' | 'instructor' | 'admin') => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState('');

  return (
    <main className="login-page">
      <section className="login-story" aria-label="About Pulso">
        <div className="login-brand"><img src="/logo.png" width="52" height="52" alt="" /><span>PULSO</span></div>
        <div className="story-content">
          <span className="story-eyebrow"><span /> A LITTLE CLARITY GOES A LONG WAY</span>
          <h1>Find your rhythm.<br /><em>Stay ahead.</em></h1>
          <p>See what’s coming, make space for what matters, and navigate your semester with confidence.</p>
          <div className="story-preview" aria-hidden="true">
            <div className="preview-top"><div><span>YOUR WEEK AT A GLANCE</span><strong>Make room to breathe.</strong></div><div className="preview-icon">✦</div></div>
            <div className="preview-bars"><div><span>W6</span><i className="bar-light" /></div><div><span>W7</span><i className="bar-heavy" /></div><div><span>W8</span><i className="bar-critical" /></div><div><span>W9</span><i className="bar-heavy short" /></div><div><span>W10</span><i className="bar-light" /></div></div>
            <div className="preview-footer"><span><b>●</b> Light</span><span><b>▲</b> Heavy</span><span><b>■</b> Critical</span></div>
          </div>
        </div>
        <div className="story-bottom"><span>BUILT FOR YOUR SEMESTER</span><span>PLAN AHEAD, TOGETHER.</span></div>
      </section>
      <section className="login-side">
        <div className="mobile-brand"><img src="/logo.png" width="42" height="42" alt="" /><span>PULSO</span></div>
        <div className="login-content">
          <div className="login-kicker"><span /> YOUR WORKLOAD, IN PERSPECTIVE</div>
          <h2>Welcome to Pulso<span className="title-dot">.</span></h2>
          <p className="login-subtitle">Your semester, a little more manageable. Sign in to see what’s ahead.</p>
          <form className="login-form" onSubmit={event => { event.preventDefault(); setNotice('University sign-in is not connected yet. Please use one of the demos below.'); }}>
            <label htmlFor="login-email">University email</label>
            <input id="login-email" name="email" type="email" autoComplete="username" placeholder="you@example.edu" required />
            <div className="password-label"><label htmlFor="login-password">Password</label></div>
            <div className="login-password"><input id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div>
            <button className="login-submit" type="submit">Sign in <span aria-hidden="true">→</span></button>
            {notice && <p className="login-notice" role="status">{notice}</p>}
          </form>
          <div className="demo-divider"><span /> <b>OR EXPLORE PULSO</b> <span /></div>
          <div className="demo-role-list"><button className="demo-button" onClick={() => onDemo('student')}>Student demo <span aria-hidden="true">→</span></button><button className="demo-button" onClick={() => onDemo('instructor')}>Instructor demo <span aria-hidden="true">→</span></button><button className="demo-button" onClick={() => onDemo('admin')}>Admin demo <span aria-hidden="true">→</span></button></div>
          <p className="demo-note">Demo uses sample data. University account sign-in is not connected yet; please don’t enter real credentials.</p>
          <div className="login-support"><div className="support-icon">?</div><div><strong>Need help with your account?</strong><p>Contact your university administrator for assistance.</p></div></div>
        </div>
        <footer className="login-footer"><span>© PULSO</span><span>MADE FOR BETTER WEEKS</span></footer>
      </section>
    </main>
  );
}
