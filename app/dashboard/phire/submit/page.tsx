'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import './submit.css';
import DashSidebar from '../../DashSidebar';

export default function SubmitActivity() {
  const [member, setMember]   = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [selected, setSelected]     = useState<string|null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]   = useState(false);
  const [error, setError] = useState('');
  const [myPending, setMyPending] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>{
      if(d.error){window.location.href='/login';return;}
      setMember(d.member); setProfile(d.profile||{});
    });
    fetch('/api/dashboard/phire/activities').then(r=>r.json()).then(d=>setActivities(d.activities||[]));
    fetch('/api/dashboard/phire/submissions?view=own').then(r=>r.json()).then(d=>{
      setMyPending((d.submissions||[]).filter((s:any)=>s.status==='pending').map((s:any)=>s.activity_id));
    });
  }, []);

  async function submit() {
    if(!selected) return;
    setSubmitting(true); setError('');
    const res = await fetch('/api/dashboard/phire/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({activity_id:selected})}).then(r=>r.json());
    if(res.error){setError(res.error);setSubmitting(false);return;}
    setDone(true); setSubmitting(false);
  }

  if(!member) return <div className="dash-loading">LOADING...</div>;
  const grouped: Record<string,any[]> = {};
  activities.forEach(a=>{if(!grouped[a.category])grouped[a.category]=[];grouped[a.category].push(a);});

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />
      <main className="dash-main">
        <div className="dash-page-header">
          <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <a href="/dashboard/phire" className="sa-back">← PHIRE</a>
            <div className="dash-page-title">Log Activity</div>
          </div>
        </div>

        <div className="sa-wrap">
          {done ? (
            <div className="sa-success">
              <div className="sa-success-icon">✓</div>
              <div className="sa-success-title">Submitted for Approval</div>
              <div className="sa-success-sub">Leadership has been notified and will review your submission.</div>
              <div style={{display:'flex',gap:'.7rem',justifyContent:'center'}}>
                <button className="sa-submit-btn" onClick={()=>{setDone(false);setSelected(null);}}>Submit Another</button>
                <a href="/dashboard/phire" className="sa-cancel-btn">Back to PHIRE</a>
              </div>
            </div>
          ) : (
            <>
              {error && <div className="sa-error">{error}</div>}
              {Object.entries(grouped).map(([cat, acts]) => (
                <div key={cat}>
                  <div className="sa-group-label">{cat}</div>
                  {acts.map((a:any) => {
                    const isPending = myPending.includes(a.id);
                    const isSel = selected === a.id;
                    return (
                      <div key={a.id} className={`sa-item${isSel?' selected':''}${isPending?' pending':''}`} onClick={()=>!isPending&&setSelected(a.id)}>
                        <div style={{flex:1}}>
                          <div className="sa-item-name">{a.name}</div>
                          {isPending && <div className="sa-item-pending-label">⏳ Pending approval</div>}
                        </div>
                        <div className="sa-item-pts">+{a.point_value} pts</div>
                        {isSel && <div className="sa-check">✓</div>}
                      </div>
                    );
                  })}
                </div>
              ))}
              {selected && (
                <div className="sa-submit-bar">
                  <button className="sa-submit-btn" onClick={submit} disabled={submitting}>{submitting?'Submitting...':'Submit for Approval →'}</button>
                  <button className="sa-cancel-btn" onClick={()=>setSelected(null)}>Clear</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
