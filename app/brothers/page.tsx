'use client';
import { useEffect } from 'react';
import './brothers.css';

type Member = {
  frat: string;
  role?: string;
  fraction?: string | null;
  title?: string | null;
  iron?: boolean;
  image?: string | null;
};

const FOUNDERS: Member[] = [
  { frat: 'Big Brother Tactician', role: 'Head Founder', fraction: 'Kuro Kanda', title: 'Shogun', iron: true, image: '/brothers/tactician.png' },
  { frat: 'Big Brother Boss Sauce', role: 'Co-Founder', fraction: 'Ishi No', title: 'Shogun', iron: true, image: '/brothers/boss-sauce.png' },
  { frat: 'Big Brother Energy', role: 'Co-Founder', fraction: 'Kurofune', title: 'Shogun', iron: true, image: '/brothers/energy.png' },
  { frat: 'Big Brother Cool Breeze', role: 'Co-Founder', iron: true, image: '/brothers/cool-breeze.png' },
];

const IRON_FLEET: Member[] = [
  { frat: 'Big Brother Substance', role: 'Iron Fleet', fraction: 'Taidō', title: 'Daimyo', iron: true, image: '/brothers/substance.png' },
  { frat: 'Big Brother Noles', role: 'Iron Fleet', fraction: 'Ishi No', title: 'Daimyo', iron: true, image: '/brothers/noles.png' },
  { frat: 'Big Brother Wildwon', role: 'Iron Fleet', fraction: 'Kuro Kanda', title: 'Daimyo', iron: true, image: '/brothers/wildwon.png' },
  { frat: 'Big Brother CATALYST', role: 'Iron Fleet', fraction: 'Kuro Kanda', title: 'KyōKishi — Chief Officer', iron: true, image: '/brothers/catalyst.png' },
  { frat: 'Big Brother Trench', role: 'Iron Fleet', fraction: 'Ishi No', title: 'Kaizoku Kansatsu — Chief Officer', iron: true, image: '/brothers/trench.png' },
];

const BROTHERS: Member[] = [
  { frat: 'Big Brother Sage', fraction: 'Ishi No', title: 'Member', image: '/brothers/sage.png' },
  { frat: 'Big Brother Fathom', fraction: 'Kuro Kanda', title: 'Member', image: '/brothers/fathom.png' },
  { frat: 'Big Brother Khaos', fraction: 'Kuro Kanda', title: 'Member', image: '/brothers/khaos.png' },
  { frat: 'Big Brother Limitless', image: '/brothers/limitless.png' },
  { frat: 'Big Brother 5 Star General', image: '/brothers/five-star-general.png' },
  { frat: 'Big Brother Pristine', image: '/brothers/pristine.png' },
  { frat: 'Big Brother Deep Dive', image: '/brothers/deep-dive.png' },
  { frat: 'Big Brother Reasonable', image: '/brothers/reasonable.png' },
  { frat: 'Big Brother Nexus', image: '/brothers/nexus.png' },
  { frat: 'Big Brother Sentinel', image: '/brothers/sentinel.png' },
  { frat: 'Big Brother Wildcard', image: '/brothers/wildcard.png' },
];

function getInitials(name: string) {
  const parts = name.replace(/^Big Bro(ther)?\s*/i, '').trim().split(/\s+/);
  return parts.map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function MemberCard({ frat, role, fraction, title, iron, image }: Member) {
  return (
    <div className={`member-card${iron ? ' iron' : ''}`}>
      {image ? (
        <img src={image} alt={frat} className="member-portrait" />
      ) : (
        <div className="member-avatar">{getInitials(frat)}</div>
      )}
      <div className="member-frat-name">{frat}</div>
      {role && <div className="member-role">{role}</div>}
      {fraction && <div className="member-fraction">{fraction} Fraction</div>}
      {title && <div className="member-fraction-title">{title}</div>}
      {iron && <div className="iron-badge">Iron Compass</div>}
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
          <li><a href="/brothers">Brothers</a></li>
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
            <p className="brothers-hero-sub">20 brothers. One bloodline. One legacy.</p>
          </div>
        </section>

        <div className="brothers-stats">
          <div className="brothers-stat">
            <div className="brothers-stat-num">20</div>
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
            <div className="brothers-stat-num">4</div>
            <div className="brothers-stat-label">Founders</div>
          </div>
        </div>

        <section className="roster-section reveal">
          <div className="roster-section-tag">The Architects</div>
          <div className="roster-section-title">Founders</div>
          <div className="roster-grid">
            {FOUNDERS.map(m => <MemberCard key={m.frat} {...m} />)}
          </div>
        </section>

        <section className="roster-section reveal">
          <div className="roster-section-tag">The Founding Compass</div>
          <div className="roster-section-title">Iron Fleet</div>
          <div className="roster-grid">
            {IRON_FLEET.map(m => <MemberCard key={m.frat} {...m} />)}
          </div>
        </section>

        <section className="roster-section reveal">
          <div className="roster-section-tag">The Brotherhood</div>
          <div className="roster-section-title">Brothers</div>
          <div className="roster-grid">
            {BROTHERS.map(m => <MemberCard key={m.frat} frat={m.frat} role="Member" fraction={m.fraction} title={m.title} image={m.image} />)}
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
