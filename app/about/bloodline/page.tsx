'use client';
import { useEffect, useRef } from 'react';
import './bloodline.css';

const LINES = [
  { numeral: 'I',   name: 'Founding',  kanji: '火', mark: 'The Spark · Origin' },
  { numeral: 'II',  name: 'Kraken',    kanji: '触', mark: 'From The Depths' },
  { numeral: 'III', name: 'Berserker', kanji: '狂', mark: 'The Frenzy · Unbound' },
  { numeral: 'IV',  name: 'Wokou',     kanji: '倭', mark: 'The Raid · Brotherhood' },
  { numeral: 'V',   name: 'Abyssal',   kanji: '深', mark: 'Into The Deep' },
];

export default function BloodlinePage() {
  const dustRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = dustRef.current;
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
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <>
      <div className="kanji-watermarks">
        <span className="k1">血</span>
        <span className="k2">統</span>
        <span className="k3">家</span>
        <span className="k4">系</span>
        <span className="k5">魂</span>
      </div>

      <canvas ref={dustRef} id="bloodline-dust"></canvas>

      <nav id="navbar">
        <a href="/" className="nav-brand">KΘΦ <span>II</span></a>
        <ul className="nav-links" id="navLinks">
          <li><a href="/">Home</a></li>
          <li><a href="/about" className="active">About</a></li>
          <li><a href="/brothers">Brothers</a></li>
          <li><a href="/gallery">Gallery</a></li>
        </ul>
        <div className="mobile-toggle" onClick={() => document.getElementById('navLinks')?.classList.toggle('open')}>
          <span></span><span></span><span></span>
        </div>
      </nav>

      <main className="lineage">

        {/* ── HERO ── */}
        <header className="hero">
          <div className="hero-tag">The Bloodline</div>
          <h1 className="hero-title">Lineage <em>·</em> Chart</h1>
          <p className="hero-sub">From Yasuke to KTP II · the line that runs through us</p>
        </header>

        {/* ── THE TREE ── */}
        <div className="tree">

          {/* Roots chain — vertical descent */}
          <div className="roots-chain">
            <div className="node ancestor">
              <span className="corner-tr"></span><span className="corner-bl"></span><span className="corner-br"></span>
              <div className="n-label">Inspiration · 1581</div>
              <div className="n-name">Yasuke</div>
            </div>

            <div className="link"></div>

            <div className="node ancestor">
              <span className="corner-tr"></span><span className="corner-bl"></span><span className="corner-br"></span>
              <div className="n-label">Frat Origin</div>
              <div className="n-name">Nevarious</div>
            </div>

            <div className="link"></div>

            <div className="node ancestor">
              <span className="corner-tr"></span><span className="corner-bl"></span><span className="corner-br"></span>
              <div className="n-label">Brother Org</div>
              <div className="n-name">Raul Damu</div>
            </div>

            <div className="link"></div>

            <div className="node trunk">
              <span className="corner-tr"></span><span className="corner-bl"></span><span className="corner-br"></span>
              <div className="trunk-crown">⚓ Chapter II ⚓</div>
              <div className="greek">K Θ Φ II</div>
              <div className="n-name">Kappa Theta Phi II</div>
              <div className="n-mark">Wokou-Corsairs · Est. 3·14·21</div>
            </div>
          </div>

          {/* Trunk stem down to branches */}
          <div className="trunk-stem"></div>

          {/* Branch label */}
          <div className="branch-label">The Five Lines Descended</div>

          {/* Lines + SVG branch overlay */}
          <div className="branches-wrap">
            <svg className="branches-svg" viewBox="0 0 1000 80" preserveAspectRatio="none">
              <path className="b1" d="M 500 0 C 500 30, 200 30, 100 80"/>
              <path className="b2" d="M 500 0 C 500 30, 320 30, 300 80"/>
              <path className="b3" d="M 500 0 C 500 30, 500 30, 500 80"/>
              <path className="b4" d="M 500 0 C 500 30, 680 30, 700 80"/>
              <path className="b5" d="M 500 0 C 500 30, 800 30, 900 80"/>
            </svg>

            <div className="lines">
              {LINES.map(line => (
                <div className="node line-node" key={line.numeral}>
                  <span className="corner-tr"></span><span className="corner-bl"></span><span className="corner-br"></span>
                  <div className="line-numeral-seal">{line.numeral}</div>
                  <div className="line-kanji-crest">{line.kanji}</div>
                  <div className="line-name">{line.name}</div>
                  <div className="line-suffix">Line</div>
                  <div className="line-mark">{line.mark}</div>
                </div>
              ))}
            </div>
          </div>

          {/* TIDES — separate, distinct treatment */}
          <div className="tides-divider">Beyond The Lines</div>

          <div className="node tides-node">
            <span className="corner-tr"></span><span className="corner-bl"></span><span className="corner-br"></span>
            <div className="tides-kanji">潮</div>
            <div className="tides-name">The Tides</div>
            <div className="tides-mark">For some, the line was the open sea</div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="foot">
          <div className="motto">⚓ Death Before Dishonor ⚓</div>
          <a className="back" href="/about">← Return to The Story</a>
        </footer>
      </main>
    </>
  );
}
