'use client';
import { useState, useEffect, useRef } from 'react';
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

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\s]+)/);
  return m ? m[1] : null;
}

function isYouTube(url: string): boolean {
  return !!getYouTubeId(url);
}

type CurrentUser = {
  frat_name: string;
  sl_name: string;
  isAdmin: boolean;
} | null;

const ADMIN_SL_NAMES = ['safareehills'];
const TOKEN_STORAGE_KEY = 'ktp_gallery_tokens'; // localStorage map: { [post_id]: delete_token }

const SUPABASE_URL = 'https://uamhroebetbacvxdvzxo.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhbWhyb2ViZXRiYWN2eGR2enhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODY0MTEsImV4cCI6MjA5MjI2MjQxMX0.F_So-6St7sCFYPYksjrBeo_xJQ0B0Y-Lv5mAsj4ViJg';

function loadTokens(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveTokens(tokens: Record<string, string>) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens)); } catch {}
}

export default function GalleryPage() {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [tabs, setTabs] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tabMode, setTabMode] = useState<'existing'|'new'>('existing');
  const [newTabName, setNewTabName] = useState('');
  const [selectedTab, setSelectedTab] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleting, setDeleting] = useState<string|null>(null);
  const [status, setStatus] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; type: 'image' | 'youtube' } | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  const [myTokens, setMyTokens] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadGallery();
    setMyTokens(loadTokens());
    // Best-effort session check — used only to grant admin override on delete
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
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null));
  }, []);

  function canDeletePost(post: GalleryPost): boolean {
    // Admin can delete anything
    if (currentUser?.isAdmin) return true;
    // Otherwise, only if this browser holds a token for this post
    return !!myTokens[post.id];
  }

  async function loadGallery() {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/gallery_posts?select=*&order=created_at.desc`, {
        headers: { 'apikey': ANON_KEY, 'Accept-Profile': 'members' }
      });
      const d = await r.json();
      if (Array.isArray(d)) {
        setPosts(d);
        const eventTags = [...new Set(d.map((p: GalleryPost) => p.event_tag).filter(Boolean))] as string[];
        setTabs(eventTags);
        if (eventTags.length > 0) {
          setSelectedTab(eventTags[0]);
          // Default the active tab to the first event tag — and reset if the
          // previously-selected tab disappeared (e.g. its last photo was deleted)
          setActiveTab(prev => (!prev || !eventTags.includes(prev)) ? eventTags[0] : prev);
        }
      }
    } catch {}
  }

  const filtered = activeTab ? posts.filter(p => p.event_tag === activeTab) : [];

  async function deletePost(id: string, fileUrl: string) {
    if (!confirm('Delete this photo?')) return;
    setDeleting(id);
    const token = myTokens[id]; // may be undefined if user is admin deleting someone else's photo
    try {
      const r = await fetch('/api/gallery-upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, file_url: fileUrl, delete_token: token }),
      });
      if (r.ok) {
        // Drop the token from local storage since the photo is gone
        if (myTokens[id]) {
          const next = { ...myTokens };
          delete next[id];
          setMyTokens(next);
          saveTokens(next);
        }
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
        // Persist the delete token so this browser can later delete its own photo
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

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

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

      <main className="gallery-page">

        <section className="gallery-hero">
          <div className="gallery-hero-bg" />
          <div className="gallery-hero-kanji">写</div>
          <div className="gallery-hero-content">
            <div className="gallery-hero-tag">The Archive</div>
            <h1 className="gallery-hero-title">Gallery</h1>
            <p className="gallery-hero-sub">Collabs, events, and moments captured.</p>
          </div>
        </section>

        {/* Tabs */}
        <div className="gallery-tabs">
          {tabs.map(t => (
            <button key={t} className={`gallery-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>

        {/* Upload trigger — public, anyone can post */}
        <div style={{textAlign:'center',marginBottom:'1.5rem'}}>
          <button onClick={() => setShowUploadModal(true)}
            style={{background:'rgba(198,147,10,0.1)',border:'1px solid rgba(198,147,10,0.3)',color:'#c6930a',borderRadius:'8px',padding:'10px 24px',fontFamily:"'Rajdhani',sans-serif",fontSize:'0.9rem',fontWeight:700,letterSpacing:'2px',cursor:'pointer',textTransform:'uppercase'}}>
            + Add Photo
          </button>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'1rem'}}>
            <div style={{background:'#1a1a2e',border:'1px solid #2a2a3e',borderRadius:'14px',padding:'1.5rem',width:'100%',maxWidth:'420px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.2rem'}}>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.4rem',letterSpacing:'3px',color:'#f0e8d0'}}>Add Photo</div>
                <button onClick={() => {setShowUploadModal(false);setFile(null);}} style={{background:'none',border:'none',color:'#666',cursor:'pointer',fontSize:'1.2rem'}}>✕</button>
              </div>
              <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)}
                style={{width:'100%',background:'#0d0d1a',border:'1px solid #2a2a3e',borderRadius:'8px',padding:'0.6rem 0.8rem',color:'#f0e8d0',fontFamily:"'Rajdhani',sans-serif",fontSize:'0.9rem',marginBottom:'0.8rem',boxSizing:'border-box'}} />
              <input type="text" placeholder="Caption (optional)" value={caption} onChange={e => setCaption(e.target.value)}
                style={{width:'100%',background:'#0d0d1a',border:'1px solid #2a2a3e',borderRadius:'8px',padding:'0.6rem 0.8rem',color:'#f0e8d0',fontFamily:"'Rajdhani',sans-serif",fontSize:'0.9rem',marginBottom:'0.8rem',boxSizing:'border-box'}} />
              <label style={{display:'block',width:'100%',background:'#0d0d1a',border:'1px dashed #2a2a3e',borderRadius:'8px',padding:'0.8rem',textAlign:'center',cursor:'pointer',color:file?'#c6930a':'#666',marginBottom:'0.8rem',fontFamily:"'Rajdhani',sans-serif",fontSize:'0.85rem',boxSizing:'border-box'}}>
                {file ? file.name.slice(0,30) : '📷 Choose File'}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4" style={{display:'none'}} onChange={e => setFile(e.target.files?.[0] || null)} />
              </label>
              <div style={{marginBottom:'0.8rem'}}>
                <div style={{fontSize:'0.6rem',letterSpacing:'3px',color:'#666',textTransform:'uppercase',marginBottom:'0.5rem'}}>Album / Tab</div>
                <div style={{display:'flex',gap:'8px',marginBottom:'0.6rem'}}>
                  <button onClick={() => setTabMode('existing')} style={{flex:1,padding:'6px',borderRadius:'6px',border:'1px solid',fontFamily:"'Rajdhani',sans-serif",fontSize:'0.78rem',fontWeight:700,cursor:'pointer',background:tabMode==='existing'?'rgba(198,147,10,0.15)':'#0d0d1a',borderColor:tabMode==='existing'?'rgba(198,147,10,0.4)':'#2a2a3e',color:tabMode==='existing'?'#c6930a':'#666'}}>Existing</button>
                  <button onClick={() => setTabMode('new')} style={{flex:1,padding:'6px',borderRadius:'6px',border:'1px solid',fontFamily:"'Rajdhani',sans-serif",fontSize:'0.78rem',fontWeight:700,cursor:'pointer',background:tabMode==='new'?'rgba(198,147,10,0.15)':'#0d0d1a',borderColor:tabMode==='new'?'rgba(198,147,10,0.4)':'#2a2a3e',color:tabMode==='new'?'#c6930a':'#666'}}>+ New Tab</button>
                </div>
                {tabMode === 'existing' ? (
                  <select value={selectedTab} onChange={e => setSelectedTab(e.target.value)}
                    style={{width:'100%',background:'#0d0d1a',border:'1px solid #2a2a3e',borderRadius:'8px',padding:'0.6rem 0.8rem',color:'#f0e8d0',fontFamily:"'Rajdhani',sans-serif",fontSize:'0.9rem',boxSizing:'border-box'}}>
                    {tabs.map(t => <option key={t} value={t}>{t}</option>)}
                    {tabs.length === 0 && <option value="General">General</option>}
                  </select>
                ) : (
                  <input value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder="e.g. Birdies For BIFIDA 2026"
                    style={{width:'100%',background:'#0d0d1a',border:'1px solid #2a2a3e',borderRadius:'8px',padding:'0.6rem 0.8rem',color:'#f0e8d0',fontFamily:"'Rajdhani',sans-serif",fontSize:'0.9rem',boxSizing:'border-box'}} />
                )}
              </div>
              {status && <div style={{fontSize:'0.78rem',color:status.type==='error'?'#e05070':'#4ade80',marginBottom:'0.8rem'}}>{status.msg}</div>}
              <button onClick={handleUpload} disabled={!file||uploading}
                style={{width:'100%',background:file?'#c6930a':'#1a1a2e',color:file?'#000':'#666',border:'none',borderRadius:'8px',padding:'0.8rem',fontFamily:"'Bebas Neue',cursive",fontSize:'1rem',letterSpacing:'2px',cursor:file?'pointer':'not-allowed'}}>
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        )}

        <div className="gallery-grid">
          {filtered.length === 0 && (
            <div className="gallery-empty">No posts yet. Be the first to share a moment.</div>
          )}
          {filtered.map(post => (
            <div className="gallery-item" key={post.id} style={{position:'relative'}}>
              {canDeletePost(post) && (
                <button onClick={e => { e.stopPropagation(); deletePost(post.id, post.file_url); }}
                  disabled={deleting === post.id}
                  style={{position:'absolute',top:'6px',right:'6px',width:'26px',height:'26px',borderRadius:'50%',background:'rgba(0,0,0,0.75)',border:'1px solid rgba(224,80,112,0.5)',color:'#e05070',cursor:'pointer',fontSize:'0.7rem',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2,opacity:0,transition:'opacity 0.15s'}}
                  onMouseEnter={e => (e.currentTarget.style.opacity='1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity='0')}>
                  {deleting === post.id ? '⏳' : '✕'}
                </button>
              )}
              <div onClick={() => {
              if (isYouTube(post.file_url)) setLightbox({ url: post.file_url, type: 'youtube' });
              else if (post.file_type === 'image') setLightbox({ url: post.file_url, type: 'image' });
            }}>
              {isYouTube(post.file_url) ? (
                <div className="gallery-yt-wrap">
                  <img
                    src={`https://img.youtube.com/vi/${getYouTubeId(post.file_url)}/hqdefault.jpg`}
                    alt={post.caption || 'Video'}
                    loading="lazy"
                  />
                  <div className="gallery-yt-play">▶</div>
                </div>
              ) : post.file_type === 'video' ? (
                <video src={post.file_url} controls preload="metadata" />
              ) : (
                <img src={post.file_url} alt={post.caption || 'Gallery'} loading="lazy" />
              )}
              </div>
              <div className="gallery-item-info">
                {post.caption && <div className="gallery-item-caption">{post.caption}</div>}
                <div className="gallery-item-meta">
                  <span>{post.uploaded_by}</span>
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox */}
        {lightbox && (
          <div className="lightbox" onClick={() => setLightbox(null)}>
            {lightbox.type === 'youtube' ? (
              <div className="lightbox-yt" onClick={e => e.stopPropagation()}>
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(lightbox.url)}?autoplay=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <img src={lightbox.url} alt="Full size" />
            )}
            <div className="lightbox-close" onClick={() => setLightbox(null)}>✕</div>
          </div>
        )}

        <footer className="gallery-footer">
          <div className="footer-brand">KΘΦ II — WOKOU-CORSAIRS</div>
          <p>&copy; 2026 Kappa Theta Phi II Fraternity. All Rights Reserved.</p>
        </footer>
      </main>
    </>
  );
}
