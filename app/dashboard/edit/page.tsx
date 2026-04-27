'use client';
import { useState, useEffect } from 'react';
import '../dash.css';

const SOCIALS = ['Instagram','Twitter/X','TikTok','YouTube','Discord','Second Life'];
const NAV = [
  { href: '/dashboard', label: 'Home' },
  { href: '/dashboard/news', label: 'Wokou News' },
  { href: '/dashboard/events', label: 'Events' },
  { href: '/dashboard/phire', label: 'PHIRE' },
  { href: '/dashboard/discipline', label: 'Discipline' },
  { href: '/dashboard/gallery', label: 'My Gallery' },
  { href: '/dashboard/edit', label: 'Edit Profile' },
];

export default function EditPage() {
  const [member, setMember] = useState<any>(null);
  const [profile, setProfile] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<string|null>(null);
  const [previews, setPreviews] = useState<any>({});

  useEffect(() => {
    fetch('/api/dashboard/profile').then(r => r.json()).then(d => {
      if (d.error) { window.location.href = '/login'; return; }
      setMember(d.member);
      setProfile(d.profile || { social_links: {} });
    });
  }, []);

  function update(k: string, v: any) { setProfile((p:any) => ({ ...p, [k]: v })); }
  function updateSocial(k: string, v: string) { setProfile((p:any) => ({ ...p, social_links: { ...(p.social_links||{}), [k]: v } })); }

  async function save() {
    setSaving(true);
    await fetch('/api/dashboard/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function uploadFile(e: any, type: string) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(type);
    setPreviews((p:any) => ({ ...p, [type]: URL.createObjectURL(file) }));
    const fd = new FormData();
    fd.append('file', file); fd.append('type', type);
    const res = await fetch('/api/dashboard/upload', { method: 'POST', body: fd }).then(r => r.json());
    if (res.file_url) update(`${type}_url`, res.file_url);
    setUploading(null);
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
          {NAV.map(n => <a key={n.href} href={n.href} className={`dash-nav-item ${n.href==='/dashboard/edit'?'active':''}`}><span>{n.label}</span></a>)}
          <div className="dash-nav-divider"/>
          <a href="/" className="dash-nav-item"><span>Back to Site</span></a>
        </nav>
      </aside>
      <main className="dash-main">
        <div className="edit-wrap">
          <div className="page-title" style={{ marginBottom: '2rem' }}>Edit Profile</div>

          <div className="edit-section">
            <div className="edit-section-title">Photos</div>
            <div className="field-group">
              <label className="field-label">Portrait</label>
              <label className="upload-zone">
                <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => uploadFile(e,'portrait')} />
                <div className="upload-zone-icon">↑</div>
                <div>{uploading==='portrait' ? 'Uploading...' : 'Click to upload portrait'}</div>
                {(previews.portrait||profile.portrait_url) && <img src={previews.portrait||profile.portrait_url} className="upload-thumb-portrait" alt="portrait" />}
                <div className="upload-hint">Square image recommended</div>
              </label>
            </div>
            <div className="field-group">
              <label className="field-label">Banner</label>
              <label className="upload-zone">
                <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => uploadFile(e,'banner')} />
                <div className="upload-zone-icon">↑</div>
                <div>{uploading==='banner' ? 'Uploading...' : 'Click to upload banner'}</div>
                {(previews.banner||profile.banner_url) && <img src={previews.banner||profile.banner_url} className="upload-thumb" alt="banner" />}
                <div className="upload-hint">Wide/landscape image works best</div>
              </label>
            </div>
          </div>

          <div className="edit-section">
            <div className="edit-section-title">About You</div>
            <div className="field-group">
              <label className="field-label">Bio</label>
              <textarea className="field-textarea" value={profile.bio||''} onChange={e => update('bio',e.target.value)} placeholder="Tell your brothers about yourself..." />
            </div>
            <div className="field-group">
              <label className="field-label">Favourite Quote</label>
              <input className="field-input" value={profile.favourite_quote||''} onChange={e => update('favourite_quote',e.target.value)} placeholder="A quote or motto that defines you..." />
            </div>
            <div className="field-group">
              <label className="field-label">Hobbies & Interests</label>
              <textarea className="field-textarea" style={{ minHeight:'80px' }} value={profile.hobbies||''} onChange={e => update('hobbies',e.target.value)} placeholder="What do you do outside the frat?" />
            </div>
          </div>

          <div className="edit-section">
            <div className="edit-section-title">Social Links</div>
            {SOCIALS.map(s => (
              <div key={s} className="social-row">
                <span className="social-platform">{s}</span>
                <input className="field-input" style={{ flex:1 }} value={(profile.social_links||{})[s]||''} onChange={e => updateSocial(s,e.target.value)} placeholder={`${s} URL or handle`} />
              </div>
            ))}
          </div>

          <div className="save-bar">
            <button className="btn btn-gold" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            {saved && <span className="save-ok">✓ Saved</span>}
            <a href="/dashboard" className="btn btn-ghost">Cancel</a>
          </div>
        </div>
      </main>
    </div>
  );
}
