'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import '../phire.css';

export default function SubmitActivity() {
  const [member, setMember] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [selected, setSelected] = useState<string|null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [myPending, setMyPending] = useState<string[]>([]);

  const slug = member.frat_name?.toLowerCase().replace(/\s+/g,'-').replace('big-brother-','') || '';
  const portrait = `/brothers/${slug}.png`;
  const NAV = [
    { href: '/dashboard', label: 'Home' },
    { href: '/dashboard/news', label: 'Wokou News' },
    { href: '/dashboard/events', label: 'Events' },
    { href: '/dashboard/phire', label: 'PHIRE' },
    { href: '/dashboard/gallery', label: 'My Gallery' },
    { href: '/dashboard/edit', label: 'Edit Profile' },
  ];
  const Sidebar = () => (
    <aside className="dash-sidebar">
      <div className="dash-sidebar-logo"><img src="/logo.png" alt="KΘΦ II" /><span className="dash-sidebar-logo-text">KΘΦ II</span></div>
      <div className="dash-sidebar-member">
        <div className="dash-sidebar-portrait"><img src={portrait} alt="" onError={(e:any)=>e.target.src='/logo.png'}/></div>
        <div className="dash-sidebar-name">{member.frat_name}</div>
        <div className="dash-sidebar-role">{member.role}</div>
      </div>
      <nav className="dash-nav">
        {NAV.map(n => <a key={n.href} href={n.href} className={`dash-nav-item ${typeof window !== 'undefined' && window.location.pathname === n.href ? 'active' : ''}`}><span>{n.label}</span></a>)}
        <div className="dash-nav-divider"/>
        <a href="/" className="dash-nav-item"><span>Back to Site</span></a>
      </nav>
    </aside>
  );
  useEffect(() => {
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d => { if(d.error){window.location.href='/login';return;} setMember(d.member); });
    fetch('/api/dashboard/phire/activities').then(r=>r.json()).then(d => setActivities(d.activities||[]));
    fetch('/api/dashboard/phire/submissions?view=own').then(r=>r.json()).then(d => {
      const pending = (d.submissions||[]).filter((s:any)=>s.status==='pending').map((s:any)=>s.activity_id);
      setMyPending(pending);
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

  // Group activities by category
  const grouped: Record<string,any[]> = {};
  activities.forEach(a => { if(!grouped[a.category]) grouped[a.category]=[]; grouped[a.category].push(a); });

  return (
    <div className="dash-app phire-root">
      <Sidebar />
      <main className="dash-main">
        <div className="phire-submit-wrap">
          <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'2rem'}}>
            <a href="/dashboard/phire" style={{color:'var(--muted)',textDecoration:'none',fontSize:'0.75rem',letterSpacing:'2px'}}>← PHIRE</a>
            <div className="phire-submit-title" style={{margin:0}}>Log Activity</div>
          </div>

          {done ? (
            <div style={{textAlign:'center',padding:'3rem',background:'var(--surface)',border:'1px solid rgba(74,222,128,0.2)',borderRadius:'10px'}}>
              <div style={{fontSize:'2rem',marginBottom:'1rem'}}>✅</div>
              <div style={{fontSize:'1rem',color:'#4ade80',letterSpacing:'2px',marginBottom:'0.5rem'}}>SUBMITTED FOR APPROVAL</div>
              <div style={{fontSize:'0.8rem',color:'var(--muted)',marginBottom:'1.5rem'}}>Leadership has been notified and will review your submission.</div>
              <div style={{display:'flex',gap:'0.8rem',justifyContent:'center'}}>
                <button className="btn btn-gold" onClick={()=>{setDone(false);setSelected(null);}}>Submit Another</button>
                <a href="/dashboard/phire" className="btn btn-ghost">Back to PHIRE</a>
              </div>
            </div>
          ) : (
            <>
              {error && <div style={{background:'rgba(178,34,52,0.1)',border:'1px solid rgba(178,34,52,0.3)',borderRadius:'6px',padding:'0.8rem 1.2rem',color:'#e05070',fontSize:'0.82rem',marginBottom:'1rem'}}>{error}</div>}

              {Object.entries(grouped).map(([cat, acts]) => (
                <div key={cat} className="activity-category">
                  <div className="activity-category-label">{cat}</div>
                  <div className="activity-list">
                    {acts.map((a:any) => {
                      const isPending = myPending.includes(a.id);
                      return (
                        <div key={a.id} className={`activity-item ${selected===a.id?'selected':''} ${isPending?'':''}`}
                          onClick={() => !isPending && setSelected(a.id)}
                          style={{ opacity: isPending ? 0.5 : 1, cursor: isPending ? 'not-allowed' : 'pointer' }}>
                          <div>
                            <div className="activity-name">{a.name}</div>
                            {isPending && <div className="activity-status">⏳ Pending approval</div>}
                          </div>
                          <div style={{textAlign:'right'}}>
                            <div className="activity-pts">+{a.point_value} pts</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {selected && (
                <div style={{position:'sticky',bottom:'1.5rem',display:'flex',gap:'0.8rem',justifyContent:'center',marginTop:'1.5rem'}}>
                  <button className="btn btn-gold" onClick={submit} disabled={submitting} style={{padding:'0.75rem 2.5rem',fontSize:'0.85rem'}}>
                    {submitting ? 'Submitting...' : 'Submit for Approval'}
                  </button>
                  <button className="btn btn-ghost" onClick={()=>setSelected(null)}>Clear</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
