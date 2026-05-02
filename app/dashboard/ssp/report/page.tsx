'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import '../ssp.css';

const LESSONS = [
  { key: 'lesson_1', title: 'What Brotherhood Really Means' },
  { key: 'lesson_2', title: 'Respect: The Foundation of Character' },
  { key: 'lesson_3', title: 'Accountability: Owning Your Actions' },
  { key: 'lesson_4', title: 'Public Behavior = Public Representation' },
  { key: 'lesson_5', title: 'Emotional Control & Decision Making' },
  { key: 'lesson_6', title: 'Rebuilding Trust' },
  { key: 'reflections_done', title: 'Final Reflection' },
];

const COLORS: Record<string, string> = {
  grey: '#a0a0b4', navy_blue: '#3c64c8', gold: '#c6930a', crimson_red: '#e05070',
};

function progressPct(ssp: any) {
  const done = LESSONS.filter(l => l.key === 'reflections_done' ? ssp.reflections_done : ssp[l.key]).length;
  return Math.round((done / 7) * 100);
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const NAV = [
  { href: '/dashboard', label: 'Home' },
  { href: '/dashboard/news', label: 'Wokou News' },
  { href: '/dashboard/events', label: 'Events' },
  { href: '/dashboard/phire', label: 'PHIRE' },
  { href: '/dashboard/gallery', label: 'My Gallery' },
  { href: '/dashboard/edit', label: 'Edit Profile' },
];

export default function SSPReportPage() {
  const [member, setMember] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed' | 'opted_out'>('all');

  useEffect(() => {
    fetch('/api/dashboard/phire/balance').then(r => r.json()).then(d => {
      if (d.error) { window.location.href = '/login'; return; }
      const m = d.member;
      const canManage = m?.fraction === 'Ishi No Fraction' || m?.role === 'Head Founder' || m?.role === 'Co-Founder';
      if (!canManage) { window.location.href = '/dashboard'; return; }
      setMember(m);
      fetch('/api/dashboard/ssp/report').then(r => r.json()).then(rd => {
        setReport(rd);
        setLoading(false);
      });
    });
  }, []);

  if (!member || loading) return <div className="dash-loading">LOADING...</div>;

  const slug = member.frat_name?.toLowerCase().replace(/\s+/g, '-').replace('big-brother-', '') || '';
  const { ssps = [], summary = {} } = report || {};

  const filtered = ssps.filter((s: any) => {
    if (filter === 'all') return true;
    if (filter === 'completed') return s.cleared;
    if (filter === 'opted_out') return s.status === 'opted_out';
    if (filter === 'in_progress') return !s.cleared && s.status !== 'opted_out';
    return true;
  });

  return (
    <div className="dash-app">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-logo"><img src="/logo.png" alt="KΘΦ II" /><span className="dash-sidebar-logo-text">KΘΦ II</span></div>
        <div className="dash-sidebar-member">
          <div className="dash-sidebar-portrait"><img src={`/brothers/${slug}.png`} alt="" onError={(e: any) => e.target.src = '/logo.png'} /></div>
          <div className="dash-sidebar-name">{member.frat_name}</div>
          <div className="dash-sidebar-role">{member.role}</div>
        </div>
        <nav className="dash-nav">
          {NAV.map(n => <a key={n.href} href={n.href} className="dash-nav-item"><span>{n.label}</span></a>)}
          <a href="/dashboard/ssp" className="dash-nav-item"><span>Sage Solution</span></a>
          <a href="/dashboard/ssp/report" className="dash-nav-item active"><span>SSP Report</span></a>
          {(member?.fraction === 'Ishi No Fraction' || member?.frat_name === 'Big Brother Substance') && (
            <a href="/dashboard/dues-report" className="dash-nav-item"><span>Dues Report</span></a>
          )}
          <div className="dash-nav-divider" />
          <a href="/" className="dash-nav-item"><span>Back to Site</span></a>
          <button onClick={async () => { await fetch('/api/logout', { method: 'POST' }); window.location.href = '/login'; }} className="dash-nav-item" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: '#e05070', fontFamily: 'inherit' }}><span>Sign Out</span></button>
        </nav>
      </aside>

      <main className="dash-main">
        {/* Header */}
        <div style={{ padding: '2rem 2rem 1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.55rem', letterSpacing: '3px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '4px' }}>Ishi No Faction · Confidential</div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '2rem', letterSpacing: '4px', color: 'var(--bone)' }}>Sage Solution Report</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '4px' }}>Full session history · All brothers · All facilitators</div>
        </div>

        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', padding: '1.5rem 2rem' }}>
          {[
            { label: 'Total Programs', val: summary.total || 0, color: 'var(--bone)' },
            { label: 'In Progress', val: summary.in_progress || 0, color: '#60a5fa' },
            { label: 'Completed', val: summary.completed || 0, color: '#4ade80' },
            { label: 'Opted Out', val: summary.opted_out || 0, color: '#e05070' },
            { label: 'Sessions Held', val: summary.total_sessions_conducted || 0, color: 'var(--gold)' },
            { label: 'Failed Sessions', val: summary.failed_sessions || 0, color: '#e05070' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '2rem', color: s.color, letterSpacing: '2px' }}>{s.val}</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', padding: '0 2rem 1.5rem', flexWrap: 'wrap' }}>
          {(['all', 'in_progress', 'completed', 'opted_out'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '5px 14px', borderRadius: '20px', border: '1px solid', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase',
                background: filter === f ? 'rgba(198,147,10,0.15)' : 'var(--surface)',
                borderColor: filter === f ? 'rgba(198,147,10,0.4)' : 'var(--border)',
                color: filter === f ? 'var(--gold)' : 'var(--muted)' }}>
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* SSP Records */}
        <div style={{ padding: '0 2rem 3rem' }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)', fontSize: '0.85rem' }}>No records found.</div>
          )}
          {filtered.map((ssp: any) => {
            const pct = progressPct(ssp);
            const isOpen = expanded === ssp.id;
            return (
              <div key={ssp.id} style={{ background: 'var(--surface)', border: `1px solid ${isOpen ? 'var(--gold)' : 'var(--border)'}`, borderRadius: '12px', marginBottom: '12px', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                {/* Row header - always visible */}
                <div onClick={() => setExpanded(isOpen ? null : ssp.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '1rem 1.2rem', cursor: 'pointer' }}>
                  {/* Avatar / color indicator */}
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${COLORS[ssp.violation?.offense_color] || 'var(--muted)'}22`, border: `2px solid ${COLORS[ssp.violation?.offense_color] || 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem', fontWeight: 700, color: COLORS[ssp.violation?.offense_color] || 'var(--muted)' }}>
                    {ssp.member_name?.split(' ').pop()?.charAt(0) || '?'}
                  </div>
                  {/* Name + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--bone)', fontSize: '0.95rem' }}>{ssp.member_name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '2px' }}>
                      Offer {ssp.offer_number} of 3 · {ssp.violation?.offense_color?.replace('_', ' ').toUpperCase() || '—'} card · Started {fmt(ssp.created_at)}
                    </div>
                  </div>
                  {/* Progress */}
                  <div style={{ textAlign: 'center', minWidth: '60px' }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.85rem', color: ssp.cleared ? '#4ade80' : 'var(--gold)', fontWeight: 700 }}>{pct}%</div>
                    <div style={{ height: '3px', background: 'var(--raised)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: ssp.cleared ? '#4ade80' : 'var(--gold)', borderRadius: '2px' }} />
                    </div>
                  </div>
                  {/* Status badge */}
                  <div style={{ fontSize: '0.6rem', letterSpacing: '2px', padding: '3px 10px', borderRadius: '20px', fontWeight: 700, textTransform: 'uppercase', border: '1px solid', flexShrink: 0,
                    ...(ssp.cleared ? { color: '#4ade80', borderColor: 'rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.08)' }
                      : ssp.status === 'opted_out' ? { color: '#e05070', borderColor: 'rgba(224,80,112,0.3)', background: 'rgba(224,80,112,0.08)' }
                      : { color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)', background: 'rgba(96,165,250,0.08)' }) }}>
                    {ssp.cleared ? 'Completed' : ssp.status === 'opted_out' ? 'Opted Out' : 'In Progress'}
                  </div>
                  {/* Sessions count */}
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', minWidth: '60px', textAlign: 'right', flexShrink: 0 }}>
                    {ssp.sessions.length} session{ssp.sessions.length !== 1 ? 's' : ''}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>{isOpen ? '▲' : '▼'}</div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '1.2rem' }}>
                    {/* Lesson completion grid */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '0.6rem', letterSpacing: '3px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Session Checklist</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {LESSONS.map(l => {
                          const done = l.key === 'reflections_done' ? ssp.reflections_done : ssp[l.key];
                          const sessionLog = ssp.sessions.find((s: any) => s.lesson_key === l.key);
                          return (
                            <div key={l.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '0.6rem 0.8rem', background: done ? 'rgba(74,222,128,0.04)' : 'var(--raised)', borderRadius: '8px', border: `1px solid ${done ? 'rgba(74,222,128,0.15)' : 'var(--border)'}` }}>
                              <span style={{ fontSize: '0.75rem', minWidth: '16px', color: done ? '#4ade80' : 'var(--muted)', marginTop: '1px' }}>{done ? '✓' : '○'}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.82rem', color: done ? 'var(--bone)' : 'var(--muted)', fontWeight: done ? 600 : 400 }}>{l.title}</div>
                                {sessionLog && (
                                  <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '3px' }}>
                                    Conducted by <strong style={{ color: 'rgba(240,232,208,0.6)' }}>{sessionLog.facilitator_name}</strong> · {fmtTime(sessionLog.session_at)}
                                    {sessionLog.passed === false && <span style={{ color: '#e05070', marginLeft: '8px' }}>· Did not pass</span>}
                                  </div>
                                )}
                                {sessionLog?.private_notes && (
                                  <div style={{ fontSize: '0.7rem', color: 'rgba(198,147,10,0.7)', marginTop: '3px', fontStyle: 'italic' }}>
                                    📝 {sessionLog.private_notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Cleared by / completion info */}
                    {ssp.cleared && (
                      <div style={{ padding: '0.8rem 1rem', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '8px', fontSize: '0.78rem', color: '#4ade80' }}>
                        ✓ Program completed · Cleared by <strong>{ssp.cleared_by_name}</strong> on {fmt(ssp.cleared_at)}
                      </div>
                    )}

                    {/* Sessions timeline */}
                    {ssp.sessions.length > 0 && (
                      <div style={{ marginTop: '1.2rem' }}>
                        <div style={{ fontSize: '0.6rem', letterSpacing: '3px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Session Timeline</div>
                        {ssp.sessions.map((s: any, i: number) => (
                          <div key={s.id} style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.passed === false ? '#e05070' : '#4ade80', flexShrink: 0, marginTop: '4px' }} />
                              {i < ssp.sessions.length - 1 && <div style={{ width: '1px', flex: 1, background: 'var(--border)', marginTop: '3px' }} />}
                            </div>
                            <div style={{ paddingBottom: '8px' }}>
                              <div style={{ fontSize: '0.78rem', color: 'var(--bone)', fontWeight: 600 }}>
                                {LESSONS.find(l => l.key === s.lesson_key)?.title || 'Unknown'}
                                {s.passed === false && <span style={{ color: '#e05070', marginLeft: '6px', fontSize: '0.65rem' }}>FAILED</span>}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '2px' }}>{s.facilitator_name} · {fmtTime(s.session_at)}</div>
                              {s.private_notes && <div style={{ fontSize: '0.7rem', color: 'rgba(198,147,10,0.7)', fontStyle: 'italic', marginTop: '2px' }}>📝 {s.private_notes}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
