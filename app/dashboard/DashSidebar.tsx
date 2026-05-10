'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/dashboard',            label: 'Home',         icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg> },
  { href: '/dashboard/news',       label: 'Wokou News',   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v8a2 2 0 01-2 2z"/><path d="M17 21v-8H7"/><path d="M7 3v5h8"/></svg> },
  { href: '/dashboard/events',     label: 'Events',       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
  { href: '/dashboard/phire',      label: 'PHIRE',        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
  { href: '/dashboard/discipline', label: 'Discipline',   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { href: '/dashboard/ssp',        label: 'Sage Solution',icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
  { href: '/dashboard/dues',       label: 'Dues',         icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
  { href: '/dashboard/gallery',    label: 'My Gallery',   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg> },
  { href: '/dashboard/edit',       label: 'Edit Profile', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
];

const BACK_ICON  = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 3H5a2 2 0 00-2 2v14a2 2 0 002 2h10M17 16l4-4-4-4M21 12H9"/></svg>;
const BELL_ICON  = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>;
const OUT_ICON   = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>;
const REPORT_ICON= <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/></svg>;
const SSP_RPT_ICON=<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;

interface Props {
  member: any;
  profile?: any;
  unread?: number;
}

export default function DashSidebar({ member, profile, unread = 0 }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const leaveTimer = useRef<any>(null);
  const glassRef   = useRef<HTMLDivElement>(null);
  const railRef    = useRef<HTMLElement>(null);

  const slug     = member?.frat_name?.toLowerCase().replace(/\s+/g, '-').replace('big-brother-', '') || '';
  const portrait = profile?.portrait_url || `/brothers/${slug}.png`;

  const canSeeDuesReport = member?.fraction === 'Ishi No Faction' || member?.frat_name === 'Big Brother Substance' || member?.frat_name === 'Big Brother Cool Breeze';
  const canSeeTransactions = member?.frat_name === 'Big Brother Cool Breeze';
  const canSeeSSPReport  = member?.fraction === 'Ishi No Faction' || member?.role === 'Head Founder' || member?.role === 'Co-Founder';
  const canSeeApplications = member?.fraction === 'Kuro Kanda Fraction';
  const canSeeActivity = member?.frat_name === 'Big Brother Wildwon';

  function openPanel()  { clearTimeout(leaveTimer.current); setOpen(true); }
  function closePanel() { leaveTimer.current = setTimeout(() => setOpen(false), 220); }
  function keepOpen()   { clearTimeout(leaveTimer.current); }

  async function signOut() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  // Dust particle canvas
  useEffect(() => {
    const canvas = document.getElementById('dash-dust') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const motes = Array.from({ length: 32 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - .5) * .08,
      vy: -(Math.random() * .2 + .06),
      r: Math.random() * 1.2 + .3,
      a: Math.random() * .3 + .07,
      t: Math.random() * Math.PI * 2,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      motes.forEach(m => {
        m.x += m.vx; m.y += m.vy; m.t += .007;
        if (m.y < -8) { m.y = canvas.height + 8; m.x = Math.random() * canvas.width; }
        const al = m.a * (.5 + Math.sin(m.t) * .5);
        ctx.fillStyle = `rgba(198,147,10,${al})`;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Kanji watermarks */}
      <div className="dash-kanji" aria-hidden="true">
        <span className="k1">武</span>
        <span className="k2">義</span>
        <span className="k3">忠</span>
        <span className="k4">兄</span>
      </div>

      {/* Dust canvas */}
      <canvas id="dash-dust" aria-hidden="true" />

      {/* Icon Rail */}
      <aside
        className="dash-rail"
        ref={railRef}
        onMouseEnter={openPanel}
        onMouseLeave={closePanel}
      >
        <div className="dash-rail-logo">
          <img src="/logo.png" alt="KΘΦ II" onError={(e: any) => e.target.style.display = 'none'} />
        </div>

        <div className="dash-rail-portrait">
          <img src={portrait} alt={member?.frat_name} onError={(e: any) => e.target.src = '/logo.png'} />
        </div>

        <div className="dash-rail-divider" />

        {NAV.map(n => (
          <a
            key={n.href}
            href={n.href}
            className={`dash-rail-btn${isActive(n.href) ? ' active' : ''}`}
            title={n.label}
          >
            {n.icon}
          </a>
        ))}

        <div className="dash-rail-divider" />

        <button
          className="dash-rail-btn"
          title="Notifications"
          style={{ position: 'relative' }}
        >
          {BELL_ICON}
          {unread > 0 && <span className="dash-rail-notif-badge" />}
        </button>

        <a href="/" className="dash-rail-btn" title="Back to Site">
          {BACK_ICON}
        </a>

        <button className="dash-rail-btn danger" title="Sign Out" onClick={signOut}>
          {OUT_ICON}
        </button>
      </aside>

      {/* Glass Panel */}
      <div
        className={`dash-glass${open ? ' open' : ''}`}
        ref={glassRef}
        onMouseEnter={keepOpen}
        onMouseLeave={closePanel}
      >
        <span className="dash-glass-corner tr" />
        <span className="dash-glass-corner br" />

        <div className="dash-glass-inner">
          {/* Member card */}
          <div className="dash-glass-member">
            <div className="dash-glass-portrait">
              <img src={portrait} alt={member?.frat_name} onError={(e: any) => e.target.src = '/logo.png'} />
              <span className="dash-glass-portrait-corner tl" />
              <span className="dash-glass-portrait-corner tr" />
              <span className="dash-glass-portrait-corner bl" />
              <span className="dash-glass-portrait-corner br" />
            </div>
            <div className="dash-glass-name">{member?.frat_name}</div>
            <div className="dash-glass-role">{member?.role}</div>
            {member?.fraction && <div className="dash-glass-faction">{member.fraction}</div>}
          </div>

          {/* Nav */}
          <nav className="dash-glass-nav">
            {NAV.map(n => (
              <a
                key={n.href}
                href={n.href}
                className={`dash-glass-item${isActive(n.href) ? ' active' : ''}`}
              >
                {n.icon}
                {n.label}
              </a>
            ))}

            <div className="dash-glass-divider" />

            {canSeeActivity && (
              <a href="/dashboard/activity" className={`dash-glass-item${pathname.startsWith('/dashboard/activity') ? ' active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/></svg>
                Member Activity
              </a>
            )}
            <a href="/dashboard/applications" className={`dash-glass-item${pathname.startsWith('/dashboard/applications') ? ' active' : ''}`} style={{display:canSeeApplications?'flex':'none'}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Applications
            </a>

            <a href="/dashboard/grievances" className={`dash-glass-item${pathname.startsWith('/dashboard/grievances') ? ' active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2L8 8H3l4 5-2 7 7-3 7 3-2-7 4-5h-5z"/></svg>
              The Crow's Nest
            </a>

            <div className="dash-glass-divider" />

            {canSeeDuesReport && (
              <a href="/dashboard/dues-report" className={`dash-glass-item${pathname.startsWith('/dashboard/dues-report') ? ' active' : ''}`}>
                {REPORT_ICON}
                Dues Report
              </a>
            )}
            {canSeeTransactions && (
              <a href="/dashboard/dues/transactions" className={`dash-glass-item${pathname.startsWith('/dashboard/dues/transactions') ? ' active' : ''}`}>
                {REPORT_ICON}
                Terminal Log
              </a>
            )}
            {canSeeSSPReport && (
              <a href="/dashboard/ssp/report" className={`dash-glass-item${pathname.startsWith('/dashboard/ssp/report') ? ' active' : ''}`}>
                {SSP_RPT_ICON}
                SSP Report
              </a>
            )}

            <button className="dash-glass-item" onClick={signOut}>
              {BACK_ICON}
              Back to Site
            </button>

            <button className="dash-glass-item danger" onClick={signOut}>
              {OUT_ICON}
              Sign Out
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}
