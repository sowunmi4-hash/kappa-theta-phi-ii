'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import './manage.css';
import DashSidebar from '../../DashSidebar';

const LEADERS=['Head Founder','Co-Founder','Iron Fleet'];
const CATS=['General','Attendance','Service','Recruitment','Outreach','Leadership','Training'];
function timeAgo(d:string){const s=Math.floor((Date.now()-new Date(d).getTime())/1000);if(s<60)return 'just now';if(s<3600)return `${Math.floor(s/60)}m ago`;if(s<86400)return `${Math.floor(s/3600)}h ago`;return `${Math.floor(s/86400)}d ago`;}

export default function PhireManage() {
  const [member, setMember]   = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [tab, setTab]         = useState<'queue'|'activities'|'adjust'>('queue');
  const [queue, setQueue]     = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [roster, setRoster]   = useState<any[]>([]);
  const [denyNote, setDenyNote] = useState('');
  const [denyId, setDenyId]   = useState<string|null>(null);
  const [newAct, setNewAct]   = useState({name:'',point_value:'',category:'General'});
  const [adjust, setAdjust]   = useState({member_id:'',points:'',note:''});
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');

  useEffect(()=>{
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>{
      if(d.error){window.location.href='/login';return;}
      if(!LEADERS.includes(d.member.role)){window.location.href='/dashboard/phire';return;}
      setMember(d.member);setProfile(d.profile||{});
    });
    loadAll();
  },[]);
  useEffect(()=>{const p=setInterval(loadAll,20000);return()=>clearInterval(p);},[]);

  async function loadAll(){
    const[q,a]=await Promise.all([fetch('/api/dashboard/phire/submissions?view=pending').then(r=>r.json()),fetch('/api/dashboard/phire/activities').then(r=>r.json())]);
    setQueue(q.submissions||[]);setActivities(a.activities||[]);
  }
  async function loadRoster(){if(roster.length)return;const r=await fetch('/api/dashboard/roster').then(r=>r.json());setRoster(r.members||[]);}
  async function review(id:string,action:'approve'|'deny',note=''){setSaving(true);await fetch('/api/dashboard/phire/review',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({submission_id:id,action,note})});setSaving(false);setDenyId(null);setDenyNote('');await loadAll();}
  async function createActivity(){if(!newAct.name||!newAct.point_value){setMsg('err:Fill in all fields');return;}setSaving(true);await fetch('/api/dashboard/phire/activities',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newAct)});setMsg('ok:Activity created');setNewAct({name:'',point_value:'',category:'General'});setSaving(false);await loadAll();}
  async function toggleActivity(id:string,is_active:boolean){await fetch('/api/dashboard/phire/activities',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,is_active:!is_active})});await loadAll();}
  async function doAdjust(){if(!adjust.member_id||!adjust.points||!adjust.note){setMsg('err:Fill in all fields');return;}setSaving(true);const r=await fetch('/api/dashboard/phire/adjust',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({member_id:adjust.member_id,points:parseInt(adjust.points),note:adjust.note})}).then(r=>r.json());setMsg(r.error?`err:${r.error}`:`ok:Done — new balance: ${r.new_balance}`);setAdjust({member_id:'',points:'',note:''});setSaving(false);}

  if(!member) return <div className="dash-loading">LOADING...</div>;
  const msgType=msg.startsWith('ok:')?'ok':'err';
  const msgText=msg.replace(/^(ok|err):/,'');

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />
      <main className="dash-main">
        <div className="dash-page-header">
          <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <a href="/dashboard/phire" style={{fontFamily:'var(--cinzel)',fontSize:'.65rem',letterSpacing:'2px',color:'var(--bone-faint)',textDecoration:'none'}}>← PHIRE</a>
            <div className="dash-page-title">Manage PHIRE</div>
          </div>
        </div>

        <div className="mg-tabs">
          <button className={`mg-tab${tab==='queue'?' active':''}`} onClick={()=>setTab('queue')}>
            Approval Queue {queue.length>0&&<span className="mg-badge">{queue.length}</span>}
          </button>
          <button className={`mg-tab${tab==='activities'?' active':''}`} onClick={()=>setTab('activities')}>Activities</button>
          <button className={`mg-tab${tab==='adjust'?' active':''}`} onClick={()=>{setTab('adjust');loadRoster();}}>Adjust Points</button>
        </div>

        <div className="mg-wrap">
          {msgText&&<div className={`mg-msg ${msgType}`}>{msgText}</div>}

          {tab==='queue'&&(
            <>
              {queue.length===0&&<div className="mg-empty">Queue is clear ✓</div>}
              {queue.map((s:any)=>(
                <div key={s.id}>
                  <div className="mg-queue-item">
                    <div className="mg-queue-dot"/>
                    <div>
                      <div className="mg-queue-member">{s.member_name}</div>
                      <div className="mg-queue-activity">{s.activity_name}</div>
                      <div className="mg-queue-time">{timeAgo(s.created_at)}</div>
                    </div>
                    <div className="mg-queue-pts">+{s.point_value} pts</div>
                    <div className="mg-queue-btns">
                      <button className="mg-btn-green" onClick={()=>review(s.id,'approve')} disabled={saving}>✓ Approve</button>
                      <button className="mg-btn-red" onClick={()=>setDenyId(s.id)} disabled={saving}>✕ Deny</button>
                    </div>
                  </div>
                  {denyId===s.id&&(
                    <div className="mg-deny-row">
                      <input className="mg-create-input" style={{flex:1}} placeholder="Reason for denial..." value={denyNote} onChange={e=>setDenyNote(e.target.value)}/>
                      <button className="mg-btn-red" onClick={()=>review(s.id,'deny',denyNote)}>Confirm</button>
                      <button className="mg-btn-ghost" onClick={()=>setDenyId(null)}>Cancel</button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {tab==='activities'&&(
            <>
              <div className="mg-create">
                <div className="mg-create-grid">
                  <div><label className="mg-create-label">Name</label><input className="mg-create-input" value={newAct.name} onChange={e=>setNewAct(f=>({...f,name:e.target.value}))} placeholder="Activity name..."/></div>
                  <div><label className="mg-create-label">Points</label><input className="mg-create-input" type="number" min="1" value={newAct.point_value} onChange={e=>setNewAct(f=>({...f,point_value:e.target.value}))} placeholder="pts"/></div>
                  <div><label className="mg-create-label">Category</label><select className="mg-create-select" value={newAct.category} onChange={e=>setNewAct(f=>({...f,category:e.target.value}))}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
                  <button className="mg-btn-gold" onClick={createActivity} disabled={saving} style={{marginTop:'1.4rem'}}>+ Create</button>
                </div>
              </div>
              {activities.map((a:any)=>(
                <div key={a.id} className={`mg-act-row${a.is_active?'':' inactive'}`}>
                  <div style={{flex:1}}>
                    <div className="mg-act-name">{a.name}</div>
                    <div className="mg-act-cat">{a.category}</div>
                  </div>
                  <div className="mg-act-pts">{a.point_value} pts</div>
                  <button className={a.is_active?'mg-btn-red':'mg-btn-green'} onClick={()=>toggleActivity(a.id,a.is_active)}>{a.is_active?'Deactivate':'Activate'}</button>
                </div>
              ))}
            </>
          )}

          {tab==='adjust'&&(
            <div className="mg-adjust-card">
              <div className="mg-field"><label className="mg-label">Brother</label>
                <select className="mg-input" value={adjust.member_id} onChange={e=>setAdjust(f=>({...f,member_id:e.target.value}))}>
                  <option value="">Select brother...</option>
                  {roster.map((r:any)=><option key={r.member_id} value={r.member_id}>{r.frat_name} ({r.balance} pts)</option>)}
                </select>
              </div>
              <div className="mg-field"><label className="mg-label">Points (negative to deduct)</label><input className="mg-input" type="number" value={adjust.points} onChange={e=>setAdjust(f=>({...f,points:e.target.value}))} placeholder="e.g. 50 or -25"/></div>
              <div className="mg-field"><label className="mg-label">Reason</label><input className="mg-input" value={adjust.note} onChange={e=>setAdjust(f=>({...f,note:e.target.value}))} placeholder="Reason for adjustment..."/></div>
              <button className="mg-btn-gold" onClick={doAdjust} disabled={saving}>{saving?'Saving...':'Apply Adjustment →'}</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
