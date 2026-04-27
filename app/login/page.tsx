'use client';
import { useState, useEffect } from 'react';
import './login.css';

export default function LoginPage() {
  const [step, setStep] = useState<'login' | 'create-password' | 'logged-in'>('login');
  const [fratName, setFratName] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [member, setMember] = useState<any>(null);

  useEffect(() => { checkSession(); }, []);

  async function checkSession() {
    try {
      const r = await fetch('/api/verify-session', { credentials: 'include' });
      const d = await r.json();
      if (r.ok && d.authenticated) { setMember(d.member); setStep('logged-in'); }
    } catch {}
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const r = await fetch('/api/verify-login', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frat_name: fratName, password })
      });
      const d = await r.json();
      if (d.needs_password) {
        setMember(d.member);
        setStep('create-password');
      } else if (d.success) {
        setMember(d.member);
        setStep('logged-in');
      } else {
        setError(d.message || 'Login failed. Please try again.');
      }
    } catch { setError('Connection error. Please try again.'); }
    finally { setLoading(false); }
  }

  async function handleCreatePassword(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }
    try {
      const r = await fetch('/api/create-password', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: member.id, password: newPassword })
      });
      const d = await r.json();
      if (d.success) { setMember(d.member); setStep('logged-in'); }
      else { setError(d.message || 'Failed to create password.'); }
    } catch { setError('Connection error. Please try again.'); }
    finally { setLoading(false); }
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    setMember(null); setStep('login'); setFratName(''); setPassword('');
    setNewPassword(''); setConfirmPassword(''); setError('');
  }

  return (
    <>
      <nav>
        <a href="/" className="nav-brand">KΘΦ <span>II</span></a>
        <ul className="nav-links">
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/brothers">Brothers</a></li>
          <li><a href="/gallery">Gallery</a></li>
        </ul>
      </nav>

      <main className="login-page">
        <div className="gate-card">
          <img src="/logo.png" alt="KΘΦ II" className="gate-logo" />

          {step === 'login' && (
            <>
              <p className="gate-label">Brotherhood Access</p>
              <h2 className="gate-title">Enter the Gate</h2>
              <p className="gate-copy">
                Enter your Big Brother name and password to access the brotherhood.
                First time logging in? Use the one-time password: <strong>KTF2026</strong>
              </p>
              <div className="gate-divider" />
              {error && <div className="login-error">{error}</div>}
              <form className="gate-form" onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Big Brother Name</label>
                  <input type="text" value={fratName} onChange={e => setFratName(e.target.value)} placeholder="e.g. Big Brother Tactician" required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
                </div>
                <button type="submit" className="gate-submit" disabled={loading}>{loading ? 'Verifying...' : 'Enter'}</button>
              </form>
              <p className="gate-note">Access is granted only to verified brothers of KΘΦ II.</p>
            </>
          )}

          {step === 'create-password' && member && (
            <>
              <p className="gate-label">First Time Setup</p>
              <h2 className="gate-title">Create Your Password</h2>
              <div className="welcome-name">{member.frat_name}</div>
              <p className="gate-copy">
                Welcome, brother. The one-time password has been verified. 
                Now create your personal password to secure your access going forward.
              </p>
              <div className="gate-divider" />
              {error && <div className="login-error">{error}</div>}
              <form className="gate-form" onSubmit={handleCreatePassword}>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Create a password (min 6 chars)" required />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm your password" required />
                </div>
                <button type="submit" className="gate-submit" disabled={loading}>{loading ? 'Setting up...' : 'Set Password & Enter'}</button>
              </form>
            </>
          )}

          {step === 'logged-in' && member && (
            <div className="session-panel">
              <p className="gate-label">Seal Recognised</p>
              <h2 className="gate-title">The Gate Opens</h2>
              <div className="session-name">{member.frat_name}</div>
              <div className="session-role">{member.role}</div>
              <p className="gate-copy">{member.sl_name}</p>
              <div className="session-links">
                <a href="/dashboard">Dashboard</a>
              </div>
              <button className="session-logout" onClick={handleLogout}>Sign out</button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
