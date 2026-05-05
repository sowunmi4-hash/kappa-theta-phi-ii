'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import './gallery.css';

type GalleryPost = {
  id: string;
  file_url: string;
  file_type: string;
  caption: string;
  uploaded_by: string;
  event_tag: string | null;
  created_at: string;
};

type Volume = {
  tag: string;
  numeral: string;
  index: number;
  photos: GalleryPost[];
  earliestDate: string;
};

type CurrentUser = {
  frat_name: string;
  sl_name: string;
  isAdmin: boolean;
} | null;

const ADMIN_SL_NAMES = ['safareehills'];
const TOKEN_STORAGE_KEY = 'ktp_gallery_tokens';
const SUPABASE_URL = 'https://uamhroebetbacvxdvzxo.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhbWhyb2ViZXRiYWN2eGR2enhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODY0MTEsImV4cCI6MjA5MjI2MjQxMX0.F_So-6St7sCFYPYksjrBeo_xJQ0B0Y-Lv5mAsj4ViJg';

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\s]+)/);
  return m ? m[1] : null;
}
function isYouTube(url: string): boolean { return !!getYouTubeId(url); }

function loadTokens(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try { const raw = localStorage.getItem(TOKEN_STORAGE_KEY); return raw ? JSON.parse(raw) : {}; }
  catch { return {}; }
}
function saveTokens(tokens: Record<string, string>) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens)); } catch {}
}

function toRoman(num: number): string {
  const map: [number, string][] = [
    [1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],
    [50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']
  ];
  let n = num, out = '';
  for (const [v, s] of map) { while (n >= v) { out += s; n -= v; } }
  return out;
}
const pad3 = (n: number) => String(n).padStart(3, '0');

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }
  catch { return iso; }
}

