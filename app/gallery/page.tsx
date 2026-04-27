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

const SUPABASE_URL = 'https://uamhroebetbacvxdvzxo.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhbWhyb2ViZXRiYWN2eGR2enhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODY0MTEsImV4cCI6MjA5MjI2MjQxMX0.F_So-6St7sCFYPYksjrBeo_xJQ0B0Y-Lv5mAsj4ViJg';

export default function GalleryPage() {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [tabs, setTabs] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadGallery(); }, []);

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
      }
    } catch {}
  }

  const filtered = activeTab === 'all' ? posts : posts.filter(p => p.event_tag === activeTab);

  async function handleUpload() {
    if (!file) { setStatus({ msg: 'Please select a file.', type: 'error' }); return; }
    setUploading(true); setStatus(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('caption', caption);
      form.append('uploaded_by', name || 'Anonymous');
      const r = await fetch('/api/gallery-upload', { method: 'POST', body: form });
      const d = await r.json();
      if (d.success) {
        setStatus({ msg: 'Uploaded successfully!', type: 'success' });
        setFile(null); setCaption(''); setName('');
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
          <button className={`gallery-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All</button>
          {tabs.map(t => (
            <button key={t} className={`gallery-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>

        {/* Upload bar */}
        <div className="upload-bar">
          <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
          <input type="text" placeholder="Add a caption..." value={caption} onChange={e => setCaption(e.target.value)} />
          <label className="upload-file-btn">
            {file ? file.name.slice(0, 20) : 'Choose File'}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4" onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
          <button className="upload-submit" onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          {status && <div className={`upload-status ${status.type}`}>{status.msg}</div>}
        </div>

        <div className="gallery-grid">
          {filtered.length === 0 && (
            <div className="gallery-empty">No posts yet. Be the first to share a moment.</div>
          )}
          {filtered.map(post => (
            <div className="gallery-item" key={post.id} onClick={() => post.file_type === 'image' && setLightbox(post.file_url)}>
              {post.file_type === 'video' ? (
                <video src={post.file_url} controls preload="metadata" />
              ) : (
                <img src={post.file_url} alt={post.caption || 'Gallery'} loading="lazy" />
              )}
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
            <img src={lightbox} alt="Full size" />
            <div className="lightbox-close">✕</div>
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
