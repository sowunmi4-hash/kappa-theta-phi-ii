'use client';
import { useState, useEffect, useRef } from 'react';
import '../dash.css';

const NAV = [
  { href: '/dashboard', label: 'Home' },
  { href: '/dashboard/news', label: 'Wokou News' },
  { href: '/dashboard/events', label: 'Events' },
  { href: '/dashboard/phire', label: 'PHIRE' },
  { href: '/dashboard/discipline', label: 'Discipline' },
    { href: '/dashboard/ssp', label: 'Sage Solution' },
  { href: '/dashboard/dues', label: 'Dues' },
    { href: '/dashboard/gallery', label: 'My Gallery' },
  { href: '/dashboard/edit', label: 'Edit Profile' },
];

export default function GalleryPage() {
  const [member, setMember] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [lightbox, setLightbox] = useState<string|null>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/dashboard/profile').then(r => r.json()).then(d => {
      if (d.error) { window.location.href = '/login'; return; }
      setMember(d.member);
    });
    loadGallery();
  }, []);

  async function loadGallery() {
    const d = await fetch('/api/dashboard/private-gallery').then(r => r.json());
    setItems(d.items || []);
  }

  async function upload(e: any) {
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

  if (!member) return <div className="dash-loading">LOADING...</div>;
  const slug = member.frat_name?.toLowerCase().replace(/\s+/g,'-').replace('big-brother-','') || '';
  const portrait = `/brothers/${slug}.png`;

  return (
    <div className="dash-app">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-logo">
          <img src="/logo.png" alt="KΘΦ II" />
          <span className="dash-sidebar-logo-text">KΘΦ II</span>
        </div>
        <div className="dash-sidebar-member">
          <div className="dash-sidebar-portrait"><img src={portrait} alt="" onError={(e:any)=>e.target.src='/logo.png'}/></div>
          <div className="dash-sidebar-name">{member.frat_name}</div>
          <div className="dash-sidebar-role">{member.role}</div>
        </div>
        <nav className="dash-nav">
          {NAV.map(n => <a key={n.href} href={n.href} className={`dash-nav-item ${n.href==='/dashboard/gallery'?'active':''}`}><span>{n.label}</span></a>)}
          {(member?.fraction === 'Ishi No Fraction' || member?.frat_name === 'Big Brother Substance') && (
            <a href="/dashboard/dues-report" className="dash-nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              <span>Dues Report</span>
            </a>
          )}
          <div className="dash-nav-divider"/>
          <a href="/" className="dash-nav-item"><span>Back to Site</span></a>
            <button onClick={async()=>{await fetch('/api/logout',{method:'POST'});window.location.href='/login';}} className="dash-nav-item" style={{width:'100%',textAlign:'left',background:'none',border:'none',cursor:'pointer',color:'#e05070',fontFamily:'inherit'}}><span>Sign Out</span></button>
        </nav>
      </aside>
      <main className="dash-main">
        <div className="page-wrap" style={{ maxWidth: '100%' }}>
          <div className="page-title" style={{ marginBottom: '1rem' }}>
            My Private Gallery
            <span style={{ fontSize: '0.65rem', color: 'rgba(240,232,208,0.3)', letterSpacing: '1px' }}>Only visible to you</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.2rem' }}>
            <input className="field-input" style={{ flex: 1 }} value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption (optional)..." />
          </div>
          <div className="gallery-grid">
            <div className="gallery-upload-tile" onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept="image/*,video/mp4" style={{ display: 'none' }} onChange={upload} />
              <div className="gallery-upload-icon">{uploading ? '⏳' : '+'}</div>
              <span>{uploading ? 'Uploading...' : 'Add Photo / Video'}</span>
            </div>
            {items.map(item => (
              <div key={item.id} className="gallery-tile" onClick={() => item.file_type === 'image' && setLightbox(item.file_url)}>
                {item.file_type === 'video'
                  ? <video src={item.file_url} />
                  : <img src={item.file_url} alt={item.caption || ''} />}
                {item.caption && <div className="gallery-tile-cap">{item.caption}</div>}
              </div>
            ))}
          </div>
          {items.length === 0 && !uploading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(240,232,208,0.25)', fontSize: '0.85rem' }}>
              Your private gallery is empty. Upload your first photo above.
            </div>
          )}
        </div>
      </main>
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="full size" />
          <div className="lightbox-close">✕</div>
        </div>
      )}
    </div>
  );
}
