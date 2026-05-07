'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../dash.css';
import './discipline.css';
import DashSidebar from '../DashSidebar';

const COLORS = [
  { id:'grey',       label:'Grey Card' },
  { id:'navy_blue',  label:'Navy Blue Card' },
  { id:'gold',       label:'Gold Card' },
  { id:'crimson_red',label:'Crimson Red Card' },
];

const SSP_LESSONS = [
  { key:'lesson_1', title:'What Brotherhood Really Means',           desc:'Brotherhood = responsibility. Wearing letters means representing something bigger.' },
  { key:'lesson_2', title:'Respect: The Foundation of Character',    desc:'Respect for brothers, women, property and shared spaces.' },
  { key:'lesson_3', title:'Accountability: Owning Your Actions',     desc:'Explanation vs excuse. Apology vs change. Trust rebuilt through actions.' },
  { key:'lesson_4', title:'Public Behavior = Public Representation', desc:'You are never "just yourself" in public. One moment can define a chapter\'s reputation.' },
  { key:'lesson_5', title:'Conflict Resolution Without Escalation',  desc:'De-escalation as strength. When to walk away. Right way to raise grievances.' },
  { key:'lesson_6', title:'Your Role in the Chapter Going Forward',  desc:'How to rebuild trust. Contribution vs consumption. Being a positive example.' },
];

function dateFmt(d:string){ return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }
function timeAgo(d:string){ const s=Math.floor((Date.now()-new Date(d).getTime())/1000); if(s<86400)return`${Math.floor(s/3600)}h ago`; if(s<604800)return`${Math.floor(s/86400)}d ago`; return dateFmt(d); }
const COLOR_DOT: Record<string,string> = { grey:'var(--grey-c)', navy_blue:'var(--navy-c)', gold:'var(--gold-c)', crimson_red:'var(--crimson-c)' };

