'use client';
import { useEffect, useRef, useState } from 'react';
import './brothers.css';
import '../public.css';
import PublicNav from '../components/PublicNav';

type Member = {
  frat: string;
  role?: string;
  faction?: string | null;
  title?: string | null;
  iron?: boolean;
  image?: string | null;
};

// Roster — single ordered list (Founders → Iron Fleet → faction members → unranked).
// Stagger entrance follows this order, so it should reflect ceremonial hierarchy.
const ROSTER: Member[] = [
  { frat: 'Big Brother Tactician', role: 'Head Founder', faction: 'Kuro Kanda', title: 'Shogun', iron: true, image: '/brothers/tactician.png' },
  { frat: 'Big Brother Boss Sauce', role: 'Co-Founder', faction: 'Ishi No', title: 'Shogun', iron: true, image: '/brothers/boss-sauce.png' },
  { frat: 'Big Brother Energy', role: 'Co-Founder', faction: 'Kurofune', title: 'Shogun', iron: true, image: '/brothers/energy.png' },
  { frat: 'Big Brother Cool Breeze', role: 'Co-Founder', iron: true, image: '/brothers/cool-breeze.png' },
  { frat: 'Big Brother Substance', role: 'Iron Fleet', faction: 'Taidō', title: 'Daimyo', iron: true, image: '/brothers/substance.png' },
  { frat: 'Big Brother Noles', role: 'Iron Fleet', faction: 'Ishi No', title: 'Daimyo', iron: true, image: '/brothers/noles.png' },
  { frat: 'Big Brother Wildwon', role: 'Iron Fleet', faction: 'Kuro Kanda', title: 'Daimyo', iron: true, image: '/brothers/wildwon.png' },
  { frat: 'Big Brother CATALYST', role: 'Iron Fleet', faction: 'Kuro Kanda', title: 'KyōKishi — Chief Officer', iron: true, image: '/brothers/catalyst.png' },
  { frat: 'Big Brother Trench', role: 'Iron Fleet', faction: 'Ishi No', title: 'Kaizoku Kansatsu — Chief Officer', iron: true, image: '/brothers/trench.png' },
  { frat: 'Big Brother Sage', faction: 'Ishi No', title: 'Member', image: '/brothers/sage.png' },
  { frat: 'Big Brother Fathom', faction: 'Kuro Kanda', title: 'Member', image: '/brothers/fathom.png' },
  { frat: 'Big Brother Khaos', faction: 'Kuro Kanda', title: 'Member', image: '/brothers/khaos.png' },
  { frat: 'Big Brother Limitless', image: '/brothers/limitless.png' },
  { frat: 'Big Brother 5 Star General', image: '/brothers/five-star-general.png' },
  { frat: 'Big Brother Pristine', image: '/brothers/pristine.png' },
  { frat: 'Big Brother Deep Dive', image: '/brothers/deep-dive.png' },
  { frat: 'Big Brother Reasonable', image: '/brothers/reasonable.png' },
  { frat: 'Big Brother Nexus', image: '/brothers/nexus.png' },
  { frat: 'Big Brother Sentinel', image: '/brothers/sentinel.png' },
  { frat: 'Big Brother Wildcard', image: '/brothers/wildcard.png' },
];

const FACTION_GLYPH: Record<string, string> = {
  'Kuro Kanda': '黒',
  'Ishi No':    '石',
  'Kurofune':   '船',
  'Taidō':      '体',
};

const FACTION_FROM_KEY: Record<string, string> = {
  'kuro-kanda': 'Kuro Kanda',
  'ishi-no':    'Ishi No',
  'kurofune':   'Kurofune',
  'taido':      'Taidō',
};

function factionKey(f?: string | null): string {
  if (!f) return '';
  return f.toLowerCase().replace('ō', 'o').replace(/\s+/g, '-');
}

function displayName(frat: string): string {
  return frat.replace(/^Big Brother\s+/i, '');
}

