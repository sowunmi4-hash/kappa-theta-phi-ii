'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import './about.css';

const SLIDE_NARRATION = [
  "Kappa Theta Phi Chapter Two, known as the Wokou-Corsairs, is a dynamic fraternity rooted in tradition, innovation, and brotherhood. Blending the daring spirit of the legendary Japanese Wokou pirates with the cultural depth of African Yoruba mythology, we are a collective of leaders, creators, and visionaries united by a shared mission: to navigate uncharted waters, build lasting legacies, and uplift our community. Our identity is shaped by the strength and resilience of the Wokou pirates, who symbolise adaptability and courage. The spiritual wisdom of Olokun, the Yoruba Orisha of the deep sea, whose power connects us to legacy, mystery, and the boundless potential of water. And the commanding force of the Kraken, embodying control over ocean life and representing our strength, unity, and influence. We don't follow waves. We create them.",
  "Once known as the wickedest city on Earth, Port Royal, Jamaica stood as a haven for pirates, privateers, and outlaws during the Golden Age of Piracy. Power was taken, not given. Wealth was earned through risk. Brotherhood formed in the face of danger. Our cultural foundation rests on four pillars. The Wokou: adaptability, courage, and calculated movement. Olokun: spiritual depth, legacy awareness, and limitless potential. The Kraken: absolute power beneath the surface. And Port Royal: where chaos became empire.",
  "In the aftermath of the Great Fire War, two rival forces, the Wokou and the Samurai, rose from destruction not as enemies, but as brothers. What began as conflict evolved into an unbreakable alliance, sealed through a sacred blood oath that would transcend generations. At the heart of this legacy stands Yasuke, the legendary African Samurai whose presence bridged cultures and redefined honour. His son Nevarious journeyed across continents to master the sacred traditions of the Yoruba and unlock the mysteries of the Orishas. That wisdom was passed to Raul Damu, who in 2011 founded Kappa Theta Phi Fraternity of Second Life. By March 2021, Chapter Two was born, an evolution, not just a continuation.",
  "Big Brother Damu, The Visionary, unlocked fragments of forgotten lifetimes through deep meditation. With his power, he awakened Big Brother Tactician, opening his third eye and restoring their connection to a shared past. Together, they began the mission: reunite the lost brothers. Big Brother Hype, master of interdimensional travel. Big Brother Energy, the Hybrid King with unmatched tracking. Big Brother Smooth Talk, manipulator of minds and words. Big Brother Cool Breeze, Mystic and summoner of unseen forces. Their journey revealed a deeper truth: their connection to Olokun, the primordial deity of the ocean. They were no longer just brothers. They were chosen.",
  "Drawn toward the Bermuda Triangle, the brothers sailed into chaos. From the depths emerged the legendary Kraken, a force of destruction beyond imagination. Tentacles tore through their ship. The sea roared. Death loomed. We are the Sons of Olokun. We do not fear death. Steel clashed against myth. Power against fate. But even warriors fall. The Kraken dragged them into the abyss.",
  "At Pirate's Well, a new generation trained under Big Brother Third Degree and Big Brother Sacred. When the call came, they did not hesitate. They rose. Neo Kimo, the born leader. Neo Jabari, the wise strategist. Neo Tre, the silent enigma. Neo Kash, the fearless youngest. Neo Blake, the unknown variable. Neo Jessy, the relentless spirit. Gifted with divine power by Olokun, their blades became extensions of the ocean itself. They emerged not as neophytes, but as Sons of Olokun.",
  "We are more than a fraternity. We are a brotherhood with a purpose. Adventure: just as the Wokou traversed the seas, we embrace new challenges, opportunities, and creative endeavours. Heritage: we honour the rich traditions of our influences, blending diverse cultures into a unified identity. Leadership: we strive to inspire and lead, creating immersive experiences that bring people together. Purpose: through events and initiatives, we give back, leaving a lasting impact in Second Life and beyond.",
  "Our Chapter Two reflects a lineage of innovation, vision, and success. With iconic events like LOONAPALOOSA and philanthropic contributions such as raising one hundred thousand Linden dollars for the Save the Music Foundation, we continue to solidify our place as leaders in the virtual world. We are adventurers, strategists, and brothers. We embrace the mystery of the ocean, the power of the Kraken, and the wisdom of Olokun. Together, we navigate challenges, celebrate victories, and build a legacy that transcends time. Where tradition meets innovation, and the past inspires the future.",
];

const SLIDES = [
  { tag: 'Who We Are', title: 'The Wokou-Corsairs', kanji: '魂' },
  { tag: 'Our Cultural Foundation', title: 'Where Chaos Became Power', kanji: '海' },
  { tag: 'Chapter I — Origins', title: 'The Legacy of Kappa Theta Phi', kanji: '火' },
  { tag: 'Chapter II — The Awakening', title: 'The Call to Awaken', kanji: '眼' },
  { tag: 'Chapter III — The Depths', title: 'The Battle of the Depths', kanji: '淵' },
  { tag: 'Chapter IV — Rebirth', title: 'The Rise of the Next Generation', kanji: '生' },
  { tag: 'Our Principles', title: 'What We Stand For', kanji: '道' },
  { tag: 'Our Legacy', title: 'Built on Vision. Proven by Impact.', kanji: '永' },
];


