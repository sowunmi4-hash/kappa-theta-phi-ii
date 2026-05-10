'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import '../dash.css';
import DashSidebar from '../DashSidebar';

const SOCIALS = ['Instagram', 'Twitter/X', 'TikTok', 'YouTube', 'Discord', 'Second Life'];

export default function EditPage() {
  const [member, setMember]   = useState<any>(null);
  const [profile, setProfile] = useState<any>({});
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [previews, setPreviews]   = useState<any>({});

  useEffect(() => {
    fetch('/api/dashboard/profile').then(r => r.json()).then(d => {
      if (d.error) { window.location.href = '/login'; return; }
      setMember(d.member);
      setProfile(d.profile || { social_links: {} });
    });
  }, []);

  function update(k: string, v: any) { setProfile((p: any) => ({ ...p, [k]: v })); }
  function updateSocial(k: string, v: string) {
    setProfile((p: any) => ({ ...p, social_links: { ...(p.social_links || {}), [k]: v } }));
  }

  async function save() {
    setSaving(true);
    await fetch('/api/dashboard/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function uploadFile(e: any, type: string) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(type); setUploadError('');
    setPreviews((p: any) => ({ ...p, [type]: URL.createObjectURL(file) }));
    const fd = new FormData();
    fd.append('file', file); fd.append('type', type);
    try {
      const res = await fetch('/api/dashboard/upload', { method: 'POST', body: fd }).then(r => r.json());
      if (res.file_url) {
        update(`${type}_url`, res.file_url);
        // Auto-save so user doesn't need to click Save Changes
        setProfile((p: any) => {
          const updated = { ...p, [`${type}_url`]: res.file_url };
          fetch('/api/dashboard/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
          return updated;
        });
        setSaved(true); setTimeout(() => setSaved(false), 2500);
        router.refresh(); // Force Next.js to re-fetch profile data on all pages
      } else {
        setUploadError(res.error || 'Upload failed. Please try again.');
        console.error('[upload] error:', res.error);
      }
    } catch {
      setUploadError('Upload failed. Check your connection and try again.');
    }
    setUploading(null);
  }

  if (!member) return <div className="dash-loading">LOADING...</div>;

  const slug = member.frat_name?.toLowerCase().replace(/\s+/g, '-').replace('big-brother-', '') || '';
  const portrait = previews.portrait || profile.portrait_url || `/brothers/${slug}.png`;
  const socials = profile.social_links || {};
  const hasSocials = Object.entries(socials).some(([, v]) => v);

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />

      <main className="dash-main">
        <div className="dash-page-header">
          <div className="dash-page-title">Edit Profile</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
            {saved && <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.4rem', letterSpacing: '2px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '.4rem' }}>✓ Changes Saved</span>}
            <button className="dash-btn gold-solid" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </div>

        {/* Two-column: form left, live preview right */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', minHeight: 'calc(100vh - 60px)' }}>

          {/* FORM */}
          <div style={{ padding: '1.2rem 1.4rem', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.1rem', overflowY: 'auto' }}>

            {/* Photos */}
            <div>
              <div className="dash-clbl">Photos</div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '.8rem' }}>
                <div>
                  <label className="dash-field-label">Portrait</label>
                  <label className="dash-upload-zone" style={{ height: '90px', cursor: 'pointer' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => uploadFile(e, 'portrait')} />
                    {(previews.portrait || profile.portrait_url)
                      ? <img src={previews.portrait || profile.portrait_url} style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--gold)' }} alt="portrait" />
                      : <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(198,147,10,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', color: 'rgba(198,147,10,.4)' }}>↑</div>
                    }
                    <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.34rem', letterSpacing: '2px', color: 'rgba(198,147,10,.4)' }}>
                      {uploading === 'portrait' ? 'Uploading...' : 'Change'}
                    </span>
                  </label>
                </div>
                <div>
                  <label className="dash-field-label">Banner</label>
                  <label className="dash-upload-zone" style={{ height: '90px', cursor: 'pointer' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => uploadFile(e, 'banner')} />
                    {(previews.banner || profile.banner_url)
                      ? <img src={previews.banner || profile.banner_url} style={{ maxWidth: '100%', maxHeight: '55px', objectFit: 'cover', borderRadius: '2px' }} alt="banner" />
                      : <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid rgba(198,147,10,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', color: 'rgba(198,147,10,.4)' }}>↑</div>
                    }
                    <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.34rem', letterSpacing: '2px', color: 'rgba(198,147,10,.4)' }}>
                      {uploading === 'banner' ? 'Uploading...' : 'Upload banner'}
                    </span>
                    <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.3rem', letterSpacing: '1px', color: 'rgba(198,147,10,.22)' }}>Wide / landscape works best</span>
                  </label>
                </div>
              </div>
            </div>

            {uploadError && (
              <div style={{fontFamily:'var(--cinzel)',fontSize:'.58rem',letterSpacing:'1px',color:'#e05070',background:'rgba(224,80,112,.07)',border:'1px solid rgba(224,80,112,.2)',borderRadius:'3px',padding:'.5rem .75rem',marginBottom:'.5rem'}}>{uploadError}</div>
            )}

            {/* About */}
            <div>
              <div className="dash-clbl">About You</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
                <div>
                  <label className="dash-field-label">Bio</label>
                  <textarea className="dash-textarea" value={profile.bio || ''} onChange={e => update('bio', e.target.value)} placeholder="Tell your brothers about yourself..." style={{ minHeight: '70px' }} />
                </div>
                <div>
                  <label className="dash-field-label">Favourite Quote</label>
                  <textarea className="dash-textarea" value={profile.favourite_quote || ''} onChange={e => update('favourite_quote', e.target.value)} placeholder="A quote that means something to you..." style={{ minHeight: '52px' }} />
                </div>
                <div>
                  <label className="dash-field-label">Hobbies</label>
                  <input className="dash-input" value={profile.hobbies || ''} onChange={e => update('hobbies', e.target.value)} placeholder="What do you enjoy?" />
                </div>
              </div>
            </div>

            {/* Social links */}
            <div>
              <div className="dash-clbl">Social Links</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.42rem' }}>
                {SOCIALS.map(s => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                    <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.36rem', letterSpacing: '2px', color: 'var(--bone-faint)', width: '72px', flexShrink: 0 }}>{s}</span>
                    <input className="dash-input" value={socials[s] || ''} onChange={e => updateSocial(s, e.target.value)} placeholder={`${s} URL or handle`} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ paddingTop: '.8rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.7rem' }}>
              <button className="dash-btn gold-solid" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              {saved && <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.4rem', letterSpacing: '2px', color: 'var(--green)' }}>✓ Changes Saved</span>}
            </div>
          </div>

          {/* LIVE PREVIEW */}
          <div style={{ padding: '.9rem .85rem', background: 'rgba(4,6,15,.4)', display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
            <div className="dash-clbl" style={{ textAlign: 'center' }}>Live Preview</div>

            <div style={{ background: 'rgba(8,13,24,.92)', border: '1px solid var(--border)', position: 'relative', borderRadius: '3px', overflow: 'hidden' }}>
              <span className="dash-corner tl" /><span className="dash-corner br" />
              {/* Mini banner */}
              <div style={{ height: '50px', background: profile.banner_url ? `url(${previews.banner || profile.banner_url}) center/cover` : 'linear-gradient(135deg,#0d1a2e,#1a0814)', position: 'relative' }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30px', background: 'linear-gradient(transparent,rgba(8,13,24,.92))' }} />
              </div>
              {/* Identity */}
              <div style={{ padding: '.5rem .7rem .6rem', display: 'flex', alignItems: 'flex-end', gap: '.55rem', marginTop: '-18px', position: 'relative', zIndex: 2 }}>
                <img
                  src={portrait}
                  alt=""
                  onError={(e: any) => e.target.src = '/logo.png'}
                  style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1.5px solid var(--gold)', objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ paddingBottom: '2px' }}>
                  <div style={{ fontFamily: 'var(--display)', fontSize: '.88rem', letterSpacing: '1px', background: 'linear-gradient(180deg,var(--gold-b),var(--gold))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', lineHeight: 1 }}>{member.frat_name}</div>
                  <div style={{ fontFamily: 'var(--cinzel)', fontSize: '.34rem', letterSpacing: '3px', color: 'var(--crimson)', textTransform: 'uppercase', marginTop: '2px' }}>{member.role}</div>
                </div>
              </div>
              {/* Body */}
              <div style={{ padding: '.5rem .7rem .8rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {profile.favourite_quote && (
                  <div style={{ fontStyle: 'italic', fontSize: '.75rem', color: 'var(--bone-faint)', borderLeft: '1.5px solid rgba(198,147,10,.3)', padding: '.3rem .6rem', lineHeight: 1.55, background: 'rgba(198,147,10,.02)' }}>
                    "{profile.favourite_quote}"
                  </div>
                )}
                {profile.bio && (
                  <div>
                    <div style={{ fontFamily: 'var(--cinzel)', fontSize: '.32rem', letterSpacing: '3px', color: 'rgba(198,147,10,.4)', textTransform: 'uppercase', marginBottom: '.15rem' }}>About</div>
                    <div style={{ fontSize: '.76rem', color: 'var(--bone-faint)', lineHeight: 1.5 }}>{profile.bio}</div>
                  </div>
                )}
                {profile.hobbies && (
                  <div>
                    <div style={{ fontFamily: 'var(--cinzel)', fontSize: '.32rem', letterSpacing: '3px', color: 'rgba(198,147,10,.4)', textTransform: 'uppercase', marginBottom: '.15rem' }}>Hobbies</div>
                    <div style={{ fontSize: '.76rem', color: 'var(--bone-faint)', lineHeight: 1.5 }}>{profile.hobbies}</div>
                  </div>
                )}
                {hasSocials && (
                  <div>
                    <div style={{ fontFamily: 'var(--cinzel)', fontSize: '.32rem', letterSpacing: '3px', color: 'rgba(198,147,10,.4)', textTransform: 'uppercase', marginBottom: '.25rem' }}>Links</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {Object.entries(socials).filter(([, v]) => v).map(([k]) => (
                        <span key={k} style={{ fontFamily: 'var(--cinzel)', fontSize: '.32rem', letterSpacing: '1px', padding: '2px 6px', borderRadius: '20px', border: '1px solid rgba(198,147,10,.2)', color: 'var(--gold)' }}>{k}</span>
                      ))}
                    </div>
                  </div>
                )}
                {!profile.bio && !profile.favourite_quote && !profile.hobbies && (
                  <div style={{ fontFamily: 'var(--cinzel)', fontSize: '.34rem', letterSpacing: '2px', color: 'rgba(198,147,10,.25)', textAlign: 'center', padding: '.5rem 0' }}>Add info to see preview</div>
                )}
              </div>
            </div>

            <div style={{ fontFamily: 'var(--cinzel)', fontSize: '.33rem', letterSpacing: '2px', color: 'var(--bone-faint)', textAlign: 'center' }}>Updates as you type</div>
          </div>
        </div>
      </main>
    </div>
  );
}
