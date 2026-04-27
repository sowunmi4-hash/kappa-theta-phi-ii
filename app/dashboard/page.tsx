'use client';
import { useState, useEffect, useRef } from 'react';
import './dash.css';

const NAV = [
  { href: '/dashboard', label: 'Home', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg> },
  { href: '/dashboard/news', label: 'Wokou News', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v8a2 2 0 01-2 2z"/><path d="M17 21v-8H7"/><path d="M7 3v5h8"/></svg> },
  { href: '/dashboard/events', label: 'Events', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
  { href: '/dashboard/phire', label: 'PHIRE', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
  { href: '/dashboard/discipline', label: 'Discipline', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { href: '/dashboard/ssp', label: 'SSP', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
  { href: '/dashboard/gallery', label: 'My Gallery', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg> },
  { href: '/dashboard/edit', label: 'Edit Profile', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
];

export default function DashHome() {
  const [data, setData] = useState<any>(null);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/dashboard/profile').then(r => r.json()).then(d => {
      if (d.error) { window.location.href = '/login'; return; }
      setData(d);
    });
  }, []);

  // POLLING: refresh unread count and recent data every 30s
  useEffect(() => {
    const poll = setInterval(() => {
      fetch('/api/dashboard/profile').then(r=>r.json()).then(d => {
        if (!d.error) setData(d);
      });
    }, 30000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    fetch('/api/dashboard/notifications').then(r => r.json()).then(d => setNotifs(d.notifications || []));
  }, [drawerOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) setDrawerOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function markRead(id: string) {
    await fetch('/api/dashboard/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setNotifs(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  if (!data) return <div className="dash-loading">LOADING...</div>;

  const { member, profile, unread } = data;
  const slug = member.frat_name?.toLowerCase().replace(/\s+/g, '-').replace('big-brother-', '') || '';
  const portrait = profile?.portrait_url || `/brothers/${slug}.png`;
  const banner = profile?.banner_url;
  const socials = profile?.social_links || {};
  const hasSocials = Object.values(socials).some(Boolean);

  return (
    <div className="dash-app">
      {/* ── SIDEBAR ── */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-logo">
          <img src="/logo.png" alt="KΘΦ II" />
          <span className="dash-sidebar-logo-text">KΘΦ II</span>
        </div>
        <div className="dash-sidebar-member">
          <div className="dash-sidebar-portrait">
            <img src={portrait} alt={member.frat_name} onError={(e:any) => e.target.src='/logo.png'} />
          </div>
          <div className="dash-sidebar-name">{member.frat_name}</div>
          <div className="dash-sidebar-role">{member.role}</div>
          {member.fraction && <div className="dash-sidebar-fraction">{member.fraction}</div>}
        </div>
        <nav className="dash-nav">
          {NAV.map(n => (
            <a key={n.href} href={n.href} className={`dash-nav-item ${n.href === '/dashboard' ? 'active' : ''}`}>
              {n.icon}<span>{n.label}</span>
            </a>
          ))}
          <div className="dash-nav-divider" />
          <a href="/" className="dash-nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 3H5a2 2 0 00-2 2v14a2 2 0 002 2h10M17 16l4-4-4-4M21 12H9"/></svg>
            <span>Back to Site</span>
          </a>
        </nav>
        <div className="dash-sidebar-bottom">
          <div className="dash-bell-wrap">
            <button className="dash-nav-item" style={{ width: '100%' }} onClick={() => setDrawerOpen(v => !v)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
              <span>Notifications</span>
            </button>
            {unread > 0 && <div className="dash-bell-badge">{unread}</div>}
          </div>
        </div>
      </aside>

      {/* ── NOTIFICATION DRAWER ── */}
      <div ref={drawerRef} className={`notif-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="notif-drawer-header">
          <div className="notif-drawer-title">Notifications</div>
          <button className="notif-drawer-close" onClick={() => setDrawerOpen(false)}>✕</button>
        </div>
        <div className="notif-list">
          {notifs.length === 0 && <div className="notif-empty">No notifications yet</div>}
          {notifs.map(n => (
            <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`} onClick={() => markRead(n.id)}>
              <div className="notif-item-title">{n.title}</div>
              <div className="notif-item-msg">{n.message}</div>
              <div className="notif-item-time">{new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="dash-main">
        {/* Banner */}
        <div className="profile-hero" style={{ position: 'relative' }}>
          {banner
            ? <img src={banner} alt="banner" className="profile-banner" />
            : <div className="profile-banner-placeholder" />}
          <div className="profile-banner-fade" />
        </div>

        {/* Identity */}
        <div className="profile-identity">
          <div className="profile-portrait-lg">
            <img src={portrait} alt={member.frat_name} onError={(e:any) => { e.target.style.display='none'; }} />
          </div>
          <div className="profile-name-block">
            <div className="profile-name">{member.frat_name}</div>
            <div className="profile-role">{member.role}</div>
            {member.fraction && <div className="profile-fraction">{member.fraction}{member.fraction_title ? ` · ${member.fraction_title}` : ''}</div>}
            {member.iron_compass && <div className="profile-iron">⚓ Iron Compass</div>}
          </div>
        </div>

        {/* Body */}
        <div className="profile-body">
          {profile?.favourite_quote && (
            <div className="profile-quote">"{profile.favourite_quote}"</div>
          )}

          {(profile?.bio || profile?.hobbies || hasSocials) && (
            <div className="profile-cards">
              {profile?.bio && (
                <div className="profile-card">
                  <div className="profile-card-label">About</div>
                  <div className="profile-card-text">{profile.bio}</div>
                </div>
              )}
              {profile?.hobbies && (
                <div className="profile-card">
                  <div className="profile-card-label">Hobbies</div>
                  <div className="profile-card-text">{profile.hobbies}</div>
                </div>
              )}
              {hasSocials && (
                <div className="profile-card">
                  <div className="profile-card-label">Links</div>
                  <div className="profile-social-links">
                    {Object.entries(socials).filter(([,v]) => v).map(([k,v]) => (
                      <a key={k} href={v as string} target="_blank" rel="noopener noreferrer" className="profile-social-link">{k}</a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!profile?.bio && !profile?.hobbies && !profile?.favourite_quote && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(240,232,208,0.3)', fontSize: '0.85rem' }}>
              Your profile is empty. <a href="/dashboard/edit" style={{ color: '#c6930a', textDecoration: 'none' }}>Add your info →</a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