function getInitial(frat: string): string {
  const name = displayName(frat);
  const parts = name.split(/\s+/);
  return parts.map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

type View = {
  tier: string;
  tierKey: 'founder' | 'iron' | 'member' | 'unranked';
  isFounder: boolean;
  stamp: string | null;
  glyph: string | null;
  roleLine: string | null;
  member: Member;
};

function brotherView(b: Member): View {
  const isFounder = b.role === 'Head Founder' || b.role === 'Co-Founder';
  const isIron = b.role === 'Iron Fleet';
  const isOfficer = !!(isIron && b.title?.includes('Chief Officer'));

  const tier =
    b.role === 'Head Founder' ? 'tier-head' :
    b.role === 'Co-Founder'   ? 'tier-co' :
    isOfficer                 ? 'tier-officer' :
    isIron                    ? 'tier-iron' :
    b.faction                ? 'tier-member' :
                                'tier-fleet';

  const tierKey: View['tierKey'] =
    isFounder  ? 'founder' :
    isIron     ? 'iron' :
    b.faction ? 'member' :
                 'unranked';

  const stamp =
    b.role === 'Head Founder' ? 'Head Founder' :
    b.role === 'Co-Founder'   ? 'Co-Founder' :
    isOfficer                 ? 'Chief Officer' :
    isIron                    ? 'Iron Fleet' :
                                null;

  const glyph = b.faction ? FACTION_GLYPH[b.faction] : (isFounder ? '⚓' : null);

  let roleLine: string | null = null;
  if (b.role === 'Head Founder') roleLine = 'Founder · Visionary';
  else if (b.role === 'Co-Founder') roleLine = 'Co-Founder';
  else if (isOfficer && b.title) roleLine = b.title.split('—')[0].trim();
  else if (isIron && b.title) roleLine = b.title;

  return { tier, tierKey, isFounder, stamp, glyph, roleLine, member: b };
}

const VIEWS: View[] = ROSTER.map(brotherView);

const COUNTS: Record<string, number> = {
  all: VIEWS.length,
  founder: VIEWS.filter(v => v.tierKey === 'founder').length,
  iron: VIEWS.filter(v => v.tierKey === 'iron').length,
  unranked: VIEWS.filter(v => v.tierKey === 'unranked').length,
  'kuro-kanda': VIEWS.filter(v => v.member.faction === 'Kuro Kanda').length,
  'ishi-no':    VIEWS.filter(v => v.member.faction === 'Ishi No').length,
  'kurofune':   VIEWS.filter(v => v.member.faction === 'Kurofune').length,
  'taido':      VIEWS.filter(v => v.member.faction === 'Taidō').length,
};

function shouldShow(v: View, filter: string): boolean {
  if (filter === 'all')      return true;
  if (filter === 'founder')  return v.tierKey === 'founder';
  if (filter === 'iron')     return v.tierKey === 'iron';
  if (filter === 'unranked') return v.tierKey === 'unranked';
  return v.member.faction === FACTION_FROM_KEY[filter];
}

export default function BrothersPage() {
  const [filter, setFilter] = useState('all');
  const [spotlight, setSpotlight] = useState<View | null>(null);
  const [spotActive, setSpotActive] = useState(false);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const wallRef = useRef<HTMLElement | null>(null);
  const cardRefsRef = useRef<Map<string, HTMLElement>>(new Map());
  const dustCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});
    setPlaying(!playing);
  }

  function markImgError(key: string) {
    setImgErrors(prev => { const n = new Set(prev); n.add(key); return n; });
  }

  // ── DUST CANVAS ─────────────────────────────────────────
  useEffect(() => {
    const canvas = dustCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let W = 0, H = 0;
    function resize() { W = canvas!.width = window.innerWidth; H = canvas!.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);
    type Mote = { x:number; y:number; vx:number; vy:number; size:number; a:number; pulse:number };
    const dust: Mote[] = [];
    function makeMote(): Mote {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() * 0.18 + 0.04) * (Math.random() < 0.5 ? 1 : -1),
        vy: (Math.random() - 0.5) * 0.04,
        size: Math.random() * 1.1 + 0.4,
        a: Math.random() * 0.25 + 0.08,
        pulse: Math.random() * Math.PI * 2,
      };
    }
    for (let i = 0; i < 28; i++) dust.push(makeMote());
    let raf = 0;
    function tick() {
      ctx!.clearRect(0, 0, W, H);
      dust.forEach(m => {
        m.x += m.vx; m.y += m.vy; m.pulse += 0.008;
        if (m.x < -10) m.x = W + 10;
        if (m.x > W + 10) m.x = -10;
        if (m.y < -10) m.y = H + 10;
        if (m.y > H + 10) m.y = -10;
        const alpha = m.a * (0.7 + Math.sin(m.pulse) * 0.3);
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = '#c6930a';
        ctx!.beginPath();
        ctx!.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        ctx!.fill();
      });
      ctx!.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    }
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  // ── STAT COUNT-UP ────────────────────────────────────────
  useEffect(() => {
    const targets = [
      { id: 'stat-brothers', val: COUNTS.all },
      { id: 'stat-founders', val: COUNTS.founder },
      { id: 'stat-fleet',    val: COUNTS.iron },
      { id: 'stat-factions', val: 4 },
    ];
    function countUp(el: HTMLElement, target: number, duration: number) {
      const start = performance.now();
      function step(now: number) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const v = Math.round(eased * target);
        el.textContent = v < 10 ? '0' + v : '' + v;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    const timer = window.setTimeout(() => {
      targets.forEach(({ id, val }) => {
        const el = document.getElementById(id);
        if (el) countUp(el, val, 1300);
      });
    }, 1100);
    return () => clearTimeout(timer);
  }, []);

  // ── AUDIO PROGRESS ───────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => { if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100); };
    const ended  = () => { setPlaying(false); setProgress(0); };
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('ended', ended);
    return () => { audio.removeEventListener('timeupdate', update); audio.removeEventListener('ended', ended); };
  }, []);

  // ── FILTER PILL CLICK + FLIP ─────────────────────────────
  function handleFilterClick(next: string) {
    if (next === filter) return;

    // Snapshot current positions of visible cards BEFORE state change
    const firstRects = new Map<string, DOMRect>();
    const wasVisibleSet = new Set<string>();
    cardRefsRef.current.forEach((el, key) => {
      if (el.classList.contains('is-visible')) {
        firstRects.set(key, el.getBoundingClientRect());
        wasVisibleSet.add(key);
      }
    });

    setFilter(next);

    // After paint: animate cards
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cardRefsRef.current.forEach((el, key) => {
          const isVisible = el.classList.contains('is-visible');
          const wasVisible = wasVisibleSet.has(key);

          if (isVisible && wasVisible) {
            // FLIP — slide from old to new position
            const oldRect = firstRects.get(key)!;
            const newRect = el.getBoundingClientRect();
            const dx = oldRect.left - newRect.left;
            const dy = oldRect.top - newRect.top;
            if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
            el.style.transition = 'none';
            el.style.transform = `translate(${dx}px, ${dy}px)`;
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            el.offsetHeight;
            requestAnimationFrame(() => {
              el.style.transition = 'transform .55s cubic-bezier(.16,1,.3,1)';
              el.style.transform = '';
              window.setTimeout(() => { el.style.transition = ''; el.style.transform = ''; }, 600);
            });
          } else if (isVisible && !wasVisible) {
            // ENTERING — fresh fade-in
            el.style.transition = 'none';
            el.style.opacity = '0';
            el.style.transform = 'translateY(16px) scale(.96)';
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            el.offsetHeight;
            requestAnimationFrame(() => {
              el.style.transition = 'opacity .5s ease, transform .55s cubic-bezier(.16,1,.3,1)';
              el.style.opacity = '';
              el.style.transform = '';
              window.setTimeout(() => { el.style.transition = ''; }, 600);
            });
          }
        });
      });
    });
  }

  // ── SPOTLIGHT ─────────────────────────────────────────────
  function openSpotlight(v: View) {
    setProfileData(null);
    setProfileLoading(true);
    fetch(`/api/public/profile?frat_name=${encodeURIComponent(v.member.frat)}`)
      .then(r => r.json())
      .then(d => { setProfileData(d.profile); setProfileLoading(false); })
      .catch(() => setProfileLoading(false));
    setSpotlight(v);
    setSpotActive(false);
    window.setTimeout(() => setSpotActive(true), 350);
  }
  function closeSpotlight() {
    setProfileData(null); setProfileLoading(false);
    setProfileData(null);
    setSpotActive(false);
    window.setTimeout(() => setSpotlight(null), 500);
  }
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && spotlight) closeSpotlight();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotlight]);

  return (
    <div className="brothers-shell">
      <canvas ref={dustCanvasRef} id="dust-canvas"></canvas>

      <PublicNav/>
      <div className="pub-kanji" aria-hidden="true">
        <span className="k1">兄</span>
        <span className="k2">統</span>
        <span className="k3">義</span>
      </div>

      <audio ref={audioRef} src="/brothers/anthem.mp3" preload="metadata" />

      {/* Audio player — floating, gold-themed */}
      <button className={`audio-player${playing ? ' playing' : ''}`} onClick={togglePlay} aria-label="Play anthem">
        <span className="audio-btn">{playing ? '❚❚' : '▶'}</span>
        <span className="audio-info">
          <span className="audio-title">The Wokou Anthem</span>
          <span className="audio-bar"><span className="audio-bar-fill" style={{ width: `${progress}%` }} /></span>
        </span>
      </button>

      {/* HERO BAND */}
      <section id="hero-band">
        <div className="hero-glyph">兄</div>
        <div className="hero-content">
          <div className="hero-left">
            <p className="hero-eyeline">Wokou-Corsairs · Chapter II</p>
            <h1 className="hero-title">The<em>Brotherhood</em></h1>
            <p className="hero-tag">Death Before Dishonor · Est. 3·14·21</p>
          </div>
          <div className="hero-stats">
            <div><div className="stat-num" id="stat-brothers">00</div><div className="stat-lbl">Brothers</div></div>
            <div><div className="stat-num" id="stat-founders">00</div><div className="stat-lbl">Founders</div></div>
            <div><div className="stat-num" id="stat-fleet">00</div><div className="stat-lbl">Iron Fleet</div></div>
            <div><div className="stat-num" id="stat-factions">00</div><div className="stat-lbl">Factions</div></div>
          </div>
        </div>
      </section>

      {/* FILTER BAR */}
      <div id="filter-bar">
        <FilterPill active={filter==='all'}        onClick={() => handleFilterClick('all')}>All <span className="count">{COUNTS.all}</span></FilterPill>
        <FilterPill active={filter==='founder'}    onClick={() => handleFilterClick('founder')}>Founders <span className="count">{COUNTS.founder}</span></FilterPill>
        <FilterPill active={filter==='iron'}       onClick={() => handleFilterClick('iron')}>Iron Fleet <span className="count">{COUNTS.iron}</span></FilterPill>
        <FilterPill active={filter==='kuro-kanda'} onClick={() => handleFilterClick('kuro-kanda')}><span className="glyph">黒</span> Kuro Kanda <span className="count">{COUNTS['kuro-kanda']}</span></FilterPill>
        <FilterPill active={filter==='ishi-no'}    onClick={() => handleFilterClick('ishi-no')}><span className="glyph">石</span> Ishi No <span className="count">{COUNTS['ishi-no']}</span></FilterPill>
        <FilterPill active={filter==='kurofune'}   onClick={() => handleFilterClick('kurofune')}><span className="glyph">船</span> Kurofune <span className="count">{COUNTS.kurofune}</span></FilterPill>
        <FilterPill active={filter==='taido'}      onClick={() => handleFilterClick('taido')}><span className="glyph">体</span> Taidō <span className="count">{COUNTS.taido}</span></FilterPill>
        <FilterPill active={filter==='unranked'}   onClick={() => handleFilterClick('unranked')}>Fleet <span className="count">{COUNTS.unranked}</span></FilterPill>
      </div>

      {/* THE WALL */}
      <main id="wall" ref={wallRef}>
        {VIEWS.map((v, i) => {
          const visible = shouldShow(v, filter);
          const key = v.member.frat;
          const showImage = !!v.member.image && !imgErrors.has(key);
          return (
            <article
              key={key}
              ref={el => { if (el) cardRefsRef.current.set(key, el); else cardRefsRef.current.delete(key); }}
              className={`card ${v.tier} ${v.isFounder ? 'founder' : ''} ${visible ? 'is-visible' : 'is-hidden'}`}
              data-tier={v.tierKey}
              data-faction={factionKey(v.member.faction)}
              style={{ ['--idx' as string]: i } as React.CSSProperties}
              onClick={() => openSpotlight(v)}
            >
              {v.stamp && <span className="card-stamp">{v.stamp}</span>}
              {v.glyph && <span className="card-glyph">{v.glyph}</span>}
              <div className="card-frame"></div>
              <div className="portrait">
                {showImage && (
                  <img
                    className="portrait-img"
                    src={v.member.image as string}
                    alt={displayName(v.member.frat)}
                    onError={() => markImgError(key)}
                  />
                )}
                <span className="portrait-initial">{getInitial(v.member.frat)}</span>
              </div>
              <div className="card-footer">
                {v.roleLine && <div className="card-role">{v.roleLine}</div>}
                <h3 className="card-name">{displayName(v.member.frat)}</h3>
                <div className="card-faction">
                  {v.member.faction ? (
                    <>
                      <strong>{v.member.faction}</strong>
                      {v.member.title && v.member.title !== v.roleLine && !v.member.title.includes('—') && <> · {v.member.title}</>}
                    </>
                  ) : v.isFounder ? 'Founder' : 'Brother'}
                </div>
              </div>
              <span className="card-cue">→</span>
            </article>
          );
        })}
      </main>

      {/* CLOSING */}
      <section id="brothers-closing">
        <p className="closing-quote">We don&apos;t follow waves.<br/>We <em>create them.</em></p>
        <p className="closing-motto">⚓ Death Before Dishonor ⚓</p>
      </section>

      {/* FOOTER */}
      <footer className="brothers-footer">
        <div className="footer-brand">KΘΦ II — Wokou-Corsairs</div>
        <p>&copy; 2026 Kappa Theta Phi II Fraternity · All Rights Reserved</p>
      </footer>

      {/* SPOTLIGHT MODAL */}
      {spotlight && (
        <div
          className={`spotlight${spotActive ? ' open' : ''}`}
          onClick={(e) => { if (e.target === e.currentTarget) closeSpotlight(); }}
        >
          <button className="spotlight-close" onClick={closeSpotlight}>Close</button>
          <div className="spotlight-content">
            {spotlight.glyph && <div className="spotlight-bg-glyph">{spotlight.glyph}</div>}
            <div className="spotlight-portrait">
              {spotlight.member.image && !imgErrors.has(spotlight.member.frat) ? (
                <img
                  className="spotlight-img"
                  src={spotlight.member.image}
                  alt={displayName(spotlight.member.frat)}
                  onError={() => markImgError(spotlight.member.frat)}
                />
              ) : (
                <span className="spotlight-initial">{getInitial(spotlight.member.frat)}</span>
              )}
            </div>
            <div className="spotlight-text">
              <p className="spotlight-eyeline">{spotlight.stamp || 'Big Brother'}</p>
              <h2 className="spotlight-name">
                {displayName(spotlight.member.frat).split('').map((ch, i) =>
                  ch === ' '
                    ? <span key={i}>&nbsp;</span>
                    : <span key={i} className="letter" style={{ transitionDelay: `${i * 35}ms` }}>{ch}</span>
                )}
              </h2>
              <div className="spotlight-rule"></div>
              {spotlight.roleLine && <p className="spotlight-role">{spotlight.roleLine}</p>}
              <div className="spotlight-meta">
                {spotlight.glyph && <span className="spotlight-faction-glyph">{spotlight.glyph}</span>}
                {spotlight.member.faction && (
                  <span className="spotlight-faction">
                    <strong>{spotlight.member.faction}</strong>
                    {spotlight.member.title && !spotlight.member.title.includes('—') && spotlight.member.title !== 'Member' && <> · {spotlight.member.title}</>}
                  </span>
                )}
                {spotlight.member.title && (
                  <span className="spotlight-title">{spotlight.member.title.split('—')[0].trim()}</span>
                )}
                {spotlight.member.iron && <span className="spotlight-iron">⚓ Iron Compass</span>}
              </div>

              {/* Profile — integrated inside right panel */}
              {profileLoading && (
                <div className="spotlight-profile-loading">Loading...</div>
              )}
              {!profileLoading && profileData && (
                <div className="spotlight-profile">
                  {profileData.favourite_quote && (
                    <div className="spotlight-quote">
                      <span className="spotlight-quote-mark">"</span>
                      {profileData.favourite_quote}
                      <span className="spotlight-quote-mark">"</span>
                    </div>
                  )}
                  {profileData.bio && (
                    <div className="spotlight-bio-section">
                      <div className="spotlight-profile-lbl">About</div>
                      <p className="spotlight-bio">{profileData.bio}</p>
                    </div>
                  )}
                  {profileData.hobbies && (
                    <div className="spotlight-bio-section">
                      <div className="spotlight-profile-lbl">Hobbies & Interests</div>
                      <p className="spotlight-bio">{profileData.hobbies}</p>
                    </div>
                  )}
                  <BrotherSocials links={profileData.social_links}/>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function socialLink(platform: string, handle: string): string {
  if (!handle) return '#';
  const h = handle.replace('@', '');
  if (platform === 'Second Life') return handle;
  if (platform === 'Instagram') return `https://instagram.com/${h}`;
  if (platform === 'Twitter/X') return `https://x.com/${h}`;
  if (platform === 'TikTok') return `https://tiktok.com/@${h}`;
  if (platform === 'YouTube') return `https://youtube.com/@${h}`;
  return '#';
}

const SOCIAL_ICONS: Record<string, string> = {
  Instagram: '📸', 'Twitter/X': '𝕏', TikTok: '🎵',
  YouTube: '▶', Discord: '💬', 'Second Life': '⚓',
};

function BrotherSocials({ links }: { links: any }) {
  const [copied, setCopied] = useState<string|null>(null);
  if (!links || typeof links !== 'object') return null;
  const entries = Object.entries(links).filter(([, v]) => v) as [string, string][];
  if (!entries.length) return null;

  function handleClick(e: React.MouseEvent, platform: string, handle: string) {
    if (platform === 'Discord') {
      e.preventDefault();
      navigator.clipboard.writeText(handle).catch(() => {});
      setCopied(handle);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  return (
    <div className="spotlight-bio-section">
      <div className="spotlight-profile-lbl">Find Me On</div>
      <div className="spotlight-socials">
        {entries.map(([platform, handle]) => (
          <a key={platform} className={`spotlight-social-pill${copied===handle?' copied':''}`}
            href={platform === 'Discord' ? '#' : socialLink(platform, handle)}
            onClick={(e) => handleClick(e, platform, handle)}
            target={platform === 'Discord' ? undefined : '_blank'}
            rel="noopener noreferrer"
            title={platform === 'Discord' ? 'Click to copy Discord username' : undefined}>
            <span className="spotlight-social-icon">{SOCIAL_ICONS[platform] || '🔗'}</span>
            <span className="spotlight-social-name">{platform}</span>
            <span className="spotlight-social-handle">
              {copied === handle ? '✓ Copied!' : handle.startsWith('secondlife') ? 'View Profile' : handle}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}


function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className={`filter-pill${active ? ' active' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}