export default function AboutPage() {
  const [current, setCurrent] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance|null>(null);

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


  function speak() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(SLIDE_NARRATION[current]);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart  = () => { setSpeaking(true);  setPaused(false); };
    utterance.onend    = () => { setSpeaking(false); setPaused(false); };
    utterance.onpause  = () => setPaused(true);
    utterance.onresume = () => setPaused(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function togglePause() {
    if (!window.speechSynthesis) return;
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }

  function stopSpeaking() {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }

  // Stop speech when slide changes
  useEffect(() => {
    stopSpeaking();
  }, [current]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (window.speechSynthesis) window.speechSynthesis.cancel(); };
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
                <strong>Kappa Theta Phi Chapter II</strong>, known as the Wokou-Corsairs, is a dynamic fraternity rooted in tradition, innovation, and brotherhood. Blending the daring spirit of the legendary Japanese Wokou pirates with the cultural depth of African Yoruba mythology, we are a collective of leaders, creators, and visionaries united by a shared mission: to navigate uncharted waters, build lasting legacies, and uplift our community.
              </p>
              <p className="slide-text">
                Our identity is shaped by the strength and resilience of the <strong>Wokou pirates</strong>, who symbolise adaptability and courage. The spiritual wisdom of <strong>Olokun</strong>, the Yoruba Orisha of the deep sea, whose power connects us to legacy, mystery, and the boundless potential of water. And the commanding force of the <strong>Kraken</strong>, embodying control over ocean life and representing our fraternity's strength, unity, and influence.
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
              <p className="slide-text" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                We are more than a fraternity — we are a brotherhood with a purpose.
              </p>
              <div className="slide-pillars">
                <div className="slide-pillar">
                  <div className="slide-pillar-kanji">冒</div>
                  <h3>Adventure</h3>
                  <p>Just as the Wokou traversed the seas, we embrace new challenges, opportunities, and creative endeavours</p>
                </div>
                <div className="slide-pillar">
                  <div className="slide-pillar-kanji">継</div>
                  <h3>Heritage</h3>
                  <p>We honour the rich traditions of our influences, blending diverse cultures into a unified identity</p>
                </div>
                <div className="slide-pillar">
                  <div className="slide-pillar-kanji">導</div>
                  <h3>Leadership</h3>
                  <p>We strive to inspire and lead, creating immersive experiences that bring people together</p>
                </div>
                <div className="slide-pillar">
                  <div className="slide-pillar-kanji">志</div>
                  <h3>Purpose</h3>
                  <p>Through events and initiatives, we give back, leaving a lasting impact in Second Life and beyond</p>
                </div>
              </div>
            </div>
          </div>

          {/* SLIDE 7: Legacy & Closing */}
          <div className={`slide ${current === 7 ? 'active' : ''}`}>
            <div className="slide-content" key={current === 7 ? 'active-7' : 'idle-7'}>
              <div className="slide-tag">{SLIDES[7].tag}</div>
              <h2 className="slide-title">{SLIDES[7].title}</h2>
              <div className="slide-divider" />
              <p className="slide-text" style={{ textAlign: 'center' }}>
                Our Chapter II reflects a lineage of innovation, vision, and success. With iconic events like <strong>LOONAPALOOSA</strong> and philanthropic contributions such as raising <strong>L$100,000 for the Save the Music Foundation</strong>, we continue to solidify our place as leaders in the virtual world.
              </p>
              <div className="slide-quote"><p>We are adventurers, strategists, and brothers. We embrace the mystery of the ocean, the power of the Kraken, and the wisdom of Olokun. Together, we navigate challenges, celebrate victories, and build a legacy that transcends time.</p></div>
              <p className="slide-text" style={{ textAlign: 'center', color: 'rgba(245,240,232,0.35)', letterSpacing: '4px', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                Where tradition meets innovation, and the past inspires the future.
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

        {/* Text-to-speech controls */}
        <div className="tts-controls">
          {!speaking ? (
            <button className="tts-btn tts-play" onClick={speak} title="Read this slide aloud">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z"/></svg>
              <span>Read Aloud</span>
            </button>
          ) : (
            <>
              <button className="tts-btn tts-pause" onClick={togglePause} title={paused ? 'Resume' : 'Pause'}>
                {paused
                  ? <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z"/></svg>
                  : <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                }
                <span>{paused ? 'Resume' : 'Pause'}</span>
              </button>
              <button className="tts-btn tts-stop" onClick={stopSpeaking} title="Stop">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 6h12v12H6z"/></svg>
                <span>Stop</span>
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}
