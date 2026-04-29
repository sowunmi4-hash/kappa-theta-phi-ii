'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import '../phire.css';



const LEADERS = ['Head Founder','Co-Founder','Iron Fleet'];
const CATEGORIES = ['General','Attendance','Service','Recruitment','Outreach','Leadership','Training'];

export default function PhireManage() {
  const [member, setMember] = useState<any>(null);
  const [tab, setTab] = useState<'queue'|'activities'|'adjust'|'redemptions'>('queue');
  const [queue, setQueue] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [denyNote, setDenyNote] = useState('');
  const [denyId, setDenyId] = useState<string|null>(null);
  const [newActivity, setNewActivity] = useState({ name:'', point_value:'', category:'General' });
  const [adjust, setAdjust] = useState({ member_id:'', points:'', note:'' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const slug = member?.frat_name?.toLowerCase().replace(/\s+/g,'-').replace('big-brother-','') || '';
  const portrait = `/brothers/${slug}.png`;
  const NAV = [
    { href: '/dashboard', label: 'Home' },
    { href: '/dashboard/news', label: 'Wokou News' },
    { href: '/dashboard/events', label: 'Events' },
    { href: '/dashboard/phire', label: 'PHIRE' },
    { href: '/dashboard/discipline', label: 'Discipline' },
    { href: '/dashboard/ssp', label: 'SSP' },
  { href: '/dashboard/dues', label: 'Dues' },
    { href: '/dashboard/gallery', label: 'My Gallery' },
    { href: '/dashboard/edit', label: 'Edit Profile' },
  ];
  const Sidebar = () => (
    <aside className="dash-sidebar">
      <div className="dash-sidebar-logo"><img src="/logo.png" alt="KΘΦ II" /><span className="dash-sidebar-logo-text">KΘΦ II</span></div>
      <div className="dash-sidebar-member">
        <div className="dash-sidebar-portrait"><img src={portrait} alt="" onError={(e:any)=>e.target.src='/logo.png'}/></div>
        <div className="dash-sidebar-name">{member?.frat_name}</div>
        <div className="dash-sidebar-role">{member?.role}</div>
      </div>
      <nav className="dash-nav">
        {NAV.map(n => <a key={n.href} href={n.href} className={`dash-nav-item ${typeof window !== 'undefined' && window.location.pathname === n.href ? 'active' : ''}`}><span>{n.label}</span></a>)}
        <div className="dash-nav-divider"/>
        <a href="/" className="dash-nav-item"><span>Back to Site</span></a>
      </nav>
    </aside>
  );
  useEffect(() => {
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>{ if(d.error){window.location.href='/login';return;} if(!LEADERS.includes(d.member.role)){window.location.href='/dashboard/phire';return;} setMember(d.member); });
    loadAll();
  }, []);

  // POLLING: refresh approval queue every 20s
  useEffect(() => {
    const poll = setInterval(() => { loadAll(); }, 20000);
    return () => clearInterval(poll);
  }, []);

  async function loadAll() {
    const [q, a, reds] = await Promise.all([
      fetch('/api/dashboard/phire/submissions?view=pending').then(r=>r.json()),
      fetch('/api/dashboard/phire/activities').then(r=>r.json()),
      fetch('/api/dashboard/phire/submissions?view=all').then(r=>r.json()),
    ]);
    setQueue(q.submissions||[]);
    setActivities(a.activities||[]);
    // Get pending redemptions from roster via a hacky approach - fetch all subs
    fetch('/api/dashboard/phire/rewards').catch(()=>{});
  }

  async function loadRoster() {
    if (roster.length) return;
    const res = await fetch('/api/dashboard/roster').then(r=>r.json());
    setRoster(res.members||[]);
  }

  async function review(submission_id: string, action: 'approve'|'deny', note='') {
    setSaving(true);
    await fetch('/api/dashboard/phire/review', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ submission_id, action, note }) });
    setSaving(false); setDenyId(null); setDenyNote('');
    await loadAll();
  }

  async function createActivity() {
    if (!newActivity.name || !newActivity.point_value) { setMsg('Fill in all fields'); return; }
    setSaving(true);
    await fetch('/api/dashboard/phire/activities', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(newActivity) });
    setMsg('✅ Activity created'); setNewActivity({ name:'', point_value:'', category:'General' });
    setSaving(false); await loadAll();
  }

  async function toggleActivity(id: string, is_active: boolean) {
    await fetch('/api/dashboard/phire/activities', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, is_active: !is_active }) });
    await loadAll();
  }

  async function doAdjust() {
    if (!adjust.member_id || !adjust.points || !adjust.note) { setMsg('Fill in all fields'); return; }
    setSaving(true);
    const res = await fetch('/api/dashboard/phire/adjust', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ member_id: adjust.member_id, points: parseInt(adjust.points), note: adjust.note }) }).then(r=>r.json());
    setMsg(res.error ? `❌ ${res.error}` : `✅ Done! New balance: ${res.new_balance}`);
    setAdjust({ member_id:'', points:'', note:'' });
    setSaving(false);
  }

  function timeAgo(d:string){ const s=Math.floor((Date.now()-new Date(d).getTime())/1000); if(s<60) return 'just now'; if(s<3600) return `${Math.floor(s/60)}m ago`; if(s<86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`; }

  if (!member) return <div className="dash-loading">LOADING...</div>;

  return (
    <div className="dash-app phire-root">
      <Sidebar />
      <main className="dash-main">
        <div className="phire-manage-wrap">
          <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'1.5rem'}}>
            <a href="/dashboard/phire" style={{color:'var(--muted)',textDecoration:'none',fontSize:'0.75rem',letterSpacing:'2px'}}>← PHIRE</a>
            <div className="phire-submit-title" style={{margin:0}}>Manage PHIRE</div>
          </div>

          {msg && <div style={{padding:'0.7rem 1.2rem',background:msg.startsWith('✅')?'rgba(74,222,128,0.08)':'rgba(178,34,52,0.08)',border:`1px solid ${msg.startsWith('✅')?'rgba(74,222,128,0.2)':'rgba(178,34,52,0.2)'}`,borderRadius:'6px',fontSize:'0.8rem',color:msg.startsWith('✅')?'#4ade80':'#e05070',marginBottom:'1rem'}}>{msg}</div>}

          <div className="phire-tabs manage-tabs">
            <button className={`phire-tab ${tab==='queue'?'active':''}`} onClick={()=>setTab('queue')}>
              Approval Queue {queue.length>0 && <span style={{background:'var(--crimson)',color:'#fff',padding:'0 5px',borderRadius:'8px',fontSize:'0.55rem',marginLeft:'4px'}}>{queue.length}</span>}
            </button>
            <button className={`phire-tab ${tab==='activities'?'active':''}`} onClick={()=>setTab('activities')}>Activities</button>
            <button className={`phire-tab ${tab==='adjust'?'active':''}`} onClick={()=>{setTab('adjust');loadRoster();}}>Adjust Points</button>
          </div>

          {/* APPROVAL QUEUE */}
          {tab === 'queue' && (
            <>
              {queue.length === 0 && <div className="phire-empty">No pending submissions. All clear ✓</div>}
              {queue.map((s:any) => (
                <div key={s.id}>
                  <div className="queue-item">
                    <div style={{flex:1}}>
                      <div className="queue-member">{s.member_name}</div>
                      <div className="queue-activity">{s.activity_name}</div>
                      <div style={{fontSize:'0.62rem',color:'var(--muted)',marginTop:'2px'}}>{timeAgo(s.created_at)}</div>
                    </div>
                    <div className="queue-pts">+{s.point_value} pts</div>
                    <div className="queue-actions">
                      <button className="queue-btn approve" onClick={()=>review(s.id,'approve')} disabled={saving}>✓ Approve</button>
                      <button className="queue-btn deny" onClick={()=>setDenyId(s.id)} disabled={saving}>✕ Deny</button>
                    </div>
                  </div>
                  {denyId === s.id && (
                    <div style={{background:'var(--raised)',border:'1px solid rgba(178,34,52,0.2)',borderRadius:'6px',padding:'0.8rem 1rem',marginBottom:'2px',display:'flex',gap:'8px'}}>
                      <input className="field-input" style={{flex:1,fontSize:'0.8rem'}} placeholder="Reason for denial (optional)..." value={denyNote} onChange={e=>setDenyNote(e.target.value)} />
                      <button className="queue-btn deny" onClick={()=>review(s.id,'deny',denyNote)}>Confirm Deny</button>
                      <button className="queue-btn" style={{borderColor:'var(--border)',color:'var(--muted)'}} onClick={()=>setDenyId(null)}>Cancel</button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* ACTIVITIES */}
          {tab === 'activities' && (
            <>
              {/* Create new */}
              <div className="phire-card" style={{marginBottom:'1.5rem'}}>
                <div className="phire-card-header"><div className="phire-card-title">Create Activity</div></div>
                <div className="phire-card-body" style={{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'flex-end'}}>
                  <div className="field-group" style={{flex:'2',minWidth:'160px',marginBottom:0}}>
                    <label className="field-label">Name</label>
                    <input className="field-input" value={newActivity.name} onChange={e=>setNewActivity(f=>({...f,name:e.target.value}))} placeholder="Activity name..." />
                  </div>
                  <div className="field-group" style={{width:'100px',marginBottom:0}}>
                    <label className="field-label">Points</label>
                    <input className="field-input" type="number" min="1" value={newActivity.point_value} onChange={e=>setNewActivity(f=>({...f,point_value:e.target.value}))} placeholder="pts" />
                  </div>
                  <div className="field-group" style={{width:'140px',marginBottom:0}}>
                    <label className="field-label">Category</label>
                    <select className="field-input" value={newActivity.category} onChange={e=>setNewActivity(f=>({...f,category:e.target.value}))}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <button className="btn btn-gold" onClick={createActivity} disabled={saving} style={{height:'40px'}}>+ Create</button>
                </div>
              </div>

              {/* List */}
              {activities.map((a:any) => (
                <div key={a.id} className="queue-item" style={{opacity:a.is_active?1:0.5}}>
                  <div style={{flex:1}}>
                    <div className="queue-member" style={{fontSize:'0.85rem'}}>{a.name}</div>
                    <div className="queue-activity">{a.category}</div>
                  </div>
                  <div className="queue-pts">{a.point_value} pts</div>
                  <button className="queue-btn" style={{borderColor:a.is_active?'rgba(178,34,52,0.3)':'rgba(74,222,128,0.3)',color:a.is_active?'#e05070':'#4ade80'}} onClick={()=>toggleActivity(a.id,a.is_active)}>
                    {a.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ))}
            </>
          )}

          {/* ADJUST POINTS */}
          {tab === 'adjust' && (
            <div className="phire-card">
              <div className="phire-card-header"><div className="phire-card-title">Manual Point Adjustment</div></div>
              <div className="phire-card-body" style={{display:'flex',flexDirection:'column',gap:'0.8rem'}}>
                <div className="field-group" style={{marginBottom:0}}>
                  <label className="field-label">Brother</label>
                  <select className="field-input" value={adjust.member_id} onChange={e=>setAdjust(f=>({...f,member_id:e.target.value}))}>
                    <option value="">Select brother...</option>
                    {roster.map((r:any) => <option key={r.member_id} value={r.member_id}>{r.frat_name} ({r.balance} pts)</option>)}
                  </select>
                </div>
                <div className="field-group" style={{marginBottom:0}}>
                  <label className="field-label">Points (use negative to deduct)</label>
                  <input className="field-input" type="number" value={adjust.points} onChange={e=>setAdjust(f=>({...f,points:e.target.value}))} placeholder="e.g. 50 or -25" />
                </div>
                <div className="field-group" style={{marginBottom:0}}>
                  <label className="field-label">Reason</label>
                  <input className="field-input" value={adjust.note} onChange={e=>setAdjust(f=>({...f,note:e.target.value}))} placeholder="Reason for adjustment..." />
                </div>
                <button className="btn btn-gold" onClick={doAdjust} disabled={saving}>{saving?'Saving...':'Apply Adjustment'}</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
