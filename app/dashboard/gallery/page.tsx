'use client';
import { useState, useEffect, useRef } from 'react';
import '../dash.css';
import DashSidebar from '../DashSidebar';

export default function GalleryPage() {
  const [member, setMember]       = useState<any>(null);
  const [profile, setProfile]     = useState<any>(null);
  const [items, setItems]         = useState<any[]>([]);
  const [activeAlbum, setActiveAlbum] = useState('All Photos');
  const [selected, setSelected]   = useState<any>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption]     = useState('');
  const [tabMode, setTabMode]     = useState<'existing'|'new'>('existing');
  const [selectedTab, setSelectedTab] = useState('General');
  const [newTabName, setNewTabName]   = useState('');
  const [filePreview, setFilePreview] = useState('');
  const [fileObj, setFileObj]     = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/dashboard/profile').then(r => r.json()).then(d => {
      if (d.error) { window.location.href = '/login'; return; }
      setMember(d.member); setProfile(d.profile);
    });
    loadGallery();
  }, []);

  async function loadGallery() {
    const d = await fetch('/api/dashboard/private-gallery').then(r => r.json());
    setItems(d.items || []);
  }

  const albums = ['All Photos', ...Array.from(new Set(items.map((i: any) => i.tab || 'General'))) as string[]];
  const filtered = activeAlbum === 'All Photos' ? items : items.filter((i: any) => (i.tab || 'General') === activeAlbum);

  function selectItem(item: any, idx: number) { setSelected(item); setSelectedIdx(idx); }
  function prev() {
    const ni = (selectedIdx - 1 + filtered.length) % filtered.length;
    setSelected(filtered[ni]); setSelectedIdx(ni);
  }
  function next() {
    const ni = (selectedIdx + 1) % filtered.length;
    setSelected(filtered[ni]); setSelectedIdx(ni);
  }

  function onFileChange(e: any) {
    const file = e.target.files[0];
    if (!file) return;
    setFileObj(file);
    setFilePreview(URL.createObjectURL(file));
  }


  async function compressImage(file: File, maxPx = 1200): Promise<File> {
    if (file.type === 'video/mp4') return file; // don't compress video
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        canvas.toBlob(blob => resolve(new File([blob!], 'photo.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.85);
      };
      img.src = url;
    });
  }

  async function upload() {
    if (!fileObj) return;
    const tab = tabMode === 'new' ? newTabName.trim() || 'General' : selectedTab;
    setUploading(true);
    try {
      const compressed = await compressImage(fileObj);
      const fd = new FormData();
      fd.append('file', compressed);
      fd.append('caption', caption);
      fd.append('tab', tab);
      const raw = await fetch('/api/dashboard/private-gallery', { method: 'POST', body: fd });
      const res = await raw.json();
      if (!raw.ok || res.error) {
        alert('Upload failed: ' + (res.error || raw.status));
        setUploading(false); return;
      }
      setCaption(''); setNewTabName(''); setFileObj(null); setFilePreview('');
      setShowUpload(false);
      await loadGallery();
    } catch(err: any) {
      alert('Upload error: ' + err.message);
    }
    setUploading(false);
  }

  async function deleteItem(id: string, fileUrl: string) {
    if (!confirm('Delete this photo? This cannot be undone.')) return;
    await fetch('/api/dashboard/private-gallery', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, file_url: fileUrl }),
    });
    if (selected?.id === id) setSelected(filtered[0] || null);
    await loadGallery();
  }

  if (!member) return <div className="dash-loading">LOADING...</div>;

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />
      <main className="dash-main">
        <div className="dash-page-header">
          <div className="dash-page-title">My Gallery</div>
          <button className="dash-btn gold-ghost" onClick={() => setShowUpload(v => !v)}>
            {showUpload ? '✕ Cancel' : '+ Upload Photo'}
          </button>
        </div>

        {/* Upload form */}
        {showUpload && (
          <div className="dash-hero-card" style={{ margin: '1rem 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            <span className="dash-corner tl" /><span className="dash-corner br" />
            <div className="dash-clbl">Upload Photo</div>
            <label className="dash-upload-zone" style={{ cursor: 'pointer' }}>
              <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={onFileChange} />
              {filePreview
                ? <img src={filePreview} style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain', borderRadius: '2px' }} alt="preview" />
                : <><div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(198,147,10,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(198,147,10,.5)', fontSize: '.85rem' }}>↑</div>
                   <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.38rem', letterSpacing: '2px', color: 'rgba(198,147,10,.4)' }}>Click to choose file</span></>
              }
            </label>
            <div><label className="dash-field-label">Caption</label><input className="dash-input" value={caption} onChange={e => setCaption(e.target.value)} placeholder="Optional caption..." /></div>
            <div>
              <label className="dash-field-label">Album</label>
              <div style={{ display: 'flex', gap: '.4rem', marginBottom: '.4rem' }}>
                <button className={`dash-itab${tabMode === 'existing' ? ' active' : ''}`} onClick={() => setTabMode('existing')}>Existing</button>
                <button className={`dash-itab${tabMode === 'new' ? ' active' : ''}`} onClick={() => setTabMode('new')}>New Album</button>
              </div>
              {tabMode === 'existing'
                ? <select className="dash-select" value={selectedTab} onChange={e => setSelectedTab(e.target.value)}>
                    {['General', ...albums.slice(1)].map(a => <option key={a}>{a}</option>)}
                  </select>
                : <input className="dash-input" value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder="New album name..." />
              }
            </div>
            <button className="dash-btn gold-solid" onClick={upload} disabled={uploading || !fileObj}>{uploading ? 'Uploading...' : 'Upload'}</button>
          </div>
        )}

        {/* Three-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 190px', flex: 1, minHeight: showUpload ? '300px' : 'calc(100vh - 60px)' }}>

          {/* LEFT: Albums */}
          <div style={{ borderRight: '1px solid var(--border)', background: 'rgba(4,6,15,.5)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '.65rem .8rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div className="dash-clbl" style={{ margin: 0 }}>Albums</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '.5rem .55rem', gap: '1px' }}>
              {albums.map(album => {
                const count = album === 'All Photos' ? items.length : items.filter((i: any) => (i.tab || 'General') === album).length;
                return (
                  <div
                    key={album}
                    onClick={() => { setActiveAlbum(album); setSelected(null); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '.48rem .65rem', borderRadius: '3px', cursor: 'pointer',
                      border: `1px solid ${activeAlbum === album ? 'rgba(198,147,10,.28)' : 'transparent'}`,
                      background: activeAlbum === album ? 'rgba(198,147,10,.1)' : 'none',
                      position: 'relative', transition: 'all .15s',
                    }}
                  >
                    {activeAlbum === album && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', background: 'linear-gradient(to bottom,var(--gold-b),var(--gold))', borderRadius: '1px' }} />}
                    <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.4rem', letterSpacing: '2px', color: activeAlbum === album ? 'var(--gold)' : 'var(--bone-faint)' }}>{album}</span>
                    <span style={{ fontFamily: 'var(--display)', fontSize: '.82rem', color: activeAlbum === album ? 'var(--gold-b)' : 'var(--bone-faint)' }}>{count}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: '.6rem .8rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--cinzel)', fontSize: '.33rem', letterSpacing: '2px', color: 'var(--bone-faint)', lineHeight: 1.6 }}>{items.length} photos<br />Private gallery</div>
            </div>
          </div>

          {/* CENTRE: Lightbox preview */}
          <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'rgba(4,6,15,.3)' }}>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--deep)', overflow: 'hidden', minHeight: '300px' }}>
              {selected ? (
                <>
                  <img src={selected.file_url} alt={selected.caption || ''} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  <span style={{ position: 'absolute', top: '8px', left: '8px', width: '10px', height: '10px', borderTop: '1px solid rgba(198,147,10,.6)', borderLeft: '1px solid rgba(198,147,10,.6)' }} />
                  <span style={{ position: 'absolute', top: '8px', right: '8px', width: '10px', height: '10px', borderTop: '1px solid rgba(198,147,10,.6)', borderRight: '1px solid rgba(198,147,10,.6)' }} />
                  <span style={{ position: 'absolute', bottom: '8px', left: '8px', width: '10px', height: '10px', borderBottom: '1px solid rgba(198,147,10,.6)', borderLeft: '1px solid rgba(198,147,10,.6)' }} />
                  <span style={{ position: 'absolute', bottom: '8px', right: '8px', width: '10px', height: '10px', borderBottom: '1px solid rgba(198,147,10,.6)', borderRight: '1px solid rgba(198,147,10,.6)' }} />
                  {selected.caption && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '.7rem 1rem', background: 'linear-gradient(transparent,rgba(0,0,0,.8))', zIndex: 2 }}>
                      <div style={{ fontFamily: 'var(--display)', fontSize: '.95rem', letterSpacing: '2px', color: 'var(--bone)' }}>{selected.caption}</div>
                      <div style={{ fontFamily: 'var(--cinzel)', fontSize: '.38rem', letterSpacing: '2px', color: 'rgba(198,147,10,.65)', marginTop: '.2rem' }}>{selected.tab || 'General'}</div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontFamily: 'var(--cinzel)', fontSize: '.48rem', letterSpacing: '4px', color: 'var(--bone-faint)', textAlign: 'center' }}>
                  {filtered.length === 0 ? 'No photos in this album' : 'Select a photo →'}
                </div>
              )}
            </div>
            {/* Nav bar */}
            <div style={{ height: '44px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 .9rem', flexShrink: 0, background: 'rgba(4,6,15,.6)' }}>
              <button className="dash-btn ghost" style={{ padding: '.26rem .55rem', fontSize: '.7rem' }} onClick={prev} disabled={!selected}>‹</button>
              <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.38rem', letterSpacing: '3px', color: 'var(--bone-faint)' }}>
                {selected ? `${selectedIdx + 1} / ${filtered.length}` : `${filtered.length} photos`}
              </span>
              <div style={{ display: 'flex', gap: '.4rem' }}>
                {selected && (
                  <button className="dash-btn danger" style={{ padding: '.26rem .55rem', fontSize: '.36rem' }} onClick={() => deleteItem(selected.id, selected.file_url)}>Delete</button>
                )}
                <button className="dash-btn ghost" style={{ padding: '.26rem .55rem', fontSize: '.7rem' }} onClick={next} disabled={!selected}>›</button>
              </div>
            </div>
          </div>

          {/* RIGHT: Thumbnail strip */}
          <div style={{ background: 'rgba(4,6,15,.4)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '.65rem .7rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.38rem', letterSpacing: '3px', color: 'rgba(198,147,10,.4)', textTransform: 'uppercase' }}>{activeAlbum}</span>
              <span style={{ fontFamily: 'var(--display)', fontSize: '.78rem', color: 'var(--bone-faint)' }}>{filtered.length}</span>
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', padding: '.5rem .55rem', alignContent: 'start', overflowY: 'auto' }}>
              {filtered.map((item: any, i: number) => (
                <div
                  key={item.id}
                  onClick={() => selectItem(item, i)}
                  style={{
                    aspectRatio: '1', overflow: 'hidden', cursor: 'pointer', borderRadius: '2px',
                    border: selected?.id === item.id ? '1px solid var(--gold)' : '1px solid transparent',
                    boxShadow: selected?.id === item.id ? '0 0 0 1px rgba(198,147,10,.3)' : 'none',
                    transition: 'all .15s', position: 'relative',
                  }}
                >
                  <img src={item.file_url} alt={item.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
              {/* Upload tile */}
              <div
                onClick={() => setShowUpload(true)}
                style={{
                  aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px',
                  border: '1px dashed rgba(198,147,10,.18)', borderRadius: '2px', cursor: 'pointer', transition: 'all .15s',
                }}
                onMouseEnter={e => { (e.currentTarget as any).style.borderColor = 'var(--gold)'; }}
                onMouseLeave={e => { (e.currentTarget as any).style.borderColor = 'rgba(198,147,10,.18)'; }}
              >
                <span style={{ fontSize: '.9rem', color: 'rgba(198,147,10,.35)' }}>+</span>
                <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.3rem', letterSpacing: '1px', color: 'rgba(198,147,10,.3)' }}>Upload</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
