'use client';
import { useEffect, useRef, useState } from 'react';
import './globals.css';

const VIDEO_ID = 'kQLWXpS1qx8';

export default function HomePage() {
  const [lightbox, setLightbox] = useState(false);
  const dustRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Scroll-triggered reveal
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    // Particle dust
    const canvas = dustRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const motes = Array.from({ length: 36 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.1,
      vy: -(Math.random() * 0.3 + 0.1),
      r: Math.random() * 1.4 + 0.4,
      a: Math.random() * 0.4 + 0.1,
      t: Math.random() * Math.PI * 2,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      motes.forEach(m => {
        m.x += m.vx; m.y += m.vy; m.t += 0.008;
        if (m.y < -10) { m.y = window.innerHeight + 10; m.x = Math.random() * window.innerWidth; }
        const alpha = m.a * (0.6 + Math.sin(m.t) * 0.4);
        ctx.fillStyle = `rgba(198,147,10,${alpha})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); io.disconnect(); };
  }, []);

  return (
    <>
      <div className="kanji-watermarks">
        <span className="k1">武</span>
        <span className="k2">士</span>
        <span className="k3">兄</span>
        <span className="k4">義</span>
        <span className="k5">忠</span>
      </div>

      <canvas ref={dustRef} id="home-dust"></canvas>

      <nav id="navbar">
        <a href="/" className="nav-brand">KΘΦ <span>II</span></a>
        <ul className="nav-links" id="navLinks">
          <li><a href="/" className="active">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/brothers">Brothers</a></li>
          <li><a href="/gallery">Gallery</a></li>
          <li><a href="/philanthropy">Philanthropy</a></li>
          <li><a href="/store" className="nav-store">Store</a></li>
        </ul>
        <div className="mobile-toggle" onClick={() => document.getElementById('navLinks')?.classList.toggle('open')}>
          <span></span><span></span><span></span>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-tag">Brotherhood Beyond Borders</div>

        <a href="/login" className="hero-logo-wrap" aria-label="Login">
          <span className="hl-tl"></span><span className="hl-tr"></span>
          <span className="hl-bl"></span><span className="hl-br"></span>
          <img src="/logo.png" alt="KΘΦ II Wokou-Corsairs" className="hero-logo" />
        </a>

        <div className="hero-greek">K Θ Φ II</div>
        <h1 className="hero-title">Kappa Theta Phi <em>II</em></h1>
        <div className="hero-corsairs">Wokou-Corsairs</div>
        <div className="hero-divider"></div>
        <div className="hero-motto"><strong>Death Before Dishonor</strong></div>
        <div className="hero-est">Est. 3·14·21</div>

        <a href="#pillars" className="scroll-hint">Scroll</a>
      </section>

      {/* ── THREE PILLARS ── */}
      <div className="section-divider reveal" id="pillars">
        <span className="label">Three Pillars</span>
        <span className="sub">The brotherhood, the lineage, the work</span>
      </div>

      <div className="pillars-wrap">
        <div className="pillars">
          <a href="/brothers" className="pillar reveal reveal-1">
            <span className="pc-tl"></span><span className="pc-tr"></span><span className="pc-bl"></span><span className="pc-br"></span>
            <div className="p-kanji">兄</div>
            <div className="p-stat">Twenty</div>
            <div className="p-name">The Brotherhood</div>
            <p className="p-desc">Founders, Iron Fleet, Faction, Fleet — every brother charted</p>
            <span className="p-link">Meet The Brothers →</span>
          </a>

          <a href="/about/bloodline" className="pillar reveal reveal-2">
            <span className="pc-tl"></span><span className="pc-tr"></span><span className="pc-bl"></span><span className="pc-br"></span>
            <div className="p-kanji">統</div>
            <div className="p-stat">Five Lines</div>
            <div className="p-name">The Bloodline</div>
            <p className="p-desc">From Yasuke to KTP II — the line that runs through us</p>
            <span className="p-link">Trace The Lineage →</span>
          </a>

          <a href="/philanthropy" className="pillar reveal reveal-3">
            <span className="pc-tl"></span><span className="pc-tr"></span><span className="pc-bl"></span><span className="pc-br"></span>
            <div className="p-kanji">慈</div>
            <div className="p-stat">2026</div>
            <div className="p-name">Philanthropy</div>
            <p className="p-desc">Birdies For BIFIDA · Spina Bifida Awareness · current cause</p>
            <span className="p-link">View Philanthropy →</span>
          </a>
        </div>
      </div>

      {/* ── VIDEO ── */}
      <div className="section-divider reveal">
        <span className="label">The Anthem</span>
        <span className="sub">Watch the chapter's official film</span>
      </div>

      <div className="video-wrap" id="video">
        <div className="video-frame reveal" onClick={() => setLightbox(true)}>
          <span className="vc-tl"></span><span className="vc-tr"></span>
          <span className="vc-bl"></span><span className="vc-br"></span>
          <img src={`https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`} alt="KΘΦ II Official Video" />
          <div className="video-overlay">
            <div className="play-btn">▶</div>
          </div>
        </div>
      </div>

      {/* ── CURRENTLY CHAMPIONING PULL-UP ── */}
      <div className="section-divider reveal">
        <span className="label">Currently Championing</span>
        <span className="sub">The cause the chapter is working in 2026</span>
      </div>

      <div className="champ-wrap">
        <a href="/philanthropy" className="champ reveal">
          <span className="champ-corner-tl"></span><span className="champ-corner-tr"></span>
          <span className="champ-corner-bl"></span><span className="champ-corner-br"></span>
          <div className="champ-emblem">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 2 L12 8 L15 2 L18 4 L13.5 11 L13.5 22 L12 21 L10.5 22 L10.5 11 L6 4 Z"/>
            </svg>
          </div>
          <div className="champ-text">
            <div className="champ-tag">2026 · Currently Championing</div>
            <div className="champ-title">Birdies For BIFIDA</div>
            <div className="champ-sub">In support of the Spina Bifida Association — the chapter's wider philanthropy work</div>
          </div>
          <div className="champ-cta">View Philanthropy →</div>
        </a>
      </div>

      {/* ── FOOTER ── */}
      <footer className="home-footer">
        <div className="foot-mark">KΘΦ II — Wokou-Corsairs</div>
        <div className="foot-tag">Death Before Dishonor · Est. 3·14·21</div>
        <div className="foot-meta">© 2026 Kappa Theta Phi II Fraternity · All Rights Reserved</div>
      </footer>

      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <div onClick={() => setLightbox(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ position: 'relative', width: '90vw', maxWidth: '1100px', aspectRatio: '16/9' }}
               onClick={e => e.stopPropagation()}>
            <iframe
              src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: '6px' }}
            />
          </div>
          <div onClick={() => setLightbox(false)} style={{
            position: 'fixed', top: '1.5rem', right: '2rem', color: '#fff', fontSize: '2rem',
            cursor: 'pointer', zIndex: 10000, lineHeight: 1
          }}>✕</div>
        </div>
      )}
    </>
  );
}
