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
  const [title, setTitle]     = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned]   = useState(false);
  const [posting, setPosting] = useState(false);
  const [postErr, setPostErr] = useState('');
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

  useEffect(() => {
    if (news.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIdx(i => (i + 1) % news.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timerRef.current);
  }, [news.length]);

  function selectDispatch(idx: number) {
    setActiveIdx(idx);
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
    setPostErr('');
    if (!title.trim()) { setPostErr('Title is required.'); return; }
    if (!content.trim()) { setPostErr('Content is required.'); return; }
    setPosting(true);
    try {
      const res = await fetch('/api/dashboard/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), pinned }),
      }).then(r => r.json());
      if (res.error) { setPostErr(res.error); setPosting(false); return; }
      setComposing(false);
      setTitle(''); setContent(''); setPinned(false);
      await loadNews();
      setActiveIdx(0);
    } catch (e) {
      setPostErr('Failed to post. Try again.');
    }
    setPosting(false);
  }

  function cancelCompose() {
    setComposing(false);
    setTitle(''); setContent(''); setPinned(false); setPostErr('');
  }

  if (!member) return <div className="dash-loading">LOADING...</div>;

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
          <button className="dash-btn gold-ghost" onClick={() => composing ? cancelCompose() : setComposing(true)}>
            {composing ? '✕ Cancel' : '+ New Post'}
          </button>
        </div>

        {/* ── COMPOSE FORM ── */}
        {composing && (
          <div className="nw-compose-panel">
            <div className="nw-compose-inner">
              <div className="nw-compose-hdr">
                <span className="nw-compose-eyebrow">New Dispatch</span>
                <button className="nw-compose-x" onClick={cancelCompose}>✕</button>
              </div>

              <div className="nw-compose-fields">
                <div className="nw-compose-field full">
                  <label className="nw-compose-label">Dispatch Title *</label>
                  <input
                    className="nw-compose-input"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. LOONAPALOOSA II — Official Announcement"
                  />
                </div>

                <div className="nw-compose-field full">
                  <label className="nw-compose-label">Content *</label>
                  <textarea
                    className="nw-compose-textarea"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Write your dispatch for the brotherhood..."
                  />
                </div>

                <div className="nw-compose-foot">
                  <label className="nw-compose-pin">
                    <input
                      type="checkbox"
                      checked={pinned}
                      onChange={e => setPinned(e.target.checked)}
                      style={{ accentColor: 'var(--gold)' }}
                    />
                    <span>Pin this dispatch</span>
                  </label>

                  {postErr && <span className="nw-compose-err">{postErr}</span>}

                  <button
                    className="nw-compose-submit"
                    onClick={post}
                    disabled={posting || !title.trim() || !content.trim()}
                  >
                    {posting ? 'Posting...' : 'Post Dispatch →'}
                  </button>
                </div>
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

        {news.length === 0 && <div className="nw-empty">No dispatches yet. Be the first to post.</div>}

        {news.length > 0 && featured && (
          <div className="nw-body">
            {/* LEFT: Featured */}
            <div className="nw-lead">
              <div className="nw-lead-meta">
                <span className="nw-dispatched-badge">Dispatched</span>
                <span className="nw-lead-date">{fmtDate(featured.created_at)}</span>
                {featured.posted_by_name && <span className="nw-lead-byauthor">· {featured.posted_by_name}</span>}
                {featured.pinned && <span className="nw-pinned-badge">Pinned</span>}
              </div>

              <h2 className="nw-lead-title">{featured.title}</h2>
              <blockquote className="nw-lead-content">{featured.content}</blockquote>

              {news.length > 1 && (
                <div className="nw-progress-dots">
                  {news.map((_: any, i: number) => (
                    <div key={i} className={`nw-dot${i === activeIdx ? ' active' : ''}`} onClick={() => selectDispatch(i)} />
                  ))}
                </div>
              )}

              <div className="nw-lead-footer">
                <Initial name={featured.posted_by_name || 'L'} size={40} />
                <div className="nw-author-info">
                  <div className="nw-author-name">
                    {featured.posted_by_name || 'Leadership'}
                    {featured.posted_by_role && <span className="nw-author-sep"> · {featured.posted_by_role}</span>}
                  </div>
                </div>
                {(featured.posted_by_name === member?.frat_name || LEADERS.includes(role)) && (
                  <button className="nw-delete-btn" onClick={async () => {
                    if (!confirm('Delete this dispatch?')) return;
                    const res = await fetch('/api/dashboard/news', {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: featured.id }),
                    }).then(r => r.json());
                    if (res.error === 'Window expired') {
                      alert('Dispatches can only be deleted within 24 hours of posting.');
                      return;
                    }
                    setActiveIdx(0);
                    await loadNews();
                  }}>Delete</button>
                )}
              </div>
            </div>

            {/* RIGHT: All dispatches */}
            <div className="nw-stack">
              {news.map((n: any, i: number) => (
                <div key={n.id} className={`nw-item${i === activeIdx ? ' active' : ''}`} onClick={() => selectDispatch(i)}>
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
