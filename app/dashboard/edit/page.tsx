'use client';
import { useState, useEffect } from 'react';
import '../dashboard.css';

const ACCENT_COLOURS = [
  { hex: '#c6930a', label: 'Gold' },
  { hex: '#b22234', label: 'Crimson' },
  { hex: '#1a3a6b', label: 'Navy' },
  { hex: '#2d6a4f', label: 'Jade' },
  { hex: '#6b21a8', label: 'Violet' },
  { hex: '#c2410c', label: 'Ember' },
];

const SOCIAL_FIELDS = ['Instagram', 'Twitter/X', 'TikTok', 'YouTube', 'Discord', 'Second Life'];

export default function EditProfile() {
  const [member, setMember] = useState<any>(null);
  const [profile, setProfile] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [previews, setPreviews] = useState<any>({});

  useEffect(() => {
    fetch('/api/dashboard/profile')
      .then(r => r.json())
      .then(d => {
        if (d.error) { window.location.href = '/login'; return; }
        setMember(d.member);
        setProfile(d.profile || { accent_colour: '#c6930a', social_links: {} });
      });
  }, []);

  function update(key: string, val: any) {
    setProfile((p: any) => ({ ...p, [key]: val }));
  }
  function updateSocial(key: string, val: string) {
    setProfile((p: any) => ({ ...p, social_links: { ...(p.social_links || {}), [key]: val } }));
  }

  async function save() {
    setSaving(true);
    await fetch('/api/dashboard/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function uploadFile(e: any, type: 'banner' | 'background' | 'portrait') {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(type);
    setPreviews((p: any) => ({ ...p, [type]: URL.createObjectURL(file) }));
    const fd = new FormData();
    fd.append('file', file); fd.append('type', type);
    const res = await fetch('/api/dashboard/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.file_url) update(`${type}_url`, data.file_url);
    setUploading(null);
  }

  if (!member) return (
    <div style={{ minHeight: '100vh', background: '#050810', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c6930a', fontFamily: 'Rajdhani,sans-serif', fontSize: '0.7rem', letterSpacing: '6px' }}>LOADING...</div>
  );

  const accent = profile.accent_colour || '#c6930a';

  return (
    <div className="dash-root">
      <nav className="dash-nav">
        <div className="dash-nav-brand">KΘΦ II</div>
        <div className="dash-nav-links">
          <a href="/dashboard">← Dashboard</a>
          <a href="/dashboard/news">Wokou News</a>
          <a href="/dashboard/gallery">My Gallery</a>
        </div>
      </nav>

      <div className="dash-edit-wrap">
        <div className="dash-edit-title">Edit Your Profile</div>

        {/* Portrait */}
        <div className="dash-field-group">
          <label className="dash-label">Portrait Photo</label>
          <label className="upload-zone">
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => uploadFile(e, 'portrait')} />
            {uploading === 'portrait' ? '⏳ Uploading...' : '📷 Click to upload portrait'}
            {(previews.portrait || profile.portrait_url) && (
              <img src={previews.portrait || profile.portrait_url} className="upload-preview-portrait" alt="portrait" />
            )}
            <div style={{ fontSize: '0.7rem', color: 'rgba(240,232,208,0.3)', marginTop: '6px' }}>Square image works best</div>
          </label>
        </div>

        {/* Banner */}
        <div className="dash-field-group">
          <label className="dash-label">Banner Image (hero background)</label>
          <label className="upload-zone">
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => uploadFile(e, 'banner')} />
            {uploading === 'banner' ? '⏳ Uploading...' : '🖼 Click to upload banner'}
            {(previews.banner || profile.banner_url) && (
              <img src={previews.banner || profile.banner_url} className="upload-preview" alt="banner" />
            )}
            <div style={{ fontSize: '0.7rem', color: 'rgba(240,232,208,0.3)', marginTop: '6px' }}>Wide/landscape image recommended</div>
          </label>
        </div>

        {/* Background */}
        <div className="dash-field-group">
          <label className="dash-label">Page Background</label>
          <label className="upload-zone">
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => uploadFile(e, 'background')} />
            {uploading === 'background' ? '⏳ Uploading...' : '🌄 Click to upload background'}
            {(previews.background || profile.background_url) && (
              <img src={previews.background || profile.background_url} className="upload-preview" alt="background" />
            )}
            <div style={{ fontSize: '0.7rem', color: 'rgba(240,232,208,0.3)', marginTop: '6px' }}>Shows as a subtle fixed background behind everything</div>
          </label>
        </div>

        {/* Accent colour */}
        <div className="dash-field-group">
          <label className="dash-label">Accent Colour</label>
          <div className="colour-picker">
            {ACCENT_COLOURS.map(c => (
              <div key={c.hex} className={`colour-swatch ${profile.accent_colour === c.hex ? 'active' : ''}`}
                style={{ background: c.hex }} title={c.label}
                onClick={() => update('accent_colour', c.hex)} />
            ))}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(240,232,208,0.3)', marginTop: '8px' }}>
            Changes your name, badges and accents across your dashboard
          </div>
        </div>

        {/* Bio */}
        <div className="dash-field-group">
          <label className="dash-label">Bio</label>
          <textarea className="dash-textarea" value={profile.bio || ''}
            onChange={e => update('bio', e.target.value)}
            placeholder="Tell your brothers about yourself..." />
        </div>

        {/* Quote */}
        <div className="dash-field-group">
          <label className="dash-label">Favourite Quote</label>
          <input className="dash-input" value={profile.favourite_quote || ''}
            onChange={e => update('favourite_quote', e.target.value)}
            placeholder="A quote or motto that defines you..." />
        </div>

        {/* Hobbies */}
        <div className="dash-field-group">
          <label className="dash-label">Hobbies & Interests</label>
          <textarea className="dash-textarea" value={profile.hobbies || ''}
            onChange={e => update('hobbies', e.target.value)}
            placeholder="What do you get into outside the frat?"
            style={{ minHeight: '80px' }} />
        </div>

        {/* Social Links */}
        <div className="dash-field-group">
          <label className="dash-label">Social Links</label>
          {SOCIAL_FIELDS.map(field => (
            <div key={field} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ width: '90px', fontSize: '0.75rem', color: 'rgba(240,232,208,0.4)', flexShrink: 0 }}>{field}</span>
              <input className="dash-input" style={{ flex: 1 }}
                value={(profile.social_links || {})[field] || ''}
                onChange={e => updateSocial(field, e.target.value)}
                placeholder={`Your ${field} URL or handle`} />
            </div>
          ))}
        </div>

        {/* Save */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingBottom: '4rem' }}>
          <button className="dash-btn dash-btn-gold" onClick={save} disabled={saving} style={{ background: accent, borderColor: accent }}>
            {saving ? '⏳ Saving...' : '💾 Save Profile'}
          </button>
          {saved && <span style={{ color: '#4ade80', fontSize: '0.8rem', letterSpacing: '1px' }}>✓ Saved</span>}
          <a href="/dashboard" className="dash-btn dash-btn-outline" style={{ color: accent, borderColor: `${accent}40` }}>Cancel</a>
        </div>
      </div>
    </div>
  );
}
