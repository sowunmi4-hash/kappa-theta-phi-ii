'use client';
import { useState } from 'react';
import './globals.css';

const VIDEO_ID = 'kQLWXpS1qx8';

export default function HomePage() {
  const [lightbox, setLightbox] = useState(false);

  return (
    <>
      <nav id="navbar">
        <div className="nav-brand">KΘΦ <span>II</span></div>
        <ul className="nav-links" id="navLinks">
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/brothers">Brothers</a></li>
          <li><a href="/gallery">Gallery</a></li>
        </ul>
        <div className="mobile-toggle" id="mobileToggle" onClick={() => document.getElementById('navLinks')?.classList.toggle('open')}>
          <span></span><span></span><span></span>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="hero-bg"></div>
        <div className="hero-pattern"></div>
        <div className="hero-kanji left">武</div>
        <div className="hero-kanji right">士</div>
        <div className="side-line left"></div>
        <div className="side-line right"></div>
        <div className="side-label left">Est. Second Life</div>
        <div className="side-label right">Wokou-Corsairs</div>

        <div className="hero-content">
          <a href="/login"><img src="/logo.png" alt="KΘΦ II Wokou-Corsairs" className="hero-logo" style={{ cursor: 'pointer' }} /></a>
          <div className="hero-subtitle-top">Brotherhood Beyond Borders</div>
          <h1 className="hero-title">
            <span className="gold">Kappa Theta Phi</span><br />
            <span className="crimson">II Fraternity</span>
          </h1>
          <div className="hero-numeral">亗 WOKOU-CORSAIRS 亗</div>
          <div className="hero-divider"></div>
          <div className="hero-motto">Death before Dishonor · Est. 3/14/21</div>
        </div>

        <a href="#video" className="hero-scroll-hint">
          <span style={{ fontSize: '0.65rem', letterSpacing: '4px', textTransform: 'uppercase', color: 'rgba(198,147,10,0.4)', fontFamily: "'Rajdhani', sans-serif" }}>Scroll</span>
          <div style={{ width: '1px', height: '30px', background: 'linear-gradient(180deg, rgba(198,147,10,0.4), transparent)', marginTop: '0.4rem' }}></div>
        </a>
      </section>

      <section className="video-section" id="video">
        <div className="video-container" onClick={() => setLightbox(true)} style={{ cursor: 'pointer', position: 'relative' }}>
          <img
            src={`https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`}
            alt="KΘΦ II Official Video"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '4px' }}
          />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.3)', borderRadius: '4px'
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(178,34,52,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', color: '#fff', paddingLeft: '6px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.5)'
            }}>▶</div>
          </div>
        </div>
      </section>

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

      <footer className="home-footer">
        <div className="footer-brand">KΘΦ II — WOKOU-CORSAIRS</div>
        <p>&copy; 2026 Kappa Theta Phi II Fraternity. All Rights Reserved.</p>
      </footer>
    </>
  );
}
