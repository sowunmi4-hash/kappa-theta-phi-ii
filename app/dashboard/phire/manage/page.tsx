'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import '../phire-sub.css';
import DashSidebar from '../../DashSidebar';

const LEADERS = ['Head Founder','Co-Founder','Iron Fleet'];
const CATEGORIES = ['General','Attendance','Service','Recruitment','Outreach','Leadership','Training'];

function timeAgo(d:string){ const s=Math.floor((Date.now()-new Date(d).getTime())/1000); if(s<60) return 'just now'; if(s<3600) return `${Math.floor(s/60)}m ago`; if(s<86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`; }

export default function PhireManage() {
  const [member, setMember]   = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [tab, setTab]         = useState<'queue'|'activities'|'adjust'>('queue');
  const [queue, setQueue]     = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [roster, setRoster]   = useState<any[]>([]);
  const [denyNote, setDenyNote] = useState('');
  const [denyId, setDenyId]   = useState<string|null>(null);
  const [newAct, setNewAct]   = useState({ name:'', point_value:'', category:'General' });
  const [adjust, setAdjust]   = useState({ member_id:'', points:'', note:'' });
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');

  useEffect(() => {
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>{
      if(d.error){window.location.href='/login';return;}
      if(!LEADERS.includes(d.member.role)){window.location.href='/dashboard/phire';return;}
      setMember(d.member); setProfile(d.profile||{});
    });
    loadAll();
  }, []);

  useEffect(() => {
    const poll = setInterval(loadAll, 20000);
    return () => clearInterval(poll);
  }, []);

  async function loadAll() {
    const [q, a] = await Promise.all([
      fetch('/api/dashboard/phire/submissions?view=pending').then(r=>r.json()),
      fetch('/api/dashboard/phire/activities').then(r=>r.json()),
    ]);
    setQueue(q.submissions||[]);
    setActivities(a.activities||[]);
  }

  async function loadRoster() {
    if (roster.length) return;
    const res = await fetch('/api/dashboard/roster').then(r=>r.json());
    setRoster(res.members||[]);
  }

  async function review(id: string, action: 'approve'|'deny', note='') {
    setSaving(true);
    await fetch('/api/dashboard/phire/review', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ submission_id: id, action, note }) });
    setSaving(false); setDenyId(null); setDenyNote('');
    await loadAll();
  }

  async function createActivity() {
    if (!newAct.name || !newAct.point_value) { setMsg('err:Fill in all fields'); return; }
    setSaving(true);
    await fetch('/api/dashboard/phire/activities', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(newAct) });
    setMsg('ok:Activity created'); setNewAct({ name:'', point_value:'', category:'General' });
    setSaving(false); await loadAll();
  }

  async function toggleActivity(id: string, is_active: boolean) {
    await fetch('/api/dashboard/phire/activities', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, is_active: !is_active }) });
    await loadAll();
  }

  async function doAdjust() {
    if (!adjust.member_id || !adjust.points || !adjust.note) { setMsg('err:Fill in all fields'); return; }
    setSaving(true);
    const res = await fetch('/api/dashboard/phire/adjust', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ member_id: adjust.member_id, points: parseInt(adjust.points), note: adjust.note }) }).then(r=>r.json());
    setMsg(res.error ? `err:${res.error}` : `ok:Done! New balance: ${res.new_balance}`);
    setAdjust({ member_id:'', points:'', note:'' }); setSaving(false);
  }

  if (!member) return <div className="dash-loading">LOADING...</div>;
  const msgType = msg.startsWith('ok:') ? 'ok' : 'err';
  const msgText = msg.replace(/^(ok|err):/, '');

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />
      <main className="dash-main">
        <div className="dash-page-header">
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            <a href="/dashboard/phire" className="ps-back">← PHIRE</a>
            <div className="dash-page-title">Manage PHIRE</div>
          </div>
        </div>

        <div className="ps-tabs">
          <button className={`ps-tab${tab==='queue'?' active':''}`} onClick={()=>setTab('queue')}>
            Approval Queue {queue.length > 0 && <span className="ps-tab-badge">{queue.length}</span>}
          </button>
          <button className={`ps-tab${tab==='activities'?' active':''}`} onClick={()=>setTab('activities')}>Activities</button>
          <button className={`ps-tab${tab==='adjust'?' active':''}`} onClick={()=>{setTab('adjust');loadRoster();}}>Adjust Points</button>
        </div>

        <div className="ps-wrap">
          {msgText && <div className={`ps-msg ${msgType}`}>{msgText}</div>}

          {/* QUEUE */}
          {tab === 'queue' && (
            <>
              {queue.length === 0 && <div className="ps-empty">Queue is clear ✓ No pending submissions.</div>}
              {queue.map((s:any) => (
                <div key={s.id}>
                  <div className="ps-row" style={{ alignItems:'flex-start' }}>
                    <span className="ps-dot pending" style={{ marginTop:'4px' }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:'var(--display)', fontSize:'1rem', letterSpacing:'1px', color:'var(--bone)', textTransform:'uppercase' }}>{s.member_name}</div>
                      <div className="ps-row-title" style={{ marginTop:'2px' }}>{s.activity_name}</div>
                      <div className="ps-row-sub">{timeAgo(s.created_at)}</div>
                    </div>
                    <div style={{ fontFamily:'var(--display)', fontSize:'1.1rem', color:'var(--gold-b)', flexShrink:0 }}>+{s.point_value}</div>
                    <div style={{ display:'flex', gap:'.4rem', flexShrink:0 }}>
                      <button className="ps-btn green" onClick={()=>review(s.id,'approve')} disabled={saving}>✓ Approve</button>
                      <button className="ps-btn danger" onClick={()=>setDenyId(s.id)} disabled={saving}>✕ Deny</button>
                    </div>
                  </div>
                  {denyId === s.id && (
                    <div style={{ display:'flex', gap:'.5rem', padding:'.65rem .8rem', background:'rgba(4,6,15,.7)', border:'1px solid rgba(224,80,112,.2)', marginTop:'-1px' }}>
                      <input className="ps-input" style={{ flex:1 }} placeholder="Reason for denial (optional)..." value={denyNote} onChange={e=>setDenyNote(e.target.value)} />
                      <button className="ps-btn danger" onClick={()=>review(s.id,'deny',denyNote)}>Confirm Deny</button>
                      <button className="ps-btn ghost" onClick={()=>setDenyId(null)}>Cancel</button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* ACTIVITIES */}
          {tab === 'activities' && (
            <>
              <div className="ps-card">
                <div className="ps-card-hdr"><div className="ps-card-title">Create Activity</div></div>
                <div className="ps-card-body">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 120px 160px auto', gap:'.7rem', alignItems:'flex-end' }}>
                    <div className="ps-field">
                      <label className="ps-label">Name</label>
                      <input className="ps-input" value={newAct.name} onChange={e=>setNewAct(f=>({...f,name:e.target.value}))} placeholder="Activity name..." />
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">Points</label>
                      <input className="ps-input" type="number" min="1" value={newAct.point_value} onChange={e=>setNewAct(f=>({...f,point_value:e.target.value}))} placeholder="pts" />
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">Category</label>
                      <select className="ps-select" value={newAct.category} onChange={e=>setNewAct(f=>({...f,category:e.target.value}))}>
                        {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <button className="ps-btn gold" onClick={createActivity} disabled={saving} style={{ height:'44px' }}>+ Create</button>
                  </div>
                </div>
              </div>
              {activities.map((a:any) => (
                <div key={a.id} className="ps-row" style={{ opacity: a.is_active ? 1 : .5 }}>
                  <div style={{ flex:1 }}>
                    <div className="ps-row-title">{a.name}</div>
                    <div className="ps-row-sub">{a.category} · {a.point_value} pts</div>
                  </div>
                  <button className={`ps-btn ${a.is_active ? 'danger' : 'green'}`} onClick={()=>toggleActivity(a.id, a.is_active)}>
                    {a.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ))}
            </>
          )}

          {/* ADJUST */}
          {tab === 'adjust' && (
            <div className="ps-card">
              <div className="ps-card-hdr"><div className="ps-card-title">Manual Point Adjustment</div></div>
              <div className="ps-card-body">
                <div className="ps-field">
                  <label className="ps-label">Brother</label>
                  <select className="ps-select" value={adjust.member_id} onChange={e=>setAdjust(f=>({...f,member_id:e.target.value}))}>
                    <option value="">Select brother...</option>
                    {roster.map((r:any) => <option key={r.member_id} value={r.member_id}>{r.frat_name} ({r.balance} pts)</option>)}
                  </select>
                </div>
                <div className="ps-field">
                  <label className="ps-label">Points (negative to deduct)</label>
                  <input className="ps-input" type="number" value={adjust.points} onChange={e=>setAdjust(f=>({...f,points:e.target.value}))} placeholder="e.g. 50 or -25" />
                </div>
                <div className="ps-field">
                  <label className="ps-label">Reason</label>
                  <input className="ps-input" value={adjust.note} onChange={e=>setAdjust(f=>({...f,note:e.target.value}))} placeholder="Reason for adjustment..." />
                </div>
                <button className="ps-btn gold" onClick={doAdjust} disabled={saving} style={{ marginTop:'.3rem' }}>{saving ? 'Saving...' : 'Apply Adjustment →'}</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
