'use client';
import { useState } from 'react';
import '../apply.css';

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; border: string; message: string }> = {
  pending: {
    label: 'Under Review', icon: '⏳', color: '#FFD740', bg: 'rgba(244,195,0,.07)', border: 'rgba(244,195,0,.25)',
    message: 'Your application is in the hands of the founding brothers. Sit tight — you will be contacted through your preferred method once a decision has been made.'
  },
  approved: {
    label: 'Approved', icon: '⚓', color: '#4ade80', bg: 'rgba(74,222,128,.07)', border: 'rgba(74,222,128,.25)',
    message: 'Welcome to the brotherhood. A brother will reach out to you shortly with next steps for your pledging process. Death Before Dishonor.'
  },
  denied: {
    label: 'Not Accepted', icon: '✕', color: '#e05070', bg: 'rgba(224,80,112,.07)', border: 'rgba(224,80,112,.25)',
    message: 'After careful review, the founding brothers have decided not to move forward with your application at this time. You may reapply in the future.'
  },
  waitlisted: {
    label: 'Waitlisted', icon: '◈', color: '#60a5fa', bg: 'rgba(96,165,250,.07)', border: 'rgba(96,165,250,.25)',
    message: 'Your application is on hold. The chapter is currently at capacity or reviewing timing. You will be contacted if a spot opens.'
  },
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function StatusPage() {
  const [query, setQuery]   = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  async function check() {
    if (!query.trim()) { setError('Please enter your SL avatar name.'); return; }
    setLoading(true); setError(''); setResult(null);
    const d = await fetch(`/api/apply/status?sl_name=${encodeURIComponent(query.trim())}`).then(r => r.json());
    setLoading(false);
    if (!d.found) { setError('No application found for that name. Check the spelling and try again.'); return; }
    setResult(d);
  }

  const cfg = result ? STATUS_CONFIG[result.status] : null;

  return (
    <div>
      <div className="ap-kanji"><span className="k1">武</span><span className="k2">義</span></div>
      <div className="ap-wrap">
        {/* Header */}
        <div className="ap-header">
          <img src="/logo.png" alt="KΘΦ II" className="ap-logo"/>
          <div className="ap-header-sub">Kappa Theta Phi II · Application Portal</div>
          <h1 className="ap-header-title">Check Your Status</h1>
          <p className="ap-header-desc">Enter your Second Life avatar name exactly as you submitted it on your application.</p>
        </div>

        {/* Search card */}
        <div className="ap-card" style={{maxWidth:480}}>
          <div className="ap-card-hdr">
            <div className="ap-card-step">Application Status</div>
            <div className="ap-card-title">SL Avatar Lookup</div>
          </div>
          <div className="ap-fields">
            {error && <div className="ap-error">{error}</div>}
            <div>
              <label className="ap-field-lbl">SL Legacy Name</label>
              <input
                className="ap-input"
                placeholder="e.g. JohnDoe Resident"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && check()}
              />
            </div>
          </div>
          <div className="ap-actions">
            <button className="ap-btn-next" onClick={check} disabled={loading}>
              {loading ? 'Searching...' : 'Check Status ⚓'}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && cfg && (
          <div className="ap-card" style={{maxWidth:480, marginTop:'1rem', border:`1px solid ${cfg.border}`, background:cfg.bg}}>
            <div className="ap-card-hdr" style={{borderColor:`${cfg.border}`}}>
              <div className="ap-card-step" style={{color:cfg.color}}>Application Found</div>
              <div className="ap-card-title">{result.sl_name}</div>
            </div>
            <div className="ap-fields">
              {/* Status badge */}
              <div style={{textAlign:'center', padding:'1.2rem 0 .8rem'}}>
                <div style={{fontSize:'2.5rem', marginBottom:'.6rem'}}>{cfg.icon}</div>
                <div style={{
                  fontFamily:'Cinzel,serif', fontSize:'.72rem', letterSpacing:'4px',
                  color:cfg.color, textTransform:'uppercase', marginBottom:'.4rem'
                }}>{cfg.label}</div>
                <div style={{
                  fontFamily:'Rajdhani,sans-serif', fontSize:'.95rem',
                  color:'rgba(245,240,232,.55)', lineHeight:1.7, maxWidth:'340px', margin:'0 auto'
                }}>{cfg.message}</div>
              </div>

              {/* Dates */}
              <div style={{borderTop:`1px solid ${cfg.border}`, paddingTop:'.85rem', display:'flex', flexDirection:'column', gap:'.4rem'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span style={{fontFamily:'Cinzel,serif', fontSize:'.56rem', letterSpacing:'2px', color:'rgba(245,240,232,.35)', textTransform:'uppercase'}}>Submitted</span>
                  <span style={{fontFamily:'Cinzel,serif', fontSize:'.62rem', letterSpacing:'1px', color:'rgba(245,240,232,.6)'}}>{fmt(result.submitted_at)}</span>
                </div>
                {result.reviewed_at && (
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span style={{fontFamily:'Cinzel,serif', fontSize:'.56rem', letterSpacing:'2px', color:'rgba(245,240,232,.35)', textTransform:'uppercase'}}>Reviewed</span>
                    <span style={{fontFamily:'Cinzel,serif', fontSize:'.62rem', letterSpacing:'1px', color:cfg.color}}>{fmt(result.reviewed_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <div style={{display:'flex', gap:'2rem', marginTop:'1.5rem'}}>
          <a href="/" style={{fontFamily:'Cinzel,serif', fontSize:'.5rem', letterSpacing:'3px', color:'rgba(245,240,232,.25)', textDecoration:'none', textTransform:'uppercase'}}>← Home</a>
          <a href="/apply" style={{fontFamily:'Cinzel,serif', fontSize:'.5rem', letterSpacing:'3px', color:'rgba(196,30,58,.55)', textDecoration:'none', textTransform:'uppercase'}}>Apply →</a>
        </div>

        <div style={{marginTop:'1rem', fontFamily:'Cinzel,serif', fontSize:'.44rem', letterSpacing:'2px', color:'rgba(245,240,232,.15)', textAlign:'center'}}>
          KΘΦ II · Death Before Dishonor · Est. 3·14·21
        </div>
      </div>
    </div>
  );
}
