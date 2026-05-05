'use client';
import { useEffect, useRef } from 'react';
import './philanthropy.css';

const BIFIDA_PHOTOS = [
  'https://uamhroebetbacvxdvzxo.supabase.co/storage/v1/object/public/gallery/bifida-1777258950193.jpg',
  'https://uamhroebetbacvxdvzxo.supabase.co/storage/v1/object/public/gallery/bifida-1777258957832.jpg',
  'https://uamhroebetbacvxdvzxo.supabase.co/storage/v1/object/public/gallery/bifida-1777258964876.jpg',
  'https://uamhroebetbacvxdvzxo.supabase.co/storage/v1/object/public/gallery/bifida-1777258973908.jpg',
];

const PAST_PRIMARIES = [
  {
    year: '2024',
    title: 'Save The Music\nFoundation',
    org: 'Music Education Restoration',
    desc: 'A nonprofit dedicated to restoring and supporting music education in schools by providing instruments, funding, and resources so students can access the benefits of music programs.',
    statValue: 'L$ 100,000',
    statLabel: 'Total Raised',
    statPending: '— pending final confirmation —',
    partner: 'Delta Psi Gamma',
    donateUrl: 'https://www.savethemusic.org',
    logoSrc: '/philanthropy/savethemusic.jpg',
    logoBg: 'light' as const,
  },
  {
    year: '2025',
    title: 'Gamer Outreach\nFoundation',
    org: 'Gaming for Hospitalized Children',
    desc: 'A charity that uses video games to support hospitalized children by providing gaming equipment and programs that help reduce stress, build community, and improve overall well-being during treatment.',
    statValue: 'L$ —',
    statLabel: 'Total Raised',
    statPending: '— pending confirmation —',
    partner: 'Gamma Delta Mu Xi',
    donateUrl: 'https://www.gamersoutreach.org',
    logoSrc: '/philanthropy/gamersoutreach.png',
    logoBg: 'dark' as const,
  },
];

const HONOURABLE = [
  { year: '2023', name: 'Golfing for Lupus' },
  { year: '2023', name: 'American Heart Association' },
  { year: '2023', name: 'Feed the Hungry' },
  { year: '2022', name: 'Various Supporting Campaigns', tag: 'Multiple Organizations' },
];

