'use client';
import { useEffect } from 'react';
import './brothers.css';

const FOUNDERS = [
  { frat: 'Big Bro Tactician', role: 'Head Founder', fraction: 'Kuro Kanda', title: 'Shogun', iron: true },
  { frat: 'Big Brother Boss Sauce', role: 'Senior Founder', fraction: 'Ishi No', title: 'Shogun', iron: true },
  { frat: 'Big Brother Energy', role: 'Senior Founder', fraction: 'Kurofune', title: 'Shogun', iron: true },
  { frat: 'Big Brother Cool Breeze', role: 'Senior Founder', fraction: null, title: null, iron: true },
  { frat: 'Big Brother Violator', role: 'Senior Founder', fraction: null, title: null, iron: false },
];

const IRON_FLEET = [
  { frat: 'Big Brother Substance', role: 'Iron Fleet', fraction: 'Taidō', title: 'Daimyo', iron: true },
  { frat: 'Big Brother Noles', role: 'Iron Fleet', fraction: 'Ishi No', title: 'Daimyo', iron: true },
  { frat: 'Big Brother Wildwon', role: 'Iron Fleet', fraction: 'Kuro Kanda', title: 'Daimyo', iron: true },
  { frat: 'Big Brother CATALYST', role: 'Iron Fleet', fraction: 'Kuro Kanda', title: 'KyōKishi — Chief Officer', iron: true },
  { frat: 'Big Brother Trench', role: 'Iron Fleet', fraction: 'Ishi No', title: 'Kaizoku Kansatsu — Chief Officer', iron: true },
];

const BROTHERS = [
  { frat: 'Big Brother Sage', fraction: 'Ishi No', title: 'Member' },
  { frat: 'Big Brother Fathom', fraction: 'Kuro Kanda', title: 'Member' },
  { frat: 'Big Brother Khaos', fraction: 'Kuro Kanda', title: 'Member' },
  { frat: 'Big Brother Limitless', fraction: null, title: null },
  { frat: 'Big Brother 5 Star General', fraction: null, title: null },
  { frat: 'Big Brother Pristine', fraction: null, title: null },
  { frat: 'Big Brother Deep Dive', fraction: null, title: null },
  { frat: 'Big Brother Surge', fraction: null, title: null },
  { frat: 'Big Brother Reasonable', fraction: null, title: null },
  { frat: 'Big Brother Nexus', fraction: null, title: null },
  { frat: 'Big Brother Sentinel', fraction: null, title: null },
  { frat: 'Big Brother Wildcard', fraction: null, title: null },
];

function getInitials(name: string) {
  const parts = name.replace(/^Big Bro(ther)?\s*/i, '').trim().split(/\s+/);
  return parts.map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function MemberCard({ frat, role, fraction, title, iron }: { frat: string; role?: string; fraction?: string | null; title?: string | null; iron?: boolean }) {
  return (
    <div className={`member-card${iron ? ' iron' : ''}`}>
      <div className="member-avatar">{getInitials(frat)}</div>
      <div className="member-info">
        <div className="member-frat-name">{frat}</div>
        {role && <div className="member-role">{role}</div>}
        {fraction && <div className="member-fraction">{fraction} Fraction</div>}
        {title && <div className="member-fraction-title">{title}</div>}
        {iron && <div className="iron-badge">Iron Compass</div>}
      </div>
    </div>
  );
}

export default function BrothersPage() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <nav id="navbar">
        <a href="/" className="nav-brand">KΘΦ <span>II</span></a>
        <ul className="nav-links" id="navLinks">
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
        </ul>
        <div className="mobile-toggle" onClick={() => document.getElementById('navLinks')?.classList.toggle('open')}>
          <span></span><span></span><span></span>
        </div>
      </nav>

      <main className="brothers-page">

        <section className="brothers-hero">
          <div className="brothers-hero-bg" />
          <div className="brothers-hero-kanji">兄</div>
          <div className="brothers-hero-content">
            <div className="brothers-hero-tag">The Brotherhood</div>
            <h1 className="brothers-hero-title">Our Brothers</h1>
            <p className="brothers-hero-sub">22 brothers. One bloodline. One legacy.</p>
          </div>
        </section>

        <div className="brothers-stats">
          <div className="brothers-stat">
            <div className="brothers-stat-num">22</div>
            <div className="brothers-stat-label">Brothers</div>
          </div>
          <div className="brothers-stat">
            <div className="brothers-stat-num">9</div>
            <div className="brothers-stat-label">Iron Fleet</div>
          </div>
          <div className="brothers-stat">
            <div className="brothers-stat-num">4</div>
            <div className="brothers-stat-label">Fractions</div>
          </div>
          <div className="brothers-stat">
            <div className="brothers-stat-num">5</div>
            <div className="brothers-stat-label">Founders</div>
          </div>
        </div>

        {/* Founders */}
        <section className="roster-section reveal">
          <div className="roster-section-tag">The Architects</div>
          <div className="roster-section-title">Founders</div>
          <div className="roster-grid">
            {FOUNDERS.map(m => <MemberCard key={m.frat} frat={m.frat} role={m.role} fraction={m.fraction} title={m.title} iron={m.iron} />)}
          </div>
        </section>

        {/* Iron Fleet */}
        <section className="roster-section reveal">
          <div className="roster-section-tag">The Founding Compass</div>
          <div className="roster-section-title">Iron Fleet</div>
          <div className="roster-grid">
            {IRON_FLEET.map(m => <MemberCard key={m.frat} frat={m.frat} role={m.role} fraction={m.fraction} title={m.title} iron={m.iron} />)}
          </div>
        </section>

        {/* Brothers */}
        <section className="roster-section reveal">
          <div className="roster-section-tag">The Brotherhood</div>
          <div className="roster-section-title">Brothers</div>
          <div className="roster-grid">
            {BROTHERS.map(m => <MemberCard key={m.frat} frat={m.frat} role="Member" fraction={m.fraction} title={m.title} />)}
          </div>
        </section>

        <footer className="brothers-footer">
          <div className="footer-brand">KΘΦ II — WOKOU-CORSAIRS</div>
          <p>&copy; 2026 Kappa Theta Phi II Fraternity. All Rights Reserved.</p>
        </footer>
      </main>
    </>
  );
}
