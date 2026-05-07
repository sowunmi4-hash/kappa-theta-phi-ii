'use client';
import { useState, useEffect } from 'react';
import '../dash.css';
import DashSidebar from '../DashSidebar';

const LEADERS = ['Head Founder', 'Co-Founder', 'Iron Fleet'];

export default function NewsPage() {
  const [member, setMember] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [role, setRole]     = useState('');
  const [news, setNews]     = useState<any[]>([]);
  const [composing, setComposing] = useState(false);
  const [form, setForm]     = useState({ title: '', content: '', pinned: false });
  const [posting, setPosting] = useState(false);

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

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />

      <main className="dash-main">
        {/* Page header */}
        <div className="dash-page-header">
          <div className="dash-page-title">Wokou News</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            {canPost && (
              <button className="dash-btn gold-ghost" onClick={() => setComposing(v => !v)}>
                {composing ? '✕ Cancel' : '+ New Post'}
              </button>
            )}
          </div>
        </div>

        <div className="dash-page">
          {/* Compose form */}
          {composing && (
            <div className="dash-hero-card" style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
              <span className="dash-corner tl" /><span className="dash-corner tr" />
              <span className="dash-corner bl" /><span className="dash-corner br" />
              <div style={{ fontFamily: 'var(--cinzel)', fontSize: '.42rem', letterSpacing: '4px', color: 'rgba(198,147,10,.5)', textTransform: 'uppercase' }}>New Dispatch</div>
              <div>
                <label className="dash-field-label">Title</label>
                <input className="dash-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Dispatch title..." />
              </div>
              <div>
                <label className="dash-field-label">Content</label>
                <textarea className="dash-textarea" style={{ minHeight: '110px' }} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your announcement..." />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--cinzel)', fontSize: '.4rem', letterSpacing: '2px', color: 'var(--bone-dim)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} style={{ accentColor: 'var(--gold)' }} />
                  Pin this dispatch
                </label>
                <button className="dash-btn gold-solid" onClick={post} disabled={posting}>{posting ? 'Posting...' : 'Post Dispatch'}</button>
              </div>
            </div>
          )}

          {/* Newspaper masthead */}
          <div style={{
            textAlign: 'center', padding: '.9rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', bottom: '-1px', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '2px', background: 'linear-gradient(90deg,transparent,var(--gold),transparent)' }} />
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.4rem', letterSpacing: '8px', color: 'var(--bone)', textTransform: 'uppercase' }}>The Wokou Gazette</div>
            <div style={{ fontFamily: 'var(--cinzel)', fontSize: '.42rem', letterSpacing: '4px', color: 'var(--bone-faint)', textTransform: 'uppercase', marginTop: '.3rem' }}>Official Dispatches of Kappa Theta Phi II · Wokou-Corsairs</div>
          </div>

          {news.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', fontFamily: 'var(--cinzel)', fontSize: '.5rem', letterSpacing: '3px', color: 'var(--bone-faint)' }}>No dispatches yet.</div>
          )}

          {/* Lead story */}
          {news.length > 0 && (() => {
            const lead = news[0];
            const rest = news.slice(1);
            return (
              <>
                {/* Featured lead */}
                <div className="dash-hero-card" style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                  <span className="dash-corner tl" /><span className="dash-corner tr" />
                  <span className="dash-corner bl" /><span className="dash-corner br" />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
                    {lead.pinned && (
                      <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.38rem', letterSpacing: '1px', background: 'var(--gold)', color: 'var(--deep)', padding: '2px 8px', borderRadius: '2px', fontWeight: 700 }}>PINNED</span>
                    )}
                    <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.4rem', letterSpacing: '3px', color: 'rgba(198,147,10,.5)', textTransform: 'uppercase' }}>
                      {new Date(lead.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.35rem', letterSpacing: '3px', color: 'var(--bone)', lineHeight: 1.15 }}>{lead.title}</div>
                  <div style={{ fontSize: '.9rem', color: 'var(--bone-dim)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{lead.content}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', paddingTop: '.7rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg,#1a2236,#0d1520)', border: '1px solid rgba(198,147,10,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.5rem', color: 'var(--gold)', flexShrink: 0 }}>
                      {(lead.posted_by_name || 'L')[0]}
                    </div>
                    <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.4rem', letterSpacing: '2px', color: 'var(--bone-faint)' }}>{lead.posted_by_name || 'Leadership'}</span>
                  </div>
                </div>

                {/* Remaining — two column grid */}
                {rest.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: rest.length === 1 ? '1fr' : '1fr 1fr', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)' }}>
                    {rest.map((n: any, i: number) => (
                      <div key={n.id} style={{ background: 'var(--surface)', padding: '1rem 1.1rem', position: 'relative', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                        <span className="dash-corner tl" /><span className="dash-corner br" />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                          {n.pinned && <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.36rem', letterSpacing: '1px', background: 'var(--gold)', color: 'var(--deep)', padding: '1px 6px', borderRadius: '2px' }}>PINNED</span>}
                          <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.38rem', letterSpacing: '2px', color: 'var(--bone-faint)' }}>{new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div style={{ fontFamily: 'var(--display)', fontSize: '1rem', letterSpacing: '2px', color: 'var(--bone)', lineHeight: 1.2 }}>{n.title}</div>
                        <div style={{ fontSize: '.84rem', color: 'var(--bone-dim)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{n.content}</div>
                        <div style={{ marginTop: 'auto', paddingTop: '.5rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'linear-gradient(135deg,#1a2236,#0d1520)', border: '1px solid rgba(198,147,10,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.42rem', color: 'var(--gold)' }}>
                            {(n.posted_by_name || 'L')[0]}
                          </div>
                          <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.38rem', letterSpacing: '1px', color: 'var(--bone-faint)' }}>{n.posted_by_name || 'Leadership'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer bar */}
                <div style={{ padding: '.65rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.38rem', letterSpacing: '2px', color: 'var(--bone-faint)' }}>{news.length} dispatch{news.length !== 1 ? 'es' : ''}</span>
                  <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.38rem', letterSpacing: '2px', color: 'rgba(198,147,10,.3)' }}>Death Before Dishonor · Est. 3·14·21</span>
                </div>
              </>
            );
          })()}
        </div>
      </main>
    </div>
  );
}
