'use client';
import { useState, useEffect, useRef } from 'react';
import './dashboard.css';

const ACCENT_COLOURS = ['#c6930a','#b22234','#1a3a6b','#2d6a4f','#6b21a8','#c2410c'];
const LAYOUT_OPTIONS = [
  { id: 1, icon: '⊙', name: 'Centered' },
  { id: 2, icon: '⊞', name: 'Split' },
  { id: 3, icon: '⊟', name: 'Banner Hero' },
  { id: 4, icon: '⊠', name: 'Card Grid' },
  { id: 5, icon: '巻', name: 'Samurai Scroll' },
];

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
    await fetch('/api/dashboard/notifications', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
    setNotifs(prev => prev.map(n => n.id === id ? {...n, is_read: true} : n));
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c6930a', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '3px' }}>
      LOADING...
    </div>
  );

  const { member, profile, unread_count } = data;
  const layout = profile?.layout_preference || 1;
  const accent = profile?.accent_colour || '#c6930a';
  const portrait = profile?.portrait_url || `/brothers/${member.frat_name?.toLowerCase().replace(/\s+/g,'-').replace('big-brother-','')}.png`;
  const banner = profile?.banner_url;
  const bg = profile?.background_url;

  const socialLinks = profile?.social_links || {};

  const Nav = () => (
    <nav className="dash-nav">
      <div className="dash-nav-brand">KΘΦ II</div>
      <div className="dash-nav-links">
        <a href="/dashboard" className="active">Home</a>
        <a href="/dashboard/news">Wokou News</a>
        <a href="/dashboard/gallery">My Gallery</a>
        <a href="/dashboard/edit">Edit Profile</a>
        <a href="/">← Site</a>
      </div>
      <div ref={notifRef} style={{ position: 'relative' }}>
        <button className="dash-bell" onClick={() => setShowNotifs(v => !v)}>
          🔔
          {unread_count > 0 && <span className="dash-bell-badge">{unread_count}</span>}
        </button>
        {showNotifs && (
          <div className="notif-panel">
            <div className="notif-header">NOTIFICATIONS</div>
            {notifs.length === 0 && <div className="notif-item"><div className="notif-msg">No notifications</div></div>}
            {notifs.map(n => (
              <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`} onClick={() => markRead(n.id)}>
                <div className="notif-title">{n.title}</div>
                <div className="notif-msg">{n.message}</div>
                <div className="notif-time">{new Date(n.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </nav>
  );

  const ProfileCards = () => (
    <>
      {profile?.bio && (
        <div className="dash-card">
          <div className="dash-card-title">About</div>
          <p>{profile.bio}</p>
        </div>
      )}
      {profile?.favourite_quote && (
        <div className="dash-card">
          <div className="dash-card-title">Favourite Quote</div>
          <p style={{ fontStyle: 'italic', fontFamily: "'Zen Antique Soft', serif" }}>"{profile.favourite_quote}"</p>
        </div>
      )}
      {profile?.hobbies && (
        <div className="dash-card">
          <div className="dash-card-title">Hobbies</div>
          <p>{profile.hobbies}</p>
        </div>
      )}
      {Object.keys(socialLinks).filter(k => socialLinks[k]).length > 0 && (
        <div className="dash-card">
          <div className="dash-card-title">Links</div>
          <div className="dash-social-links">
            {Object.entries(socialLinks).filter(([,v]) => v).map(([k, v]) => (
              <a key={k} href={v as string} target="_blank" rel="noopener noreferrer" className="dash-social-link">{k}</a>
            ))}
          </div>
        </div>
      )}
      <div className="dash-card">
        <div className="dash-card-title">Rank & Fraction</div>
        <p>{member.role}{member.fraction ? ` · ${member.fraction}` : ''}</p>
        {member.fraction_title && <p style={{ color: 'rgba(245,240,232,0.5)', fontSize: '0.85rem' }}>{member.fraction_title}</p>}
        {member.iron_compass && <div className="dash-iron-badge" style={{ marginTop: '0.8rem' }}>⚓ Iron Compass</div>}
      </div>
    </>
  );

  const PortraitWrap = () => (
    <div className="dash-portrait-wrap">
      <img src={portrait} alt={member.frat_name} onError={(e: any) => { e.target.src = '/logo.png'; }} />
    </div>
  );

  const rootStyle: any = bg ? { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundAttachment: 'fixed' } : {};

  return (
    <div className={`dash-root layout-${layout}`} style={{ ...rootStyle, '--accent': accent } as any}>
      <Nav />

      {/* ── LAYOUT 1: CENTERED ── */}
      {layout === 1 && (
        <>
          {banner ? <img src={banner} alt="banner" className="dash-banner" /> : <div className="dash-banner-placeholder" style={{ background: `linear-gradient(135deg, var(--navy-deep), ${accent}22)` }} />}
          <div className="dash-profile-wrap">
            <PortraitWrap />
            <div className="dash-name" style={{ color: accent }}>{member.frat_name}</div>
            <div className="dash-role">{member.role}</div>
            {member.fraction && <div className="dash-fraction">{member.fraction} · {member.fraction_title}</div>}
            {profile?.favourite_quote && <div className="dash-quote">"{profile.favourite_quote}"</div>}
            <div className="dash-cards"><ProfileCards /></div>
          </div>
        </>
      )}

      {/* ── LAYOUT 2: SPLIT ── */}
      {layout === 2 && (
        <div className="dash-split">
          <div className="dash-sidebar">
            <PortraitWrap />
            <div className="dash-name" style={{ color: accent }}>{member.frat_name}</div>
            <div className="dash-role">{member.role}</div>
            {member.fraction && <div style={{ fontSize: '0.8rem', color: 'rgba(245,240,232,0.5)', textAlign: 'center' }}>{member.fraction}</div>}
            {member.iron_compass && <div className="dash-iron-badge" style={{ marginTop: '0.5rem' }}>⚓ Iron Compass</div>}
            <div style={{ borderTop: '1px solid rgba(198,147,10,0.15)', width: '100%', marginTop: '1rem', paddingTop: '1rem' }}>
              <a href="/dashboard/news" className="dash-btn dash-btn-outline" style={{ width: '100%', justifyContent: 'center', marginBottom: '0.5rem', display: 'flex' }}>📰 Wokou News</a>
              <a href="/dashboard/gallery" className="dash-btn dash-btn-outline" style={{ width: '100%', justifyContent: 'center', marginBottom: '0.5rem', display: 'flex' }}>🖼 My Gallery</a>
              <a href="/dashboard/edit" className="dash-btn dash-btn-outline" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>✏️ Edit Profile</a>
            </div>
          </div>
          <div className="dash-main">
            {banner && <img src={banner} alt="banner" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1.5rem' }} />}
            <div className="dash-cards"><ProfileCards /></div>
          </div>
        </div>
      )}

      {/* ── LAYOUT 3: BANNER HERO ── */}
      {layout === 3 && (
        <>
          <div className="dash-hero">
            {banner ? <img src={banner} alt="banner" /> : <div className="dash-banner-placeholder" style={{ background: `linear-gradient(135deg, #0f1b33, ${accent}44)` }} />}
            <div className="dash-hero-overlay">
              <PortraitWrap />
              <div className="dash-hero-info">
                <div className="dash-name" style={{ color: accent }}>{member.frat_name}</div>
                <div className="dash-role">{member.role}{member.fraction ? ` · ${member.fraction}` : ''}</div>
              </div>
            </div>
          </div>
          <div className="dash-main">
            <div className="dash-cards"><ProfileCards /></div>
          </div>
        </>
      )}

      {/* ── LAYOUT 4: CARD GRID ── */}
      {layout === 4 && (
        <>
          <div className="dash-top" style={{ background: `linear-gradient(135deg, var(--navy-deep), ${accent}22)` }}>
            <PortraitWrap />
            <div>
              <div className="dash-name" style={{ color: accent }}>{member.frat_name}</div>
              <div className="dash-role">{member.role}</div>
              {member.fraction && <div style={{ fontSize: '0.8rem', color: 'rgba(245,240,232,0.5)' }}>{member.fraction} · {member.fraction_title}</div>}
            </div>
          </div>
          <div className="dash-main">
            <div className="dash-cards"><ProfileCards /></div>
          </div>
        </>
      )}

      {/* ── LAYOUT 5: SAMURAI SCROLL ── */}
      {layout === 5 && (
        <>
          <div className="dash-scroll-header">
            <div className="dash-kanji-bg">侍</div>
            <PortraitWrap />
            <div className="dash-name" style={{ color: accent }}>{member.frat_name}</div>
            <div className="dash-role">{member.role}</div>
            {member.iron_compass && <div className="dash-iron-badge" style={{ margin: '0.5rem auto', display: 'inline-flex' }}>⚓ Iron Compass</div>}
          </div>
          <div className="dash-divider-kanji">亗 · 亗 · 亗</div>
          <div className="dash-main">
            <div className="dash-cards"><ProfileCards /></div>
          </div>
        </>
      )}

      {/* Actions bar for all layouts */}
      {layout !== 2 && (
        <div className="dash-actions">
          <a href="/dashboard/edit" className="dash-btn dash-btn-gold">✏️ Edit Profile</a>
          <a href="/dashboard/news" className="dash-btn dash-btn-outline">📰 Wokou News</a>
          <a href="/dashboard/gallery" className="dash-btn dash-btn-outline">🖼 My Gallery</a>
        </div>
      )}
    </div>
  );
}
