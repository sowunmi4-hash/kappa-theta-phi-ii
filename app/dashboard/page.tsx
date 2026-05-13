'use client';
import { useState, useEffect } from 'react';
import './dash.css';
import DashSidebar from './DashSidebar';

export default function DashHome() {
  const [data, setData]   = useState<any>(null);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/profile?t=' + Date.now()).then(r => r.json()).then(d => {
      if (d.error) { window.location.href = '/login'; return; }
      setData(d);
    });
  }, []);

  useEffect(() => {
    const poll = setInterval(() => {
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;
      fetch('/api/dashboard/profile').then(r => r.json()).then(d => { if (!d.error) setData(d); });
    }, 30000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    fetch('/api/dashboard/notifications').then(r => r.json()).then(d => setNotifs(d.notifications || []));
  }, [drawerOpen]);

  async function markRead(id: string) {
    await fetch('/api/dashboard/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setNotifs(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
    setData((p: any) => p ? { ...p, unread: Math.max(0, (p.unread || 0) - 1) } : p);
  }

  async function markAllRead() {
    const ids = notifs.filter((n: any) => !n.is_read).map((n: any) => n.id);
    await Promise.all(ids.map((id: string) =>
      fetch('/api/dashboard/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    ));
    setNotifs(p => p.map(n => ({ ...n, is_read: true })));
    setData((p: any) => p ? { ...p, unread: 0 } : p);
  }

  async function shareToNews() {
    if (!data) return;
    const { member, profile } = data;
    if (!profile?.bio && !profile?.hobbies && !profile?.favourite_quote) {
      setShareMsg('Add some profile info first.');
      setTimeout(() => setShareMsg(''), 3000);
      return;
    }
    setSharing(true);
    const lines: string[] = [];
    if (profile?.bio)             lines.push(profile.bio);
    if (profile?.favourite_quote) lines.push('"' + profile.favourite_quote + '"');
    if (profile?.hobbies)         lines.push('Hobbies: ' + profile.hobbies);
    const socials = profile?.social_links || {};
    const socialList = Object.entries(socials).filter(([, v]) => v).map(([k, v]) => k + ': ' + v).join(' · ');
    if (socialList) lines.push(socialList);
    const res = await fetch('/api/dashboard/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: member.frat_name + ' — Profile', content: lines.join('\n\n') }),
    }).then(r => r.json());
    setSharing(false);
    setShareMsg(res.error ? 'Failed to share. Try again.' : 'Shared to Wokou News! ✓');
    setTimeout(() => setShareMsg(''), 3000);
  }

  if (!data) return <div className="dash-loading">LOADING...</div>;

  const { member, profile, unread } = data;
  const slug    = member.frat_name?.toLowerCase().replace(/\s+/g, '-').replace('big-brother-', '') || '';
  const portrait = profile?.portrait_url || `/brothers/${slug}.png`;
  const banner   = profile?.banner_url;
  const socials  = profile?.social_links || {};
  const hasSocials = Object.values(socials).some(Boolean);

  // Stats for the right column
  const stats = [
    { key: 'Role',    val: member.role,                       color: 'var(--crimson)' },
    { key: 'Faction', val: member.faction || '—',            color: 'var(--bone-dim)' },
    { key: 'Joined',  val: '3·14·21',                         color: 'var(--bone-dim)' },
  ];

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} unread={unread} />

      <main className="dash-main">
        {/* Banner */}
        <div style={{ position: 'relative' }}>
          {banner
            ? <img src={banner} alt="banner" className="dash-profile-banner" />
            : <div className="dash-profile-banner-ph" />
          }
          <div className="dash-banner-fade" />
          <span className="dash-banner-corner tl" />
          <span className="dash-banner-corner tr" />
          <span className="dash-banner-corner bl" />
          <span className="dash-banner-corner br" />
        </div>

        {/* Identity */}
        <div className="dash-identity">
          <div className="dash-identity-portrait">
            <img src={portrait} alt={member.frat_name} onError={(e: any) => e.target.src = '/logo.png'} />
            <span className="dash-identity-portrait-corner tl" />
            <span className="dash-identity-portrait-corner tr" />
            <span className="dash-identity-portrait-corner bl" />
            <span className="dash-identity-portrait-corner br" />
          </div>
          <div className="dash-identity-info">
            <div className="dash-identity-name">{member.frat_name}</div>
            <div className="dash-identity-role">{member.role}</div>
            {member.faction && (
              <div className="dash-identity-faction">
                {member.faction}{member.faction_title ? ` · ${member.faction_title}` : ''}
              </div>
            )}
            {member.iron_compass && <div className="dash-identity-badge">⚓ Iron Compass</div>}
          </div>
        </div>

        {/* Profile body — two column */}
        <div className="dash-profile-body">
          {/* LEFT: quote + about + hobbies + links */}
          <div className="dash-profile-left">
            {profile?.favourite_quote && (
              <div className="dash-profile-quote">"{profile.favourite_quote}"</div>
            )}
            {profile?.bio && (
              <div>
                <div className="dash-clbl">About</div>
                <div style={{ fontSize: '.9rem', color: 'var(--bone-dim)', lineHeight: 1.7 }}>{profile.bio}</div>
              </div>
            )}
            {profile?.hobbies && (
              <div>
                <div className="dash-clbl">Hobbies</div>
                <div style={{ fontSize: '.9rem', color: 'var(--bone-dim)', lineHeight: 1.7 }}>{profile.hobbies}</div>
              </div>
            )}
            {hasSocials && (
              <div>
                <div className="dash-clbl">Links</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {Object.entries(socials).filter(([, v]) => v).map(([k, v]) => (
                    <a key={k} href={v as string} target="_blank" rel="noopener noreferrer" className="dash-social-pill">{k}</a>
                  ))}
                </div>
              </div>
            )}
            {!profile?.bio && !profile?.hobbies && !profile?.favourite_quote && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--bone-faint)', fontSize: '.85rem' }}>
                Your profile is empty.{' '}
                <a href="/dashboard/edit" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Add your info →</a>
              </div>
            )}
            {(profile?.bio || profile?.hobbies || profile?.favourite_quote) && (
              <div style={{ marginTop: 'auto', paddingTop: '.8rem', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={shareToNews}
                  disabled={sharing}
                  className="dash-btn gold-ghost"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  {sharing ? 'Sharing...' : 'Share to Wokou News'}
                </button>
                {shareMsg && (
                  <span style={{ fontSize: '.75rem', color: shareMsg.includes('!') ? 'var(--green)' : '#e05070' }}>
                    {shareMsg}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: fraternity stats */}
          <div className="dash-profile-right">
            <div className="dash-clbl">Brotherhood</div>
            {stats.map(s => (
              <div key={s.key} className="dash-profile-stat-row">
                <span className="dash-profile-stat-key">{s.key}</span>
                <span className="dash-profile-stat-val" style={{ color: s.color }}>{s.val}</span>
              </div>
            ))}

            {/* Notifications bell area */}
            <div style={{ marginTop: 'auto', paddingTop: '.8rem', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setDrawerOpen(v => !v)}
                className="dash-btn ghost"
                style={{ width: '100%', justifyContent: 'center', position: 'relative' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                Notifications
                {unread > 0 && (
                  <span style={{
                    background: 'var(--crimson)', color: '#fff',
                    fontSize: '.45rem', minWidth: '16px', height: '16px',
                    borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px', fontFamily: 'var(--cinzel)', letterSpacing: '0',
                  }}>{unread}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notification Drawer */}
        {drawerOpen && (
          <div
            style={{
              position: 'fixed', top: 0, right: 0, width: '320px', height: '100vh',
              background: 'rgba(7,11,22,.96)', borderLeft: '1px solid var(--border)',
              zIndex: 300, display: 'flex', flexDirection: 'column',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ padding: '1.2rem 1.4rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.55rem', letterSpacing: '4px', color: 'var(--gold)', textTransform: 'uppercase' }}>Notifications</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {notifs.some((n: any) => !n.is_read) && (
                  <button onClick={markAllRead} style={{ fontFamily: 'var(--cinzel)', fontSize: '.42rem', letterSpacing: '1px', color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', opacity: .7 }}>
                    Mark all read
                  </button>
                )}
                <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--bone-faint)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {notifs.length === 0 && (
                <div style={{ padding: '2rem 1.5rem', textAlign: 'center', fontFamily: 'var(--cinzel)', fontSize: '.5rem', letterSpacing: '2px', color: 'var(--bone-faint)' }}>
                  No notifications yet
                </div>
              )}
              {notifs.map((n: any) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  style={{
                    padding: '1rem 1.4rem', borderBottom: '1px solid var(--border)',
                    cursor: 'pointer', transition: 'background .15s',
                    borderLeft: n.is_read ? 'none' : '2px solid var(--crimson)',
                  }}
                >
                  <div style={{ fontSize: '.88rem', color: 'var(--bone)', fontWeight: 600, marginBottom: '3px' }}>{n.title}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--bone-dim)', lineHeight: 1.5 }}>{n.message}</div>
                  <div style={{ fontFamily: 'var(--cinzel)', fontSize: '.42rem', letterSpacing: '1px', color: 'rgba(240,232,208,.22)', marginTop: '5px' }}>
                    {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
