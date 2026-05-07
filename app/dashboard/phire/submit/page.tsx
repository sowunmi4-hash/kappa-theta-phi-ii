'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import '../phire-sub.css';
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
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d => {
      if (d.error) { window.location.href='/login'; return; }
      setMember(d.member); setProfile(d.profile||{});
    });
    fetch('/api/dashboard/phire/activities').then(r=>r.json()).then(d => setActivities(d.activities||[]));
    fetch('/api/dashboard/phire/submissions?view=own').then(r=>r.json()).then(d => {
      setMyPending((d.submissions||[]).filter((s:any)=>s.status==='pending').map((s:any)=>s.activity_id));
    });
  }, []);

  async function submit() {
    if (!selected) return;
    setSubmitting(true); setError('');
    const res = await fetch('/api/dashboard/phire/submit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ activity_id: selected }) }).then(r=>r.json());
    if (res.error) { setError(res.error); setSubmitting(false); return; }
    setDone(true); setSubmitting(false);
  }

  if (!member) return <div className="dash-loading">LOADING...</div>;

  const grouped: Record<string,any[]> = {};
  activities.forEach(a => { if(!grouped[a.category]) grouped[a.category]=[]; grouped[a.category].push(a); });

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />
      <main className="dash-main">
        <div className="dash-page-header">
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            <a href="/dashboard/phire" className="ps-back">← PHIRE</a>
            <div className="dash-page-title">Log Activity</div>
          </div>
        </div>

        <div className="ps-wrap">
          {done ? (
            <div className="ps-card" style={{ padding:'3rem', textAlign:'center' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>✓</div>
              <div style={{ fontFamily:'var(--cinzel)', fontSize:'.85rem', letterSpacing:'4px', color:'var(--green)', marginBottom:'.5rem' }}>SUBMITTED FOR APPROVAL</div>
              <div style={{ fontFamily:'var(--cinzel)', fontSize:'.65rem', letterSpacing:'1px', color:'var(--bone-faint)', marginBottom:'1.5rem' }}>Leadership has been notified and will review your submission.</div>
              <div style={{ display:'flex', gap:'.6rem', justifyContent:'center' }}>
                <button className="ps-btn gold" onClick={()=>{setDone(false);setSelected(null);}}>Submit Another</button>
                <a href="/dashboard/phire" className="ps-btn ghost">Back to PHIRE</a>
              </div>
            </div>
          ) : (
            <>
              {error && <div className="ps-msg err">{error}</div>}

              {Object.entries(grouped).map(([cat, acts]) => (
                <div key={cat}>
                  <div style={{ fontFamily:'var(--cinzel)', fontSize:'.62rem', letterSpacing:'5px', color:'rgba(198,147,10,.45)', textTransform:'uppercase', marginBottom:'.6rem' }}>{cat}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
                    {acts.map((a:any) => {
                      const isPending = myPending.includes(a.id);
                      const isSel = selected === a.id;
                      return (
                        <div
                          key={a.id}
                          onClick={() => !isPending && setSelected(a.id)}
                          style={{
                            display:'flex', alignItems:'center', gap:'1rem',
                            padding:'.9rem 1.1rem',
                            background: isSel ? 'rgba(198,147,10,.1)' : 'rgba(7,11,20,.75)',
                            border: `1px solid ${isSel ? 'var(--gold)' : 'var(--border)'}`,
                            cursor: isPending ? 'not-allowed' : 'pointer',
                            opacity: isPending ? .5 : 1,
                            transition: 'all .15s',
                            position: 'relative',
                          }}
                        >
                          {isSel && <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'2px', background:'linear-gradient(to bottom, var(--gold-b), var(--gold))' }} />}
                          <div style={{ flex:1 }}>
                            <div style={{ fontFamily:'var(--cinzel)', fontSize:'.72rem', letterSpacing:'1px', color: isSel ? 'var(--bone)' : 'var(--bone-dim)' }}>{a.name}</div>
                            {isPending && <div style={{ fontFamily:'var(--cinzel)', fontSize:'.58rem', letterSpacing:'1px', color:'var(--gold)', marginTop:'2px' }}>⏳ Pending approval</div>}
                          </div>
                          <div style={{ fontFamily:'var(--display)', fontSize:'1.05rem', color: isSel ? 'var(--gold-b)' : 'var(--bone-faint)' }}>+{a.point_value} pts</div>
                          {isSel && <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.65rem', color:'var(--deep)', fontWeight:700, flexShrink:0 }}>✓</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {selected && (
                <div style={{ position:'sticky', bottom:'1.5rem', display:'flex', gap:'.6rem', justifyContent:'center' }}>
                  <button className="ps-btn gold" onClick={submit} disabled={submitting} style={{ padding:'.65rem 2.5rem' }}>
                    {submitting ? 'Submitting...' : 'Submit for Approval →'}
                  </button>
                  <button className="ps-btn ghost" onClick={()=>setSelected(null)}>Clear</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
