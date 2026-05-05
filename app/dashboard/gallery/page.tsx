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
  const [member, setMember]       = useState<any>(null);
  const [items, setItems]         = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [lightbox, setLightbox]   = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // Upload form state
  const [caption, setCaption]       = useState('');
  const [tabMode, setTabMode]       = useState<'existing' | 'new'>('existing');
  const [selectedTab, setSelectedTab] = useState('General');
  const [newTabName, setNewTabName] = useState('');
  const [filePreview, setFilePreview] = useState('');
  const [fileObj, setFileObj]       = useState<File | null>(null);
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

  // All unique tabs from existing items
  const tabs = ['All', ...Array.from(new Set(items.map((i: any) => i.tab || 'General')))];
  const filtered = activeTab === 'All' ? items : items.filter((i: any) => (i.tab || 'General') === activeTab);

  function onFileChange(e: any) {
    const file = e.target.files[0];
    if (!file) return;
    setFileObj(file);
    setFilePreview(URL.createObjectURL(file));
  }

  async function upload() {
    if (!fileObj) return;
    const tab = tabMode === 'new' ? newTabName.trim() || 'General' : selectedTab;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', fileObj);
    fd.append('caption', caption);
    fd.append('tab', tab);
    await fetch('/api/dashboard/private-gallery', { method: 'POST', body: fd });
    setCaption('');
    setNewTabName('');
    setFileObj(null);
    setFilePreview('');
    setShowUpload(false);
    await loadGallery();
    setUploading(false);
  }

  async function deleteItem(id: string, fileUrl: string) {
    if (!confirm('Delete this photo? This cannot be undone.')) return;
    setDeleting(id);
    await fetch('/api/dashboard/private-gallery', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, file_url: fileUrl })
    });
    setDeleting(null);
    if (lightbox?.id === id) setLightbox(null);
    await loadGallery();
  }

  if (!member) return <div className="dash-loading">LOADING...</div>;
  const slug = member.frat_name?.toLowerCase().replace(/\s+/g, '-').replace('big-brother-', '') || '';

  return (
    <div className="dash-app">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-logo"><img src="/logo.png" alt="KΘΦ II" /><span className="dash-sidebar-logo-text">KΘΦ II</span></div>
        <div className="dash-sidebar-member">
          <div className="dash-sidebar-portrait"><img src={`/brothers/${slug}.png`} alt="" onError={(e: any) => e.target.src = '/logo.png'} /></div>
          <div className="dash-sidebar-name">{member.frat_name}</div>
          <div className="dash-sidebar-role">{member.role}</div>
          {member.fraction && <div className="dash-sidebar-fraction">{member.fraction}</div>}
        </div>
        <nav className="dash-nav">
          {NAV.map(n => <a key={n.href} href={n.href} className={`dash-nav-item ${n.href === '/dashboard/gallery' ? 'active' : ''}`}><span>{n.label}</span></a>)}
          {(member?.fraction === 'Ishi No Fraction' || member?.frat_name === 'Big Brother Substance') && (
            <a href="/dashboard/dues-report" className="dash-nav-item"><span>Dues Report</span></a>
          )}
          {(member?.fraction === 'Ishi No Fraction' || member?.role === 'Head Founder' || member?.role === 'Co-Founder') && (
            <a href="/dashboard/ssp/report" className="dash-nav-item"><span>SSP Report</span></a>
          )}
          <div className="dash-nav-divider" />
          <a href="/" className="dash-nav-item"><span>Back to Site</span></a>
          <button onClick={async () => { await fetch('/api/logout', { method: 'POST' }); window.location.href = '/login'; }} className="dash-nav-item" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: '#e05070', fontFamily: 'inherit' }}><span>Sign Out</span></button>
        </nav>
      </aside>

      <main className="dash-main" style={{ padding: '1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.8rem', letterSpacing: '4px', color: 'var(--bone)' }}>My Gallery</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>{items.length} photo{items.length !== 1 ? 's' : ''}</div>
          </div>
          <button onClick={() => setShowUpload(true)}
            style={{ background: 'rgba(198,147,10,0.1)', border: '1px solid rgba(198,147,10,0.3)', color: 'var(--gold)', borderRadius: '8px', padding: '8px 18px', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer' }}>
            + Add Photo
          </button>
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ padding: '5px 14px', borderRadius: '20px', border: '1px solid', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase',
                  background: activeTab === t ? 'rgba(198,147,10,0.15)' : 'var(--surface)',
                  borderColor: activeTab === t ? 'rgba(198,147,10,0.4)' : 'var(--border)',
                  color: activeTab === t ? 'var(--gold)' : 'var(--muted)' }}>
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
            No photos yet. {activeTab !== 'All' ? `Nothing in "${activeTab}" tab.` : 'Click + Add Photo to get started.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
            {filtered.map((item: any) => (
              <div key={item.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={() => setLightbox(item)}>
                {item.file_type === 'video' ? (
                  <video src={item.file_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={item.file_url} alt={item.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {/* Delete button */}
                <button onClick={(e) => { e.stopPropagation(); deleteItem(item.id, item.file_url); }}
                  disabled={deleting === item.id}
                  style={{ position: 'absolute', top: '6px', right: '6px', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(224,80,112,0.4)', color: '#e05070', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                  {deleting === item.id ? '⏳' : '✕'}
                </button>
                {/* Tab badge */}
                {item.tab && item.tab !== 'General' && (
                  <div style={{ position: 'absolute', bottom: '4px', left: '4px', fontSize: '0.55rem', letterSpacing: '1px', background: 'rgba(0,0,0,0.7)', color: 'var(--gold)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {item.tab}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem', width: '100%', maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.4rem', letterSpacing: '3px', color: 'var(--bone)' }}>Add Photo</div>
              <button onClick={() => { setShowUpload(false); setFileObj(null); setFilePreview(''); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            {/* File picker */}
            <div onClick={() => fileRef.current?.click()}
              style={{ border: '2px dashed var(--border)', borderRadius: '10px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', marginBottom: '1rem', background: 'var(--raised)', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <input ref={fileRef} type="file" accept="image/*,video/mp4" style={{ display: 'none' }} onChange={onFileChange} />
              {filePreview ? (
                <img src={filePreview} alt="preview" style={{ maxHeight: '150px', borderRadius: '6px', objectFit: 'cover' }} />
              ) : (
                <>
                  <div style={{ fontSize: '2rem', marginBottom: '6px' }}>📷</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Click to choose a photo or video</div>
                </>
              )}
            </div>

            {/* Caption */}
            <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption (optional)"
              style={{ width: '100%', background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.6rem 0.8rem', color: 'var(--bone)', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', marginBottom: '1rem', boxSizing: 'border-box' }} />

            {/* Tab selection */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.6rem', letterSpacing: '3px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Album / Tab</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '0.7rem' }}>
                <button onClick={() => setTabMode('existing')}
                  style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    background: tabMode === 'existing' ? 'rgba(198,147,10,0.15)' : 'var(--raised)',
                    borderColor: tabMode === 'existing' ? 'rgba(198,147,10,0.4)' : 'var(--border)',
                    color: tabMode === 'existing' ? 'var(--gold)' : 'var(--muted)' }}>
                  Existing Tab
                </button>
                <button onClick={() => setTabMode('new')}
                  style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    background: tabMode === 'new' ? 'rgba(198,147,10,0.15)' : 'var(--raised)',
                    borderColor: tabMode === 'new' ? 'rgba(198,147,10,0.4)' : 'var(--border)',
                    color: tabMode === 'new' ? 'var(--gold)' : 'var(--muted)' }}>
                  + New Tab
                </button>
              </div>

              {tabMode === 'existing' ? (
                <select value={selectedTab} onChange={e => setSelectedTab(e.target.value)}
                  style={{ width: '100%', background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.6rem 0.8rem', color: 'var(--bone)', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', boxSizing: 'border-box' }}>
                  {tabs.filter(t => t !== 'All').map(t => <option key={t} value={t}>{t}</option>)}
                  {tabs.filter(t => t !== 'All').length === 0 && <option value="General">General</option>}
                </select>
              ) : (
                <input value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder="New tab name e.g. Birdies For BIFIDA"
                  style={{ width: '100%', background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.6rem 0.8rem', color: 'var(--bone)', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', boxSizing: 'border-box' }} />
              )}
            </div>

            <button onClick={upload} disabled={!fileObj || uploading}
              style={{ width: '100%', background: fileObj ? 'var(--gold)' : 'var(--raised)', color: fileObj ? '#000' : 'var(--muted)', border: 'none', borderRadius: '8px', padding: '0.8rem', fontFamily: "'Bebas Neue', cursive", fontSize: '1rem', letterSpacing: '2px', cursor: fileObj ? 'pointer' : 'not-allowed' }}>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          onClick={() => setLightbox(null)}>
          {lightbox.file_type === 'video' ? (
            <video src={lightbox.file_url} controls style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: '8px' }} onClick={e => e.stopPropagation()} />
          ) : (
            <img src={lightbox.file_url} alt={lightbox.caption || ''} style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: '8px', objectFit: 'contain' }} />
          )}
          {lightbox.caption && <div style={{ color: 'rgba(240,232,208,0.6)', marginTop: '12px', fontSize: '0.85rem' }}>{lightbox.caption}</div>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button onClick={e => { e.stopPropagation(); setLightbox(null); }}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '6px', padding: '6px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem' }}>
              Close
            </button>
            <button onClick={e => { e.stopPropagation(); deleteItem(lightbox.id, lightbox.file_url); }}
              style={{ background: 'rgba(224,80,112,0.15)', border: '1px solid rgba(224,80,112,0.3)', color: '#e05070', borderRadius: '6px', padding: '6px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem' }}>
              Delete Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
