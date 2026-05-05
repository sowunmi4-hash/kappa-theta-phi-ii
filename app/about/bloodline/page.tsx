'use client';
import { useEffect } from 'react';
import './bloodline.css';

// Wraps each character of a string in a span for letter-by-letter reveals.
// Spaces become explicit .space spans so they hold width during the rotateX.
function letters(text: string) {
  return text.split('').map((ch, i) => {
    if (ch === ' ') return <span key={i} className="space" style={{transitionDelay: `${i * 0.045}s`}}>&nbsp;</span>;
    return <span key={i} style={{transitionDelay: `${i * 0.045}s`}}>{ch}</span>;
  });
}

const LINES = [
  { numeral: 'I',   name: 'FOUNDING LINE', kanji: '火', mark: 'The Spark · Origin' },
  { numeral: 'II',  name: 'KRAKEN LINE',   kanji: '触', mark: 'From The Depths' },
  { numeral: 'III', name: 'WOKOU LINE',    kanji: '倭', mark: 'The Raid · Brotherhood' },
  { numeral: 'IV',  name: 'ABYSSAL LINE',  kanji: '深', mark: 'Into The Deep' },
];

export default function BloodlinePage() {
  useEffect(() => {
    // ── CANVAS PARTICLES (matched to /about, slightly slower) ──
    const canvas = document.getElementById('bg-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let W: number, H: number;
    type Particle = { x:number; y:number; vx:number; vy:number; a:number; size:number; life:number; maxLife:number };
    let particles: Particle[] = [];
    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);
    function mkP(): Particle { return { x: Math.random()*W, y: H+10, vx: (Math.random()-.5)*.3, vy: -(Math.random()*.45+.2), a: 0, size: Math.random()*1.4+.4, life: 0, maxLife: Math.random()*500+300 }; }
    let raf: number;
    function animCanvas() {
      ctx.clearRect(0,0,W,H);
      if (particles.length < 70) particles.push(mkP());
      particles = particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.life++;
        const pct = p.life / p.maxLife;
        p.a = pct < .1 ? pct*10 : pct > .8 ? (1-pct)*5 : 1;
        ctx.globalAlpha = p.a * .45;
        ctx.fillStyle = '#c6930a';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        return p.life < p.maxLife && p.y > -20;
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(animCanvas);
    }
    animCanvas();

    // ── PROGRESS / NAV / DOTS ──
    const progBar = document.getElementById('prog')!;
    const navbar = document.getElementById('navbar')!;
    const sections = document.querySelectorAll<HTMLElement>('[data-ch]');
    const dots = document.querySelectorAll<HTMLButtonElement>('.ch-dot');
    function onScroll() {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
      progBar.style.width = pct + '%';
      navbar.classList.toggle('scrolled', window.scrollY > 80);
      let current = 0;
      sections.forEach(s => { if (window.scrollY >= s.offsetTop - 240) current = parseInt(s.dataset.ch||'0'); });
      dots.forEach(d => d.classList.toggle('active', parseInt(d.dataset.ch||'0') === current));
    }
    window.addEventListener('scroll', onScroll);

    // ── DOT CLICK ──
    dots.forEach(d => d.addEventListener('click', () => {
      const ch = parseInt(d.dataset.ch||'0');
      const target = Array.from(sections).find(s => parseInt(s.dataset.ch||'0') === ch);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }));

    // ── REVEAL ON SCROLL ──
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
    }, { threshold: .18 });
    document.querySelectorAll('.R, .line-name').forEach(el => obs.observe(el));

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <>
      <canvas id="bg-canvas"></canvas>
      <div id="prog"></div>

      <nav id="navbar">
        <a href="/" className="nav-brand">KΘΦ <span>II</span></a>
        <ul className="nav-links">
          <li><a href="/">Home</a></li>
          <li><a href="/about" className="current">About</a></li>
          <li><a href="/brothers">Brothers</a></li>
          <li><a href="/gallery">Gallery</a></li>
        </ul>
        <div className="mobile-toggle"><span></span><span></span><span></span></div>
      </nav>

      <a href="/about" className="back-link">Return to About</a>

      <div id="chapter-nav">
        {['The Bloodline','Roots','Founding','Kraken','Wokou','Abyssal','Closing'].map((title, i) => (
          <button key={i} className={`ch-dot ${i===0?'active':''}`} data-ch={String(i)} title={title}></button>
        ))}
      </div>

      {/* ── HERO ── */}
      <section id="hero" data-ch="0">
        <p className="hero-eyeline">Lineage of KΘΦ Chapter II</p>
        <h1 className="hero-title">The<em>Bloodline</em></h1>
        <p className="hero-sub">Brothers come and go · The line endures</p>
        <div className="hero-mark"></div>
        <div className="scroll-cue">
          <span>Descend</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      <div className="ch-divider" data-label="Roots — Before The Chapter"></div>

      {/* ── ORIGINS ── */}
      <section id="origins" data-ch="1">
        <div className="origins-watermark">ROOTS</div>
        <div className="origins-wrap">
          <p className="origins-eyeline R">The Sacred Chain</p>
          <h2 className="origins-heading R d1">Before<br/><em>The Chapter</em></h2>
          <p className="origins-tag R d2">起源 · The Lineage Before The Lineage</p>

          <div className="R d3">
            <div className="origin-node">
              <div className="origin-seal">Y</div>
              <div className="origin-text">
                <div className="origin-name">Yasuke</div>
                <div className="origin-sub">The Legendary African Samurai</div>
              </div>
            </div>
            <div className="origin-spine"></div>
            <div className="origin-node">
              <div className="origin-seal">N</div>
              <div className="origin-text">
                <div className="origin-name">Nevarious</div>
                <div className="origin-sub">Yoruba Tradition · Orisha Mysteries</div>
              </div>
            </div>
            <div className="origin-spine"></div>
            <div className="origin-node">
              <div className="origin-seal">RD</div>
              <div className="origin-text">
                <div className="origin-name">Raul Damu</div>
                <div className="origin-sub">Founded KTP SL — 2011</div>
              </div>
            </div>
            <div className="origin-spine"></div>
            <div className="origin-terminus">
              <div className="origin-terminus-name">KΘΦ Chapter II</div>
              <div className="origin-terminus-sub">Born · 3·14·21</div>
            </div>
          </div>
        </div>
      </section>

      <div className="ch-divider" data-label="The Lines of Descent"></div>

      {/* ── BRIDGE ── */}
      <section id="bridge">
        <div>
          <div className="bridge-mark R">系譜 · Genealogy</div>
          <h2 className="bridge-line R d1">From The Founders,<br/>The <em>Lines Descended</em>.</h2>
          <div className="bridge-flourish R d2"></div>
        </div>
      </section>

      {/* ── THE FOUR LINES ── */}
      {LINES.map((line, idx) => (
        <div key={line.name}>
          <div className="ch-divider" data-label={`Line ${line.numeral}`}></div>
          <section className="line-chapter" data-ch={String(idx + 2)}>
            <div className="line-kanji-bg">{line.kanji}</div>
            <div className="line-numeral-wrap R">
              <div className="line-numeral">{line.numeral}</div>
            </div>
            <p className="line-eyeline R d1">Generation · {line.numeral}</p>
            <h2 className="line-name">{letters(line.name)}</h2>
            <div className="line-flourish R d3"></div>
            <p className="line-marking R d4">{line.mark}</p>
          </section>
        </div>
      ))}

      <div className="ch-divider" data-label="The Lineage Endures"></div>

      {/* ── CLOSING ── */}
      <section id="closing" data-ch="6">
        <h2 className="closing-mark R">The Bloodline<br/><em>Endures</em></h2>
        <p className="closing-motto R d1">⚓ Death Before Dishonor ⚓</p>
        <a href="/about" className="closing-back R d2">Return to The Story</a>
      </section>
    </>
  );
}
