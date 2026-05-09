'use client';
import { useEffect, useRef, useState } from 'react';
import './home.css';

const VIDEO_ID = 'kQLWXpS1qx8';

export default function HomePage() {
  const [lightbox, setLightbox] = useState(false);
  const [scrolled, setScrolled]  = useState(false);
  const dustRef = useRef<HTMLCanvasElement>(null);
  const navRef  = useRef<HTMLElement>(null);

  useEffect(() => {
    // Scroll nav style
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });

    // Reveal on scroll
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    // Dust particles
    const canvas = dustRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const GOLD = 'rgba(198,147,10,';
    type P = { x:number; y:number; r:number; vx:number; vy:number; a:number; va:number; };
    const particles: P[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -Math.random() * 0.22 - 0.05,
      a: Math.random() * 0.35 + 0.05,
      va: (Math.random() - 0.5) * 0.003,
    }));
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.a += p.va;
        if (p.a < 0.03) p.va = Math.abs(p.va);
        if (p.a > 0.45) p.va = -Math.abs(p.va);
        if (p.y < -5) p.y = canvas.height + 5;
        if (p.x < -5) p.x = canvas.width + 5;
        if (p.x > canvas.width + 5) p.x = -5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${GOLD}${p.a.toFixed(2)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); window.removeEventListener('scroll', onScroll); };
  }, []);

  return (
    <>
      {/* Atmosphere */}
      <div className="home-kanji" aria-hidden="true">
        <span className="k1">武</span>
        <span className="k2">海</span>
        <span className="k3">義</span>
      </div>
      <canvas id="home-dust" ref={dustRef} aria-hidden="true"/>

      {/* ── NAV ── */}
      <nav className={`hn-nav${scrolled?' scrolled':''}`} ref={navRef}>
        <a href="/" className="hn-brand">KΘΦ II</a>
        <ul className="hn-links">
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/brothers">Brothers</a></li>
          <li><a href="/gallery">Gallery</a></li>
          <li><a href="/philanthropy">Philanthropy</a></li>
        </ul>
        <a href="/login" className="hn-enter">Enter</a>
      </nav>

      {/* ── HERO ── */}
      <section className="hn-hero">
        <div className="hn-hero-sub">Brotherhood Beyond Borders</div>

        <a href="/login" className="hn-seal" aria-label="Enter the dashboard">
          <div className="hn-seal-ring r1"/>
          <div className="hn-seal-ring r2"/>
          <div className="hn-seal-ring r3"/>
          <div className="hn-seal-glow"/>
          <img src="/logo.png" alt="KΘΦ II Crest" className="hn-seal-logo"/>
        </a>
        <div className="hn-seal-tap">Touch the seal to enter</div>

        <h1 className="hn-title">Kappa Theta Phi <em>II</em></h1>
        <div className="hn-corsairs">Wokou·Corsairs</div>
        <div className="hn-divider"/>
        <div className="hn-motto">Death Before Dishonor</div>
        <div className="hn-est">Est. 3 · 14 · 21</div>

        <a href="#pillars" className="hn-scroll">Scroll</a>
      </section>

      {/* ── THREE PILLARS ── */}
      <div className="hn-sec reveal" id="pillars">
        <div className="hn-sec-label">Three Pillars</div>
        <div className="hn-sec-sub">The brotherhood, the lineage, the work</div>
      </div>
      <div className="hn-pillars">
        <a href="/brothers" className="hn-pillar reveal reveal-1">
          <div className="hn-p-kanji">兄</div>
          <div className="hn-p-stat">Twenty</div>
          <div className="hn-p-name">The Brotherhood</div>
          <p className="hn-p-desc">Founders, Iron Fleet, Faction, Fleet — every brother charted</p>
          <span className="hn-p-cta">Meet The Brothers →</span>
        </a>
        <a href="/about/bloodline" className="hn-pillar reveal reveal-2">
          <div className="hn-p-kanji">統</div>
          <div className="hn-p-stat">Five Lines</div>
          <div className="hn-p-name">The Bloodline</div>
          <p className="hn-p-desc">From Yasuke to KTP II — the line that runs through every brother</p>
          <span className="hn-p-cta">Trace The Lineage →</span>
        </a>
        <a href="/philanthropy" className="hn-pillar reveal reveal-3">
          <div className="hn-p-kanji">慈</div>
          <div className="hn-p-stat">2026</div>
          <div className="hn-p-name">Philanthropy</div>
          <p className="hn-p-desc">Birdies For BIFIDA · Spina Bifida Awareness · current cause</p>
          <span className="hn-p-cta">View Philanthropy →</span>
        </a>
      </div>

      {/* ── ANTHEM ── */}
      <div className="hn-sec reveal" style={{marginTop:'2.5rem'}}>
        <div className="hn-sec-label">The Anthem</div>
        <div className="hn-sec-sub">The chapter's official film</div>
      </div>
      <div className="hn-video-wrap reveal">
        <div className="hn-video-frame" onClick={() => setLightbox(true)}>
          <span className="hn-video-corner tl"/><span className="hn-video-corner tr"/>
          <span className="hn-video-corner bl"/><span className="hn-video-corner br"/>
          <img src={`https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`} alt="KΘΦ II Official Video"/>
          <div className="hn-play">
            <div className="hn-play-btn">
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* ── LINEAGE ── */}
      <div className="hn-sec reveal" style={{marginTop:'2.5rem'}}>
        <div className="hn-sec-label">The Lineage</div>
        <div className="hn-sec-sub">The line that binds every brother to the origin</div>
      </div>
      <div className="hn-lineage reveal">
        <div className="hn-lineage-card">
          <div>
            <div className="hn-lineage-title">Where the line begins</div>
            <div className="hn-lineage-line">Five bloodlines. One origin.</div>
            <p className="hn-lineage-desc">
              Before you wore the letters, someone else carried them. The lineage of KΘΦ II runs from a single root through five distinct lines — each forged by the brothers who came before and the trials they chose to endure.
            </p>
            <a href="/about/bloodline" className="hn-lineage-cta">Trace The Full Lineage →</a>
          </div>
          <div className="hn-lineage-tree">
            <div className="hn-tree-node origin">Yasuke</div>
            <div className="hn-tree-arrow">↓</div>
            <div className="hn-tree-node">Nevarious</div>
            <div className="hn-tree-arrow">↓</div>
            <div className="hn-tree-node">Raul Damu</div>
            <div className="hn-tree-arrow">↓</div>
            <div className="hn-tree-node origin">KΘΦ II — Five Lines · The Tides</div>
          </div>
        </div>
      </div>

      {/* ── CURRENTLY CHAMPIONING ── */}
      <div className="hn-sec reveal" style={{marginTop:'2.5rem'}}>
        <div className="hn-sec-label">Currently Championing</div>
        <div className="hn-sec-sub">The cause the chapter is working in 2026</div>
      </div>
      <div className="hn-champ reveal">
        <a href="/philanthropy" className="hn-champ-card">
          <div className="hn-champ-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 2L12 8L15 2L18 4L13.5 11L13.5 22L12 21L10.5 22L10.5 11L6 4Z"/>
            </svg>
          </div>
          <div>
            <div className="hn-champ-tag">2026 · Currently Championing</div>
            <div className="hn-champ-title">Birdies For BIFIDA</div>
            <div className="hn-champ-sub">In support of the Spina Bifida Association — the chapter's wider philanthropy work</div>
          </div>
          <span className="hn-champ-arr">View Philanthropy →</span>
        </a>
      </div>

      {/* ── FOOTER ── */}
      <footer className="hn-footer">
        <div className="hn-footer-mark">KΘΦ II — Wokou-Corsairs</div>
        <div className="hn-footer-tag">Death Before Dishonor · Est. 3·14·21</div>
        <div className="hn-footer-copy">© 2026 Kappa Theta Phi II Fraternity · All Rights Reserved</div>
      </footer>

      {/* LIGHTBOX */}
      {lightbox && (
        <div className="hn-lightbox" onClick={() => setLightbox(false)}>
          <button className="hn-lb-close" onClick={() => setLightbox(false)}>✕</button>
          <iframe onClick={e => e.stopPropagation()}
            src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1`}
            allow="autoplay; encrypted-media" allowFullScreen/>
        </div>
      )}
    </>
  );
}
