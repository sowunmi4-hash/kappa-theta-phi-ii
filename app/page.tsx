'use client';
import './globals.css';

export default function HomePage() {
  return (
    <>
      <nav id="navbar">
        <div className="nav-brand">KΘΦ <span>II</span></div>
        <ul className="nav-links" id="navLinks">
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/brothers">Brothers</a></li>
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
        <div className="video-container">
          <iframe
            src="https://www.youtube.com/embed/kQLWXpS1qx8?rel=0&modestbranding=1"
            title="KΘΦ II Official Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </section>

      <footer className="home-footer">
        <div className="footer-brand">KΘΦ II — WOKOU-CORSAIRS</div>
        <p>&copy; 2026 Kappa Theta Phi II Fraternity. All Rights Reserved.</p>
      </footer>
    </>
  );
}
