'use client';
import { useState, useEffect } from 'react';
import '../dashboard.css';

const FOUNDER_ROLES = ['Head Founder', 'Co-Founder', 'Iron Fleet'];

export default function WokouNews() {
  const [member, setMember] = useState<any>(null);
  const [role, setRole] = useState('');
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', pinned: false });
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard/profile').then(r => r.json()).then(d => {
      if (d.error) { window.location.href = '/login'; return; }
      setMember(d.member);
    });
    fetch('/api/dashboard/news').then(r => r.json()).then(d => {
      setNews(d.news || []);
      setRole(d.role || '');
      setLoading(false);
    });
  }, []);

  async function postNews() {
    if (!form.title || !form.content) return;
    setPosting(true);
    const res = await fetch('/api/dashboard/news', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.success) {
      setComposing(false);
      setForm({ title: '', content: '', pinned: false });
      const updated = await fetch('/api/dashboard/news').then(r => r.json());
      setNews(updated.news || []);
    }
    setPosting(false);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c6930a', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '3px' }}>LOADING...</div>
  );

  return (
    <div className="dash-root">
      <nav className="dash-nav">
        <div className="dash-nav-brand">KΘΦ II</div>
        <div className="dash-nav-links">
          <a href="/dashboard">← Dashboard</a>
          <a href="/dashboard/gallery">My Gallery</a>
          <a href="/dashboard/edit">Edit Profile</a>
        </div>
      </nav>

      <div className="news-wrap">
        <div className="news-header">
          <div className="news-title">📰 Wokou News</div>
          {FOUNDER_ROLES.includes(role) && (
            <button className="dash-btn dash-btn-gold" onClick={() => setComposing(v => !v)}>
              {composing ? '✕ Cancel' : '+ Post News'}
            </button>
          )}
        </div>

        {composing && (
          <div className="news-compose">
            <div className="dash-field-group">
              <label className="dash-label">Title</label>
              <input className="dash-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="News title..." />
            </div>
            <div className="dash-field-group">
              <label className="dash-label">Content</label>
              <textarea className="dash-textarea" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your announcement..." style={{ minHeight: '140px' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(245,240,232,0.7)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} />
                Pin this post
              </label>
              <button className="dash-btn dash-btn-gold" onClick={postNews} disabled={posting}>
                {posting ? '⏳ Posting...' : '📤 Post'}
              </button>
            </div>
          </div>
        )}

        {news.length === 0 && (
          <div className="dash-card" style={{ textAlign: 'center', color: 'rgba(245,240,232,0.4)' }}>
            No news yet. Check back soon.
          </div>
        )}

        {news.map(n => (
          <div key={n.id} className={`news-item ${n.pinned ? 'pinned' : ''}`}>
            <div className="news-item-title">
              {n.pinned && <span className="news-pin-badge">📌 PINNED</span>}
              {n.title}
            </div>
            <div className="news-item-content">{n.content}</div>
            <div className="news-item-meta">
              Posted by {n.posted_by_name || 'Leadership'} · {new Date(n.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