export default function GalleryPage() {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [activeVolIdx, setActiveVolIdx] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [caption, setCaption] = useState('');
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tabMode, setTabMode] = useState<'existing'|'new'>('existing');
  const [newTabName, setNewTabName] = useState('');
  const [selectedTab, setSelectedTab] = useState('');
  const [deleting, setDeleting] = useState<string|null>(null);
  const [status, setStatus] = useState<{ msg: string; type: 'error'|'success' }|null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  const [myTokens, setMyTokens] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const dustRef = useRef<HTMLCanvasElement>(null);
  const volContentRef = useRef<HTMLDivElement>(null);

  // Group posts into volumes — sorted oldest event first (Volume I = chapter's first event)
  const volumes = useMemo<Volume[]>(() => {
    const byTag = new Map<string, GalleryPost[]>();
    for (const p of posts) {
      const tag = p.event_tag || 'General';
      if (!byTag.has(tag)) byTag.set(tag, []);
      byTag.get(tag)!.push(p);
    }
    const groups = Array.from(byTag.entries()).map(([tag, ps]) => {
      ps.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      return { tag, photos: ps, earliestDate: ps[0]?.created_at || '' };
    });
    groups.sort((a, b) => new Date(a.earliestDate).getTime() - new Date(b.earliestDate).getTime());
    return groups.map((g, i) => ({ ...g, index: i, numeral: toRoman(i + 1) }));
  }, [posts]);

  const activeVolume = volumes[activeVolIdx];
  const tabs = useMemo(() => volumes.map(v => v.tag), [volumes]);

  useEffect(() => {
    loadGallery();
    setMyTokens(loadTokens());
    fetch('/api/verify-session', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.authenticated && d.member) {
          const sl = String(d.member.sl_name || '').trim().toLowerCase();
          setCurrentUser({
            frat_name: d.member.frat_name,
            sl_name: d.member.sl_name,
            isAdmin: ADMIN_SL_NAMES.includes(sl),
          });
        } else { setCurrentUser(null); }
      })
      .catch(() => setCurrentUser(null));
  }, []);

  // Reset to first volume if active becomes invalid (e.g., last photo of a tab deleted)
  useEffect(() => {
    if (activeVolIdx >= volumes.length && volumes.length > 0) setActiveVolIdx(0);
  }, [volumes.length, activeVolIdx]);

  // Default selected tab in upload modal
  useEffect(() => {
    if (!selectedTab && tabs.length > 0) setSelectedTab(tabs[0]);
  }, [tabs, selectedTab]);

  // Lightbox keyboard nav
  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowLeft') navLightbox(-1);
      if (e.key === 'ArrowRight') navLightbox(1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, activeVolume]);

  // Particle dust canvas — same atmospheric language as /brothers
  useEffect(() => {
    const canvas = dustRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const motes = Array.from({ length: 32 }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.06,
      r: Math.random() * 1.4 + 0.4, a: Math.random() * 0.4 + 0.1, t: Math.random() * Math.PI * 2,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      motes.forEach(m => {
        m.x += m.vx; m.y += m.vy; m.t += 0.008;
        if (m.x < 0) m.x = innerWidth; if (m.x > innerWidth) m.x = 0;
        if (m.y < 0) m.y = innerHeight; if (m.y > innerHeight) m.y = 0;
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

  function canDeletePost(post: GalleryPost): boolean {
    if (currentUser?.isAdmin) return true;
    return !!myTokens[post.id];
  }

  async function loadGallery() {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/gallery_posts?select=*&order=created_at.desc`, {
        headers: { 'apikey': ANON_KEY, 'Accept-Profile': 'members' }
      });
      const d = await r.json();
      if (Array.isArray(d)) setPosts(d);
    } catch {}
  }

  function navLightbox(dir: number) {
    if (lightbox === null || !activeVolume) return;
    const len = activeVolume.photos.length;
    setLightbox(((lightbox + dir) % len + len) % len);
  }

  function selectVolume(idx: number) {
    setActiveVolIdx(idx);
    setTimeout(() => {
      volContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  async function deletePost(id: string, fileUrl: string) {
    if (!confirm('Delete this photo?')) return;
    setDeleting(id);
    const token = myTokens[id];
    try {
      const r = await fetch('/api/gallery-upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, file_url: fileUrl, delete_token: token }),
      });
      if (r.ok && myTokens[id]) {
        const next = { ...myTokens };
        delete next[id];
        setMyTokens(next);
        saveTokens(next);
      }
    } catch {}
    setDeleting(null);
    loadGallery();
  }

  async function handleUpload() {
    if (!file) { setStatus({ msg: 'Please select a file.', type: 'error' }); return; }
    setUploading(true); setStatus(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('caption', caption);
      const tab = tabMode === 'new' ? (newTabName.trim() || 'General') : (selectedTab || 'General');
      form.append('uploaded_by', name || 'Anonymous');
      form.append('event_tag', tab);
      const r = await fetch('/api/gallery-upload', { method: 'POST', body: form });
      const d = await r.json();
      if (d.success) {
        if (d.post_id && d.delete_token) {
          const next = { ...myTokens, [d.post_id]: d.delete_token };
          setMyTokens(next);
          saveTokens(next);
        }
        setStatus({ msg: 'Uploaded successfully!', type: 'success' });
        setFile(null); setCaption(''); setName(''); setNewTabName(''); setShowUploadModal(false);
        if (fileRef.current) fileRef.current.value = '';
        loadGallery();
      } else { setStatus({ msg: d.message || 'Upload failed.', type: 'error' }); }
    } catch { setStatus({ msg: 'Connection error.', type: 'error' }); }
    finally { setUploading(false); }
  }

  const lightboxPhoto = lightbox !== null && activeVolume ? activeVolume.photos[lightbox] : null;

  return (
    <div className="gallery-shell">
      <canvas ref={dustRef} id="gallery-dust"></canvas>

      <nav id="navbar">
        <a href="/" className="nav-brand">KΘΦ <span>II</span></a>
        <ul className="nav-links" id="navLinks">
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/brothers">Brothers</a></li>
          <li><a href="/gallery" className="active">Gallery</a></li>
        </ul>
        <div className="mobile-toggle" onClick={() => document.getElementById('navLinks')?.classList.toggle('open')}>
          <span></span><span></span><span></span>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="gh-hero">
        <div className="gh-kanji">写</div>
        <div className="gh-content">
          <div className="gh-tag">The Archive · Sha</div>
          <h1 className="gh-title">Gallery</h1>
          <p className="gh-sub">Moments captured · Memory made permanent</p>
          <p className="gh-quote">Every plate a record of what the chapter has done together — kept, catalogued, preserved.</p>
        </div>
        {volumes.length > 0 && <div className="gh-scroll">Browse the archive</div>}
      </section>

      {/* ── VOLUME PICKER ── */}
      {volumes.length > 0 && (
        <div className="vol-picker-wrap">
          <div className="section-label">Select a volume</div>
          <div className="volumes">
            {volumes.map(v => (
              <button key={v.tag}
                className={`volume ${activeVolIdx === v.index ? 'active' : ''}`}
                onClick={() => selectVolume(v.index)}>
                <div className="vol-row">
                  <div className="vol-numeral">{v.numeral}</div>
                  <div className="vol-info">
                    <div className="vol-name">{v.tag}</div>
                    <div className="vol-meta">
                      <strong>{v.photos.length}</strong> plate{v.photos.length !== 1 ? 's' : ''} · {new Date(v.earliestDate).getFullYear() || '—'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {volumes.length === 0 && (
        <div className="empty-archive">
          <p>No volumes yet · Be the first to add a memory</p>
          <button className="vh-cta" onClick={() => setShowUploadModal(true)}>+ Add Memory</button>
        </div>
      )}

      {/* ── VOLUME CONTENT ── */}
      {activeVolume && (
        <section className="vol-content" ref={volContentRef}>
          <header className="vol-header">
            <div>
              <div className="vh-tag">Volume {activeVolume.numeral}</div>
              <h2 className="vh-title">{activeVolume.tag}</h2>
              <div className="vh-meta">
                <span>{fmtDate(activeVolume.earliestDate)}</span>
                <span>{activeVolume.photos.length} plate{activeVolume.photos.length !== 1 ? 's' : ''}</span>
                <span>captured by the chapter</span>
              </div>
            </div>
            <button className="vh-cta" onClick={() => setShowUploadModal(true)}>+ Add Memory</button>
          </header>

          <div className="grid" key={activeVolume.tag}>
            {activeVolume.photos.map((post, idx) => {
              const yt = isYouTube(post.file_url) ? getYouTubeId(post.file_url) : null;
              return (
                <figure key={post.id} className="photo"
                  style={{ ['--idx' as any]: idx }}
                  onClick={() => setLightbox(idx)}>
                  <span className="plate">P · {pad3(idx + 1)}</span>
                  <span className="corner tl"></span>
                  <span className="corner tr"></span>
                  <span className="corner bl"></span>
                  <span className="corner br"></span>
                  {yt ? (
                    <div className="yt-thumb">
                      <img src={`https://img.youtube.com/vi/${yt}/hqdefault.jpg`} alt={post.caption || 'video'} />
                      <div className="yt-play">▶</div>
                    </div>
                  ) : post.file_type === 'video' ? (
                    <video src={post.file_url} muted playsInline />
                  ) : (
                    <img src={post.file_url} alt={post.caption || 'photo'} loading="lazy" />
                  )}
                  <div className="caption">
                    <div className="caption-text">{post.caption || '—'}</div>
                    <div className="caption-meta">By {post.uploaded_by || 'Anonymous'} · {fmtDate(post.created_at)}</div>
                  </div>
                  {canDeletePost(post) && (
                    <button className="del-btn"
                      onClick={e => { e.stopPropagation(); deletePost(post.id, post.file_url); }}
                      disabled={deleting === post.id}
                      title="Delete">
                      {deleting === post.id ? '⏳' : '✕'}
                    </button>
                  )}
                </figure>
              );
            })}
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="gallery-footer">
        <div className="gf-motto">⚓ Death Before Dishonor ⚓</div>
        <div className="gf-sub">Kappa Theta Phi · Chapter II · Wokou-Corsairs</div>
      </footer>

      {/* ── LIGHTBOX ── */}
      {lightboxPhoto && activeVolume && (
        <div className="lb-overlay" onClick={e => { if (e.target === e.currentTarget) setLightbox(null); }}>
          <button className="lb-close" onClick={() => setLightbox(null)}>×</button>
          {activeVolume.photos.length > 1 && (
            <>
              <button className="lb-nav prev" onClick={() => navLightbox(-1)}>‹</button>
              <button className="lb-nav next" onClick={() => navLightbox(1)}>›</button>
            </>
          )}
          <div className="lb-frame">
            {(() => {
              const yt = isYouTube(lightboxPhoto.file_url) ? getYouTubeId(lightboxPhoto.file_url) : null;
              if (yt) return <iframe className="lb-yt" src={`https://www.youtube.com/embed/${yt}?autoplay=1`} title="video" allow="autoplay; encrypted-media" allowFullScreen></iframe>;
              if (lightboxPhoto.file_type === 'video') return <video className="lb-video" src={lightboxPhoto.file_url} controls autoPlay />;
              return <img className="lb-img" src={lightboxPhoto.file_url} alt={lightboxPhoto.caption || ''} />;
            })()}
            <div className="lb-meta">
              <div className="lb-plate">Plate {pad3((lightbox ?? 0) + 1)} of {pad3(activeVolume.photos.length)}</div>
              <div className="lb-caption">{lightboxPhoto.caption || '—'}</div>
              <div className="lb-attr">By <strong>{lightboxPhoto.uploaded_by || 'Anonymous'}</strong> · {fmtDate(lightboxPhoto.created_at)}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── UPLOAD MODAL ── */}
      {showUploadModal && (
        <div className="up-overlay" onClick={e => { if (e.target === e.currentTarget) setShowUploadModal(false); }}>
          <div className="up-modal">
            <div className="up-head">
              <div className="up-title">Add Memory<small>Contribute to the archive</small></div>
              <button className="up-close" onClick={() => setShowUploadModal(false)}>×</button>
            </div>
            <div className="up-body">
              <span className="up-label">Your name</span>
              <input className="up-input" type="text" placeholder="e.g. Cool Breeze (or leave blank)" value={name} onChange={e => setName(e.target.value)} />

              <span className="up-label">Caption (optional)</span>
              <input className="up-input" type="text" placeholder="What's the moment?" value={caption} onChange={e => setCaption(e.target.value)} />

              <span className="up-label">File</span>
              <label className={`up-file ${file ? 'has-file' : ''}`}>
                {file ? '📷 ' + file.name.slice(0, 36) : '📷 Choose image or video'}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4" style={{display:'none'}}
                  onChange={e => setFile(e.target.files?.[0] || null)} />
              </label>

              <span className="up-label">Volume / Album</span>
              <div className="up-tab-toggle">
                <button className={tabMode === 'existing' ? 'active' : ''} onClick={() => setTabMode('existing')}>Existing</button>
                <button className={tabMode === 'new' ? 'active' : ''} onClick={() => setTabMode('new')}>+ New Volume</button>
              </div>
              {tabMode === 'existing' ? (
                <select className="up-select" value={selectedTab} onChange={e => setSelectedTab(e.target.value)}>
                  {tabs.map(t => <option key={t} value={t}>{t}</option>)}
                  {tabs.length === 0 && <option value="General">General</option>}
                </select>
              ) : (
                <input className="up-input" placeholder="e.g. Birdies For BIFIDA 2026" value={newTabName} onChange={e => setNewTabName(e.target.value)} />
              )}

              {status && <div className={`up-status ${status.type}`}>{status.msg}</div>}

              <button className="up-submit" onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
