'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../dash.css';
import './applications.css';
import DashSidebar from '../DashSidebar';

function fmt(d:string){ return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }

// SLT = America/Los_Angeles. Convert UTC ISO → SLT string for datetime-local input
function utcToSLTInput(iso:string):string {
  if(!iso) return '';
  const d = new Date(iso);
  const inLA = new Date(d.toLocaleString('en-US',{timeZone:'America/Los_Angeles'}));
  const y=inLA.getFullYear(), mo=String(inLA.getMonth()+1).padStart(2,'0'),
        dd=String(inLA.getDate()).padStart(2,'0'), h=String(inLA.getHours()).padStart(2,'0'),
        mi=String(inLA.getMinutes()).padStart(2,'0');
  return `${y}-${mo}-${dd}T${h}:${mi}`;
}
// Convert datetime-local string (treated as SLT) → UTC ISO for storage
function sltInputToUTC(sltStr:string):string|null {
  if(!sltStr) return null;
  const naive = new Date(sltStr);
  const inLA  = new Date(naive.toLocaleString('en-US',{timeZone:'America/Los_Angeles'}));
  const offset = naive.getTime() - inLA.getTime();
  return new Date(naive.getTime() - offset).toISOString();
}
function timeAgo(d:string){ const s=Math.floor((Date.now()-new Date(d).getTime())/1000); if(s<3600)return`${Math.floor(s/60)}m ago`; if(s<86400)return`${Math.floor(s/3600)}h ago`; if(s<604800)return`${Math.floor(s/86400)}d ago`; return fmt(d); }
const STATUS_LABELS: Record<string,string> = { pending:'Pending', interview:'Interview', approved:'Approved', denied:'Denied', waitlisted:'Waitlisted' };

