'use client';
import { useEffect } from 'react';
import './about.css';

export default function AboutPage() {
  useEffect(() => {
    // ── CANVAS PARTICLES ──
    const canvas = document.getElementById('bg-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    let W: number, H: number;
    type Particle = { x:number; y:number; vx:number; vy:number; a:number; size:number; life:number; maxLife:number };
    let particles: Particle[] = [];
    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);
    function mkP(): Particle { return { x: Math.random()*W, y: H+10, vx: (Math.random()-.5)*.4, vy: -(Math.random()*.6+.3), a: 0, size: Math.random()*1.5+.5, life: 0, maxLife: Math.random()*400+200 }; }
    let raf: number;
    function animCanvas() {
      ctx.clearRect(0,0,W,H);
      if (particles.length < 80) particles.push(mkP());
      particles = particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.life++;
        const pct = p.life / p.maxLife;
        p.a = pct < .1 ? pct*10 : pct > .8 ? (1-pct)*5 : 1;
        ctx.globalAlpha = p.a * .5;
        ctx.fillStyle = '#c6930a';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        return p.life < p.maxLife && p.y > -20;
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(animCanvas);
    }
    animCanvas();

    // ── SCROLL PROGRESS ──
    const progBar = document.getElementById('prog')!;
    const navbar = document.getElementById('navbar')!;
    const sections = document.querySelectorAll<HTMLElement>('.chapter');
    const dots = document.querySelectorAll<HTMLButtonElement>('.ch-dot');
    function onScroll() {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
      progBar.style.width = pct + '%';
      navbar.classList.toggle('scrolled', window.scrollY > 80);
      let current = 0;
      sections.forEach(s => { if (window.scrollY >= s.offsetTop - 200) current = parseInt(s.dataset.ch||'0'); });
      dots.forEach(d => d.classList.toggle('active', parseInt(d.dataset.ch||'0') === current));
    }
    window.addEventListener('scroll', onScroll);

    // ── CHAPTER DOTS CLICK ──
    dots.forEach(d => d.addEventListener('click', () => {
      const ch = parseInt(d.dataset.ch||'0');
      const target = Array.from(sections).find(s => parseInt(s.dataset.ch||'0') === ch);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }));

    // ── INTERSECTION OBSERVER ──
    const revealObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); } });
    }, { threshold: .12 });
    document.querySelectorAll('.R').forEach(el => revealObs.observe(el));

    // ── MOTTO REVEAL ──
    const mottoObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          ['mw1','mw2','mw3'].forEach((id, i) => {
            setTimeout(() => {
              const el = document.getElementById(id);
              if (el) { el.style.transitionDelay = i*.22 + 's'; el.classList.add('in'); }
            }, 50);
          });
          mottoObs.unobserve(e.target);
        }
      });
    }, { threshold: .4 });
    const mottoEl = document.getElementById('act4-motto');
    if (mottoEl) mottoObs.observe(mottoEl);

    // ── COUNTER ANIMATION ──
    function animCount(el: HTMLElement, target: number, dur=1600) {
      let start: number|null = null;
      (function step(ts: number) {
        if (!start) start = ts;
        const p = Math.min((ts-start)/dur, 1);
        const ease = 1 - Math.pow(1-p, 3);
        el.textContent = String(Math.floor(ease*target));
        if (p < 1) requestAnimationFrame(step); else el.textContent = String(target);
      })(performance.now());
    }
    const cntObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const t = parseInt((e.target as HTMLElement).dataset.target||'0');
          animCount(e.target as HTMLElement, t);
          cntObs.unobserve(e.target);
        }
      });
    }, { threshold: .5 });
    document.querySelectorAll('[data-target]').forEach(el => cntObs.observe(el));

    // ── KEYBOARD NAV ──
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        const next = Array.from(sections).find(s => s.offsetTop > window.scrollY + 50);
        if (next) next.scrollIntoView({ behavior: 'smooth' });
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        const prev = [...Array.from(sections)].reverse().find(s => s.offsetTop < window.scrollY - 50);
        if (prev) prev.scrollIntoView({ behavior: 'smooth' });
      }
    };
    document.addEventListener('keydown', handleKey);

    // ── MOBILE TOGGLE ──
    const toggle = document.querySelector('.mobile-toggle');
    if (toggle) toggle.addEventListener('click', () => document.getElementById('navLinks')?.classList.toggle('open'));

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  return (
    <>
      <canvas id="bg-canvas"></canvas>
      <div id="prog"></div>

      <nav id="navbar">
        <a href="/" className="nav-brand">KΘΦ <span>II</span></a>
        <ul className="nav-links" id="navLinks">
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/brothers">Brothers</a></li>
          <li><a href="/gallery">Gallery</a></li>
        </ul>
        <div className="mobile-toggle"><span></span><span></span><span></span></div>
      </nav>

      {/* Chapter dots */}
      <div id="chapter-nav">
        {['Who We Are','Cultural Foundation','Origins','Awakening','The Depths','Rebirth','The Code','Legacy'].map((title,i) => (
          <button key={i} className={`ch-dot ${i===0?'active':''}`} data-ch={String(i)} title={title}></button>
        ))}
      </div>

      {/* ── ACT I: HERO ── */}
      <section className="chapter" id="act1" data-ch="0" data-title="Who We Are">
        <div className="skull-wrap">
          <div className="skull-ring"></div><div className="skull-ring"></div><div className="skull-ring"></div>
          <svg className="skull-svg" viewBox="0 0 100 100" fill="none">
            <path d="M50 8C27 8 13 24 13 43c0 14 8 24 17 28v11c0 2.5 2 4 4 4h32c2 0 4-1.5 4-4V71c9-4 17-14 17-28C87 24 73 8 50 8z" fill="rgba(198,147,10,.12)" stroke="rgba(198,147,10,.65)" strokeWidth="1.5"/>
            <ellipse cx="36" cy="42" rx="9.5" ry="11" fill="rgba(4,6,15,.92)" stroke="rgba(198,147,10,.35)" strokeWidth="1"/>
            <ellipse cx="64" cy="42" rx="9.5" ry="11" fill="rgba(4,6,15,.92)" stroke="rgba(198,147,10,.35)" strokeWidth="1"/>
            <path d="M46 58l4-6 4 6-4 2.5z" fill="rgba(4,6,15,.85)" stroke="rgba(198,147,10,.25)" strokeWidth=".5"/>
            <line x1="36" y1="82" x2="36" y2="70" stroke="rgba(4,6,15,.9)" strokeWidth="2.5"/>
            <line x1="44" y1="82" x2="44" y2="70" stroke="rgba(4,6,15,.9)" strokeWidth="2.5"/>
            <line x1="56" y1="82" x2="56" y2="70" stroke="rgba(4,6,15,.9)" strokeWidth="2.5"/>
            <line x1="64" y1="82" x2="64" y2="70" stroke="rgba(4,6,15,.9)" strokeWidth="2.5"/>
            <line x1="22" y1="90" x2="78" y2="97" stroke="rgba(198,147,10,.25)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="78" y1="90" x2="22" y2="97" stroke="rgba(198,147,10,.25)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="hero-eyeline">The Wokou-Corsairs Present</p>
        <h1 className="hero-title">Kappa<br/><span>Theta</span><br/>Phi II</h1>
        <p className="hero-sub">Chapter II · Second Life · Est. 3·14·21</p>
        <p className="hero-motto">⚓ &nbsp; Death Before Dishonor &nbsp; ⚓</p>
        <div className="scroll-cue">
          <span>Begin the story</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      <div className="ch-divider" data-label="Chapter I — The Wokou-Corsairs"></div>

      {/* ── ACT II: WHO WE ARE ── */}
      <section className="chapter" id="act2" data-ch="0" data-title="Who We Are">
        <div className="ch-watermark">01</div>
        <div className="ch-kanji">魂</div>
        <div className="two-col">
          <div>
            <p className="label R">Who We Are</p>
            <h2 className="heading R d1">The<br/><em>Wokou-Corsairs</em></h2>
            <p className="body-text R d2"><strong>Kappa Theta Phi Chapter II</strong>, known as the Wokou-Corsairs, is a dynamic fraternity rooted in tradition, innovation, and brotherhood. Blending the daring spirit of the legendary Japanese Wokou pirates with the cultural depth of African Yoruba mythology, we are a collective of leaders, creators, and visionaries united by a shared mission.</p>
            <p className="body-text R d3">Our identity is shaped by the strength of the <strong>Wokou pirates</strong>, the spiritual wisdom of <strong>Olokun</strong> — the Yoruba Orisha of the deep sea — and the commanding force of the <strong>Kraken</strong>, embodying our fraternity's strength, unity, and influence.</p>
            <div className="quote-block R d4"><p>We don't follow waves. We create them.</p></div>
          </div>
          <div className="found-card R d2">
            <div className="found-date">3·14·21</div>
            <div className="found-lbl">Date of Founding</div>
            <div className="found-hr"></div>
            <div className="found-motto">Death Before Dishonor</div>
            <div className="found-hr"></div>
            <div className="found-rows">
              <div className="found-row"><span>Head Founder</span><span>Tactician</span></div>
              <div className="found-row"><span>Co-Founder</span><span>Boss Sauce</span></div>
              <div className="found-row"><span>Co-Founder</span><span>Energy</span></div>
              <div className="found-row"><span>Co-Founder</span><span>Cool Breeze</span></div>
              <div className="found-row" style={{borderBottom:'none',marginTop:'8px',fontSize:'.6rem',letterSpacing:'1px',color:'rgba(198,147,10,.4)'}}><span>Chapter II</span><span>Wokou-Corsairs</span></div>
            </div>
          </div>
        </div>
      </section>

      <div className="ch-divider" data-label="Chapter II — Cultural Foundation"></div>

      {/* ── ACT III: WHERE CHAOS BECAME POWER ── */}
      <section className="chapter" id="act3" data-ch="1" data-title="Our Cultural Foundation">
        <div className="ch-watermark">02</div>
        <div className="ch-kanji">海</div>
        <div className="one-col">
          <p className="label R">Our Cultural Foundation</p>
          <h2 className="heading R d1">Where Chaos<br/><em>Became Power</em></h2>
          <p className="body-text R d2">Once known as the "wickedest city on Earth," <strong>Port Royal, Jamaica</strong> stood as a haven for pirates, privateers, and outlaws during the Golden Age of Piracy. Power was taken, not given. Wealth was earned through risk. Brotherhood formed in the face of danger.</p>
          <div className="pillars R d3">
            <div className="pillar"><div className="pillar-kanji">海</div><h3>The Wokou</h3><p>Adaptability, courage, and calculated movement</p></div>
            <div className="pillar"><div className="pillar-kanji">深</div><h3>Olokun</h3><p>Spiritual depth, legacy awareness, limitless potential</p></div>
            <div className="pillar"><div className="pillar-kanji">力</div><h3>The Kraken</h3><p>Absolute power beneath the surface</p></div>
            <div className="pillar"><div className="pillar-kanji">冠</div><h3>Port Royal</h3><p>Where chaos became empire</p></div>
          </div>
        </div>
      </section>

      <div className="ch-divider" data-label="Chapter III — Origins"></div>

      {/* ── ACT IV: LEGACY OF KTP ── */}
      <section className="chapter" id="act4" data-ch="2" data-title="The Legacy of Kappa Theta Phi">
        <div className="ch-watermark">03</div>
        <div className="ch-kanji">火</div>
        <div className="two-col">
          <div>
            <p className="label R">Chapter I — Origins</p>
            <h2 className="heading R d1">The Legacy of<br/><em>Kappa Theta Phi</em></h2>
            <p className="body-text R d2">In the aftermath of the <em>Great Fire War</em>, two rival forces — the Wokou and the Samurai — rose from destruction not as enemies, but as brothers. What began as conflict evolved into an unbreakable alliance, sealed through a sacred blood oath that would transcend generations.</p>
            <p className="body-text R d3">At the heart of this legacy stands <strong>Yasuke</strong>, the legendary African Samurai. His son <strong>Nevarious</strong> journeyed across continents to master the sacred traditions of the Yoruba and unlock the mysteries of the Orishas.</p>
            <p className="body-text R d4">That wisdom was passed to <strong>Raul Damu</strong>, who in <strong>2011</strong> founded <strong>Kappa Theta Phi Fraternity of Second Life</strong>. By <strong>March 2021</strong>, Chapter II was born — <em>an evolution, not just a continuation.</em></p>
          </div>
          <div className="R d2">
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'16px',padding:'2rem',textAlign:'center',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,rgba(198,147,10,.06) 0,transparent 70%)'}}></div>
              <div style={{fontSize:'.55rem',letterSpacing:'5px',color:'var(--gold)',textTransform:'uppercase',marginBottom:'1.5rem'}}>The Bloodline</div>
              {[{i:'Y',name:'Yasuke',sub:'The Legendary African Samurai'},{i:'N',name:'Nevarious',sub:'Yoruba tradition · Orisha mysteries'},{i:'RD',name:'Raul Damu',sub:'Founded KTP SL — 2011'}].map((p,idx) => (
                <div key={p.name}>
                  <div style={{display:'flex',alignItems:'center',gap:'1rem',padding:'.8rem',background:'rgba(198,147,10,.04)',borderRadius:'8px',border:'1px solid rgba(198,147,10,.08)'}}>
                    <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(198,147,10,.1)',border:'1px solid rgba(198,147,10,.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.7rem',color:'var(--gold)',fontFamily:"'Cinzel',serif",flexShrink:0}}>{p.i}</div>
                    <div style={{textAlign:'left'}}><div style={{fontFamily:"'Bebas Neue',cursive",letterSpacing:'3px',fontSize:'.95rem',color:'var(--bone)'}}>{p.name}</div><div style={{fontSize:'.62rem',color:'var(--bone-faint)'}}>{p.sub}</div></div>
                  </div>
                  {idx < 2 && <div style={{width:'1px',height:'20px',background:'linear-gradient(to bottom,var(--gold),transparent)',margin:'0 auto',opacity:.4}}></div>}
                </div>
              ))}
              <div style={{width:'1px',height:'20px',background:'linear-gradient(to bottom,var(--gold),transparent)',margin:'0 auto',opacity:.4}}></div>
              <div style={{padding:'.8rem',background:'rgba(198,147,10,.07)',borderRadius:'8px',border:'1px solid rgba(198,147,10,.2)',textAlign:'center'}}>
                <div style={{fontFamily:"'Bebas Neue',cursive",letterSpacing:'4px',fontSize:'1rem',color:'var(--gold)'}}>KΘΦ Chapter II</div>
                <div style={{fontSize:'.6rem',color:'var(--bone-faint)',marginTop:'3px'}}>Born · 3·14·21</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="ch-divider" data-label="Chapter IV — The Awakening"></div>

      {/* ── ACT V: THE AWAKENING ── */}
      <section className="chapter" id="act5" data-ch="3" data-title="The Call to Awaken">
        <div className="ch-watermark">04</div>
        <div className="ch-kanji">眼</div>
        <div className="one-col">
          <p className="label R">Chapter II — The Awakening</p>
          <h2 className="heading R d1">The Call<br/><em>to Awaken</em></h2>
          <p className="body-text R d2"><strong>Big Brother Damu</strong>, The Visionary, unlocked fragments of forgotten lifetimes through deep meditation. With his power, he awakened <strong>Big Brother Tactician</strong> — opening his third eye and restoring their connection to a shared past. Together, they began the mission: <em>reunite the lost brothers.</em></p>
          <div className="cards R d3">
            {[{name:'Big Brother Hype',desc:'Master of interdimensional travel'},{name:'Big Brother Energy',desc:'The Hybrid King — unmatched tracking'},{name:'Big Brother Smooth Talk',desc:'Manipulator of minds and words'},{name:'Big Brother Cool Breeze',desc:'Mystic — summoner of unseen forces'}].map(b => (
              <div key={b.name} className="card"><div className="card-name">{b.name}</div><div className="card-desc">{b.desc}</div></div>
            ))}
          </div>
          <p className="body-text R d4">Their journey revealed a deeper truth: their connection to <strong>Olokun</strong>, the primordial deity of the ocean. They were no longer just brothers. <em>They were chosen.</em></p>
        </div>
      </section>

      <div className="ch-divider" data-label="Chapter V — The Depths"></div>

      {/* ── ACT VI: THE BATTLE ── */}
      <section className="chapter" id="act6" data-ch="4" data-title="The Battle of the Depths">
        <div className="ch-watermark">05</div>
        <div className="ch-kanji">淵</div>
        <div className="one-col" style={{alignItems:'center',textAlign:'center',maxWidth:'700px'}}>
          <p className="label R" style={{justifyContent:'center'}}>Chapter III — The Depths</p>
          <h2 className="heading R d1" style={{textAlign:'center'}}>The Battle of<br/><em>the Depths</em></h2>
          <p className="body-text R d2" style={{textAlign:'center'}}>Drawn toward the Bermuda Triangle, the brothers sailed into chaos. From the depths emerged the legendary <strong>Kraken</strong> — a force of destruction beyond imagination. Tentacles tore through their ship. The sea roared. Death loomed.</p>
          <div className="quote-block R d3" style={{width:'100%',textAlign:'left'}}><p>"We are the Sons of Olokun. We do not fear death."</p></div>
          <p className="body-text R d4" style={{textAlign:'center'}}>Steel clashed against myth. Power against fate. But even warriors fall. The Kraken dragged them into the abyss.</p>
          <div className="R d5" style={{marginTop:'2rem',display:'flex',flexDirection:'column',alignItems:'center',gap:'.8rem'}}>
            <div style={{width:'80px',height:'1px',background:'linear-gradient(90deg,transparent,#e05070,transparent)',opacity:.5}}></div>
            <div style={{fontSize:'.58rem',letterSpacing:'5px',color:'#e05070',textTransform:'uppercase',opacity:.7}}>Into the Abyss</div>
            <div style={{fontSize:'2.5rem',opacity:.3}}>🦑</div>
          </div>
        </div>
      </section>

      <div className="ch-divider" data-label="Chapter VI — Rebirth"></div>

      {/* ── ACT VII: NEXT GENERATION ── */}
      <section className="chapter" id="act7" data-ch="5" data-title="Rise of the Next Generation">
        <div className="ch-watermark">06</div>
        <div className="ch-kanji">生</div>
        <div className="one-col">
          <p className="label R">Chapter IV — Rebirth</p>
          <h2 className="heading R d1">Rise of the<br/><em>Next Generation</em></h2>
          <p className="body-text R d2">At <strong>Pirate's Well</strong>, a new generation trained under <strong>Big Brother 3rd Degree</strong> and <strong>Big Brother Sacred</strong>. When the call came, they did not hesitate. <em>They rose.</em></p>
          <div className="cards R d3">
            {[{name:'Neo Kimo',role:'Born Leader',desc:'Destined to guide the next chapter forward'},{name:'Neo Jabari',role:'The Wise Strategist',desc:'Mind of iron, heart of the brotherhood'},{name:'Neo Tre',role:'The Silent Enigma',desc:'Speaks with action, not words'},{name:'Neo Kash',role:'The Fearless Youngest',desc:'First into the storm, last to leave'},{name:'Neo Blake',role:'The Unknown Variable',desc:'Unpredictable. Unbreakable.'},{name:'Neo Jessy',role:'The Relentless Spirit',desc:'Fuelled by purpose, defined by will'}].map(b => (
              <div key={b.name} className="card"><div className="card-name">{b.name}</div><div className="card-role">{b.role}</div><div className="card-desc">{b.desc}</div></div>
            ))}
          </div>
          <p className="body-text R d4">Gifted with divine power by <strong>Olokun</strong>, their blades became extensions of the ocean itself. They emerged not as neophytes — but as <em>Sons of Olokun.</em></p>
        </div>
      </section>

      <div className="ch-divider" data-label="Chapter VII — The Code"></div>

      {/* ── ACT VIII: THE OATH ── */}
      <section className="chapter" id="act-oath" data-ch="6" data-title="What We Stand For">
        <div className="ch-watermark">07</div>
        <div style={{textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center'}}>
          <p className="label R" style={{justifyContent:'center'}}>The Oath</p>
          <div id="act4-motto" className="R d1">
            <div className="motto-line"><span className="motto-word" id="mw1">Death</span></div>
            <div className="motto-line"><span className="motto-word" id="mw2">Before</span></div>
            <div className="motto-line"><span className="motto-word gold-word" id="mw3">Dishonor</span></div>
          </div>
          <div className="R d2" style={{marginTop:'2.5rem',maxWidth:'600px'}}>
            <p className="body-text" style={{textAlign:'center'}}>We are more than a fraternity — we are a brotherhood with a purpose. Adventure, Heritage, Leadership, and Purpose guide everything we do.</p>
          </div>
          <div className="values-row R d3">
            {['Loyalty','Honour','Brotherhood','Courage','Legacy'].map((v,i) => (
              <div key={v} className="val-item"><div className="val-num">{['I','II','III','IV','V'][i]}</div><div className="val-name">{v}</div></div>
            ))}
          </div>
          <div className="pillars R d4" style={{marginTop:'3rem',maxWidth:'900px'}}>
            <div className="pillar"><div className="pillar-kanji">冒</div><h3>Adventure</h3><p>Just as the Wokou traversed the seas, we embrace new challenges and creative endeavours</p></div>
            <div className="pillar"><div className="pillar-kanji">継</div><h3>Heritage</h3><p>We honour the rich traditions of our influences, blending diverse cultures into a unified identity</p></div>
            <div className="pillar"><div className="pillar-kanji">導</div><h3>Leadership</h3><p>We strive to inspire and lead, creating immersive experiences that bring people together</p></div>
            <div className="pillar"><div className="pillar-kanji">志</div><h3>Purpose</h3><p>Through events and initiatives, we give back, leaving a lasting impact in Second Life and beyond</p></div>
          </div>
        </div>
      </section>

      <div className="ch-divider" data-label="Chapter VIII — The Legacy"></div>

      {/* ── ACT IX: THE LEGACY ── */}
      <section className="chapter" id="act8" data-ch="7" data-title="Built on Vision. Proven by Impact.">
        <div className="ch-watermark">08</div>
        <div className="ch-kanji">永</div>
        <div className="one-col">
          <p className="label R">Our Legacy</p>
          <h2 className="heading R d1">Built on Vision.<br/><em>Proven by Impact.</em></h2>
          <div className="stats-grid R d2">
            <div className="stat-card"><span className="stat-num" data-target="4">0</span><span className="stat-lbl">Founding Members</span></div>
            <div className="stat-card"><span className="stat-num" data-target="2021">0</span><span className="stat-lbl">Year Founded</span></div>
            <div className="stat-card"><span className="stat-num">L$100K</span><span className="stat-lbl">Raised for Charity</span></div>
            <div className="stat-card"><span className="stat-num" data-target="4">0</span><span className="stat-lbl">Years Strong</span></div>
          </div>
          <div className="legacy-row R d3">
            <span className="legacy-icon">🎵</span>
            <div><div className="legacy-name">LOONAPALOOSA</div><div className="legacy-desc">KΘΦ II's landmark charity music event — raising L$100,000 for the Save the Music Foundation and setting the gold standard for Greek Life giving in Second Life.</div></div>
          </div>
          <div className="legacy-row R d4">
            <span className="legacy-icon">⚓</span>
            <div><div className="legacy-name">The Abyssal Line Crossing</div><div className="legacy-desc">Our signature crossing ritual — where pledges become brothers and the Wokou-Corsair legacy is passed on in the tradition of the deep sea.</div></div>
          </div>
          <div className="quote-block R d5" style={{marginTop:'2rem'}}>
            <p>We are adventurers, strategists, and brothers. We embrace the mystery of the ocean, the power of the Kraken, and the wisdom of Olokun. Together, we navigate challenges, celebrate victories, and build a legacy that transcends time.</p>
          </div>
        </div>
      </section>

      {/* ── CLOSING ── */}
      <section className="chapter" id="act-close" data-ch="7" style={{minHeight:'70vh',flexDirection:'column',textAlign:'center',background:'radial-gradient(ellipse at center,rgba(198,147,10,.07) 0,transparent 60%)'}}>
        <p className="closing-sub R">Est. 3·14·21 · Second Life · Wokou-Corsairs</p>
        <div className="closing-brand R d1">KΘΦ II</div>
        <p className="closing-sub R d2">Where tradition meets innovation, and the past inspires the future.</p>
        <div className="R d3" style={{display:'flex',gap:'1rem',flexWrap:'wrap',justifyContent:'center',marginTop:'2rem'}}>
          <a href="/" className="cta">⚓ Back to Home</a>
          <a href="/brothers" className="cta cta-ghost">Meet the Brothers</a>
          <a href="/gallery" className="cta cta-ghost">Gallery</a>
        </div>
        <div className="R d4" style={{marginTop:'4rem',fontSize:'.55rem',letterSpacing:'3px',color:'var(--bone-faint)'}}>© 2026 Kappa Theta Phi II Fraternity. All Rights Reserved.</div>
      </section>
    </>
  );
}