export default function DisciplinePage() {
  const [member, setMember]       = useState<any>(null);
  const [profile, setProfile]     = useState<any>(null);
  const [canManage, setCanManage] = useState(false);
  const [violations, setViolations] = useState<any[]>([]);
  const [roster, setRoster]         = useState<any[]>([]);
  const [myRecord, setMyRecord]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selBrother, setSelBrother] = useState<string|null>(null);
  const [openCards, setOpenCards]   = useState<Set<string>>(new Set());
  const [modal, setModal]           = useState<any>(null);
  const [submitMsg, setSubmitMsg]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    member_id:'', offense_color:'grey', violations:[''], is_repeat:false, notes:''
  });

  useEffect(()=>{
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>{
      if(d.error){window.location.href='/login';return;}
      setMember(d.member); setProfile(d.profile||{});
    });
  },[]);

  useEffect(()=>{
    if(!member) return;
    const manage=member.fraction==='Ishi No Fraction'||member.role==='Head Founder'||member.role==='Co-Founder';
    setCanManage(manage);
    if(manage){
      loadAll();
      fetch('/api/dashboard/roster').then(r=>r.json()).then(d=>setRoster(d.members||[]));
    }
    fetch('/api/dashboard/discipline/my-record').then(r=>r.json()).then(d=>setMyRecord(d.violations||[]));
    setLoading(false);
  },[member]);

  useEffect(()=>{
    if(!member) return;
    const manage=member.fraction==='Ishi No Fraction'||member.role==='Head Founder'||member.role==='Co-Founder';
    const poll=setInterval(()=>{
      if(document.activeElement instanceof HTMLInputElement||document.activeElement instanceof HTMLTextAreaElement||document.activeElement instanceof HTMLSelectElement) return;
      if(manage) loadAll();
      fetch('/api/dashboard/discipline/my-record').then(r=>r.json()).then(d=>setMyRecord(d.violations||[]));
    },30000);
    return()=>clearInterval(poll);
  },[member]);

  async function loadAll(){ const d=await fetch('/api/dashboard/discipline/violations?view=all').then(r=>r.json()); setViolations(d.violations||[]); }
  function toggle(id:string){ setOpenCards(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;}); }

  async function issueViolation(){
    if(!form.member_id||!form.offense_color||!form.violations.some(v=>v.trim())){setSubmitMsg('err:Select a brother, offense color, and at least one violation.');return;}
    setSubmitting(true); setSubmitMsg('');
    const res=await fetch('/api/dashboard/discipline/violations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,violations:form.violations.filter(v=>v.trim()),member_name:roster.find(r=>r.member_id===form.member_id)?.frat_name||'Unknown'})}).then(r=>r.json());
    if(res.error){setSubmitMsg(`err:${res.error}`);setSubmitting(false);return;}
    setSubmitMsg('ok:Violation issued successfully.');
    setForm({member_id:'',offense_color:'grey',violations:[''],is_repeat:false,notes:''});
    setSubmitting(false); await loadAll();
    setTimeout(()=>setSubmitMsg(''),4000);
  }

  async function updateSSP(ssp_id:string,status:string,extra={}){ await fetch('/api/dashboard/discipline/ssp',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ssp_id,status,...extra})}); await loadAll(); }
  async function updateFine(fine_id:string,status:string,extra={}){ await fetch('/api/dashboard/discipline/fines',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({fine_id,status,...extra})}); await loadAll(); }
  async function liftSuspension(suspension_id:string){ if(!confirm('Lift this suspension early?'))return; await fetch('/api/dashboard/discipline/suspensions',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({suspension_id,action:'lift'})}); await loadAll(); }
  async function logCourtMarshall(violation_id:string,member_id:string,data:any){ await fetch('/api/dashboard/discipline/court-marshall',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({violation_id,member_id,...data})}); setModal(null); await loadAll(); }

  // Group violations by member for the left panel
  const brotherMap: Record<string,{name:string,viols:any[]}> = {};
  violations.forEach(v=>{
    if(!brotherMap[v.member_id]) brotherMap[v.member_id]={name:v.member_name,viols:[]};
    brotherMap[v.member_id].viols.push(v);
  });
  const brotherList = Object.entries(brotherMap).sort((a,b)=>a[1].name.localeCompare(b[1].name));
  const selectedViolations = selBrother ? brotherMap[selBrother]?.viols || [] : [];

  const colorCounts: Record<string,number> = {grey:0,navy_blue:0,gold:0,crimson_red:0};
  violations.forEach(v=>{if(colorCounts[v.offense_color]!==undefined) colorCounts[v.offense_color]++;});

  const msgType = submitMsg.startsWith('ok:') ? 'ok' : 'err';
  const msgText = submitMsg.replace(/^(ok|err):/,'');

  if(!member||loading) return <div className="dash-loading">LOADING...</div>;

  /* ══ BROTHER VIEW ══ */
  if(!canManage){
    return (
      <div className="dash-app">
        <DashSidebar member={member} profile={profile}/>
        <main className="dash-main">
          <div className="dash-page-header">
            <div className="dash-page-title">My Discipline Record</div>
            <span style={{fontFamily:'var(--cinzel)',fontSize:'.58rem',letterSpacing:'2px',color:'var(--bone-faint)'}}>Private · Visible only to you and leadership</span>
          </div>
          <div className="disc-bro-wrap">
            <div className="disc-bro-inner">
              {myRecord.length===0 ? (
                <div className="disc-clean-card">
                  <div className="disc-clean-icon">⚓</div>
                  <div className="disc-clean-title">Clean Record</div>
                  <div className="disc-clean-sub">You have no violations on record. Keep it that way.</div>
                </div>
              ) : (
                <>
                  <div style={{fontFamily:'var(--cinzel)',fontSize:'.65rem',letterSpacing:'1px',color:'var(--bone-faint)'}}>
                    You have <strong style={{color:'var(--bone)'}}>{myRecord.length}</strong> violation{myRecord.length!==1?'s':''} on record.
                  </div>
                  {myRecord.map(v=>(
                    <ViolCard key={v.id} v={v} open={openCards.has(v.id)} onToggle={()=>toggle(v.id)}
                      canManage={false} isBrother={true}
                      onSSP={()=>{}} onFine={()=>{}} onLiftSusp={()=>{}} onCourtMarshall={()=>{}}
                      onReload={async()=>{const d=await fetch('/api/dashboard/discipline/my-record').then(r=>r.json());setMyRecord(d.violations||[]);}}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ══ MANAGEMENT VIEW ══ */
  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile}/>
      <main className="dash-main">

        <div className="dash-page-header">
          <div className="dash-page-title">Discipline & Enforcement</div>
          <span style={{fontFamily:'var(--cinzel)',fontSize:'.58rem',letterSpacing:'2px',color:'rgba(224,80,112,.6)'}}>Ishi No Faction Management</span>
        </div>

        {/* Stats */}
        <div className="disc-stats-strip">
          {[
            {id:'grey',       label:'Grey',        color:'var(--grey-c)',    bg:'var(--grey-bg)',    n:colorCounts.grey},
            {id:'navy_blue',  label:'Navy Blue',   color:'var(--navy-c)',    bg:'var(--navy-bg)',    n:colorCounts.navy_blue},
            {id:'gold',       label:'Gold',        color:'var(--gold-c)',    bg:'var(--gold-bg)',    n:colorCounts.gold},
            {id:'crimson_red',label:'Crimson Red', color:'var(--crimson-c)', bg:'var(--crimson-bg)', n:colorCounts.crimson_red},
          ].map(c=>(
            <div key={c.id} className="disc-stat-cell" style={{borderLeft:`3px solid ${c.color}40`}}>
              <div className="disc-stat-swatch" style={{background:c.bg,border:`1px solid ${c.color}30`}}>
                <span style={{width:'10px',height:'10px',borderRadius:'50%',background:c.color,display:'block',boxShadow:`0 0 6px ${c.color}60`}}/>
              </div>
              <div>
                <div className="disc-stat-num" style={{color:c.color}}>{c.n}</div>
                <div className="disc-stat-lbl">{c.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Three columns */}
        <div className="disc-manage-layout">

          {/* LEFT: brother list */}
          <div className="disc-list-col">
            <div className="disc-list-hdr">Brothers ({brotherList.length})</div>
            <div className="disc-list-items">
              {violations.length===0 && <div style={{padding:'1.5rem',fontFamily:'var(--cinzel)',fontSize:'.58rem',letterSpacing:'2px',color:'var(--bone-faint)',textAlign:'center'}}>No violations on record.</div>}
              {brotherList.map(([memberId,{name,viols}])=>(
                <div key={memberId} className={`disc-list-item${selBrother===memberId?' sel':''}`} onClick={()=>setSelBrother(memberId)}>
                  <div className="disc-list-item-top">
                    <span className="disc-list-name">{name}</span>
                    <span className="disc-list-count">{viols.length}</span>
                  </div>
                  <div className="disc-list-dots">
                    {viols.map((v:any,i:number)=>(
                      <span key={i} className="disc-list-dot" style={{background:COLOR_DOT[v.offense_color]||'var(--bone-faint)',opacity:.85}}/>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CENTRE: violation detail */}
          <div className="disc-detail-col">
            {!selBrother ? (
              <div className="disc-detail-empty">Select a brother to view their record</div>
            ) : (
              <>
                <div className="disc-detail-hdr">
                  <div className="disc-detail-name">{brotherMap[selBrother]?.name}</div>
                  <div className="disc-detail-sub">{selectedViolations.length} violation{selectedViolations.length!==1?'s':''} on record</div>
                </div>
                <div className="disc-detail-violations">
                  {selectedViolations.map(v=>(
                    <ViolCard key={v.id} v={v} open={openCards.has(v.id)} onToggle={()=>toggle(v.id)}
                      canManage={true} isBrother={false}
                      onSSP={updateSSP} onFine={updateFine} onLiftSusp={liftSuspension}
                      onCourtMarshall={()=>setModal(v)} onReload={loadAll}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* RIGHT: issue violation form */}
          <div className="disc-issue-col">
            <div className="disc-issue-hdr">Issue Violation</div>
            <div className="disc-issue-form">
              {msgText && <div className={`disc-msg ${msgType}`}>{msgText}</div>}

              <div>
                <label className="disc-issue-lbl">Brother</label>
                <select className="disc-issue-fld" value={form.member_id} onChange={e=>setForm(f=>({...f,member_id:e.target.value}))}>
                  <option value="">Select brother...</option>
                  {roster.map(r=><option key={r.member_id} value={r.member_id}>{r.frat_name}</option>)}
                </select>
              </div>

              <div>
                <label className="disc-issue-lbl">Offense Color</label>
                <div className="disc-color-picker">
                  {COLORS.map(c=>(
                    <button key={c.id} className={`disc-color-opt ${c.id}${form.offense_color===c.id?' sel':''}`} onClick={()=>setForm(f=>({...f,offense_color:c.id}))}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="disc-offense-desc">
                {form.offense_color==='grey' && <><strong style={{color:'var(--grey-c)'}}>Grey:</strong> Counseling with Sgt. at Arms and Chief Admin. SSP offered and explained.</>}
                {form.offense_color==='navy_blue' && <><strong style={{color:'var(--navy-c)'}}>Navy Blue:</strong> SSP offered (warrant + L$1,500 fine if opted out). 1st Warrant. 1 week to pay.</>}
                {form.offense_color==='gold' && <><strong style={{color:'var(--gold-c)'}}>Gold:</strong> SSP offered (warrant + L$3,000 fine). 2nd Warrant. 1 month suspension + gear prohibition. 1 week to pay.</>}
                {form.offense_color==='crimson_red' && <><strong style={{color:'var(--crimson-c)'}}>Crimson Red:</strong> Corsair Court Marshall with ALL Founders. Log verdict and consequences after proceedings.</>}
              </div>

              <label className="disc-repeat-toggle">
                <input type="checkbox" checked={form.is_repeat} onChange={e=>setForm(f=>({...f,is_repeat:e.target.checked}))}/>
                <span>Repeat violation (same committed 2+ times — SSP not offered, fine + penalty applied automatically)</span>
              </label>

              <div>
                <label className="disc-issue-lbl">Violations Committed</label>
                <div className="disc-viol-inputs">
                  {form.violations.map((v,i)=>(
                    <div key={i} className="disc-viol-row">
                      <input className="disc-issue-fld" value={v} onChange={e=>{const a=[...form.violations];a[i]=e.target.value;setForm(f=>({...f,violations:a}));}} placeholder={`Violation ${i+1}...`}/>
                      {form.violations.length>1 && <button className="disc-remove-btn" onClick={()=>setForm(f=>({...f,violations:f.violations.filter((_,j)=>j!==i)}))}>✕</button>}
                    </div>
                  ))}
                  <button className="disc-add-btn" onClick={()=>setForm(f=>({...f,violations:[...f.violations,'']}))}>+ Add violation</button>
                </div>
              </div>

              <div>
                <label className="disc-issue-lbl">Notes (optional)</label>
                <textarea className="disc-issue-fld disc-issue-textarea" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Any additional context..."/>
              </div>

              <button className="disc-submit-btn" onClick={issueViolation} disabled={submitting}>
                {submitting?'Issuing...':'Issue Violation'}
              </button>
            </div>
          </div>

        </div>
      </main>

      {modal && <CourtMarshallModal v={modal} onClose={()=>setModal(null)} onSave={logCourtMarshall}/>}
    </div>
  );
}

/* ── VIOLATION CARD ── */
function ViolCard({v,open,onToggle,canManage,isBrother,onSSP,onFine,onLiftSusp,onCourtMarshall,onReload}:any){
  const [fineModal, setFineModal] = useState(false);
  const [planAmt, setPlanAmt]     = useState('');
  const [planNote, setPlanNote]   = useState('');
  const colorLabel = COLORS.find(c=>c.id===v.offense_color)?.label||v.offense_color;

  return (
    <div className={`disc-viol-card ${v.offense_color}${open?' open':''}`}>
      <div className="disc-viol-hdr" onClick={onToggle}>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:'.6rem',flexWrap:'wrap'}}>
            {canManage && <span className="disc-viol-name">{v.member_name}</span>}
            <span className={`disc-offense-badge ${v.offense_color}`}>{colorLabel}</span>
            {v.is_repeat && <span className="disc-viol-repeat">REPEAT</span>}
          </div>
          <div className="disc-viol-meta">Issued {timeAgo(v.created_at)} by {v.issued_by_name}</div>
        </div>
        <span className="disc-viol-chevron">▼</span>
      </div>

      {open && (
        <div className="disc-viol-body">
          <div>
            <div className="disc-viol-list-label">Violations</div>
            {(v.violations||[]).map((vio:string,i:number)=>(
              <div key={i} className="disc-viol-item">{vio}</div>
            ))}
          </div>
          {v.notes && <div className="disc-viol-notes">{v.notes}</div>}

          <div className="disc-track-grid">
            {/* SSP */}
            {v.ssp && <SSPBlock ssp={v.ssp} violationId={v.id} memberId={v.member_id} canManage={canManage} isBrother={isBrother} onSSP={onSSP} onReload={onReload} cleared={v.cleared}/>}

            {/* Fines */}
            {v.fines?.map((fine:any)=>(
              <div key={fine.id} className="disc-track-block">
                <div className="disc-track-label">Fine — L${fine.amount_ls?.toLocaleString()}</div>
                <div className="disc-track-status" style={{color:fine.status==='paid'?'var(--green)':'#e05070'}}>{fine.status==='paid'?'Paid':fine.status==='payment_plan'?'Payment Plan':'Pending'}</div>
                {fine.due_date&&fine.status!=='paid'&&<div className="disc-track-detail">Due: {dateFmt(fine.due_date)}</div>}
                {fine.payment_plan_amount&&<div className="disc-track-detail">Plan: L${fine.payment_plan_amount?.toLocaleString()} — {fine.payment_plan_notes}</div>}
                {fine.paid_at&&<div className="disc-track-detail">Paid {timeAgo(fine.paid_at)}</div>}
                {canManage&&fine.status!=='paid'&&(
                  <div style={{display:'flex',gap:'4px',marginTop:'.4rem',flexWrap:'wrap'}}>
                    <button className="disc-track-btn green" onClick={()=>onFine(fine.id,'paid')}>Mark Paid</button>
                    {fine.status!=='payment_plan'&&<button className="disc-track-btn gold" onClick={()=>setFineModal(true)}>Payment Plan</button>}
                  </div>
                )}
                {fineModal&&canManage&&(
                  <div style={{marginTop:'.5rem',display:'flex',flexDirection:'column',gap:'4px'}}>
                    <input className="disc-issue-fld" placeholder="Amount agreed (L$)..." value={planAmt} onChange={e=>setPlanAmt(e.target.value)} type="number"/>
                    <input className="disc-issue-fld" placeholder="Plan notes..." value={planNote} onChange={e=>setPlanNote(e.target.value)}/>
                    <div style={{display:'flex',gap:'4px'}}>
                      <button className="disc-track-btn gold" onClick={()=>{onFine(fine.id,'payment_plan',{payment_plan_amount:parseInt(planAmt),payment_plan_notes:planNote});setFineModal(false);}}>Save Plan</button>
                      <button className="disc-track-btn" style={{borderColor:'rgba(255,255,255,.08)',color:'var(--bone-faint)'}} onClick={()=>setFineModal(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Warrants */}
            {v.warrants?.map((w:any)=>(
              <div key={w.id} className="disc-track-block">
                <div className="disc-track-label">Warrant #{w.warrant_number}</div>
                <div className="disc-track-status" style={{color:'var(--crimson-c)'}}>Warrant Issued</div>
                <div className="disc-track-detail">Issued {timeAgo(w.issued_at)}</div>
              </div>
            ))}

            {/* Suspensions */}
            {v.suspensions?.map((s:any)=>(
              <div key={s.id} className="disc-track-block">
                <div className="disc-track-label">Suspension</div>
                <div className="disc-track-status" style={{color:s.status==='active'?'var(--crimson-c)':'var(--green)'}}>{s.status==='active'?'Active':'Lifted'}</div>
                <div className="disc-track-detail">{dateFmt(s.start_date)} → {dateFmt(s.end_date)}</div>
                <div className="disc-track-detail">No frat gear · No frat activities</div>
                {s.status==='lifted'&&<div className="disc-track-detail">Lifted by {s.lifted_by_name}</div>}
                {canManage&&s.status==='active'&&<button className="disc-track-btn green" style={{marginTop:'.4rem'}} onClick={()=>onLiftSusp(s.id)}>Lift Early</button>}
              </div>
            ))}

            {/* Court Marshall */}
            {v.offense_color==='crimson_red'&&(
              <div className="disc-track-block" style={{gridColumn:'1/-1'}}>
                <div className="disc-track-label">Court Marshall</div>
                {v.court_marshall ? (
                  <>
                    <div className="disc-track-status" style={{color:'var(--green)'}}>Verdict Logged</div>
                    {v.court_marshall.held_at&&<div className="disc-track-detail">Held: {dateFmt(v.court_marshall.held_at)}</div>}
                    {v.court_marshall.verdict&&<div className="disc-track-detail"><strong style={{color:'var(--bone)'}}>Verdict:</strong> {v.court_marshall.verdict}</div>}
                    {v.court_marshall.consequences&&<div className="disc-track-detail"><strong style={{color:'var(--bone)'}}>Consequences:</strong> {v.court_marshall.consequences}</div>}
                    <div className="disc-track-detail">Logged by {v.court_marshall.logged_by_name}</div>
                  </>
                ) : (
                  <>
                    <div className="disc-track-status" style={{color:'var(--bone-faint)'}}>Awaiting Proceedings</div>
                    {canManage&&<button className="disc-track-btn red" style={{marginTop:'.4rem'}} onClick={onCourtMarshall}>Log Verdict</button>}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="disc-issued-by">ID: {v.id.slice(0,8)}… · Issued by {v.issued_by_name} · {dateFmt(v.created_at)}</div>
        </div>
      )}
    </div>
  );
}

/* ── SSP BLOCK ── */
function SSPBlock({ssp,violationId,memberId,canManage,isBrother,onSSP,onReload,cleared}:any){
  const [expanded, setExpanded] = useState(false);
  const [localSsp, setLocalSsp] = useState(ssp);
  const [saving, setSaving]     = useState<string|null>(null);
  const offerNum = localSsp.offer_number||1;
  const isOffered  = localSsp.status==='offered';
  const isEnrolled = localSsp.status==='enrolled'||localSsp.status==='completed';
  const isOptedOut = localSsp.status==='opted_out';
  const lessonsDone = SSP_LESSONS.filter(l=>localSsp[l.key]).length;
  const allDone = lessonsDone===6&&localSsp.reflections_done;

  async function brotherEnroll(){ setSaving('enroll'); await fetch('/api/dashboard/discipline/ssp',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ssp_id:ssp.id,status:'enrolled'})}); setLocalSsp((p:any)=>({...p,status:'enrolled'})); setSaving(null); if(onReload)onReload(); window.location.href='/dashboard/ssp'; }
  async function brotherOptOut(){ if(!confirm('Opt out? Disciplinary action will be at discretion of the Sgt. at Arms.'))return; setSaving('optout'); await fetch('/api/dashboard/discipline/ssp',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ssp_id:ssp.id,status:'opted_out'})}); setLocalSsp((p:any)=>({...p,status:'opted_out'})); setSaving(null); if(onReload)onReload(); }
  async function toggleLesson(lesson:string,cur:boolean){ setSaving(lesson); setLocalSsp((p:any)=>({...p,[lesson]:!cur})); await fetch('/api/dashboard/discipline/ssp-lessons',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ssp_id:ssp.id,action:'toggle_lesson',lesson,value:!cur})}); setSaving(null); }
  async function toggleReflections(cur:boolean){ setSaving('reflect'); setLocalSsp((p:any)=>({...p,reflections_done:!cur})); await fetch('/api/dashboard/discipline/ssp-lessons',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ssp_id:ssp.id,action:'toggle_reflections',value:!cur})}); setSaving(null); }
  async function clearBrother(){ if(!confirm('Mark as cleared? All charges dismissed.'))return; setSaving('clear'); await fetch('/api/dashboard/discipline/ssp-lessons',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ssp_id:ssp.id,violation_id:violationId,member_id:memberId,action:'clear'})}); setSaving(null); onReload(); }

  return (
    <div className="disc-track-block ssp-block">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.4rem'}}>
        <div className="disc-track-label" style={{color:'rgba(107,131,184,.6)'}}>SSP — Offer {offerNum} of 3</div>
        {cleared ? <span style={{fontFamily:'var(--cinzel)',fontSize:'.52rem',letterSpacing:'2px',color:'var(--green)',background:'rgba(74,222,128,.08)',border:'1px solid rgba(74,222,128,.2)',padding:'2px 8px',borderRadius:'3px'}}>CLEARED</span>
          : <span style={{fontFamily:'var(--cinzel)',fontSize:'.52rem',letterSpacing:'1px',color:'var(--bone-faint)'}}>{localSsp.status?.replace('_',' ').toUpperCase()}</span>}
      </div>

      {/* Brother: offered */}
      {isBrother&&isOffered&&!cleared&&(
        <div className="disc-ssp-offer-box">
          <div className="disc-ssp-offer-title">Sage Solution Program Offered</div>
          <div className="disc-ssp-offer-desc">6-lesson program. Complete all lessons and reflection to clear all charges for this violation. Opting out means disciplinary action at Sgt. at Arms discretion.</div>
          <div style={{display:'flex',gap:'.5rem',marginTop:'.75rem'}}>
            <button className="disc-ssp-enroll-btn" onClick={brotherEnroll} disabled={!!saving}>{saving==='enroll'?'Enrolling...':'Accept — Begin SSP'}</button>
            <button className="disc-track-btn red" onClick={brotherOptOut} disabled={!!saving}>{saving==='optout'?'Processing...':'Opt Out'}</button>
          </div>
        </div>
      )}

      {/* Brother: opted out */}
      {isBrother&&isOptedOut&&<div className="disc-track-detail" style={{color:'var(--crimson-c)'}}>You opted out. Disciplinary action will be assessed by the Sgt. at Arms.</div>}

      {/* Brother: enrolled */}
      {isBrother&&isEnrolled&&!cleared&&(
        <>
          <div className="disc-track-detail">You are enrolled. Attend all 6 sessions and complete your reflection exercises.</div>
          <button className="disc-add-btn" style={{marginTop:'.4rem'}} onClick={()=>setExpanded(v=>!v)}>{expanded?'Hide Lessons':`View Progress (${lessonsDone}/6 complete)`}</button>
          {expanded&&<LessonList ssp={localSsp} canToggle={false}/>}
        </>
      )}

      {/* Brother: cleared */}
      {isBrother&&cleared&&<div className="disc-track-detail" style={{color:'var(--green)'}}>✓ SSP completed. All charges cleared.{localSsp.cleared_at&&` Cleared ${dateFmt(localSsp.cleared_at)}.`}</div>}

      {/* Leader */}
      {canManage&&(
        <>
          {isOffered&&<div style={{display:'flex',gap:'4px',marginTop:'.4rem'}}><button className="disc-track-btn green" onClick={()=>onSSP(ssp.id,'enrolled')}>Mark Enrolled</button><button className="disc-track-btn red" onClick={()=>onSSP(ssp.id,'opted_out')}>Mark Opted Out</button></div>}
          {isOptedOut&&<div className="disc-track-detail" style={{color:'var(--crimson-c)',marginTop:'.3rem'}}>Opted out. Action at Sgt. at Arms discretion.</div>}
          {isEnrolled&&(
            <>
              <button className="disc-add-btn" style={{marginTop:'.4rem'}} onClick={()=>setExpanded(v=>!v)}>{expanded?'Hide Lessons':`Track Lessons (${lessonsDone}/6)`}</button>
              {expanded&&(
                <div style={{marginTop:'.5rem',display:'flex',flexDirection:'column',gap:'4px'}}>
                  {SSP_LESSONS.map((l,i)=>(
                    <div key={l.key} className={`disc-ssp-lesson${localSsp[l.key]?' done':''}`} onClick={()=>!localSsp.cleared&&toggleLesson(l.key,localSsp[l.key])}>
                      <div className={`disc-ssp-lesson-check${localSsp[l.key]?' done':' pending'}`}>{localSsp[l.key]?'✓':saving===l.key?'…':`${i+1}`}</div>
                      <div><div className="disc-ssp-lesson-title">{l.title}</div><div className="disc-ssp-lesson-desc">{l.desc}</div></div>
                    </div>
                  ))}
                  <div className={`disc-ssp-lesson${localSsp.reflections_done?' done':''}`} onClick={()=>!localSsp.cleared&&toggleReflections(localSsp.reflections_done)}>
                    <div className={`disc-ssp-lesson-check${localSsp.reflections_done?' done':' pending'}`}>{localSsp.reflections_done?'✓':saving==='reflect'?'…':'R'}</div>
                    <div><div className="disc-ssp-lesson-title">Final Reflection</div></div>
                  </div>
                </div>
              )}
              {allDone&&!localSsp.cleared&&<button className="disc-track-btn green" style={{marginTop:'.5rem'}} onClick={clearBrother} disabled={saving==='clear'}>{saving==='clear'?'Clearing...':'✓ Mark Cleared — Dismiss All Charges'}</button>}
            </>
          )}
          {localSsp.cleared&&<div className="disc-track-detail" style={{color:'var(--green)',marginTop:'.3rem'}}>Cleared by {localSsp.cleared_by_name}{localSsp.cleared_at&&` · ${dateFmt(localSsp.cleared_at)}`}</div>}
        </>
      )}
    </div>
  );
}

function LessonList({ssp,canToggle}:{ssp:any;canToggle:boolean}){
  return (
    <div style={{marginTop:'.5rem',display:'flex',flexDirection:'column',gap:'4px'}}>
      {SSP_LESSONS.map((l,i)=>(
        <div key={l.key} className={`disc-ssp-lesson${ssp[l.key]?' done':''}`} style={{cursor:'default'}}>
          <div className={`disc-ssp-lesson-check${ssp[l.key]?' done':' pending'}`}>{ssp[l.key]?'✓':`${i+1}`}</div>
          <div><div className="disc-ssp-lesson-title">{l.title}</div></div>
        </div>
      ))}
      <div className={`disc-ssp-lesson${ssp.reflections_done?' done':''}`} style={{cursor:'default'}}>
        <div className={`disc-ssp-lesson-check${ssp.reflections_done?' done':' pending'}`}>{ssp.reflections_done?'✓':'R'}</div>
        <div><div className="disc-ssp-lesson-title">Final Reflection</div></div>
      </div>
    </div>
  );
}

function CourtMarshallModal({v,onClose,onSave}:any){
  const [form,setForm]=useState({held_at:'',verdict:'',consequences:'',notes:''});
  const [saving,setSaving]=useState(false);
  async function save(){setSaving(true);await onSave(v.id,v.member_id,form);setSaving(false);}
  return (
    <div className="disc-overlay" onClick={onClose}>
      <div className="disc-modal" onClick={e=>e.stopPropagation()}>
        <div className="disc-modal-hdr">
          <div className="disc-modal-title">Log Court Marshall Verdict</div>
          <button className="disc-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="disc-modal-body">
          <div style={{fontFamily:'var(--cinzel)',fontSize:'.65rem',letterSpacing:'1px',color:'var(--bone-faint)'}}>Brother: <strong style={{color:'var(--bone)'}}>{v.member_name}</strong></div>
          <div><label className="disc-modal-lbl">Date Held</label><input className="disc-modal-fld" type="date" value={form.held_at} onChange={e=>setForm(f=>({...f,held_at:e.target.value}))}/></div>
          <div><label className="disc-modal-lbl">Verdict</label><input className="disc-modal-fld" value={form.verdict} onChange={e=>setForm(f=>({...f,verdict:e.target.value}))} placeholder="e.g. Guilty, Not Guilty, Dismissed..."/></div>
          <div><label className="disc-modal-lbl">Consequences</label><textarea className="disc-modal-fld" style={{minHeight:'75px',resize:'vertical'}} value={form.consequences} onChange={e=>setForm(f=>({...f,consequences:e.target.value}))} placeholder="All disciplinary actions decided..."/></div>
          <div><label className="disc-modal-lbl">Additional Notes</label><textarea className="disc-modal-fld" style={{minHeight:'56px',resize:'vertical'}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Notes from proceedings..."/></div>
          <div className="disc-modal-foot">
            <button className="disc-submit-btn" style={{flex:1}} onClick={save} disabled={saving||!form.verdict}>{saving?'Saving...':'Save Verdict'}</button>
            <button className="disc-track-btn" style={{borderColor:'rgba(255,255,255,.08)',color:'var(--bone-faint)'}} onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
