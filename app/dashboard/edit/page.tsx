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

const LAYOUT_OPTIONS = [
  { id: 1, icon: '⊙', name: 'Centered' },
  { id: 2, icon: '⊞', name: 'Split' },
  { id: 3, icon: '⊟', name: 'Banner Hero' },
  { id: 4, icon: '⊠', name: 'Card Grid' },
  { id: 5, icon: '巻', name: 'Samurai Scroll' },
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
        setProfile(d.profile || { layout_preference: 1, accent_colour: '#c6930a', social_links: {} });
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
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function uploadFile(e: any, type: 'banner' | 'background' | 'portrait') {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(type);
    const previewUrl = URL.createObjectURL(file);
    setPreviews((p: any) => ({ ...p, [type]: previewUrl }));
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    const res = await fetch('/api/dashboard/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.file_url) update(`${type}_url`, data.file_url);
    setUploading(null);
  }

  if (!member) return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c6930a', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '3px' }}>LOADING...</div>
  );

  return (
    <div className="dash-root" style={{ minHeight: '100vh' }}>
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

        {/* Layout Picker */}
        <div className="dash-field-group">
          <label className="dash-label">Choose Layout</label>
          <div className="layout-picker">
            {LAYOUT_OPTIONS.map(l => (
              <div key={l.id} className={`layout-option ${profile.layout_preference === l.id ? 'active' : ''}`}
                   onClick={() => update('layout_preference', l.id)}>
                <div className="layout-option-icon">{l.icon}</div>
                <div className="layout-option-name">{l.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Accent Colour */}
        <div className="dash-field-group">
          <label className="dash-label">Accent Colour</label>
          <div className="colour-picker">
            {ACCENT_COLOURS.map(c => (
              <div key={c.hex} className={`colour-swatch ${profile.accent_colour === c.hex ? 'active' : ''}`}
                   style={{ background: c.hex }} title={c.label}
                   onClick={() => update('accent_colour', c.hex)} />
            ))}
          </div>
        </div>

        {/* Portrait Upload */}
        <div className="dash-field-group">
          <label className="dash-label">Profile Portrait</label>
          <label className="upload-zone">
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => uploadFile(e, 'portrait')} />
            {uploading === 'portrait' ? '⏳ Uploading...' : '📷 Click to upload portrait'}
            {(previews.portrait || profile.portrait_url) && (
              <img src={previews.portrait || profile.portrait_url} alt="portrait preview" className="upload-preview" style={{ borderRadius: '50%', width: '100px', height: '100px', objectFit: 'cover', margin: '0.8rem auto 0', display: 'block' }} />
            )}
            <div className="upload-zone-label">JPG, PNG, WebP · Square image recommended</div>
          </label>
        </div>

        {/* Banner Upload */}
        <div className="dash-field-group">
          <label className="dash-label">Banner Image</label>
          <label className="upload-zone">
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => uploadFile(e, 'banner')} />
            {uploading === 'banner' ? '⏳ Uploading...' : '🖼 Click to upload banner'}
            {(previews.banner || profile.banner_url) && (
              <img src={previews.banner || profile.banner_url} alt="banner preview" className="upload-preview" style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
            )}
            <div className="upload-zone-label">Wide image recommended · JPG, PNG, WebP</div>
          </label>
        </div>

        {/* Background Upload */}
        <div className="dash-field-group">
          <label className="dash-label">Page Background Image</label>
          <label className="upload-zone">
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => uploadFile(e, 'background')} />
            {uploading === 'background' ? '⏳ Uploading...' : '🌄 Click to upload background'}
            {(previews.background || profile.background_url) && (
              <img src={previews.background || profile.background_url} alt="bg preview" className="upload-preview" style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
            )}
            <div className="upload-zone-label">This shows as a subtle background across your dashboard</div>
          </label>
        </div>

        {/* Bio */}
        <div className="dash-field-group">
          <label className="dash-label">Bio</label>
          <textarea className="dash-textarea" value={profile.bio || ''} onChange={e => update('bio', e.target.value)} placeholder="Tell your brothers about yourself..." />
        </div>

        {/* Favourite Quote */}
        <div className="dash-field-group">
          <label className="dash-label">Favourite Quote</label>
          <input className="dash-input" value={profile.favourite_quote || ''} onChange={e => update('favourite_quote', e.target.value)} placeholder="Your motto or a quote that defines you..." />
        </div>

        {/* Hobbies */}
        <div className="dash-field-group">
          <label className="dash-label">Hobbies & Interests</label>
          <textarea className="dash-textarea" value={profile.hobbies || ''} onChange={e => update('hobbies', e.target.value)} placeholder="What do you do outside of the frat?" style={{ minHeight: '80px' }} />
        </div>

        {/* Social Links */}
        <div className="dash-field-group">
          <label className="dash-label">Social Links</label>
          {SOCIAL_FIELDS.map(field => (
            <div key={field} style={{ marginBottom: '0.6rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ width: '100px', fontSize: '0.8rem', color: 'rgba(245,240,232,0.6)', flexShrink: 0 }}>{field}</span>
              <input className="dash-input" style={{ flex: 1 }}
                value={(profile.social_links || {})[field] || ''}
                onChange={e => updateSocial(field, e.target.value)}
                placeholder={`Your ${field} URL or handle`} />
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingBottom: '3rem' }}>
          <button className="dash-btn dash-btn-gold" onClick={save} disabled={saving}>
            {saving ? '⏳ Saving...' : '💾 Save Profile'}
          </button>
          {saved && <span style={{ color: '#4ade80', fontSize: '0.85rem' }}>✓ Saved successfully</span>}
          <a href="/dashboard" className="dash-btn dash-btn-outline">Cancel</a>
        </div>
      </div>
    </div>
  );
}