export default function PhilanthropyPage() {
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
    const motes = Array.from({ length: 28 }, () => ({
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
        <span className="k1">慈</span>
        <span className="k2">善</span>
        <span className="k3">奉</span>
        <span className="k4">仕</span>
      </div>

      <canvas ref={dustRef} id="phil-dust"></canvas>

      <nav id="navbar">
        <a href="/" className="nav-brand">KΘΦ <span>II</span></a>
        <ul className="nav-links" id="navLinks">
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/brothers">Brothers</a></li>
          <li><a href="/gallery">Gallery</a></li>
          <li><a href="/philanthropy" className="active">Philanthropy</a></li>
        </ul>
        <div className="mobile-toggle" onClick={() => document.getElementById('navLinks')?.classList.toggle('open')}>
          <span></span><span></span><span></span>
        </div>
      </nav>

      <main className="phil-main">

        {/* Page opening — compact */}
        <header className="page-open">
          <div className="po-tag">Service · Stewardship · Honor</div>
          <h1 className="po-title">Philanthropy</h1>
          <p className="po-sub">The work we do beyond the brotherhood</p>
        </header>

        {/* Hero — Currently Championing */}
        <section className="hero reveal">

          {/* Cause banner — Spina Bifida Awareness logo */}
          <div className="hero-banner">
            <span className="hb-corner-tl"></span>
            <span className="hb-corner-tr"></span>
            <span className="hb-corner-bl"></span>
            <span className="hb-corner-br"></span>
            <img
              src="/philanthropy/spinabifida.jpg"
              alt="Spina Bifida Awareness — Supporting The Fight"
            />
          </div>

          <div className="hero-grid">

            <div className="hero-text">
              <div className="hero-tag">
                <span className="glyph"></span>
                <span className="hero-year">2026</span>
                <span>Currently Championing</span>
              </div>

              <h2 className="hero-title">Birdies For Bifida</h2>
              <div className="hero-org">In support of the Spina Bifida Association</div>

              <p className="hero-desc">
                The Spina Bifida Association is an organization focused on improving the lives of individuals
                affected by spina bifida through advocacy, education, research support, and community resources
                for patients and families. The chapter's current campaign, <em>Birdies For BIFIDA</em>, carries
                this work into its 2026 year.
              </p>

              <div className="hero-meta">
                <div className="hero-meta-row"><span>Cause</span><strong>Spina Bifida Association</strong></div>
                <div className="hero-meta-row"><span>Year</span><strong>2026 — Active</strong></div>
                <div className="hero-meta-row"><span>Plates Recorded</span><strong>24 photographs</strong></div>
              </div>

              <div className="hero-actions">
                <a href="https://www.spinabifidaassociation.org" target="_blank" rel="noopener" className="btn btn-primary">
                  Donate to Spina Bifida →
                </a>
                <a href="/gallery" className="btn btn-ghost">View All Plates →</a>
              </div>
            </div>

            <div className="hero-photos">
              {BIFIDA_PHOTOS.map((src, i) => (
                <div className="hero-photo" key={i}>
                  <img src={src} alt="Birdies For BIFIDA plate" loading="lazy" />
                  <div className="plate">P · {String(i + 1).padStart(3, '0')}</div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Past primary charities */}
        <div className="section-divider reveal">
          <span className="label">Past Primary Charities</span>
          <span className="sub">Causes the chapter championed</span>
        </div>

        <section className="past-grid">
          {PAST_PRIMARIES.map((c, i) => (
            <article className={`charity-card reveal reveal-${i + 1}`} key={c.year}>
              <span className="ctr"></span><span className="cbl"></span><span className="cbr"></span>
              <div className="cc-year">{c.year}</div>
              <h3 className="cc-title">{c.title.split('\n').map((line, idx) => (
                <span key={idx}>{line}{idx < c.title.split('\n').length - 1 ? <br/> : null}</span>
              ))}</h3>
              <div className="cc-org">{c.org}</div>
              <div className={`cc-logo-img ${c.logoBg}`}>
                <img src={c.logoSrc} alt={`${c.title.split('\n')[0]} logo`} loading="lazy" />
              </div>
              <p className="cc-desc">{c.desc}</p>
              <div className="cc-stat">
                <span className="cc-stat-value">{c.statValue}</span>
                <span className="cc-stat-label">{c.statLabel}</span>
                <span className="cc-stat-pending">{c.statPending}</span>
              </div>
              <div className="cc-partner">In collaboration with <strong>{c.partner}</strong></div>
              <div className="cc-actions">
                <a href={c.donateUrl} target="_blank" rel="noopener" className="btn btn-primary">Donate →</a>
              </div>
            </article>
          ))}
        </section>

        {/* Honourable mentions */}
        <div className="section-divider reveal">
          <span className="label">Honourable Mentions</span>
          <span className="sub">Earlier campaigns the chapter supported in collaboration</span>
        </div>

        <section className="honourable">
          <div className="honourable-list">
            {HONOURABLE.map((h, i) => (
              <div className={`hm-row reveal reveal-${i + 1}`} key={`${h.year}-${h.name}`}>
                <div className="hm-year">{h.year}</div>
                <div className="hm-name">{h.name}</div>
                <div className="hm-tag">{h.tag || 'Collaboration'}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Collaborate CTA */}
        <section className="collab reveal">
          <div className="collab-tag">⚓ Collaborate</div>
          <h3 className="collab-title">Stand With The<br/>Wokou-Corsairs</h3>
          <p className="collab-body">
            Each year the chapter selects a primary cause and works it through. If you represent an
            organization and want to <em>partner with KTP II</em>, or if you'd like to give directly to a
            current cause — both doors are open.
          </p>
          <div className="collab-actions">
            <a href="https://www.spinabifidaassociation.org" target="_blank" rel="noopener" className="btn btn-primary">
              Donate to Current Cause →
            </a>
            <a href="mailto:contact@ktpii.org" className="btn btn-ghost">
              Reach Chapter Leadership →
            </a>
          </div>
        </section>

      </main>
    </>
  );
}
