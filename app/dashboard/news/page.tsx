'use client';
import { useState, useEffect, useRef } from 'react';
import '../dash.css';
import DashSidebar from '../DashSidebar';
import './news.css';

const LEADERS = ['Head Founder', 'Co-Founder', 'Iron Fleet'];
const AUTO_ADVANCE_MS = 6000;

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
}

function Initial({ name, size = 34 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg,#1a2236,#0d1520)',
      border: '1.5px solid rgba(198,147,10,.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--cinzel)', fontSize: size * .3 + 'px',
      color: 'var(--gold)', flexShrink: 0, letterSpacing: 0,
    }}>{(name || 'L')[0].toUpperCase()}</div>
  );
}

export default function NewsPage() {
  const [member, setMember]   = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [role, setRole]       = useState('');
  const [news, setNews]       = useState<any[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [composing, setComposing] = useState(false);
  const [form, setForm]       = useState({ title: '', content: '', pinned: false });
  const [posting, setPosting] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    fetch('/api/dashboard/profile').then(r => r.json()).then(d => {
      if (d.error) { window.location.href = '/login'; return; }
      setMember(d.member); setProfile(d.profile);
    });
    loadNews();
  }, []);

  useEffect(() => {
    const poll = setInterval(() => {
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;
      loadNews();
    }, 30000);
    return () => clearInterval(poll);
  }, []);

  // Auto-advance through dispatches
  useEffect(() => {
    if (news.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIdx(i => (i + 1) % news.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timerRef.current);
  }, [news.length]);

  function selectDispatch(idx: number) {
    setActiveIdx(idx);
    // Reset timer on manual select
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIdx(i => (i + 1) % news.length);
    }, AUTO_ADVANCE_MS);
  }

  async function loadNews() {
    const d = await fetch('/api/dashboard/news').then(r => r.json());
    setNews(d.news || []); setRole(d.role || '');
  }

  async function post() {
    if (!form.title || !form.content) return;
    setPosting(true);
    await fetch('/api/dashboard/news', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setComposing(false); setForm({ title: '', content: '', pinned: false });
    await loadNews(); setPosting(false);
  }

  if (!member) return <div className="dash-loading">LOADING...</div>;

  const canPost = LEADERS.includes(role);
  const featured = news[activeIdx] || null;
  const now = new Date();
  const thisMonth = news.filter(n => {
    const d = new Date(n.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />

      <main className="dash-main">
        {/* Header */}
        <div className="dash-page-header">
          <div className="dash-page-title">Wokou News</div>
          {canPost && (
            <button className="dash-btn gold-ghost" onClick={() => setComposing(v => !v)}>
              {composing ? '✕ Cancel' : '+ New Post'}
            </button>
          )}
        </div>

        {/* Compose form */}
        {composing && (
          <div className="nw-compose">
            <div className="nw-compose-hdr"><span className="nw-compose-title">New Dispatch</span></div>
            <div className="nw-compose-body">
              <div>
                <label className="nw-field-label">Title</label>
                <input className="nw-field-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Dispatch title..." />
              </div>
              <div>
                <label className="nw-field-label">Content</label>
                <textarea className="nw-field-textarea" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your announcement..." />
              </div>
              <div className="nw-compose-foot">
                <label className="nw-pin-label">
                  <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} style={{ accentColor: 'var(--gold)' }} />
                  Pin this dispatch
                </label>
                <button className="nw-post-btn" onClick={post} disabled={posting}>{posting ? 'Posting...' : 'Post Dispatch →'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Masthead */}
        <div className="nw-masthead">
          <div className="nw-masthead-title">The Wokou Gazette</div>
          <div className="nw-masthead-sub">Official Dispatches of Kappa Theta Phi II · Wokou-Corsairs</div>
          <div className="nw-masthead-line" />
        </div>

        {news.length === 0 && <div className="nw-empty">No dispatches yet.</div>}

        {news.length > 0 && featured && (
          <div className="nw-body">

            {/* LEFT: Featured dispatch */}
            <div className="nw-lead">
              <div className="nw-lead-meta">
                <span className="nw-dispatched-badge">Dispatched</span>
                <span className="nw-lead-date">{fmtDate(featured.created_at)}</span>
                {featured.posted_by_name && <span className="nw-lead-byauthor">· {featured.posted_by_name}</span>}
                {featured.pinned && <span className="nw-pinned-badge">Pinned</span>}
              </div>

              <h2 className="nw-lead-title">{featured.title}</h2>

              <blockquote className="nw-lead-content">{featured.content}</blockquote>

              {/* Progress dots */}
              {news.length > 1 && (
                <div className="nw-progress-dots">
                  {news.map((_: any, i: number) => (
                    <div
                      key={i}
                      className={`nw-dot${i === activeIdx ? ' active' : ''}`}
                      onClick={() => selectDispatch(i)}
                    />
                  ))}
                </div>
              )}

              <div className="nw-lead-footer">
                <Initial name={featured.posted_by_name || 'L'} size={40} />
                <div>
                  <div className="nw-author-name">{featured.posted_by_name || 'Leadership'}</div>
                  {featured.posted_by_role && <div className="nw-author-role">{featured.posted_by_role}</div>}
                </div>
              </div>
            </div>

            {/* RIGHT: All dispatches list */}
            <div className="nw-stack">
              {news.map((n: any, i: number) => (
                <div
                  key={n.id}
                  className={`nw-item${i === activeIdx ? ' active' : ''}`}
                  onClick={() => selectDispatch(i)}
                >
                  <div className="nw-item-header">
                    <Initial name={n.posted_by_name || 'L'} size={28} />
                    <span className="nw-item-date">{fmtDate(n.created_at)}</span>
                    {n.pinned && <span className="nw-pinned-badge" style={{ fontSize: '.52rem', padding: '2px 7px' }}>Pinned</span>}
                  </div>
                  <div className="nw-item-title">{n.title}</div>
                  <div className="nw-item-content">{n.content}</div>
                  <div className="nw-item-byline">{n.posted_by_name || 'Leadership'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {news.length > 0 && (
          <div className="nw-footer">
            <span>{thisMonth} dispatch{thisMonth !== 1 ? 'es' : ''} this month</span>
            <span>Death Before Dishonor · Est. 3·14·21</span>
          </div>
        )}
      </main>
    </div>
  );
}
