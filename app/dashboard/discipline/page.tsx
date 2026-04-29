'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from 'react';
import '../dash.css';
import './discipline.css';



const COLORS = [
  { id:'grey',       label:'Grey',        icon:'' },
  { id:'navy_blue',  label:'Navy Blue',   icon:'' },
  { id:'gold',       label:'Gold',        icon:'' },
  { id:'crimson_red',label:'Crimson Red', icon:'' },
];
const FINE_AMOUNTS: Record<string,number> = { navy_blue:1500, gold:3000 };
const SSP_STATUS_LABELS: Record<string,string> = { offered:'Offered', enrolled:'Enrolled', completed:'Completed', opted_out:'Opted Out' };
const FINE_STATUS_LABELS: Record<string,string> = { pending:'Pending', payment_plan:'Payment Plan', paid:'Paid' };

function timeAgo(d:string){ const s=Math.floor((Date.now()-new Date(d).getTime())/1000); if(s<86400) return `${Math.floor(s/3600)}h ago`; if(s<604800) return `${Math.floor(s/86400)}d ago`; return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }

export default function DisciplinePage() {
  const [member, setMember]       = useState<any>(null);
  const [canManage, setCanManage] = useState(false);
  const [tab, setTab]             = useState<'all'|'issue'|'my'|'dues'>('all');
  const [duesReport, setDuesReport] = useState<any>(null);
  const [duesPeriod, setDuesPeriod] = useState<string>('');
  const [duesLoading, setDuesLoading] = useState(false);
  const [violations, setViolations] = useState<any[]>([]);
  const [roster, setRoster]       = useState<any[]>([]);
  const [openCards, setOpenCards] = useState<Set<string>>(new Set());
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState<any>(null);

  // Issue form state
  const [form, setForm] = useState({
    member_id:'', offense_color:'grey',
    violations:[''], is_repeat:false, notes:''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg]   = useState('');

  // My record
  const [myRecord, setMyRecord]   = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d => {
      if (d.error) { window.location.href='/login'; return; }
      setMember(d.member);
      // Check if this member can see dues report
      const canSeeDues = d.member?.fraction === 'Ishi No Fraction' || d.member?.frat_name === 'Big Brother Substance';
      if (canSeeDues) {
        loadDuesReport('');
      }
    });
  }, []);

  useEffect(() => {
    if (!member) return;
    const manage = member.fraction==='Ishi No Faction' || member.role==='Head Founder' || member.role==='Co-Founder';
    setCanManage(manage);
    if (manage) {
      loadAll();
      fetch('/api/dashboard/roster').then(r=>r.json()).then(d=>setRoster(d.members||[]));
    }
    fetch('/api/dashboard/discipline/my-record').then(r=>r.json()).then(d=>setMyRecord(d.violations||[]));
    setLoading(false);
  }, [member]);

  // POLLING: silent background refresh every 30s
  useEffect(() => {
    if (!member) return;
    const manage = member.fraction==='Ishi No Faction' || member.role==='Head Founder' || member.role==='Co-Founder';
    const poll = setInterval(() => {
      if (manage) loadAll();
      fetch('/api/dashboard/discipline/my-record').then(r=>r.json()).then(d=>setMyRecord(d.violations||[]));
    }, 30000);
    return () => clearInterval(poll);
  }, [member]);

  async function loadAll() {
    const d = await fetch('/api/dashboard/discipline/violations?view=all').then(r=>r.json());
    setViolations(d.violations||[]);
  }

  function toggleCard(id:string) {
    setOpenCards(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function issueViolation() {
    if (!form.member_id || !form.offense_color || !form.violations.some(v=>v.trim())) {
      setSubmitMsg('Please select a brother, offense color, and at least one violation.'); return;
    }
    setSubmitting(true); setSubmitMsg('');
    const res = await fetch('/api/dashboard/discipline/violations', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...form, violations: form.violations.filter(v=>v.trim()),
        member_name: roster.find(r=>r.member_id===form.member_id)?.frat_name||'Unknown' })
    }).then(r=>r.json());
    if (res.error) { setSubmitMsg(`${res.error}`); setSubmitting(false); return; }
    setSubmitMsg('Violation issued successfully.');
    setForm({ member_id:'', offense_color:'grey', violations:[''], is_repeat:false, notes:'' });
    setSubmitting(false);
    await loadAll();
    setTimeout(() => setSubmitMsg(''), 4000);
  }

  async function updateSSP(ssp_id:string, status:string, extra={}) {
    await fetch('/api/dashboard/discipline/ssp', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ssp_id, status, ...extra }) });
    await loadAll();
  }

  async function updateFine(fine_id:string, status:string, extra={}) {
    await fetch('/api/dashboard/discipline/fines', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ fine_id, status, ...extra }) });
    await loadAll();
  }

  async function liftSuspension(suspension_id:string) {
    if (!confirm('Lift this suspension early?')) return;
    await fetch('/api/dashboard/discipline/suspensions', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ suspension_id, action:'lift' }) });
    await loadAll();
  }

  async function logCourtMarshall(violation_id:string, member_id:string, data:any) {
    await fetch('/api/dashboard/discipline/court-marshall', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ violation_id, member_id, ...data }) });
    setModal(null); await loadAll();
  }

  const colorCounts: Record<string,number> = { grey:0, navy_blue:0, gold:0, crimson_red:0 };
  violations.forEach(v => { if (colorCounts[v.offense_color]!==undefined) colorCounts[v.offense_color]++; });

  const slug = member?.frat_name?.toLowerCase().replace(/\s+/g,'-').replace('big-brother-','') || '';
  const NAV = [
    { href:'/dashboard', label:'Home' },
    { href:'/dashboard/news', label:'Wokou News' },
    { href:'/dashboard/events', label:'Events' },
    { href:'/dashboard/phire', label:'PHIRE' },
    { href:'/dashboard/gallery', label:'My Gallery' },
    { href:'/dashboard/edit', label:'Edit Profile' },
  ];

  if (!member || loading) return <div className="dash-loading">LOADING...</div>;

  // Non-managers only see their own record
  if (!canManage) {
    return (
      <div className="dash-app disc-root">
        <aside className="dash-sidebar">
          <div className="dash-sidebar-logo"><img src="/logo.png" alt="KΘΦ II"/><span className="dash-sidebar-logo-text">KΘΦ II</span></div>
          <div className="dash-sidebar-member">
            <div className="dash-sidebar-portrait"><img src={`/brothers/${slug}.png`} alt="" onError={(e:any)=>e.target.src='/logo.png'}/></div>
            <div className="dash-sidebar-name">{member.frat_name}</div>
            <div className="dash-sidebar-role">{member.role}</div>
          </div>
          <nav className="dash-nav">
            {NAV.map(n=><a key={n.href} href={n.href} className="dash-nav-item"><span>{n.label}</span></a>)}
            <div className="dash-nav-divider"/><a href="/" className="dash-nav-item"><span>Back to Site</span></a>
          </nav>
        </aside>
        <main className="dash-main">
          <div className="disc-hero"><div className="disc-hero-title">My Discipline Record</div><div className="disc-hero-sub">Your personal record — private and visible only to you</div></div>
          <div className="disc-content">
            <MemberRecord violations={myRecord} onReload={async()=>{ const d=await fetch('/api/dashboard/discipline/my-record').then(r=>r.json()); setMyRecord(d.violations||[]); }} />
          </div>
        {/* DUES REPORT TAB */}
        {tab === 'dues' && canSeeDues && (
          <div style={{padding:'1.5rem'}}>
            {/* Period selector */}
            {duesReport?.periods?.length > 0 && (
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'1.5rem',alignItems:'center'}}>
                <span style={{fontSize:'0.6rem',letterSpacing:'3px',color:'var(--muted)',textTransform:'uppercase'}}>Period:</span>
                {duesReport.periods.map((p:any) => (
                  <button key={p.id} onClick={()=>{ setDuesPeriod(p.id); loadDuesReport(p.id); }}
                    style={{padding:'4px 12px',borderRadius:'20px',fontSize:'0.72rem',cursor:'pointer',fontFamily:'Rajdhani,sans-serif',
                      background: duesPeriod===p.id || (!duesPeriod && p.id===duesReport?.period?.id) ? 'rgba(198,147,10,0.1)' : 'var(--surface)',
                      border: duesPeriod===p.id || (!duesPeriod && p.id===duesReport?.period?.id) ? '1px solid rgba(198,147,10,0.4)' : '1px solid var(--border)',
                      color: duesPeriod===p.id || (!duesPeriod && p.id===duesReport?.period?.id) ? 'var(--gold)' : 'var(--muted)'}}>
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {duesLoading && <div style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}>Loading report...</div>}

            {!duesLoading && duesReport && (
              <>
                {/* Summary stats */}
                {duesReport.summary && (
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',marginBottom:'1.5rem'}}>
                    {[
                      {label:'Paid',val:duesReport.summary.paid,color:'#4ade80'},
                      {label:'Partial',val:duesReport.summary.partial,color:'#c6930a'},
                      {label:'Unpaid',val:duesReport.summary.unpaid,color:'#e05070'},
                      {label:'Total Collected',val:`L$${duesReport.summary.total_collected.toLocaleString()}`,color:'var(--bone)'},
                    ].map(s => (
                      <div key={s.label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'8px',padding:'0.8rem',textAlign:'center'}}>
                        <div style={{fontSize:'1.4rem',fontWeight:800,color:s.color}}>{s.val}</div>
                        <div style={{fontSize:'0.6rem',letterSpacing:'2px',color:'var(--muted)',marginTop:'2px',textTransform:'uppercase'}}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* DISCIPLINARY REPORT - visible to all Ishi No Faction */}
                <div style={{background:'rgba(178,34,52,0.06)',border:'1px solid rgba(178,34,52,0.2)',borderRadius:'10px',padding:'1.2rem',marginBottom:'1.5rem'}}>
                  <div style={{fontSize:'0.6rem',letterSpacing:'3px',color:'#e05070',textTransform:'uppercase',marginBottom:'1rem',fontWeight:700}}>
                    ⚔ Disciplinary Report — Outstanding Dues ({duesReport.disciplinary?.length || 0} Brothers)
                  </div>
                  {duesReport.disciplinary?.length === 0 && (
                    <div style={{textAlign:'center',padding:'1rem',color:'var(--muted)',fontSize:'0.85rem'}}>All brothers are in good standing this period.</div>
                  )}
                  {duesReport.disciplinary?.map((rec:any) => {
                    const owed = rec.amount_due - rec.linden_paid - rec.sweat_equity_value;
                    return (
                      <div key={rec.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.7rem 0.9rem',background:'var(--raised)',border:'1px solid var(--border)',borderRadius:'6px',marginBottom:'4px'}}>
                        <div>
                          <div style={{fontWeight:700,color:'var(--bone)',fontSize:'0.9rem'}}>{rec.member_name}</div>
                          <div style={{fontSize:'0.7rem',color:'var(--muted)',marginTop:'2px'}}>
                            Paid L${rec.linden_paid.toLocaleString()} + L${rec.sweat_equity_value.toLocaleString()} sweat equity — outstanding L${owed.toLocaleString()}
                          </div>
                        </div>
                        <span style={{fontSize:'0.6rem',letterSpacing:'2px',padding:'2px 10px',borderRadius:'3px',fontWeight:700,textTransform:'uppercase',
                          color:rec.status==='partial'?'#c6930a':'#e05070',
                          background:rec.status==='partial'?'rgba(198,147,10,0.08)':'rgba(178,34,52,0.08)',
                          border:`1px solid ${rec.status==='partial'?'rgba(198,147,10,0.25)':'rgba(178,34,52,0.25)'}`}}>
                          {rec.status}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* FULL REPORT - Substance only */}
                {duesReport.can_see_full && duesReport.full_records && (
                  <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'10px',padding:'1.2rem'}}>
                    <div style={{fontSize:'0.6rem',letterSpacing:'3px',color:'var(--gold)',textTransform:'uppercase',marginBottom:'1rem',fontWeight:700}}>
                      ◈ Full Dues Report — All Brothers ({duesReport.full_records.length})
                    </div>
                    {duesReport.full_records.map((rec:any) => {
                      const remaining = Math.max(0, rec.amount_due - rec.linden_paid - rec.sweat_equity_value);
                      const progress = Math.min(100, Math.round(((rec.linden_paid + rec.sweat_equity_value) / rec.amount_due) * 100));
                      const statusColor:any = {paid:'#4ade80',partial:'#c6930a',unpaid:'#e05070',waived:'rgba(240,232,208,0.2)'};
                      return (
                        <div key={rec.id} style={{borderLeft:`3px solid ${statusColor[rec.status]}`,background:'var(--raised)',borderRadius:'6px',padding:'0.8rem 1rem',marginBottom:'6px'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
                            <span style={{fontWeight:700,color:'var(--bone)'}}>{rec.member_name}</span>
                            <span style={{fontSize:'0.6rem',letterSpacing:'2px',padding:'2px 10px',borderRadius:'3px',fontWeight:700,textTransform:'uppercase',
                              color:statusColor[rec.status],background:'rgba(0,0,0,0.2)',border:`1px solid ${statusColor[rec.status]}44`}}>
                              {rec.status}
                            </span>
                          </div>
                          <div style={{height:'2px',background:'var(--border)',borderRadius:'2px',marginBottom:'4px'}}>
                            <div style={{height:'100%',width:`${progress}%`,background:statusColor[rec.status],borderRadius:'2px'}}/>
                          </div>
                          <div style={{display:'flex',gap:'1rem',fontSize:'0.7rem',color:'var(--muted)'}}>
                            <span style={{color:'#4ade80'}}>L${rec.linden_paid.toLocaleString()} cash</span>
                            <span style={{color:'#c6930a'}}>L${rec.sweat_equity_value.toLocaleString()} sweat</span>
                            <span style={{color:'#e05070'}}>L${remaining.toLocaleString()} remaining</span>
                            {rec.payments?.length > 0 && <span>{rec.payments.length} payment{rec.payments.length!==1?'s':''}</span>}
                            {rec.sweat_equity?.length > 0 && <span>{rec.sweat_equity.length} sweat submission{rec.sweat_equity.length!==1?'s':''}</span>}
                          </div>
                          {rec.payments?.map((p:any) => (
                            <div key={p.id} style={{marginTop:'4px',fontSize:'0.68rem',color:'rgba(240,232,208,0.3)',paddingLeft:'8px'}}>
                              └ L${p.amount_ls.toLocaleString()} on {new Date(p.created_at).toLocaleDateString('en-GB')}
                              {p.transaction_id && <span style={{fontFamily:'monospace',marginLeft:'6px'}}>{p.transaction_id.slice(0,16)}...</span>}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    <div style={{marginTop:'1rem',padding:'0.8rem',background:'var(--raised)',borderRadius:'6px',fontSize:'0.78rem',color:'var(--muted)',display:'flex',gap:'2rem'}}>
                      <span>Total collected: <strong style={{color:'#4ade80'}}>L${duesReport.summary.total_collected.toLocaleString()}</strong></span>
                      <span>Sweat equity: <strong style={{color:'#c6930a'}}>L${duesReport.summary.total_sweat.toLocaleString()}</strong></span>
                      <span>Brothers paid: <strong style={{color:'var(--bone)'}}>{duesReport.summary.paid}/{duesReport.summary.total}</strong></span>
                    </div>
                  </div>
                )}
              </>
            )}

            {!duesLoading && !duesReport && (
              <div style={{textAlign:'center',padding:'3rem',color:'var(--muted)'}}>No dues periods found.</div>
            )}
          </div>
        )}

        </main>
      </div>
    );
  }

  return (
    <div className="dash-app disc-root">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-logo"><img src="/logo.png" alt="KΘΦ II"/><span className="dash-sidebar-logo-text">KΘΦ II</span></div>
        <div className="dash-sidebar-member">
          <div className="dash-sidebar-portrait"><img src={`/brothers/${slug}.png`} alt="" onError={(e:any)=>e.target.src='/logo.png'}/></div>
          <div className="dash-sidebar-name">{member.frat_name}</div>
          <div className="dash-sidebar-role">{member.role}</div>
        </div>
        <nav className="dash-nav">
          {NAV.map(n=><a key={n.href} href={n.href} className="dash-nav-item"><span>{n.label}</span></a>)}
          <div className="dash-nav-divider"/><a href="/" className="dash-nav-item"><span>Back to Site</span></a>
        </nav>
      </aside>

      <main className="dash-main">
        <div className="disc-hero">
          <div className="disc-hero-title">Discipline & Enforcement</div>
          <div className="disc-hero-sub">KΘΦ II Color System — Ishi No Faction Management</div>
        </div>

        <div className="disc-content">
          {/* Stats */}
          <div className="disc-stats">
            {COLORS.map(c=>(
              <div key={c.id} className={`disc-stat ${c.id}`}>
                <div className="disc-stat-num">{colorCounts[c.id]}</div>
                <div className="disc-stat-label">{c.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="disc-tabs">
            <button className={`disc-tab ${tab==='all'?'active':''}`} onClick={()=>setTab('all')}>All Violations ({violations.length})</button>
            <button className={`disc-tab ${tab==='issue'?'active':''}`} onClick={()=>setTab('issue')}>Issue Violation</button>
            <button className={`disc-tab ${tab==='my'?'active':''}`} onClick={()=>setTab('my')}>My Record</button>
            {canSeeDues && <button className={`disc-tab ${tab==='dues'?'active':''}`} onClick={()=>setTab('dues')} style={{color: tab==='dues' ? 'var(--gold)' : 'var(--muted)'}}>Dues Report</button>}
          </div>

          {/* ALL VIOLATIONS */}
          {tab==='all' && (
            <>
              {violations.length===0 && <div style={{textAlign:'center',padding:'3rem',color:'var(--muted)',fontSize:'0.85rem'}}>No violations on record.</div>}
              {violations.map(v=>(
                <ViolationCard key={v.id} v={v} open={openCards.has(v.id)} onToggle={()=>toggleCard(v.id)}
                  canManage={canManage} onSSP={updateSSP} onFine={updateFine} onLiftSusp={liftSuspension}
                  onCourtMarshall={()=>setModal(v)} onReload={loadAll} />
              ))}
            </>
          )}

          {/* ISSUE VIOLATION */}
          {tab==='issue' && (
            <div className="disc-form-wrap">
              <div className="disc-form-title">Issue New Violation</div>

              {submitMsg && (
                <div style={{padding:'0.7rem 1rem',borderRadius:'6px',marginBottom:'1rem',fontSize:'0.82rem',background:submitMsg.startsWith('')?'rgba(74,222,128,0.08)':'rgba(178,34,52,0.08)',border:`1px solid ${submitMsg.startsWith('')?'rgba(74,222,128,0.2)':'rgba(178,34,52,0.2)'}`,color:submitMsg.startsWith('')?'#4ade80':'#e05070'}}>
                  {submitMsg}
                </div>
              )}

              <div className="field-group" style={{marginBottom:'1rem'}}>
                <label className="field-label">Brother</label>
                <select className="disc-member-select" value={form.member_id} onChange={e=>setForm(f=>({...f,member_id:e.target.value}))}>
                  <option value="">Select brother...</option>
                  {roster.map(r=><option key={r.member_id} value={r.member_id}>{r.frat_name}</option>)}
                </select>
              </div>

              <div className="field-group" style={{marginBottom:'1rem'}}>
                <label className="field-label">Offense Color</label>
                <div className="disc-color-picker">
                  {COLORS.map(c=>(
                    <button key={c.id} className={`disc-color-opt ${c.id} ${form.offense_color===c.id?'selected':''}`} onClick={()=>setForm(f=>({...f,offense_color:c.id}))}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Offense description */}
              <div style={{background:'var(--raised)',border:'1px solid var(--border)',borderRadius:'8px',padding:'0.9rem 1rem',marginBottom:'1rem',fontSize:'0.78rem',color:'var(--muted)',lineHeight:'1.6'}}>
                {form.offense_color==='grey' && <><strong style={{color:'var(--grey-c)'}}>Grey Offense:</strong> Counseling with Sgt. at Arms and Chief Admin. Sage Solution Program offered and explained. Class time set for all brothers.</>}
                {form.offense_color==='navy_blue' && <><strong style={{color:'var(--navy-c)'}}>Navy Blue Offense:</strong> Counseling with Sgt. at Arms and Chief Admin. SSP offered (warrant + 1,500L fine if opted out). 1st Warrant issued. 1 week to pay fine.</>}
                {form.offense_color==='gold' && <><strong style={{color:'var(--gold-c)'}}>Gold Offense:</strong> Meeting with Daimyo and Chief Admin. SSP offered (warrant + 3,000L fine if opted out). 2nd Warrant issued. 1 month gear prohibition + suspension from ALL frat activities. 3,000L fine, 1 week to pay.</>}
                {form.offense_color==='crimson_red' && <><strong style={{color:'var(--crimson-c)'}}>Crimson Red Offense:</strong> Corsair Court Marshall with ALL Founders. Disciplinary actions based on verdict of court marshall. Log verdict and consequences manually after proceedings.</>}
              </div>

              <label className="disc-repeat-toggle">
                <input type="checkbox" checked={form.is_repeat} onChange={e=>setForm(f=>({...f,is_repeat:e.target.checked}))} />
                <span>This is a <strong>repeat</strong> violation (same violation committed 2+ times — SSP not offered, fine + penalty applied automatically)</span>
              </label>

              <div className="field-group" style={{marginBottom:'1rem'}}>
                <label className="field-label">Violation(s) Committed</label>
                <div className="disc-violation-inputs">
                  {form.violations.map((v,i)=>(
                    <div key={i} className="disc-violation-row">
                      <input className="disc-violation-input" value={v} onChange={e=>{const a=[...form.violations];a[i]=e.target.value;setForm(f=>({...f,violations:a}));}} placeholder={`Violation ${i+1}...`} />
                      {form.violations.length>1 && <button className="disc-remove-btn" onClick={()=>setForm(f=>({...f,violations:f.violations.filter((_,j)=>j!==i)}))}></button>}
                    </div>
                  ))}
                  <button className="disc-add-violation" onClick={()=>setForm(f=>({...f,violations:[...f.violations,'']}))}>+ Add another violation</button>
                </div>
              </div>

              <div className="field-group" style={{marginBottom:'1.2rem'}}>
                <label className="field-label">Additional Notes (optional)</label>
                <textarea className="field-textarea" style={{minHeight:'70px'}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Any additional context..." />
              </div>

              <button className="btn btn-gold" style={{background:'var(--crimson-c)',borderColor:'var(--crimson-c)',color:'#fff'}} onClick={issueViolation} disabled={submitting}>
                {submitting ? 'Issuing...' : 'Issue Violation'}
              </button>
            </div>
          )}

          {/* MY RECORD */}
          {tab==='my' && <MemberRecord violations={myRecord} onReload={async()=>{ const d=await fetch('/api/dashboard/discipline/my-record').then(r=>r.json()); setMyRecord(d.violations||[]); }} />}
        </div>
      </main>

      {/* Court Marshall Modal */}
      {modal && (
        <CourtMarshallModal v={modal} onClose={()=>setModal(null)} onSave={logCourtMarshall} />
      )}
    </div>
  );
}

function ViolationCard({ v, open, onToggle, canManage, isBrother, onSSP, onFine, onLiftSusp, onCourtMarshall, onReload }:any) {
  const [fineModal, setFineModal] = useState(false);
  const [planAmt, setPlanAmt]     = useState('');
  const [planNote, setPlanNote]   = useState('');

  function colorClass(c:string){ return c; }

  return (
    <div className={`violation-card ${colorClass(v.offense_color)} ${open?'open':''} ${v.cleared?'cleared':''}`}>
      <div className="violation-header" onClick={onToggle}>
        <div style={{flex:1}}>
          <div className="violation-member">
            {v.member_name}
            {v.is_repeat && <span className="violation-repeat">REPEAT</span>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'5px',flexWrap:'wrap'}}>
            <span className={`offense-badge ${v.offense_color}`}>
              {COLORS.find(c=>c.id===v.offense_color)?.icon} {COLORS.find(c=>c.id===v.offense_color)?.label}
            </span>
            <span className="violation-date">Issued {timeAgo(v.created_at)} by {v.issued_by_name}</span>
          </div>
        </div>
        <div className="violation-chevron">›</div>
      </div>

      <div className="violation-body">
        {/* Violations list */}
        <div className="violation-violations">
          <div className="violation-violations-label">Violations</div>
          {(v.violations||[]).map((vio:string,i:number)=>(
            <div key={i} className="violation-item">{vio}</div>
          ))}
        </div>
        {v.notes && <div className="violation-notes">Notes: {v.notes}</div>}

        {/* Tracking blocks */}
        <div className="track-grid">

          {/* SSP */}
          {v.ssp && <SSPBlock ssp={v.ssp} violationId={v.id} memberId={v.member_id} canManage={canManage} isBrother={!!isBrother} onSSP={onSSP} onReload={onReload} cleared={v.cleared} />}

          {/* Fines */}
          {v.fines?.map((fine:any)=>(
            <div key={fine.id} className="track-block">
              <div className="track-label">Fine — {fine.amount_ls.toLocaleString()}L</div>
              <div className="track-status">{FINE_STATUS_LABELS[fine.status]}</div>
              {fine.due_date && fine.status!=='paid' && <div className="track-detail">Due: {new Date(fine.due_date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>}
              {fine.payment_plan_amount && <div className="track-detail">Plan: {fine.payment_plan_amount.toLocaleString()}L — {fine.payment_plan_notes}</div>}
              {fine.paid_at && <div className="track-detail">Paid: {timeAgo(fine.paid_at)}</div>}
              {canManage && fine.status!=='paid' && (
                <div style={{display:'flex',gap:'5px',marginTop:'6px',flexWrap:'wrap'}}>
                  <button className="track-btn green" onClick={()=>onFine(fine.id,'paid')}>Mark Paid</button>
                  {fine.status!=='payment_plan' && <button className="track-btn gold" onClick={()=>setFineModal(true)}>Payment Plan</button>}
                </div>
              )}
              {fineModal && canManage && (
                <div style={{marginTop:'8px',display:'flex',flexDirection:'column',gap:'6px'}}>
                  <input className="disc-violation-input" placeholder="Amount agreed (L$)..." value={planAmt} onChange={e=>setPlanAmt(e.target.value)} type="number"/>
                  <input className="disc-violation-input" placeholder="Plan notes..." value={planNote} onChange={e=>setPlanNote(e.target.value)}/>
                  <div style={{display:'flex',gap:'5px'}}>
                    <button className="track-btn gold" onClick={()=>{onFine(fine.id,'payment_plan',{payment_plan_amount:parseInt(planAmt),payment_plan_notes:planNote});setFineModal(false);}}>Save Plan</button>
                    <button className="track-btn" style={{color:'var(--muted)',borderColor:'var(--border)'}} onClick={()=>setFineModal(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Warrants */}
          {v.warrants?.map((w:any)=>(
            <div key={w.id} className="track-block">
              <div className="track-label">Warrant #{w.warrant_number}</div>
              <div className="track-status" style={{color:'var(--crimson-c)'}}>Warrant Issued</div>
              <div className="track-detail">Issued {timeAgo(w.issued_at)}</div>
            </div>
          ))}

          {/* Suspension */}
          {v.suspensions?.map((s:any)=>(
            <div key={s.id} className="track-block">
              <div className="track-label">Suspension</div>
              <div className="track-status" style={{color:s.status==='active'?'var(--crimson-c)':'#4ade80'}}>{s.status==='active'?' Active':'Lifted'}</div>
              <div className="track-detail">{new Date(s.start_date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})} → {new Date(s.end_date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>
              <div className="track-detail" style={{marginTop:'2px'}}>No frat gear. No frat activities.</div>
              {s.status==='lifted' && <div className="track-detail">Lifted by {s.lifted_by_name}</div>}
              {canManage && s.status==='active' && <button className="track-btn green" style={{marginTop:'6px'}} onClick={()=>onLiftSusp(s.id)}>Lift Early</button>}
            </div>
          ))}

          {/* Court Marshall */}
          {v.offense_color==='crimson_red' && (
            <div className="track-block" style={{gridColumn:'1/-1'}}>
              <div className="track-label">Court Marshall</div>
              {v.court_marshall ? (
                <>
                  <div className="track-status">️ Verdict Logged</div>
                  {v.court_marshall.held_at && <div className="track-detail">Held: {new Date(v.court_marshall.held_at+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>}
                  {v.court_marshall.verdict && <div className="track-detail" style={{marginTop:'4px'}}><strong style={{color:'var(--bone)'}}>Verdict:</strong> {v.court_marshall.verdict}</div>}
                  {v.court_marshall.consequences && <div className="track-detail" style={{marginTop:'4px'}}><strong style={{color:'var(--bone)'}}>Consequences:</strong> {v.court_marshall.consequences}</div>}
                  {v.court_marshall.notes && <div className="track-detail" style={{marginTop:'4px',fontStyle:'italic'}}>{v.court_marshall.notes}</div>}
                  <div className="track-detail" style={{marginTop:'4px'}}>Logged by {v.court_marshall.logged_by_name}</div>
                </>
              ) : (
                <>
                  <div className="track-status" style={{color:'var(--muted)'}}>Awaiting Proceedings</div>
                  {canManage && <button className="track-btn red" style={{marginTop:'6px'}} onClick={onCourtMarshall}>Log Verdict</button>}
                </>
              )}
            </div>
          )}
        </div>

        <div className="issued-by">Violation ID: {v.id.slice(0,8)}… · Issued by {v.issued_by_name} · {new Date(v.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>
      </div>
    </div>
  );
}

function MemberRecord({ violations, onReload }:{ violations:any[], onReload?:()=>void }) {
  // Auto-open any card that has a pending SSP offer so the button is immediately visible
  const initialOpen = new Set(violations.filter(v => v.ssp?.status === 'offered').map((v:any) => v.id));
  const [openCards, setOpenCards] = useState<Set<string>>(initialOpen);
  function toggle(id:string){ setOpenCards(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;}); }

  if (violations.length===0) return (
    <div className="disc-my-wrap">
      <div className="disc-clean-record">
        <div className="disc-clean-icon"></div>
        <div style={{fontSize:'1rem',color:'var(--bone)',fontWeight:700,marginBottom:'0.5rem'}}>Clean Record</div>
        <div className="disc-clean-text">You have no violations on record. Keep it that way.</div>
      </div>
    </div>
  );

  return (
    <div className="disc-my-wrap">
      <div style={{marginBottom:'1.5rem',fontSize:'0.8rem',color:'var(--muted)'}}>
        You have <strong style={{color:'var(--bone)'}}>{violations.length}</strong> violation{violations.length!==1?'s':''} on record. This is private — only you and discipline leadership can see this.
      </div>
      {violations.map(v=>(
        <ViolationCard key={v.id} v={v} open={openCards.has(v.id)} onToggle={()=>toggle(v.id)}
          canManage={false} isBrother={true} onSSP={()=>{}} onFine={()=>{}} onLiftSusp={()=>{}} onCourtMarshall={()=>{}} onReload={onReload} />
      ))}
    </div>
  );
}

function CourtMarshallModal({ v, onClose, onSave }:any) {
  const [form, setForm] = useState({ held_at:'', verdict:'', consequences:'', notes:'' });
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    await onSave(v.id, v.member_id, form);
    setSaving(false);
  }
  return (
    <div className="disc-modal-overlay" onClick={onClose}>
      <div className="disc-modal" onClick={e=>e.stopPropagation()}>
        <div className="disc-modal-header">
          <div className="disc-modal-title">Log Court Marshall Verdict</div>
          <button className="disc-modal-close" onClick={onClose}></button>
        </div>
        <div className="disc-modal-body">
          <div style={{fontSize:'0.82rem',color:'var(--muted)',marginBottom:'1rem'}}>Brother: <strong style={{color:'var(--bone)'}}>{v.member_name}</strong></div>
          <div className="field-group" style={{marginBottom:'0.9rem'}}>
            <label className="field-label">Date Held</label>
            <input className="field-input" type="date" value={form.held_at} onChange={e=>setForm(f=>({...f,held_at:e.target.value}))} />
          </div>
          <div className="field-group" style={{marginBottom:'0.9rem'}}>
            <label className="field-label">Verdict</label>
            <input className="field-input" value={form.verdict} onChange={e=>setForm(f=>({...f,verdict:e.target.value}))} placeholder="e.g. Guilty, Not Guilty, Dismissed..." />
          </div>
          <div className="field-group" style={{marginBottom:'0.9rem'}}>
            <label className="field-label">Consequences</label>
            <textarea className="field-textarea" style={{minHeight:'80px'}} value={form.consequences} onChange={e=>setForm(f=>({...f,consequences:e.target.value}))} placeholder="List all disciplinary actions decided by the court..." />
          </div>
          <div className="field-group" style={{marginBottom:'1.2rem'}}>
            <label className="field-label">Additional Notes</label>
            <textarea className="field-textarea" style={{minHeight:'60px'}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Any additional notes from proceedings..." />
          </div>
          <div className="save-bar">
            <button className="btn btn-gold" style={{background:'var(--crimson-c)',borderColor:'var(--crimson-c)',color:'#fff'}} onClick={save} disabled={saving||!form.verdict}>
              {saving?'Saving...':'Save Verdict'}
            </button>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const SSP_LESSONS = [
  { key:'lesson_1', title:'What Brotherhood Really Means',          desc:'Brotherhood = responsibility, not just friendship. Wearing letters means representing something bigger. Trust: how one person\'s actions affect the group unit.' },
  { key:'lesson_2', title:'Respect: The Foundation of Character',   desc:'Respect for brothers. Respect for women. Respect for property and spaces. Respect in disagreement.' },
  { key:'lesson_3', title:'Accountability: Owning Your Actions',    desc:'The difference between explanation and excuse. Apology vs. change. Consequences are part of growth. Trust is rebuilt through actions.' },
  { key:'lesson_4', title:'Public Behavior = Public Representation',desc:'You are never "just yourself" in public. Social media, parties, events. One moment can define an entire chapter\'s reputation. Pride vs. embarrassment.' },
  { key:'lesson_5', title:'Emotional Control & Decision Making',     desc:'Anger, ego, peer pressure. Thinking past the moment. Strength = self-control. Pause → Think → Choose.' },
  { key:'lesson_6', title:'Rebuilding Trust',                       desc:'Trust is earned back slowly. Actions speak louder than apologies. Being an example moving forward.' },
];

function SSPBlock({ ssp, violationId, memberId, canManage, isBrother, onSSP, onReload, cleared }:any) {
  const [expanded, setExpanded]   = useState(false);
  const [localSsp, setLocalSsp]   = useState(ssp);
  const [saving, setSaving]       = useState<string|null>(null);
  const [enrollMsg, setEnrollMsg] = useState('');

  const allLessonsDone  = SSP_LESSONS.every(l => localSsp[l.key]);
  const canClear        = allLessonsDone && localSsp.reflections_done && !localSsp.cleared;
  const offerNum        = localSsp.offer_number || 1;
  const isOffered       = localSsp.status === 'offered';
  const isEnrolled      = localSsp.status === 'enrolled' || localSsp.status === 'completed';
  const isOptedOut      = localSsp.status === 'opted_out';
  const lessonsComplete = SSP_LESSONS.filter(l => localSsp[l.key]).length;

  async function brotherEnroll() {
    setSaving('enroll');
    await fetch('/api/dashboard/discipline/ssp', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ssp_id: ssp.id, status: 'enrolled' })
    });
    setLocalSsp((p:any) => ({ ...p, status: 'enrolled' }));
    setSaving(null);
    if (onReload) onReload();
    window.location.href = '/dashboard/ssp';
  }

  async function brotherOptOut() {
    if (!confirm('Are you sure you want to opt out? Opting out means disciplinary action will be at the discretion of the Sgt. at Arms.')) return;
    setSaving('optout');
    await fetch('/api/dashboard/discipline/ssp', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ssp_id: ssp.id, status: 'opted_out' })
    });
    setLocalSsp((p:any) => ({ ...p, status: 'opted_out' }));
    setSaving(null);
    if (onReload) onReload();
  }

  async function toggleLesson(lesson: string, current: boolean) {
    setSaving(lesson);
    setLocalSsp((p:any) => ({ ...p, [lesson]: !current }));
    await fetch('/api/dashboard/discipline/ssp-lessons', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ssp_id: ssp.id, action: 'toggle_lesson', lesson, value: !current })
    });
    setSaving(null);
  }

  async function toggleReflections(current: boolean) {
    setSaving('reflect');
    setLocalSsp((p:any) => ({ ...p, reflections_done: !current }));
    await fetch('/api/dashboard/discipline/ssp-lessons', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ssp_id: ssp.id, action: 'toggle_reflections', value: !current })
    });
    setSaving(null);
  }

  async function clearBrother() {
    if (!confirm('Mark this brother as cleared? This will dismiss all charges for this violation.')) return;
    setSaving('clear');
    await fetch('/api/dashboard/discipline/ssp-lessons', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ssp_id: ssp.id, violation_id: violationId, member_id: memberId, action: 'clear' })
    });
    setSaving(null);
    onReload();
  }

  const borderColor = cleared ? '1px solid rgba(74,222,128,0.3)' : isOffered && isBrother ? '1px solid rgba(198,147,10,0.35)' : undefined;

  return (
    <div className="track-block ssp-block" style={{ gridColumn: '1/-1', border: borderColor }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div className="track-label">Sage Solution Program — Offer {offerNum} of 3</div>
        {cleared
          ? <span style={{ fontSize: '0.65rem', color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', padding: '2px 10px', borderRadius: '3px', letterSpacing: '2px' }}>CLEARED</span>
          : <span style={{ fontSize: '0.65rem', color: 'var(--muted)', letterSpacing: '1px' }}>{localSsp.status?.replace('_', ' ').toUpperCase()}</span>
        }
      </div>

      {/* ── BROTHER: SSP OFFERED ── */}
      {isBrother && isOffered && !cleared && (
        <div className="ssp-offered-box">
          <div className="ssp-offered-title">You have been offered the Sage Solution Program</div>
          <div className="ssp-offered-desc">
            The SSP is a 6-lesson program that guides you through what brotherhood truly means. Completing all lessons and reflection exercises will clear all charges for this violation.
          </div>
          <div className="ssp-offered-desc" style={{ marginTop: '6px', color: 'rgba(240,232,208,0.35)' }}>
            If you opt out, disciplinary action will be at the discretion of the Sgt. at Arms.
          </div>
          {enrollMsg
            ? <div style={{ fontSize: '0.8rem', color: '#4ade80', marginTop: '10px', padding: '6px 10px', background: 'rgba(74,222,128,0.08)', borderRadius: '5px', border: '1px solid rgba(74,222,128,0.2)' }}>{enrollMsg}</div>
            : (
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                <button className="ssp-enroll-btn" onClick={brotherEnroll} disabled={!!saving}>
                  {saving === 'enroll' ? 'Enrolling...' : 'Accept — Begin SSP'}
                </button>
                <button className="track-btn red" style={{ padding: '6px 14px' }} onClick={brotherOptOut} disabled={!!saving}>
                  {saving === 'optout' ? 'Processing...' : 'Opt Out'}
                </button>
              </div>
            )
          }
        </div>
      )}

      {/* ── BROTHER: OPTED OUT ── */}
      {isBrother && isOptedOut && (
        <div style={{ fontSize: '0.8rem', color: 'var(--crimson-c)', lineHeight: '1.6' }}>
          You opted out of the SSP. Disciplinary action will be assessed at the discretion of the Sgt. at Arms.
        </div>
      )}

      {/* ── BROTHER: ENROLLED — show curriculum + progress ── */}
      {isBrother && isEnrolled && !cleared && (
        <>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '10px', lineHeight: '1.6' }}>
            You are enrolled. Attend all 6 sessions with leadership, participate honestly, and complete your reflection exercises. Your progress is tracked below.
          </div>
          <button className="disc-add-violation" onClick={() => setExpanded(v => !v)} style={{ marginBottom: '8px' }}>
            {expanded ? 'Hide Lessons' : `View Lessons and Progress (${lessonsComplete}/6 complete)`}
          </button>
          {expanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
              {SSP_LESSONS.map((l, i) => (
                <div key={l.key} className={`ssp-lesson ${localSsp[l.key] ? 'done' : ''}`} style={{ cursor: 'default' }}>
                  <div className="ssp-lesson-check">{localSsp[l.key] ? 'x' : `${i + 1}`}</div>
                  <div style={{ flex: 1 }}>
                    <div className="ssp-lesson-title">Lesson {i + 1} — {l.title}</div>
                    <div className="ssp-lesson-desc">{l.desc}</div>
                  </div>
                </div>
              ))}
              <div className={`ssp-lesson ${localSsp.reflections_done ? 'done' : ''}`} style={{ cursor: 'default' }}>
                <div className="ssp-lesson-check">{localSsp.reflections_done ? 'x' : 'R'}</div>
                <div style={{ flex: 1 }}>
                  <div className="ssp-lesson-title">Reflection Exercises</div>
                  <div className="ssp-lesson-desc">Attend all sessions, participate honestly, complete reflection exercises, and show improved behavior over time.</div>
                </div>
              </div>
            </div>
          )}
          <div style={{ fontSize: '0.7rem', color: 'rgba(240,232,208,0.25)' }}>Completing all lessons and reflections will clear all charges for this violation.</div>
        </>
      )}

      {/* ── BROTHER: CLEARED ── */}
      {isBrother && cleared && (
        <div style={{ fontSize: '0.82rem', color: '#4ade80', lineHeight: '1.6' }}>
          You successfully completed the Sage Solution Program. All charges for this violation have been cleared.
          {localSsp.cleared_at && <span style={{ color: 'rgba(74,222,128,0.5)' }}> Cleared on {new Date(localSsp.cleared_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.</span>}
        </div>
      )}

      {/* ── LEADER VIEW ── */}
      {canManage && (
        <>
          {isOffered && (
            <div style={{ display: 'flex', gap: '5px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <button className="track-btn green" onClick={() => onSSP(ssp.id, 'enrolled')}>Mark Enrolled</button>
              <button className="track-btn red" onClick={() => onSSP(ssp.id, 'opted_out')}>Mark Opted Out</button>
            </div>
          )}
          {isOptedOut && (
            <div style={{ fontSize: '0.75rem', color: 'var(--crimson-c)', marginBottom: '6px' }}>
              Brother opted out. Disciplinary action at discretion of Sgt. at Arms.
            </div>
          )}
          {isEnrolled && (
            <>
              <button className="disc-add-violation" style={{ marginBottom: '8px' }} onClick={() => setExpanded(v => !v)}>
                {expanded ? 'Hide Lessons' : `Track Lessons (${lessonsComplete}/6 complete)`}
              </button>
              {expanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                  {SSP_LESSONS.map((l, i) => (
                    <div key={l.key} className={`ssp-lesson ${localSsp[l.key] ? 'done' : ''}`}
                      onClick={() => !localSsp.cleared && toggleLesson(l.key, localSsp[l.key])}>
                      <div className="ssp-lesson-check">{localSsp[l.key] ? 'x' : saving === l.key ? '...' : `${i + 1}`}</div>
                      <div style={{ flex: 1 }}>
                        <div className="ssp-lesson-title">Lesson {i + 1} — {l.title}</div>
                        <div className="ssp-lesson-desc">{l.desc}</div>
                      </div>
                    </div>
                  ))}
                  <div className={`ssp-lesson ${localSsp.reflections_done ? 'done' : ''}`}
                    onClick={() => !localSsp.cleared && toggleReflections(localSsp.reflections_done)}>
                    <div className="ssp-lesson-check">{localSsp.reflections_done ? 'x' : saving === 'reflect' ? '...' : 'R'}</div>
                    <div style={{ flex: 1 }}>
                      <div className="ssp-lesson-title">Reflection Exercises Completed</div>
                      <div className="ssp-lesson-desc">Attend all sessions, participate honestly, complete reflection exercises, show improved behavior.</div>
                    </div>
                  </div>
                </div>
              )}
              {!localSsp.cleared && (
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '8px', lineHeight: '1.5' }}>
                  All 6 lessons + reflections must be marked done to clear.
                  {allLessonsDone && localSsp.reflections_done && <span style={{ color: '#4ade80' }}> All requirements met — ready to clear.</span>}
                </div>
              )}
              {canClear && !localSsp.cleared && (
                <button className="track-btn green" style={{ fontSize: '0.75rem', padding: '5px 14px' }} onClick={clearBrother} disabled={saving === 'clear'}>
                  {saving === 'clear' ? 'Clearing...' : 'Mark Cleared — All Charges Dismissed'}
                </button>
              )}
            </>
          )}
          {localSsp.cleared && (
            <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '4px' }}>
              Cleared by {localSsp.cleared_by_name} on {localSsp.cleared_at ? new Date(localSsp.cleared_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
            </div>
          )}
        </>
      )}
    </div>
  );
}
