'use client';
import { useState, useEffect, useRef } from 'react';
import '../dashboard.css';

export default function PrivateGallery() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/dashboard/profile').then(r => r.json()).then(d => {
      if (d.error) { window.location.href = '/login'; return; }
    });
    loadGallery();
  }, []);

  async function loadGallery() {
    const res = await fetch('/api/dashboard/private-gallery');
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  async function handleUpload(e: any) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('caption', caption);
    await fetch('/api/dashboard/private-gallery', { method: 'POST', body: fd });
    setCaption('');
    await loadGallery();
    setUploading(false);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c6930a', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '3px' }}>LOADING...</div>
  );

  return (
    <div className="dash-root">
      <nav className="dash-nav">
        <div className="dash-nav-brand">KΘΦ II</div>
        <div className="dash-nav-links">
          <a href="/dashboard">← Dashboard</a>
          <a href="/dashboard/news">Wokou News</a>
          <a href="/dashboard/edit">Edit Profile</a>
        </div>
      </nav>

      <div className="pgallery-wrap">
        <div className="pgallery-header">
          <div className="pgallery-title">🔒 My Private Gallery</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.4)', letterSpacing: '1px' }}>Only visible to you</div>
        </div>

        {/* Caption input */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.6rem' }}>
          <input className="dash-input" style={{ flex: 1 }} value={caption} onChange={e => setCaption(e.target.value)} placeholder="Add a caption (optional)..." />
        </div>

        <div className="pgallery-grid">
          {/* Upload tile */}
          <div className="pgallery-upload" onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept="image/*,video/mp4" style={{ display: 'none' }} onChange={handleUpload} />
            {uploading ? <span>⏳</span> : <span style={{ fontSize: '2rem' }}>+</span>}
            <span>{uploading ? 'Uploading...' : 'Add Photo / Video'}</span>
          </div>

          {items.map(item => (
            <div key={item.id} className="pgallery-item" onClick={() => item.file_type === 'image' && setLightbox(item.file_url)}>
              {item.file_type === 'video' ? (
                <video src={item.file_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <img src={item.file_url} alt={item.caption || ''} />
              )}
              {item.caption && <div className="pgallery-caption">{item.caption}</div>}
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(245,240,232,0.3)', marginTop: '3rem', fontSize: '0.9rem' }}>
            Your private gallery is empty. Upload your first photo above.
          </div>
        )}
      </div>

      {lightbox && (
        <div className="dash-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="full size" />
          <div className="dash-lightbox-close">✕</div>
        </div>
      )}
    </div>
  );
}
