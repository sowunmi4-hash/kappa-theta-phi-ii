'use client';
import { useState, useEffect, useRef } from 'react';
import './login.css';
import '../public.css';
import PublicNav from '../components/PublicNav';

export default function LoginPage() {
  const [step, setStep] = useState<'login' | 'create-password' | 'logged-in' | 'checking'>('checking');
  const [fratName, setFratName] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [member, setMember] = useState<any>(null);
  const dustRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { checkSession(); }, []);

  useEffect(() => {
    // Particle dust drift
    const canvas = dustRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const motes = Array.from({ length: 24 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.1,
      vy: -(Math.random() * 0.3 + 0.1),
      r: Math.random() * 1.4 + 0.4,
      a: Math.random() * 0.4 + 0.1,
      t: Math.random() * Math.PI * 2,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      motes.forEach(m => {
        m.x += m.vx; m.y += m.vy; m.t += 0.008;
        if (m.y < -10) { m.y = window.innerHeight + 10; m.x = Math.random() * window.innerWidth; }
        const alpha = m.a * (0.6 + Math.sin(m.t) * 0.4);
        ctx.fillStyle = `rgba(198,147,10,${alpha})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  async function checkSession() {
    try {
      const r = await fetch('/api/verify-session', { credentials: 'include' });
      const d = await r.json();
      if (r.ok && d.authenticated) { window.location.href = '/dashboard'; return; }
    } catch {}
    setStep('login'); // Show login form only after session check completes
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const r = await fetch('/api/verify-login', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frat_name: fratName, password, remember_me: rememberMe })
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
      <div className="kanji-watermarks">
        <span className="k1">門</span>
        <span className="k2">入</span>
        <span className="k3">鍵</span>
      </div>

      <canvas ref={dustRef} id="login-dust"></canvas>

      <PublicNav/>
      <div className="pub-kanji" aria-hidden="true">
        <span className="k1">⚓</span>
        <span className="k2">武</span>
        <span className="k3">海</span>
      </div>

      <main className="login-page">

        <div className="gate-card">
          <span className="gc-tl"></span><span className="gc-tr"></span>
          <span className="gc-bl"></span><span className="gc-br"></span>

          {/* Logo plate */}
          <div className="gate-logo-wrap">
            <span className="gl-tl"></span><span className="gl-tr"></span>
            <span className="gl-bl"></span><span className="gl-br"></span>
            <img src="/logo.png" alt="KΘΦ II" className="gate-logo" />
          </div>

          {/* ── STATE 1: LOGIN ── */}
          {step === 'login' && (
            <>
              <div className="gate-label">Brotherhood Access</div>
              <h2 className="gate-title">Enter the Gate</h2>
              <p className="gate-copy">
                Enter your Big Brother name and password to access the brotherhood.
                First time logging in? Use the one-time password: <strong>KTF2026</strong>
              </p>
              <div className="gate-divider"></div>

              {error && <div className="login-error">⚠ {error}</div>}

              <form className="gate-form" onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Big Brother Name</label>
                  <input
                    type="text"
                    value={fratName}
                    onChange={e => setFratName(e.target.value)}
                    placeholder="e.g. Big Brother Tactician"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <label className={`remember${rememberMe ? ' checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{position:'absolute',opacity:0,width:0,height:0}}
                  />
                  <span className="remember-box"><span>✓</span></span>
                  <span className="remember-text">Remember me for 30 days</span>
                </label>

                <button type="submit" className="gate-submit" disabled={loading}>
                  {loading ? 'Verifying...' : 'Enter →'}
                </button>
              </form>

              <p className="gate-note">Access is granted only to verified brothers of KΘΦ II.</p>
            </>
          )}

          {/* ── STATE 2: CREATE PASSWORD ── */}
          {step === 'create-password' && member && (
            <>
              <div className="gate-label">First Time Setup</div>
              <h2 className="gate-title">Create Your Password</h2>
              <div className="welcome-name">{member.frat_name}</div>
              <p className="gate-copy">
                Welcome, brother. The one-time password has been verified.
                Now create your personal password to secure your access going forward.
              </p>
              <div className="gate-divider"></div>

              {error && <div className="login-error">⚠ {error}</div>}

              <form className="gate-form" onSubmit={handleCreatePassword}>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Create a password (min 6 chars)"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                  />
                </div>

                <button type="submit" className="gate-submit" disabled={loading}>
                  {loading ? 'Setting up...' : 'Set Password & Enter →'}
                </button>
              </form>
            </>
          )}

          {/* ── STATE 3: LOGGED IN — wax-seal moment ── */}
          {step === 'logged-in' && member && (
            <div className="session-panel">
              <div className="seal-wrap">
                <div className="seal-disc">✓</div>
              </div>
              <div className="gate-label">Seal Recognised</div>
              <h2 className="gate-title">The Gate Opens</h2>
              <div className="session-name">{member.frat_name}</div>
              <div className="session-role">{member.role}</div>
              {member.sl_name && <p className="session-sl">{member.sl_name}</p>}

              <div className="session-links">
                <a href="/dashboard" className="session-cta">Enter Dashboard →</a>
                <button className="session-logout" onClick={handleLogout}>Sign Out</button>
              </div>
            </div>
          )}

        </div>

      </main>
    </>
  );
}
