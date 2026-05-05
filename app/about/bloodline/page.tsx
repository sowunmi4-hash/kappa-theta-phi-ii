'use client';
import { useEffect } from 'react';
import './bloodline.css';

const LINES = [
  { numeral: 'I',   name: 'FOUNDING',  kanji: '火', mark: 'The Spark · Origin' },
  { numeral: 'II',  name: 'KRAKEN',    kanji: '触', mark: 'From The Depths' },
  { numeral: 'III', name: 'BERSERKER', kanji: '狂', mark: 'The Frenzy · Unbound' },
  { numeral: 'IV',  name: 'WOKOU',     kanji: '倭', mark: 'The Raid · Brotherhood' },
  { numeral: 'V',   name: 'ABYSSAL',   kanji: '深', mark: 'Into The Deep' },
];

export default function BloodlinePage() {
  useEffect(() => {
    // Lightweight particle canvas — same atmosphere as /about, fewer particles
    const canvas = document.getElementById('lineage-canvas') as HTMLCanvasElement;
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
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <>
      <nav id="navbar">
        <a href="/" className="nav-brand">KΘΦ <span>II</span></a>
        <ul className="nav-links" id="navLinks">
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/brothers">Brothers</a></li>
          <li><a href="/gallery">Gallery</a></li>
        </ul>
        <div className="mobile-toggle" onClick={() => document.getElementById('navLinks')?.classList.toggle('open')}>
          <span></span><span></span><span></span>
        </div>
      </nav>

      <canvas id="lineage-canvas"></canvas>

      <main className="lineage">
        {/* ── COMPACT HERO ── */}
        <header className="lh-hero">
          <div className="lh-tag">The Bloodline</div>
          <h1 className="lh-title">Lineage</h1>
          <p className="lh-sub">From Yasuke to KTP II · the line that runs through us</p>
        </header>

        {/* ── THE TREE ── */}
        <div className="tree">

          {/* Roots chain — vertical descent */}
          <div className="roots">
            <div className="node ancestor" style={{['--d' as any]: '0s'}}>
              <div className="n-label">Inspiration</div>
              <div className="n-name">Yasuke</div>
            </div>
            <div className="link" style={{['--d' as any]: '.15s'}}></div>

            <div className="node ancestor" style={{['--d' as any]: '.3s'}}>
              <div className="n-label">Frat Origin</div>
              <div className="n-name">Nevarious</div>
            </div>
            <div className="link" style={{['--d' as any]: '.45s'}}></div>

            <div className="node ancestor" style={{['--d' as any]: '.6s'}}>
              <div className="n-label">Brother Org</div>
              <div className="n-name">Raul Damu</div>
            </div>
            <div className="link" style={{['--d' as any]: '.75s'}}></div>

            <div className="node trunk" style={{['--d' as any]: '.9s'}}>
              <div className="n-label">Chapter II</div>
              <div className="n-name">Kappa Theta Phi II</div>
              <div className="n-mark">Wokou-Corsairs · Est. 3·14·21</div>
            </div>
          </div>

          {/* Vertical line connecting trunk down to the branch bar */}
          <div className="trunk-stem" style={{['--d' as any]: '1.1s'}}></div>

          {/* Branch label */}
          <div className="branch-label" style={{['--d' as any]: '1.2s'}}>The Five Lines Descended</div>

          {/* Lines — horizontal row with branch lines connecting up */}
          <div className="lines-row">
            <div className="branch-bar" style={{['--d' as any]: '1.3s'}}></div>
            {LINES.map((line, i) => (
              <div className="line-cell" key={line.numeral} style={{['--d' as any]: `${1.4 + i * 0.1}s`}}>
                <div className="line-stem"></div>
                <div className="node line-node">
                  <div className="ln-numeral">{line.numeral}</div>
                  <div className="ln-kanji">{line.kanji}</div>
                  <div className="ln-name">{line.name}<br/><span>Line</span></div>
                  <div className="ln-mark">{line.mark}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tides — visually separate, no connection to the trunk */}
          <div className="tides-divider" style={{['--d' as any]: '2s'}}>
            <span>Beyond The Lines</span>
          </div>

          <div className="tides-wrap" style={{['--d' as any]: '2.1s'}}>
            <div className="node tides-node">
              <div className="ln-kanji tides-kanji">潮</div>
              <div className="ln-name">The Tides</div>
              <div className="ln-mark">For some, the line was the open sea</div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="lineage-foot" style={{['--d' as any]: '2.4s'}}>
          <p className="motto">⚓ Death Before Dishonor ⚓</p>
          <a href="/about" className="back">← Return to The Story</a>
        </footer>
      </main>
    </>
  );
}
