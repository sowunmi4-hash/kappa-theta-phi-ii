'use client';
import { useState, useEffect } from 'react';
import '../dash.css';



const LEADERS = ['Head Founder','Co-Founder','Co-Founder','Iron Fleet'];
const NAV = [
  { href: '/dashboard', label: 'Home' },
  { href: '/dashboard/news', label: 'Wokou News' },
  { href: '/dashboard/events', label: 'Events' },
  { href: '/dashboard/phire', label: 'PHIRE' },
  { href: '/dashboard/discipline', label: 'Discipline' },
    { href: '/dashboard/ssp', label: 'Sage Solution' },
  { href: '/dashboard/dues', label: 'Dues' },
    { href: '/dashboard/gallery', label: 'My Gallery' },
  { href: '/dashboard/edit', label: 'Edit Profile' },
];

export default function NewsPage() {
  const [member, setMember] = useState<any>(null);
  const [role, setRole] = useState('');
  const [news, setNews] = useState<any[]>([]);
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
    });
  }, []);

  // POLLING
  useEffect(() => {
    const poll = setInterval(() => {
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement || document.activeElement instanceof HTMLSelectElement) return;
      fetch('/api/dashboard/news').then(r => r.json()).then(d => { setNews(d.news||[]); setRole(d.role||''); });
    }, 30000);
    return () => clearInterval(poll);
  }, []);

  async function post() {
    if (!form.title || !form.content) return;
    setPosting(true);
    await fetch('/api/dashboard/news', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setComposing(false);
    setForm({ title: '', content: '', pinned: false });
    const d = await fetch('/api/dashboard/news').then(r => r.json());
    setNews(d.news || []);
    setPosting(false);
  }

  if (!member) return <div className="dash-loading">LOADING...</div>;
  const slug = member.frat_name?.toLowerCase().replace(/\s+/g,'-').replace('big-brother-','') || '';
  const portrait = `/brothers/${slug}.png`;

  return (
    <div className="dash-app">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-logo">
          <img src="/logo.png" alt="KΘΦ II" />
          <span className="dash-sidebar-logo-text">KΘΦ II</span>
        </div>
        <div className="dash-sidebar-member">
          <div className="dash-sidebar-portrait"><img src={portrait} alt="" onError={(e:any)=>e.target.src='/logo.png'}/></div>
          <div className="dash-sidebar-name">{member.frat_name}</div>
          <div className="dash-sidebar-role">{member.role}</div>
        </div>
        <nav className="dash-nav">
          {NAV.map(n => <a key={n.href} href={n.href} className={`dash-nav-item ${n.href==='/dashboard/news'?'active':''}`}><span>{n.label}</span></a>)}
          {(member?.fraction === 'Ishi No Fraction' || member?.frat_name === 'Big Brother Substance') && (
            <a href="/dashboard/dues-report" className="dash-nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              <span>Dues Report</span>
            </a>
          )}
          <div className="dash-nav-divider"/>
          <a href="/" className="dash-nav-item"><span>Back to Site</span></a>
            <button onClick={async()=>{await fetch('/api/logout',{method:'POST'});window.location.href='/login';}} className="dash-nav-item" style={{width:'100%',textAlign:'left',background:'none',border:'none',cursor:'pointer',color:'#e05070',fontFamily:'inherit'}}><span>Sign Out</span></button>
        </nav>
      </aside>
      <main className="dash-main">
        <div className="page-wrap">
          <div className="page-title">
            Wokou News
            {LEADERS.includes(role) && (
              <button className="btn btn-gold" onClick={() => setComposing(v => !v)}>
                {composing ? '✕ Cancel' : '+ Post'}
              </button>
            )}
          </div>

          {composing && (
            <div className="news-compose">
              <div className="field-group">
                <label className="field-label">Title</label>
                <input className="field-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title..." />
              </div>
              <div className="field-group">
                <label className="field-label">Content</label>
                <textarea className="field-textarea" style={{ minHeight: '120px' }} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your announcement..." />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'rgba(240,232,208,0.6)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} />
                  Pin this post
                </label>
                <button className="btn btn-gold" onClick={post} disabled={posting}>{posting ? 'Posting...' : 'Post'}</button>
              </div>
            </div>
          )}

          {news.length === 0 && <div className="news-empty">No news posted yet.</div>}
          {news.map(n => (
            <div key={n.id} className={`news-item ${n.pinned ? 'pinned' : ''}`}>
              <div className="news-item-title">
                {n.pinned && <span className="news-pin">PINNED</span>}
                {n.title}
              </div>
              <div className="news-item-content">{n.content}</div>
              <div className="news-item-meta">
                {n.posted_by_name || 'Leadership'} · {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