export default function ApplicationsPage() {
  const [member,setMember]=useState<any>(null);
  const [profile,setProfile]=useState<any>(null);
  const [apps,setApps]=useState<any[]>([]);
  const [summary,setSummary]=useState<any>({});
  const [loading,setLoading]=useState(true);
  const [sel,setSel]=useState<any>(null);
  const [filter,setFilter]=useState('all');
  const [notes,setNotes]=useState('');
  const [newStatus,setNewStatus]=useState('');
  const [saving,setSaving]=useState(false);
  const [saveError,setSaveError]=useState('');
  const [interviewDate,setInterviewDate]=useState('');
  const [interviewNotes,setInterviewNotes]=useState('');

  useEffect(()=>{
    fetch('/api/dashboard/profile').then(r=>r.json()).then(d=>{
      if(d.error){window.location.href='/login';return;}
      if(d.member?.faction!=='Kuro Kanda Faction'){window.location.href='/dashboard';return;}
      setMember(d.member);setProfile(d.profile);load();
    });
  },[]);

  async function load(){
    const d=await fetch('/api/apply').then(r=>r.json());
    setApps(d.applications||[]);setSummary(d.summary||{});setLoading(false);
  }

  async function save(){
    if(!sel||!newStatus)return;
    setSaving(true);setSaveError('');
    const res=await fetch('/api/apply',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:sel.id,status:newStatus,review_notes:notes,interview_date:sltInputToUTC(interviewDate),interview_notes:interviewNotes||null})}).then(r=>r.json());
    setSaving(false);
    if(res.error){setSaveError(res.error);return;}
    setSel(null);load();
  }

  function select(a:any){setSel(a);setNewStatus(a.status);setNotes(a.review_notes||'');setInterviewDate(a.interview_date?utcToSLTInput(a.interview_date):'');setInterviewNotes(a.interview_notes||'');}
  const filtered=filter==='all'?apps:apps.filter(a=>a.status===filter);

  if(!member||loading)return <div className="dash-loading">LOADING...</div>;

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile}/>
      <main className="dash-main">
        <div className="dash-page-header">
          <div>
            <div style={{fontFamily:'var(--cinzel)',fontSize:'.52rem',letterSpacing:'4px',color:'rgba(198,147,10,.45)',textTransform:'uppercase',marginBottom:'.25rem'}}>Kuro Kanda Faction · Confidential</div>
            <div className="dash-page-title">Pledging Applications</div>
          </div>
          <span style={{fontFamily:'var(--cinzel)',fontSize:'.58rem',letterSpacing:'2px',color:'rgba(198,147,10,.6)'}}>{summary.pending||0} awaiting review</span>
        </div>

        {/* Stats */}
        <div className="ap-dash-stats">
          {[{v:summary.total||0,l:'Total',c:'var(--bone)'},{v:summary.pending||0,l:'Pending',c:'var(--gold-b)'},{v:summary.interview||0,l:'Interview',c:'#60a5fa'},{v:summary.approved||0,l:'Approved',c:'var(--green)'},{v:summary.denied||0,l:'Denied',c:'#e05070'},{v:summary.waitlisted||0,l:'Waitlisted',c:'#94a3b8'}].map((s,i)=>(
            <div key={i} className="ap-dash-stat-cell"><div className="ap-dash-stat-val" style={{color:s.c}}>{s.v}</div><div className="ap-dash-stat-lbl">{s.l}</div></div>
          ))}
        </div>

        <div className="ap-dash-layout">
          {/* LEFT */}
          <div className="ap-dash-list-col">
            <div className="ap-dash-filter-bar">
              {['all','pending','interview','approved','denied','waitlisted'].map(f=>(
                <button key={f} className={`ap-dash-filter-btn${filter===f?' active':''}`} onClick={()=>setFilter(f)}>
                  {f==='all'?`All (${apps.length})`:STATUS_LABELS[f]}
                </button>
              ))}
            </div>
            <div className="ap-dash-list">
              {filtered.length===0&&<div className="ap-dash-empty">No applications.</div>}
              {filtered.map(a=>(
                <div key={a.id} className={`ap-dash-item${sel?.id===a.id?' sel':''} ${a.status}`} onClick={()=>select(a)}>
                  <div className="ap-dash-item-top">
                    <span className="ap-dash-item-name">{a.sl_name}</span>
                    <span className={`ap-dash-badge ${a.status}`}>{STATUS_LABELS[a.status]}</span>
                  </div>
                  <div className="ap-dash-item-meta">{a.email} · {timeAgo(a.created_at)}</div>
                  {a.referred_by&&<div className="ap-dash-item-ref">Ref: {a.referred_by}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="ap-dash-detail-col">
            {!sel?(
              <div className="ap-dash-empty-detail">Select an application to review</div>
            ):(
              <>
                <div className="ap-dash-detail-hdr">
                  <div className="ap-dash-detail-name">{sel.sl_name}</div>
                  <div className="ap-dash-detail-sub">
                    <span>{sel.email}</span><span>Applied {fmt(sel.created_at)}</span>
                    {sel.reviewed_by_name&&<span>Reviewed by {sel.reviewed_by_name}</span>}
                  </div>
                </div>
                <div className="ap-dash-detail-body">
                  <div className="ap-dash-section">
                    <div className="ap-dash-sec-lbl">Identity</div>
                    <div className="ap-dash-fields-grid">
                      <div><div className="ap-dash-field-k">RL/SL Age</div><div className="ap-dash-field-v">{sel.rl_sl_age||'—'}</div></div>
                      <div><div className="ap-dash-field-k">SL Birth Date</div><div className="ap-dash-field-v">{sel.sl_birth_date?fmt(sel.sl_birth_date):'—'}</div></div>
                      <div><div className="ap-dash-field-k">Timezone</div><div className="ap-dash-field-v">{sel.timezone||'—'}</div></div>
                      <div><div className="ap-dash-field-k">Referred By</div><div className="ap-dash-field-v">{sel.referred_by||'—'}</div></div>
                    </div>
                  </div>
                  <div className="ap-dash-section">
                    <div className="ap-dash-sec-lbl">Commitment</div>
                    <div className="ap-dash-fields-grid">
                      <div><div className="ap-dash-field-k">Schedule Limits</div><div className="ap-dash-field-v" style={{color:sel.schedule_limitations?'#e05070':'var(--green)'}}>{sel.schedule_limitations===null?'—':sel.schedule_limitations?'Yes':'No'}</div></div>
                      <div><div className="ap-dash-field-k">Can Pledge 4 Weeks</div><div className="ap-dash-field-v" style={{color:sel.can_pledge?'var(--green)':'#e05070'}}>{sel.can_pledge===null?'—':sel.can_pledge?'Yes':'No'}</div></div>
                      <div><div className="ap-dash-field-k">Financially Ready</div><div className="ap-dash-field-v" style={{color:sel.financially_prepared?'var(--green)':'#e05070'}}>{sel.financially_prepared===null?'—':sel.financially_prepared?'Yes':'No'}</div></div>
                      <div><div className="ap-dash-field-k">Communication</div><div className="ap-dash-field-v">{sel.communication_mode||'—'}</div></div>
                      {sel.interview_date&&<div style={{gridColumn:'1/-1'}}><div className="ap-dash-field-k">Interview Date</div><div className="ap-dash-field-v" style={{color:'#60a5fa'}}>{new Date(sel.interview_date).toLocaleString('en-US',{weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true,timeZone:'America/Los_Angeles'})} SLT</div>{sel.interview_notes&&<div className="ap-dash-field-k" style={{marginTop:'.3rem'}}>{sel.interview_notes}</div>}</div>}
                    </div>
                  </div>
                  <div className="ap-dash-section">
                    <div className="ap-dash-sec-lbl">Contact & Activities</div>
                    <div className="ap-dash-field-k">Preferred Contact</div><div className="ap-dash-field-v" style={{marginBottom:'.5rem'}}>{sel.contact_method||'—'}</div>
                    <div className="ap-dash-field-k">SL Activities</div><div className="ap-dash-field-v">{sel.sl_activities||'—'}</div>
                  </div>
                  <div className="ap-dash-section">
                    <div className="ap-dash-sec-lbl">Why KΘΦ II</div>
                    <div className="ap-dash-field-k">Reasons for Joining</div><div className="ap-dash-field-long">{sel.reasons_to_join||'—'}</div>
                    <div className="ap-dash-field-k" style={{marginTop:'.6rem'}}>What They Hope to Gain</div><div className="ap-dash-field-long">{sel.what_you_gain||'—'}</div>
                  </div>
                  <div className="ap-dash-section">
                    <div className="ap-dash-sec-lbl">Decision</div>
                    <div className="ap-dash-status-grid">
                      {(['pending','interview','approved','denied','waitlisted'] as const).map(s=>(
                        <button key={s} className={`ap-dash-status-btn ${s}${newStatus===s?' active':''}`} onClick={()=>setNewStatus(s)}>{STATUS_LABELS[s]}</button>
                      ))}
                    </div>
                    {newStatus==='interview'&&(
                      <div style={{display:'flex',flexDirection:'column',gap:'.4rem'}}>
                        <div style={{fontFamily:'var(--cinzel)',fontSize:'.52rem',letterSpacing:'3px',color:'rgba(96,165,250,.5)',textTransform:'uppercase'}}>Interview Date & Time — Enter in SLT</div>
                        <input type="datetime-local" className="ap-dash-notes" style={{minHeight:'auto',padding:'.5rem .75rem'}} value={interviewDate} onChange={e=>setInterviewDate(e.target.value)}/>
                        <input className="ap-dash-notes" style={{minHeight:'auto',padding:'.5rem .75rem'}} value={interviewNotes} onChange={e=>setInterviewNotes(e.target.value)} placeholder="Interview location or additional notes..."/>
                      </div>
                    )}
                    <textarea className="ap-dash-notes" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Review notes (optional)..." rows={3}/>
                    {saveError&&<div style={{fontFamily:'var(--cinzel)',fontSize:'.58rem',letterSpacing:'1px',color:'#e05070',background:'rgba(224,80,112,.07)',border:'1px solid rgba(224,80,112,.2)',borderRadius:'3px',padding:'.5rem .75rem'}}>{saveError}</div>}
                    <button className="ap-dash-save-btn" onClick={save} disabled={saving||!newStatus}>{saving?'Saving...':'Save Decision'}</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
