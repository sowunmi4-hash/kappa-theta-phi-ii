'use client';
import { useState, useEffect, useCallback } from 'react';
import './about.css';

const SLIDES = [
  { tag: 'Who We Are', title: 'The Wokou-Corsairs', kanji: '魂' },
  { tag: 'Our Cultural Foundation', title: 'Where Chaos Became Power', kanji: '海' },
  { tag: 'Chapter I — Origins', title: 'The Legacy of Kappa Theta Phi', kanji: '火' },
  { tag: 'Chapter II — The Awakening', title: 'The Call to Awaken', kanji: '眼' },
  { tag: 'Chapter III — The Depths', title: 'The Battle of the Depths', kanji: '淵' },
  { tag: 'Chapter IV — Rebirth', title: 'The Rise of the Next Generation', kanji: '生' },
  { tag: 'Our Principles', title: 'What We Stand For', kanji: '道' },
  { tag: 'The Legacy', title: 'We Are the Sons of Olokun', kanji: '永' },
];

export default function AboutPage() {
  const [current, setCurrent] = useState(0);

  const goTo = useCallback((i: number) => {
    if (i >= 0 && i < SLIDES.length) setCurrent(i);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(current + 1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(current - 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [current, goTo]);

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

      <main className="about-page">
        <div className="slide-bg" />
        <div className="slide-kanji" key={current}>{SLIDES[current].kanji}</div>

        <div className="slides-wrapper">

          {/* SLIDE 0: Who We Are */}
          <div className={`slide ${current === 0 ? 'active' : ''}`}>
            <div className="slide-content" key={current === 0 ? 'active-0' : 'idle-0'}>
              <div className="slide-tag">{SLIDES[0].tag}</div>
              <h1 className="slide-title">{SLIDES[0].title}</h1>
              <div className="slide-divider" />
              <p className="slide-text">
                <strong>Kappa Theta Phi Chapter II</strong> — the Wokou-Corsairs — is a brotherhood forged from tradition, rebellion, and strategic evolution. We are a collective of leaders, creators, and visionaries united by a shared mission: to navigate uncharted waters, build lasting legacies, and uplift our community.
              </p>
              <p className="slide-text">
                Inspired by the lawless ambition of <strong>Port Royal</strong>, the fearless spirit of the <strong>Wokou</strong>, and the divine depth of <strong>Olokun</strong> — we are a brotherhood built to navigate, conquer, and leave our mark.
              </p>
              <div className="slide-quote"><p>We don't follow waves. We create them.</p></div>
            </div>
          </div>

          {/* SLIDE 1: Cultural Foundation */}
          <div className={`slide ${current === 1 ? 'active' : ''}`}>
            <div className="slide-content" key={current === 1 ? 'active-1' : 'idle-1'}>
              <div className="slide-tag">{SLIDES[1].tag}</div>
              <h2 className="slide-title">{SLIDES[1].title}</h2>
              <div className="slide-divider" />
              <p className="slide-text">
                Once known as the "wickedest city on Earth," <strong>Port Royal, Jamaica</strong> stood as a haven for pirates, privateers, and outlaws during the Golden Age of Piracy. Power was taken, not given. Wealth was earned through risk. Brotherhood formed in the face of danger.
              </p>
              <div className="slide-pillars">
                <div className="slide-pillar">
                  <div className="slide-pillar-kanji">海</div>
                  <h3>The Wokou</h3>
                  <p>Adaptability, courage, and calculated movement</p>
                </div>
                <div className="slide-pillar">
                  <div className="slide-pillar-kanji">深</div>
                  <h3>Olokun</h3>
                  <p>Spiritual depth, legacy awareness, limitless potential</p>
                </div>
                <div className="slide-pillar">
                  <div className="slide-pillar-kanji">力</div>
                  <h3>The Kraken</h3>
                  <p>Absolute power beneath the surface</p>
                </div>
                <div className="slide-pillar">
                  <div className="slide-pillar-kanji">冠</div>
                  <h3>Port Royal</h3>
                  <p>Where chaos became empire</p>
                </div>
              </div>
            </div>
          </div>

          {/* SLIDE 2: Origins */}
          <div className={`slide ${current === 2 ? 'active' : ''}`}>
            <div className="slide-content" key={current === 2 ? 'active-2' : 'idle-2'}>
              <div className="slide-tag">{SLIDES[2].tag}</div>
              <h2 className="slide-title">{SLIDES[2].title}</h2>
              <div className="slide-divider" />
              <p className="slide-text">
                In the aftermath of the <em>Great Fire War</em>, two rival forces — the Wokou and the Samurai — rose from destruction not as enemies, but as brothers. What began as conflict evolved into an unbreakable alliance, sealed through a sacred blood oath that would transcend generations.
              </p>
              <p className="slide-text">
                At the heart of this legacy stands <strong>Yasuke</strong>, the legendary African Samurai whose presence bridged cultures and redefined honour. His son, <strong>Nevarious</strong>, journeyed across continents to master the sacred traditions of the Yoruba and unlock the mysteries of the Orishas.
              </p>
              <p className="slide-text">
                That wisdom was passed to <strong>Raul Damu</strong>, who in 2011 founded <strong>Kappa Theta Phi Fraternity of Second Life</strong>. By <strong>March 2021</strong>, Chapter II was born — an evolution, not just a continuation.
              </p>
            </div>
          </div>

          {/* SLIDE 3: The Awakening */}
          <div className={`slide ${current === 3 ? 'active' : ''}`}>
            <div className="slide-content" key={current === 3 ? 'active-3' : 'idle-3'}>
              <div className="slide-tag">{SLIDES[3].tag}</div>
              <h2 className="slide-title">{SLIDES[3].title}</h2>
              <div className="slide-divider" />
              <p className="slide-text">
                <strong>Big Brother Damu</strong>, The Visionary, unlocked fragments of forgotten lifetimes through deep meditation. With his power, he awakened <strong>Big Brother Tactician</strong> — opening his third eye and restoring their connection to a shared past. Together, they began the mission: <em>reunite the lost brothers</em>.
              </p>
              <div className="slide-cards">
                <div className="slide-card"><div className="card-name">Big Brother Hype</div><div className="card-desc">Master of interdimensional travel</div></div>
                <div className="slide-card"><div className="card-name">Big Brother Energy</div><div className="card-desc">The Hybrid King — unmatched tracking</div></div>
                <div className="slide-card"><div className="card-name">Big Brother Smooth Talk</div><div className="card-desc">Manipulator of minds and words</div></div>
                <div className="slide-card"><div className="card-name">Big Brother Cool Breeze</div><div className="card-desc">Mystic — summoner of unseen forces</div></div>
              </div>
              <p className="slide-text">
                Their journey revealed a deeper truth: their connection to <strong>Olokun</strong>, the primordial deity of the ocean. They were no longer just brothers. <em>They were chosen.</em>
              </p>
            </div>
          </div>

          {/* SLIDE 4: The Battle */}
          <div className={`slide ${current === 4 ? 'active' : ''}`}>
            <div className="slide-content" key={current === 4 ? 'active-4' : 'idle-4'}>
              <div className="slide-tag">{SLIDES[4].tag}</div>
              <h2 className="slide-title">{SLIDES[4].title}</h2>
              <div className="slide-divider" />
              <p className="slide-text">
                Drawn toward the Bermuda Triangle, the brothers sailed into chaos. From the depths emerged the legendary <strong>Kraken</strong> — a force of destruction beyond imagination. Tentacles tore through their ship. The sea roared. Death loomed.
              </p>
              <div className="slide-quote"><p>"We are the Sons of Olokun! We do not fear death!"</p></div>
              <p className="slide-text">
                Steel clashed against myth. Power against fate. But even warriors fall. The Kraken dragged them into the abyss.
              </p>
            </div>
          </div>

          {/* SLIDE 5: Next Generation */}
          <div className={`slide ${current === 5 ? 'active' : ''}`}>
            <div className="slide-content" key={current === 5 ? 'active-5' : 'idle-5'}>
              <div className="slide-tag">{SLIDES[5].tag}</div>
              <h2 className="slide-title">{SLIDES[5].title}</h2>
              <div className="slide-divider" />
              <p className="slide-text">
                At <strong>Pirate's Well</strong>, a new generation trained under <strong>Big Brother 3rd Degree</strong> and <strong>Big Brother Sacred</strong>. When the call came, they did not hesitate. They rose.
              </p>
              <div className="slide-cards">
                <div className="slide-card"><div className="card-name">Neo Kimo</div><div className="card-desc">The born leader</div></div>
                <div className="slide-card"><div className="card-name">Neo Jabari</div><div className="card-desc">The wise strategist</div></div>
                <div className="slide-card"><div className="card-name">Neo Tre</div><div className="card-desc">The silent enigma</div></div>
                <div className="slide-card"><div className="card-name">Neo Kash</div><div className="card-desc">The fearless youngest</div></div>
                <div className="slide-card"><div className="card-name">Neo Blake</div><div className="card-desc">The unknown variable</div></div>
                <div className="slide-card"><div className="card-name">Neo Jessy</div><div className="card-desc">The relentless spirit</div></div>
              </div>
              <p className="slide-text">
                Gifted with divine power by <strong>Olokun</strong>, their blades became extensions of the ocean itself. They emerged not as neophytes… but as <em>Sons of Olokun</em>.
              </p>
            </div>
          </div>

          {/* SLIDE 6: Principles */}
          <div className={`slide ${current === 6 ? 'active' : ''}`}>
            <div className="slide-content" key={current === 6 ? 'active-6' : 'idle-6'}>
              <div className="slide-tag">{SLIDES[6].tag}</div>
              <h2 className="slide-title">{SLIDES[6].title}</h2>
              <div className="slide-divider" />
              <div className="slide-pillars">
                <div className="slide-pillar">
                  <div className="slide-pillar-kanji">冒</div>
                  <h3>Adventure</h3>
                  <p>We embrace risk, movement, and the pursuit of new horizons</p>
                </div>
                <div className="slide-pillar">
                  <div className="slide-pillar-kanji">継</div>
                  <h3>Heritage</h3>
                  <p>We merge history, mythology, and modern identity into one brotherhood</p>
                </div>
                <div className="slide-pillar">
                  <div className="slide-pillar-kanji">導</div>
                  <h3>Leadership</h3>
                  <p>We lead with presence and intention, creating experiences that inspire</p>
                </div>
                <div className="slide-pillar">
                  <div className="slide-pillar-kanji">志</div>
                  <h3>Purpose</h3>
                  <p>Every move is strategic. Every action builds legacy</p>
                </div>
              </div>
            </div>
          </div>

          {/* SLIDE 7: Closing */}
          <div className={`slide ${current === 7 ? 'active' : ''}`}>
            <div className="slide-content" key={current === 7 ? 'active-7' : 'idle-7'}>
              <div className="slide-tag">{SLIDES[7].tag}</div>
              <h2 className="slide-title">{SLIDES[7].title}</h2>
              <div className="slide-divider" />
              <p className="slide-text" style={{ textAlign: 'center' }}>
                With newfound power, they returned to rescue their fallen brothers — restoring what was lost and strengthening what could never be broken.
              </p>
              <div className="slide-quote"><p>Kappa Theta Phi II is more than a fraternity. It is a lineage. A myth reborn. A brotherhood written in waves and carved into eternity.</p></div>
              <p className="slide-text" style={{ textAlign: 'center', color: 'rgba(245,240,232,0.35)', letterSpacing: '4px', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                From chaos, we built power. From power, we build legacy.
              </p>
              <div className="slide-footer">
                <div className="footer-brand">KΘΦ II — WOKOU-CORSAIRS</div>
                <p>&copy; 2026 Kappa Theta Phi II Fraternity. All Rights Reserved.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Navigation */}
        <div className="slide-nav">
          <div className={`slide-arrow ${current === 0 ? 'disabled' : ''}`} onClick={() => goTo(current - 1)}>‹</div>
          <div className="slide-dots">
            {SLIDES.map((_, i) => (
              <button key={i} className={`slide-dot ${current === i ? 'active' : ''}`} onClick={() => goTo(i)} />
            ))}
          </div>
          <div className={`slide-arrow ${current === SLIDES.length - 1 ? 'disabled' : ''}`} onClick={() => goTo(current + 1)}>›</div>
        </div>

        <div className="slide-counter">{String(current + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}</div>
      </main>
    </>
  );
}
