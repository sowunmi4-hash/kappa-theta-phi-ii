'use client';
import { useState, useEffect, useRef } from 'react';
import './dashboard.css';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/dashboard/profile')
      .then(r => r.json())
      .then(d => {
        if (d.error) { window.location.href = '/login'; return; }
        setData(d);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!showNotifs) return;
    fetch('/api/dashboard/notifications')
      .then(r => r.json())
      .then(d => setNotifs(d.notifications || []));
  }, [showNotifs]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function markRead(id: string) {
    await fetch('/api/dashboard/notifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#050810',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#c6930a', fontFamily: 'Rajdhani, sans-serif',
      fontSize: '0.7rem', letterSpacing: '6px'
    }}>
      LOADING...
    </div>
  );

  const { member, profile, unread_count } = data;
  const accent = profile?.accent_colour || '#c6930a';
  const fratSlug = member.frat_name?.toLowerCase().replace(/\s+/g, '-').replace('big-brother-', '') || '';
  const portrait = profile?.portrait_url || `/brothers/${fratSlug}.png`;
  const banner = profile?.banner_url;
  const bg = profile?.background_url;
  const socialLinks = profile?.social_links || {};
  const hasSocials = Object.values(socialLinks).some(v => v);

  const rootStyle: any = bg
    ? { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center' }
    : {};

  return (
    <div className="dash-root" style={rootStyle}>

      {/* ── NAV ── */}
      <nav className="dash-nav">
        <div className="dash-nav-brand">KΘΦ II</div>
        <div className="dash-nav-links">
          <a href="/dashboard">Home</a>
          <a href="/dashboard/news">Wokou News</a>
          <a href="/dashboard/gallery">My Gallery</a>
          <a href="/dashboard/edit">Edit Profile</a>
          <a href="/" style={{ color: 'rgba(240,232,208,0.25)' }}>← Site</a>
        </div>
        <div className="dash-nav-right" ref={notifRef}>
          <button className="dash-bell" onClick={() => setShowNotifs(v => !v)}>
            🔔
            {unread_count > 0 && <span className="dash-bell-badge">{unread_count}</span>}
          </button>
          {showNotifs && (
            <div className="notif-panel">
              <div className="notif-header">Notifications</div>
              {notifs.length === 0 && (
                <div className="notif-item"><div className="notif-item-msg">No notifications yet</div></div>
              )}
              {notifs.map(n => (
                <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`} onClick={() => markRead(n.id)}>
                  <div className="notif-item-title">{n.title}</div>
                  <div className="notif-item-msg">{n.message}</div>
                  <div className="notif-item-time">{new Date(n.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* ── CINEMATIC HERO ── */}
      <div className="cin-hero">
        {banner
          ? <img src={banner} alt="banner" className="cin-banner" />
          : <div className="cin-banner-placeholder" style={{ background: `linear-gradient(160deg, #0d1a2e, ${accent}18, #0d0a1a)` }} />
        }
        <div className="cin-fade" />
        <div className="cin-portrait-wrap" style={{ borderColor: accent }}>
          <img
            src={portrait} alt={member.frat_name}
            onError={(e: any) => { e.target.style.display = 'none'; (e.target.nextSibling as HTMLElement).style.display = 'flex'; }}
          />
          <div className="cin-portrait-placeholder" style={{ display: 'none' }}>⚔</div>
        </div>
      </div>

      {/* ── IDENTITY ── */}
      <div className="cin-identity">
        <div className="cin-name" style={{ color: accent }}>{member.frat_name}</div>
        <div className="cin-rule" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
        <div className="cin-role">{member.role}{member.fraction ? ` · ${member.fraction}` : ''}</div>
        {member.fraction_title && (
          <div className="cin-fraction">{member.fraction_title}</div>
        )}
        {member.iron_compass && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
            <div className="cin-iron" style={{ borderColor: `${accent}44`, color: accent }}>⚓ Iron Compass</div>
          </div>
        )}
        {profile?.favourite_quote && (
          <div className="cin-quote">"{profile.favourite_quote}"</div>
        )}
      </div>

      {/* ── STATS ROW ── */}
      <div className="cin-stats" style={{ borderColor: `${accent}15`, marginTop: '28px' }}>
        <div className="cin-stat" style={{ borderColor: `${accent}10` }}>
          <div className="cin-stat-label">Bio</div>
          <div className="cin-stat-value">{profile?.bio || <span style={{ color: 'rgba(240,232,208,0.2)', fontSize: '0.8rem' }}>Not set</span>}</div>
        </div>
        <div className="cin-stat" style={{ borderColor: `${accent}10` }}>
          <div className="cin-stat-label">Hobbies</div>
          <div className="cin-stat-value">{profile?.hobbies || <span style={{ color: 'rgba(240,232,208,0.2)', fontSize: '0.8rem' }}>Not set</span>}</div>
        </div>
        <div className="cin-stat">
          <div className="cin-stat-label">Status</div>
          <div className="cin-stat-value" style={{ color: accent }}>
            {member.iron_compass ? '⚓ Iron Compass' : member.role}
          </div>
        </div>
      </div>

      {/* ── CONTENT CARDS ── */}
      {(profile?.bio || profile?.hobbies || profile?.favourite_quote || hasSocials) && (
        <div className="cin-cards" style={{ background: `${accent}06`, borderColor: `${accent}10` }}>
          {profile?.bio && (
            <div className="cin-card">
              <div className="cin-card-label">About</div>
              <div className="cin-card-text">{profile.bio}</div>
            </div>
          )}
          {profile?.favourite_quote && (
            <div className="cin-card">
              <div className="cin-card-label">Favourite Quote</div>
              <div className="cin-card-text" style={{ fontStyle: 'italic' }}>"{profile.favourite_quote}"</div>
            </div>
          )}
          {profile?.hobbies && (
            <div className="cin-card">
              <div className="cin-card-label">Hobbies</div>
              <div className="cin-card-text">{profile.hobbies}</div>
            </div>
          )}
          {hasSocials && (
            <div className="cin-card">
              <div className="cin-card-label">Social Links</div>
              <div className="cin-social-links">
                {Object.entries(socialLinks).filter(([, v]) => v).map(([k, v]) => (
                  <a key={k} href={v as string} target="_blank" rel="noopener noreferrer"
                    className="cin-social-link" style={{ borderColor: `${accent}35`, color: accent }}>
                    {k}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ACTION BAR ── */}
      <div className="cin-actions" style={{ borderColor: `${accent}08` }}>
        <a href="/dashboard/news" className="cin-action">
          <span className="cin-action-icon">📰</span>Wokou News
        </a>
        <a href="/dashboard/gallery" className="cin-action">
          <span className="cin-action-icon">🖼</span>My Gallery
        </a>
        <a href="/dashboard/edit" className="cin-action">
          <span className="cin-action-icon">✏️</span>Edit Profile
        </a>
        <div className="cin-action" onClick={() => setShowNotifs(v => !v)}>
          <span className="cin-action-icon">🔔</span>
          Alerts{unread_count > 0 ? ` (${unread_count})` : ''}
        </div>
      </div>

    </div>
  );
}
