'use client';
import { useEffect } from 'react';
import './about.css';

export default function AboutPage() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.15 });
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
        </ul>
        <div className="mobile-toggle" onClick={() => document.getElementById('navLinks')?.classList.toggle('open')}>
          <span></span><span></span><span></span>
        </div>
      </nav>

      <main className="about-page">

        {/* ===== HERO ===== */}
        <section className="lore-hero">
          <div className="lore-hero-bg" />
          <div className="lore-hero-kanji">魂</div>
          <div className="lore-hero-content">
            <div className="lore-hero-tag">The Legacy</div>
            <h1 className="lore-hero-title">Born from Fire.<br/>Bound by Blood.</h1>
            <p className="lore-hero-sub">Forged across lifetimes. Reborn with purpose.</p>
          </div>
        </section>

        {/* ===== WHO WE ARE ===== */}
        <div className="chapter reveal">
          <div className="chapter-tag">Who We Are</div>
          <h2 className="chapter-title">The Wokou-Corsairs</h2>
          <p>
            <strong>Kappa Theta Phi Chapter II</strong> — the Wokou-Corsairs — is a brotherhood forged from tradition, rebellion, and strategic evolution. We are a collective of leaders, creators, and visionaries united by a shared mission: to navigate uncharted waters, build lasting legacies, and uplift our community.
          </p>
          <p>
            Inspired by the lawless ambition of <strong>Port Royal</strong>, the fearless spirit of the <strong>Wokou</strong>, and the divine depth of <strong>Olokun</strong> — we are a brotherhood built to navigate, conquer, and leave our mark.
          </p>
          <div className="lore-quote">
            <p>We don't follow waves. We create them.</p>
          </div>
        </div>

        {/* ===== OUR FOUNDATIONS ===== */}
        <div className="chapter reveal">
          <div className="chapter-tag">Our Cultural Foundation</div>
          <h2 className="chapter-title">Where Chaos Became Power</h2>
          <p>
            Once known as the "wickedest city on Earth," <strong>Port Royal, Jamaica</strong> stood as a haven for pirates, privateers, and outlaws during the Golden Age of Piracy. Power was taken, not given. Wealth was earned through risk. Brotherhood formed in the face of danger.
          </p>
          <p>
            This is where our philosophy begins. We embrace the idea that order can rise from chaos, that strategy defines success, and that legacy is built by those bold enough to claim it.
          </p>

          <div className="pillars">
            <div className="pillar">
              <div className="pillar-kanji">海</div>
              <h3>The Wokou</h3>
              <p>Adaptability, courage, and calculated movement of the legendary Wokou pirates</p>
            </div>
            <div className="pillar">
              <div className="pillar-kanji">深</div>
              <h3>Olokun</h3>
              <p>The Orisha of the deep sea — spiritual depth, legacy awareness, limitless potential</p>
            </div>
            <div className="pillar">
              <div className="pillar-kanji">力</div>
              <h3>The Kraken</h3>
              <p>Absolute power beneath the surface — unity through strength, control in chaos</p>
            </div>
            <div className="pillar">
              <div className="pillar-kanji">冠</div>
              <h3>Port Royal</h3>
              <p>Where chaos became empire — risk, dominance, and the birth of brotherhood</p>
            </div>
          </div>
        </div>

        {/* ===== THE ORIGIN ===== */}
        <div className="chapter reveal">
          <div className="chapter-tag">Chapter I — Origins</div>
          <h2 className="chapter-title">The Legacy of Kappa Theta Phi</h2>
          <p>
            In the aftermath of the <em>Great Fire War</em>, two rival forces — the Wokou and the Samurai — rose from destruction not as enemies, but as brothers. What began as conflict evolved into an unbreakable alliance, sealed through a sacred blood oath that would transcend generations.
          </p>
          <p>
            At the heart of this legacy stands <strong>Yasuke</strong>, the legendary African Samurai whose presence bridged cultures and redefined honour. His legacy ignited a lineage of warriors and visionaries. His son, <strong>Nevarious</strong>, journeyed across continents to master the sacred traditions of the Yoruba and unlock the mysteries of the Orishas — ancient deities tied to the ocean's depths.
          </p>
          <p>
            That wisdom was passed down to <strong>Raul Damu</strong>, a leader destined to awaken the past. In 2011, Raul Damu founded <strong>Kappa Theta Phi Fraternity of Second Life</strong>, merging the codes of Samurai discipline and Wokou resilience into a new era of brotherhood.
          </p>
          <p>
            By <strong>March 2021</strong>, Kappa Theta Phi Chapter II was born — an evolution, not just a continuation. A brotherhood on a mission: to reclaim its legacy, its power, and its place in history.
          </p>
        </div>

        {/* ===== THE AWAKENING ===== */}
        <div className="chapter reveal">
          <div className="chapter-tag">Chapter II — The Awakening</div>
          <h2 className="chapter-title">The Call to Awaken</h2>
          <p>
            <strong>Big Brother Damu</strong>, The Visionary, unlocked fragments of forgotten lifetimes through deep meditation. Piece by piece, he assembled a truth buried beneath time itself. With his power, he awakened <strong>Big Brother Tactician</strong> — opening his third eye and restoring his connection to their shared past.
          </p>
          <p>
            Together, they began the mission: <em>reunite the lost brothers</em>.
          </p>
          <p>
            Across timelines and realities, familiar souls emerged — <strong>Boss Sauce</strong>, <strong>Live Wire</strong>, <strong>Violator</strong> — warriors reborn in every era. From ancient battlefields to modern empires, their spirits never faded.
          </p>

          <div className="brothers-grid">
            <div className="brother-card">
              <div className="name">Big Brother Hype</div>
              <div className="desc">Master of interdimensional travel</div>
            </div>
            <div className="brother-card">
              <div className="name">Big Brother Energy</div>
              <div className="desc">The Hybrid King — unmatched tracking power</div>
            </div>
            <div className="brother-card">
              <div className="name">Big Brother Smooth Talk</div>
              <div className="desc">Manipulator of minds and words</div>
            </div>
            <div className="brother-card">
              <div className="name">Big Brother Cool Breeze</div>
              <div className="desc">Mystic — summoner of unseen forces</div>
            </div>
          </div>

          <p>
            Their journey revealed a deeper truth: their connection to <strong>Olokun</strong>, the primordial deity of the ocean — keeper of wealth, mystery, and the abyss. They were no longer just brothers. <em>They were chosen.</em>
          </p>
        </div>

        {/* ===== THE BATTLE ===== */}
        <div className="chapter reveal">
          <div className="chapter-tag">Chapter III — The Depths</div>
          <h2 className="chapter-title">The Battle of the Depths</h2>
          <p>
            Drawn toward the Bermuda Triangle, the brothers sailed into chaos. From the depths emerged the legendary <strong>Kraken</strong> — a force of destruction beyond imagination. Tentacles tore through their ship. The sea roared. Death loomed.
          </p>
          <div className="lore-quote">
            <p>"We are the Sons of Olokun! We do not fear death!"</p>
          </div>
          <p>
            Steel clashed against myth. Power against fate. But even warriors fall. The Kraken dragged them into the abyss.
          </p>
        </div>

        {/* ===== NEXT GENERATION ===== */}
        <div className="chapter reveal">
          <div className="chapter-tag">Chapter IV — Rebirth</div>
          <h2 className="chapter-title">The Rise of the Next Generation</h2>
          <p>
            Hope arrived not from above — but from those yet to prove themselves. At <strong>Pirate's Well</strong>, a remote outpost, a new generation trained under <strong>Big Brother 3rd Degree</strong> and <strong>Big Brother Sacred</strong>. When the call came, they did not hesitate.
          </p>

          <div className="brothers-grid">
            <div className="brother-card">
              <div className="name">Neo Kimo</div>
              <div className="desc">The born leader</div>
            </div>
            <div className="brother-card">
              <div className="name">Neo Jabari</div>
              <div className="desc">The wise strategist</div>
            </div>
            <div className="brother-card">
              <div className="name">Neo Tre</div>
              <div className="desc">The silent enigma</div>
            </div>
            <div className="brother-card">
              <div className="name">Neo Kash</div>
              <div className="desc">The fearless youngest</div>
            </div>
            <div className="brother-card">
              <div className="name">Neo Blake</div>
              <div className="desc">The unknown variable</div>
            </div>
            <div className="brother-card">
              <div className="name">Neo Jessy</div>
              <div className="desc">The relentless spirit</div>
            </div>
          </div>

          <p>
            Thrown into the storm, they faced the Kraken not as boys — but as future legends. One by one, they were tested. Broken. Reforged. And in the depths… they met <strong>Olokun</strong>.
          </p>
          <p>
            Olokun revealed their purpose: <em>The seas are sacred. And they must be protected.</em> Gifted with divine power, their blades became extensions of the ocean itself — capable of commanding tides, storms, and destruction. They emerged not as neophytes… but as <strong>Sons of Olokun</strong>.
          </p>
        </div>

        {/* ===== WHAT WE STAND FOR ===== */}
        <div className="chapter reveal">
          <div className="chapter-tag">Our Principles</div>
          <h2 className="chapter-title">What We Stand For</h2>

          <div className="pillars">
            <div className="pillar">
              <div className="pillar-kanji">冒</div>
              <h3>Adventure</h3>
              <p>We embrace risk, movement, and the pursuit of new horizons</p>
            </div>
            <div className="pillar">
              <div className="pillar-kanji">継</div>
              <h3>Heritage</h3>
              <p>We merge history, mythology, and modern identity into one unified brotherhood</p>
            </div>
            <div className="pillar">
              <div className="pillar-kanji">導</div>
              <h3>Leadership</h3>
              <p>We lead with presence and intention, creating experiences that inspire</p>
            </div>
            <div className="pillar">
              <div className="pillar-kanji">志</div>
              <h3>Purpose</h3>
              <p>Every move is strategic. Every action builds legacy</p>
            </div>
          </div>
        </div>

        {/* ===== CLOSING ===== */}
        <section className="closing-banner reveal">
          <div className="section-divider" />
          <h2>We Are the Sons of Olokun</h2>
          <p>We are eternal.</p>
          <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', letterSpacing: '4px', color: 'rgba(245,240,232,0.3)', textTransform: 'uppercase', fontFamily: "'Rajdhani', sans-serif" }}>
            From chaos, we built power. From power, we build legacy.
          </p>
        </section>

        <footer className="about-footer">
          <div className="footer-brand">KΘΦ II — WOKOU-CORSAIRS</div>
          <p>&copy; 2026 Kappa Theta Phi II Fraternity. All Rights Reserved.</p>
        </footer>
      </main>
    </>
  );
}
