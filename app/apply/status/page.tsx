'use client';
import { useState } from 'react';
import '../apply.css';
import './status.css';

const SLT = 'America/Los_Angeles';
function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric', timeZone: SLT });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true, timeZone: SLT });
}
function fmtSubmit(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
}

export default function StatusPage() {
  const [query, setQuery]     = useState('');
  const [result, setResult]   = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function check() {
    if (!query.trim()) { setError('Please enter your SL avatar name.'); return; }
    setLoading(true); setError(''); setResult(null);
    const d = await fetch(`/api/apply/status?sl_name=${encodeURIComponent(query.trim())}`).then(r => r.json());
    setLoading(false);
    if (!d.found) { setError('No application found for that name. Check the spelling and try again.'); return; }
    setResult(d);
  }

  return (
    <div>
      <div className="ap-kanji"><span className="k1">武</span><span className="k2">義</span></div>
      <div className="ap-wrap">

        <div className="ap-header">
          <img src="/logo.png" alt="KΘΦ II" className="ap-logo"/>
          <div className="ap-header-sub">Kappa Theta Phi II · Application Portal</div>
          <h1 className="ap-header-title">Check Your Status</h1>
          <p className="ap-header-desc">Enter your Second Life avatar name exactly as you submitted it.</p>
        </div>

        {/* Search */}
        <div className="ap-card" style={{maxWidth:480}}>
          <div className="ap-card-hdr">
            <div className="ap-card-step">Application Lookup</div>
            <div className="ap-card-title">SL Avatar Name</div>
          </div>
          <div className="ap-fields">
            {error && <div className="ap-error">{error}</div>}
            <div>
              <label className="ap-field-lbl">SL Legacy Name</label>
              <input className="ap-input" placeholder="e.g. JohnDoe Resident" value={query}
                onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==='Enter' && check()}/>
            </div>
          </div>
          <div className="ap-actions">
            <button className="ap-btn-next" onClick={check} disabled={loading}>
              {loading ? 'Searching...' : 'Check Status ⚓'}
            </button>
          </div>
        </div>

        {/* Letter */}
        {result && <Letter app={result}/>}

        <div style={{display:'flex',gap:'2rem',marginTop:'1.5rem'}}>
          <a href="/" style={{fontFamily:'Cinzel,serif',fontSize:'.5rem',letterSpacing:'3px',color:'rgba(245,240,232,.25)',textDecoration:'none',textTransform:'uppercase'}}>← Home</a>
          <a href="/apply" style={{fontFamily:'Cinzel,serif',fontSize:'.5rem',letterSpacing:'3px',color:'rgba(196,30,58,.55)',textDecoration:'none',textTransform:'uppercase'}}>Apply →</a>
        </div>
        <div style={{marginTop:'.75rem',fontFamily:'Cinzel,serif',fontSize:'.44rem',letterSpacing:'2px',color:'rgba(245,240,232,.15)',textAlign:'center'}}>
          KΘΦ II · Death Before Dishonor · Est. 3·14·21
        </div>
      </div>
    </div>
  );
}

function Letter({ app }: { app: any }) {
  const status = app.status;

  const wrapStyle = {
    maxWidth: 540,
    marginTop: '1.2rem',
    width: '100%',
  };

  if (status === 'pending') return (
    <div style={wrapStyle}>
      <div className="sl-letter sl-pending">
        <div className="sl-letter-seal"><img src="/logo.png" alt="KΘΦ II"/></div>
        <div className="sl-letter-org">Kappa Theta Phi II · Wokou-Corsairs</div>
        <div className="sl-letter-type">Application Received</div>
        <div className="sl-letter-divider"/>
        <div className="sl-letter-to">To: <strong>{app.sl_name}</strong></div>
        <div className="sl-letter-body">
          <p>Your application to Kappa Theta Phi II has been received and is currently under review by the founding brothers.</p>
          <p>We take every application seriously. The brotherhood will deliberate and reach out through your preferred contact method once a decision has been made.</p>
          <p>Until then — hold your post.</p>
        </div>
        <div className="sl-letter-divider"/>
        <div className="sl-letter-footer">
          <span>Submitted {fmtSubmit(app.created_at)}</span>
          <span className="sl-status-badge pending">Under Review</span>
        </div>
      </div>
    </div>
  );

  if (status === 'interview') return (
    <div style={wrapStyle}>
      <div className="sl-letter sl-interview">
        <div className="sl-letter-seal"><img src="/logo.png" alt="KΘΦ II"/></div>
        <div className="sl-letter-org">Kappa Theta Phi II · Wokou-Corsairs</div>
        <div className="sl-letter-type">Interview Invitation</div>
        <div className="sl-letter-divider"/>
        <div className="sl-letter-to">To: <strong>{app.sl_name}</strong></div>
        <div className="sl-letter-body">
          <p>After reviewing your application, the founding brothers of Kappa Theta Phi II would like to meet with you.</p>
          <p>You have been selected for an interview — this is a significant step in the pledging process and reflects well on your application.</p>
          {app.interview_date && (
            <div className="sl-interview-block">
              <div className="sl-interview-label">Your Interview Is Scheduled For</div>
              <div className="sl-interview-date">{fmt(app.interview_date)}</div>
              <div className="sl-interview-time">{fmtTime(app.interview_date)} SLT</div>
              {app.interview_notes && <div className="sl-interview-notes">{app.interview_notes}</div>}
            </div>
          )}
          {!app.interview_date && (
            <p style={{color:'rgba(244,195,0,.7)',fontStyle:'italic'}}>A time and date will be confirmed shortly. Keep an eye on your preferred contact method.</p>
          )}
          <p>Come prepared to speak about yourself, your commitment, and what brotherhood means to you.</p>
        </div>
        <div className="sl-letter-divider"/>
        <div className="sl-letter-footer">
          <span>Submitted {fmtSubmit(app.created_at)}</span>
          <span className="sl-status-badge interview">Interview Stage</span>
        </div>
      </div>
    </div>
  );

  if (status === 'waitlisted') return (
    <div style={wrapStyle}>
      <div className="sl-letter sl-waitlisted">
        <div className="sl-letter-seal"><img src="/logo.png" alt="KΘΦ II"/></div>
        <div className="sl-letter-org">Kappa Theta Phi II · Wokou-Corsairs</div>
        <div className="sl-letter-type">Application Update</div>
        <div className="sl-letter-divider"/>
        <div className="sl-letter-to">To: <strong>{app.sl_name}</strong></div>
        <div className="sl-letter-body">
          <p>Thank you for your interest in Kappa Theta Phi II. After careful consideration, the founding brothers have placed your application on the waitlist.</p>
          <p>This is not a rejection. The chapter is reviewing capacity and timing, and your application remains active in our pool. Should a spot open, you will be contacted directly.</p>
          <p>We appreciate your patience and your interest in the brotherhood.</p>
        </div>
        <div className="sl-letter-divider"/>
        <div className="sl-letter-footer">
          <span>Submitted {fmtSubmit(app.created_at)}</span>
          <span className="sl-status-badge waitlisted">Waitlisted</span>
        </div>
      </div>
    </div>
  );

  if (status === 'denied') return (
    <div style={wrapStyle}>
      <div className="sl-letter sl-denied">
        <div className="sl-letter-seal"><img src="/logo.png" alt="KΘΦ II"/></div>
        <div className="sl-letter-org">Kappa Theta Phi II · Wokou-Corsairs</div>
        <div className="sl-letter-type">Application Decision</div>
        <div className="sl-letter-divider"/>
        <div className="sl-letter-to">To: <strong>{app.sl_name}</strong></div>
        <div className="sl-letter-body">
          <p>After thorough deliberation, the founding brothers of Kappa Theta Phi II have decided not to move forward with your application at this time.</p>
          <p>This decision was not made lightly. We recognise the effort it takes to put yourself forward, and we respect that. However, the brotherhood must ensure every new member is the right fit for where we are as a chapter.</p>
          <p>We wish you well in your journey on Second Life.</p>
        </div>
        <div className="sl-letter-divider"/>
        <div className="sl-letter-footer">
          <span>Submitted {fmtSubmit(app.created_at)}</span>
          <span className="sl-status-badge denied">Not Accepted</span>
        </div>
      </div>
    </div>
  );

  if (status === 'approved') return (
    <div style={wrapStyle}>
      <div className="sl-letter sl-approved">
        <div className="sl-letter-seal sl-letter-seal-glow"><img src="/logo.png" alt="KΘΦ II"/></div>
        <div className="sl-letter-org">Kappa Theta Phi II · Wokou-Corsairs</div>
        <div className="sl-letter-type">Letter of Acceptance</div>
        <div className="sl-letter-divider"/>
        <div className="sl-letter-to">To: <strong>{app.sl_name}</strong></div>
        <div className="sl-letter-body">
          <p>On behalf of the founding brothers of Kappa Theta Phi II, it is our honour to extend to you an offer of pledgeship.</p>
          <p>You stood out. Your application, your character, and your answers reflected someone the brotherhood believes in. We do not take this decision lightly — and neither should you.</p>
          <p>A founding brother will be in contact to walk you through the next steps of your pledging process. Come ready. Come committed.</p>
          <p style={{color:'rgba(244,195,0,.9)',fontWeight:600}}>Death Before Dishonor. Welcome to the waters.</p>
        </div>
        <div className="sl-letter-divider"/>
        <div className="sl-letter-footer">
          <span>Submitted {fmtSubmit(app.created_at)}</span>
          <span className="sl-status-badge approved">Accepted ⚓</span>
        </div>
      </div>
    </div>
  );

  return null;
}
