'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../dash.css';
import './dues.css';
import DashSidebar from '../DashSidebar';

const SWEAT_CATS = ['Planning','Advertising','Recruitment','Design','Content Creation','Event Support','Administrative','General'];
const STATUS_COL: Record<string,string> = { paid:'#4ade80', partial:'#c6930a', unpaid:'#e05070', waived:'rgba(240,232,208,.15)' };
function fmt(n: number) { return `L$${n.toLocaleString()}`; }
function pct(paid: number, sweat: number, due: number) { return Math.min(100, Math.round(((paid+sweat)/due)*100)); }
function dateFmt(d:string){ return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }
function progCls(status:string, p:number){ if(status==='paid') return 'green'; return p > 40 ? 'gold' : 'red'; }

function Countdown({ expiresAt, size='md' }: { expiresAt:string; size?:'sm'|'md' }) {
  const [display, setDisplay] = useState('');
  const [state, setState]   = useState<'ok'|'warn'|'urgent'|'expired'>('ok');
  useEffect(() => {
    function tick() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setState('expired'); setDisplay('EXPIRED'); return; }
      const d=Math.floor(diff/86400000), h=Math.floor((diff%86400000)/3600000),
            m=Math.floor((diff%3600000)/60000), s=Math.floor((diff%60000)/1000);
      setState(diff < 86400000 ? 'urgent' : diff < 86400000*3 ? 'warn' : 'ok');
      setDisplay(d > 0 ? `${d}d ${h}h ${m}m ${s}s` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    }
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, [expiresAt]);
  const fs = size === 'sm' ? '.65rem' : '.88rem';
  return <span className={`du-countdown-time ${state}`} style={{ fontSize:fs }}>{display}</span>;
}

export default function DuesPage() {
  const [member, setMember]       = useState<any>(null);
  const [profile, setProfile]     = useState<any>(null);
  const [canManage, setCanManage] = useState(false);
  const [periods, setPeriods]     = useState<any[]>([]);
  const [activePeriod, setActivePeriod] = useState<string|null>(null);
  const [records, setRecords]     = useState<any[]>([]);
  const [myRecords, setMyRecords] = useState<any[]>([]);
  const [selRecord, setSelRecord] = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState('');
  const [saving, setSaving]       = useState(false);
  const [modal, setModal]         = useState<string|null>(null);
  const [sweatApprove, setSweatApprove] = useState<{id:string,value:string,notes:string}|null>(null);
  const [timerEdit, setTimerEdit] = useState<{record_id:string,expires_at:string,casper_expiry_text:string}|null>(null);

  const [payForm, setPayForm]   = useState({ amount_ls:'', transaction_id:'', expires_at:'', casper_expiry_text:'', notes:'', target_member_id:'' });
  const [sweatForm, setSweatForm] = useState({ contribution:'', category:'General', value_requested:'', notes:'' });
  const [periodForm, setPeriodForm] = useState({ month:new Date().getMonth()+1, year:new Date().getFullYear(), amount_due:4000 });

  useEffect(() => {
    fetch('/api/dashboard/dues/periods').then(r=>r.json()).then(async d => {
      if (d.error) { window.location.href='/login'; return; }
      setMember(d.member); setProfile(d.profile||{});
      setCanManage(d.can_manage); setPeriods(d.periods||[]);
      const first = d.periods?.[0]?.id || null;
      setActivePeriod(first);
      if (d.can_manage && first) await loadRecords(first);
      await loadMyRecords();
      setLoading(false);
    });
  }, []);

  async function loadRecords(pid:string) {
    const d = await fetch(`/api/dashboard/dues/record?period_id=${pid}&view=all`).then(r=>r.json());
    const recs = d.records||[];
    setRecords(recs);
    if (selRecord) { const fresh = recs.find((r:any)=>r.id===selRecord.id); if(fresh) setSelRecord(fresh); }
  }
  async function loadMyRecords() { const d = await fetch('/api/dashboard/dues/record').then(r=>r.json()); setMyRecords(d.records||[]); }
  async function selectPeriod(pid:string) { setActivePeriod(pid); setSelRecord(null); if(canManage) await loadRecords(pid); }
  async function createPeriod() {
    setSaving(true);
    const res = await fetch('/api/dashboard/dues/periods',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(periodForm)}).then(r=>r.json());
    if(res.error){setMsg(`err:${res.error}`);setSaving(false);return;}
    setMsg('ok:Period created.'); setPeriods(p=>[res.period,...p]); setActivePeriod(res.period.id);
    await loadRecords(res.period.id); setSaving(false); setTimeout(()=>{setModal(null);setMsg('');},1500);
  }
  async function logPayment() {
    if(!payForm.amount_ls){setMsg('err:Enter payment amount.');return;}
    setSaving(true);
    const body:any = { period_id:activePeriod, amount_ls:parseInt(payForm.amount_ls), transaction_id:payForm.transaction_id||null, notes:payForm.notes||null, expires_at:payForm.expires_at||null, casper_expiry_text:payForm.casper_expiry_text||null };
    if(canManage && selRecord) body.target_member_id = selRecord.member_id;
    const res = await fetch('/api/dashboard/dues/payments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json());
    if(res.error){setMsg(`err:${res.error}`);setSaving(false);return;}
    setPayForm({amount_ls:'',transaction_id:'',expires_at:'',casper_expiry_text:'',notes:'',target_member_id:''});
    if(canManage) await loadRecords(activePeriod!);
    await loadMyRecords(); setSaving(false); setMsg('ok:Payment logged.');
    setTimeout(()=>setMsg(''),2000);
  }
  async function submitSweat() {
    if(!sweatForm.contribution.trim()){setMsg('err:Describe your contribution.');return;}
    setSaving(true);
    const body = { period_id:activePeriod, ...sweatForm, value_requested: sweatForm.value_requested ? parseInt(sweatForm.value_requested) : null };
    const res = await fetch('/api/dashboard/dues/sweat-equity',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json());
    if(res.error){setMsg(`err:${res.error}`);setSaving(false);return;}
    setMsg('ok:Submitted for review.'); setSweatForm({contribution:'',category:'General',value_requested:'',notes:''});
    await loadMyRecords(); setSaving(false); setTimeout(()=>{setModal(null);setMsg('');},1200);
  }
  async function approveSweat(sweat_id:string, action:string, value:string, notes:string) {
    setSaving(true);
    await fetch('/api/dashboard/dues/sweat-equity',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({sweat_id,action,value_approved:parseInt(value)||0,notes})});
    setSweatApprove(null);
    if(canManage) await loadRecords(activePeriod!);
    await loadMyRecords(); setSaving(false);
  }
  async function updateTimer(record_id:string, expires_at:string, casper_expiry_text:string) {
    setSaving(true);
    await fetch('/api/dashboard/dues/payments',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({record_id,expires_at,casper_expiry_text})});
    setTimerEdit(null); if(canManage) await loadRecords(activePeriod!); setSaving(false);
  }
  async function waveRecord(record_id:string) {
    if(!confirm('Waive dues for this brother?')) return;
    await fetch('/api/dashboard/dues/record',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({record_id,status:'waived'})});
    if(canManage) await loadRecords(activePeriod!);
  }

  const currentPeriod = periods.find(p=>p.id===activePeriod);
  const stats = canManage ? {
    paid:records.filter(r=>r.status==='paid').length,
    partial:records.filter(r=>r.status==='partial').length,
    unpaid:records.filter(r=>r.status==='unpaid').length,
    total:records.length,
  } : null;
  const pendingSweat = canManage ? records.flatMap(r=>(r.sweat_equity||[]).filter((s:any)=>s.status==='pending').map((s:any)=>({...s,member_name:r.member_name,member_id:r.member_id}))) : [];
  const msgType = msg.startsWith('ok:') ? 'ok' : 'err';
  const msgText = msg.replace(/^(ok|err):/,'');

  if(loading || !member) return <div className="dash-loading">LOADING...</div>;

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />
      <main className="dash-main">

        {/* Header */}
        <div className="dash-page-header">
          <div className="dash-page-title">Dues & Contributions</div>
          {canManage && <button className="du-period-new-btn" onClick={()=>setModal('period')}>+ New Period</button>}
        </div>

        {/* Period bar */}
        <div className="du-period-bar">
          <span className="du-period-label">Period</span>
          <select className="du-period-select" value={activePeriod||''} onChange={e=>selectPeriod(e.target.value)}>
            {periods.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          {currentPeriod && <span style={{fontFamily:'var(--cinzel)',fontSize:'.58rem',letterSpacing:'2px',color:'var(--bone-faint)'}}>L${currentPeriod.amount_due?.toLocaleString()} due</span>}
        </div>

        {/* ══ ADMIN VIEW ══ */}
        {canManage && activePeriod && (
          <>
            {/* Stats strip */}
            {stats && (
              <div className="du-adm-stats">
                {[
                  {val:stats.paid,   lbl:'Paid',    col:'var(--green)',  bc:'var(--green)',  ic:'#4ade80',  path:<polyline points="20 6 9 17 4 12"/>},
                  {val:stats.partial,lbl:'Partial',  col:'var(--gold-b)', bc:'var(--gold-b)', ic:'#e8b84b',  path:<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>},
                  {val:stats.unpaid, lbl:'Unpaid',   col:'#e05070',       bc:'#e05070',       ic:'#e05070',  path:<><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>},
                  {val:stats.total,  lbl:'Total',    col:'var(--gold)',   bc:'var(--gold)',   ic:'#c6930a',  path:<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>},
                ].map((s,i)=>(
                  <div key={i} className="du-adm-stat-cell" style={{borderLeft:`2px solid ${s.bc}`}}>
                    <div className="du-adm-stat-icon" style={{background:`${s.ic}18`,border:`1px solid ${s.ic}40`}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={s.ic} strokeWidth="2.2">{s.path}</svg>
                    </div>
                    <div><div className="du-adm-stat-val" style={{color:s.col}}>{s.val}</div><div className="du-adm-stat-lbl">{s.lbl}</div></div>
                  </div>
                ))}
              </div>
            )}

            {/* Three columns */}
            <div className="du-adm-body">

              {/* LEFT: brother list */}
              <div className="du-adm-list">
                <div className="du-adm-list-hdr">
                  <span>Brothers ({records.length})</span>
                  <a href="/dashboard/dues-report" style={{fontFamily:'var(--cinzel)',fontSize:'.35rem',letterSpacing:'2px',color:'var(--gold)',textDecoration:'none'}}>Report →</a>
                </div>
                <div className="du-adm-items">
                  {records.map(rec=>(
                    <div key={rec.id} className={`du-adm-item${selRecord?.id===rec.id?' sel':''}`} onClick={()=>setSelRecord(rec)}>
                      <div className="du-adm-item-top">
                        <span className="du-adm-item-name">{rec.member_name}</span>
                        <span className={`du-badge ${rec.status}`} style={{fontSize:'.44rem',padding:'1px 6px'}}>{rec.status}</span>
                      </div>
                      <div className="du-prog-track"><div className={`du-prog-fill ${progCls(rec.status, pct(rec.linden_paid,rec.sweat_equity_value,rec.amount_due))}`} style={{width:`${pct(rec.linden_paid,rec.sweat_equity_value,rec.amount_due)}%`}}/></div>
                      {rec.expires_at && <Countdown expiresAt={rec.expires_at} size="sm" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* CENTRE: detail */}
              <div className="du-adm-detail">
                {!selRecord ? (
                  <div className="du-adm-detail-empty">Select a brother</div>
                ) : (
                  <>
                    <div className="du-detail-hero">
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'.8rem'}}>
                        <div>
                          <div style={{fontFamily:'var(--cinzel)',fontSize:'.38rem',letterSpacing:'4px',color:'rgba(198,147,10,.5)',marginBottom:'.3rem'}}>
                            {currentPeriod?.label} · Active Period
                          </div>
                          <div className="du-detail-name">{selRecord.member_name}</div>
                        </div>
                        <span className={`du-badge ${selRecord.status}`} style={{marginTop:'.3rem'}}>{selRecord.status}</span>
                      </div>
                      <div style={{display:'flex',alignItems:'flex-end',gap:'.8rem'}}>
                        <div>
                          <div style={{fontFamily:'var(--cinzel)',fontSize:'.35rem',letterSpacing:'3px',color:'rgba(198,147,10,.4)',marginBottom:'.2rem'}}>Amount Due</div>
                          <div className="du-detail-amount">{fmt(selRecord.amount_due)}</div>
                        </div>
                        <div style={{paddingBottom:'.3rem'}}>
                          <div style={{fontFamily:'var(--cinzel)',fontSize:'.35rem',letterSpacing:'3px',color:'rgba(198,147,10,.4)',marginBottom:'.2rem'}}>Covered</div>
                          <div style={{fontFamily:'var(--display)',fontSize:'1.2rem',letterSpacing:'1px',color:'var(--gold-b)'}}>{pct(selRecord.linden_paid,selRecord.sweat_equity_value,selRecord.amount_due)}%</div>
                        </div>
                      </div>
                      <div className="du-prog-track"><div className={`du-prog-fill ${progCls(selRecord.status,pct(selRecord.linden_paid,selRecord.sweat_equity_value,selRecord.amount_due))}`} style={{width:`${pct(selRecord.linden_paid,selRecord.sweat_equity_value,selRecord.amount_due)}%`}}/></div>
                    </div>

                    {/* Breakdown */}
                    <div className="du-breakdown" style={{borderRadius:0,border:'none',borderBottom:'1px solid var(--border)'}}>
                      <div className="du-bk-cell"><div className="du-bk-lbl">Linden Paid</div><div className="du-bk-val green">{fmt(selRecord.linden_paid)}</div></div>
                      <div className="du-bk-cell"><div className="du-bk-lbl">Sweat Equity</div><div className="du-bk-val gold">{fmt(selRecord.sweat_equity_value)}</div></div>
                      <div className="du-bk-cell"><div className="du-bk-lbl">Remaining</div><div className="du-bk-val red">{fmt(Math.max(0,selRecord.amount_due-selRecord.linden_paid-selRecord.sweat_equity_value))}</div></div>
                    </div>

                    {/* Timer */}
                    {selRecord.expires_at && (
                      <div className="du-detail-timer-row" style={{margin:'.7rem 1rem',borderRadius:2}}>
                        <div><div className="du-detail-timer-lbl">CasperLet Expiry</div><Countdown expiresAt={selRecord.expires_at} /></div>
                      </div>
                    )}

                    {/* Payments */}
                    {selRecord.payments?.length > 0 && (
                      <div className="du-detail-section">
                        <div className="du-clbl">Linden Payments</div>
                        <div style={{display:'flex',flexDirection:'column',gap:'1px'}}>
                          {selRecord.payments.map((p:any)=>(
                            <div key={p.id} className="du-sweat-row">
                              <span className="du-sw-dot approved"/>
                              <span className="du-sw-desc">{fmt(p.amount_ls)} — {p.logged_by_name}</span>
                              <span className="du-sw-val approved">{fmt(p.amount_ls)} ✓</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sweat */}
                    {selRecord.sweat_equity?.length > 0 && (
                      <div className="du-detail-section">
                        <div className="du-clbl">Sweat Equity</div>
                        <div style={{display:'flex',flexDirection:'column',gap:'1px'}}>
                          {selRecord.sweat_equity.map((s:any)=>(
                            <div key={s.id} className="du-sweat-row">
                              <span className={`du-sw-dot ${s.status}`}/>
                              <span className="du-sw-desc">{s.contribution}</span>
                              <span className={`du-sw-val ${s.status}`}>{s.value_approved > 0 ? fmt(s.value_approved) : 'Pending'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* RIGHT: actions */}
              <div className="du-adm-actions">
                {!selRecord && <div style={{padding:'1rem',fontFamily:'var(--cinzel)',fontSize:'.58rem',letterSpacing:'2px',color:'var(--bone-faint)'}}>Select a brother first</div>}
                {selRecord && (
                  <>
                    {msgText && <div className={`du-msg ${msgType}`} style={{margin:'.7rem .85rem 0'}}>{msgText}</div>}

                    {/* Log payment */}
                    <div className="du-action-section">
                      <div className="du-action-title">Log Payment</div>
                      <div style={{fontFamily:'var(--display)',fontSize:'.8rem',letterSpacing:'1px',color:'var(--bone-faint)'}}>{selRecord.member_name}</div>
                      <div><label className="du-action-lbl">Amount (L$)</label><input className="du-action-fld" type="number" placeholder="e.g. 1000" value={payForm.amount_ls} onChange={e=>setPayForm(f=>({...f,amount_ls:e.target.value}))}/></div>
                      <div><label className="du-action-lbl">Transaction ID</label><input className="du-action-fld" placeholder="Optional" value={payForm.transaction_id} onChange={e=>setPayForm(f=>({...f,transaction_id:e.target.value}))}/></div>
                      <div><label className="du-action-lbl">Expiry Date</label><input className="du-action-fld" type="datetime-local" value={payForm.expires_at} onChange={e=>setPayForm(f=>({...f,expires_at:e.target.value}))}/></div>
                      <div><label className="du-action-lbl">Expiry Text</label><input className="du-action-fld" placeholder="e.g. expires Wed 13 May..." value={payForm.casper_expiry_text} onChange={e=>setPayForm(f=>({...f,casper_expiry_text:e.target.value}))}/></div>
                      <button className="du-btn green" style={{width:'100%',justifyContent:'center'}} onClick={logPayment} disabled={saving}>Log Payment</button>
                    </div>

                    {/* Sweat equity review */}
                    {pendingSweat.filter(s=>s.member_id===selRecord.member_id).length > 0 && (
                      <div className="du-action-section">
                        <div className="du-action-title">Sweat Equity Review</div>
                        {pendingSweat.filter(s=>s.member_id===selRecord.member_id).map((s:any)=>(
                          <div key={s.id} className="du-sweat-approve-card">
                            <div className="du-sweat-approve-desc">{s.contribution}</div>
                            <div className="du-sweat-approve-req">Requested: {s.value_requested ? fmt(s.value_requested) : 'N/A'} · {s.category}</div>
                            {sweatApprove?.id === s.id ? (
                              <>
                                <input className="du-action-fld" type="number" placeholder="Approve value (L$)..." value={sweatApprove.value} onChange={e=>setSweatApprove(p=>p?{...p,value:e.target.value}:p)}/>
                                <div className="du-sweat-approve-row">
                                  <button className="du-btn green" style={{fontSize:'.52rem',padding:'.28rem .55rem'}} onClick={()=>approveSweat(s.id,'approve',sweatApprove.value,sweatApprove.notes||'')} disabled={saving}>✓</button>
                                  <button className="du-btn danger" style={{fontSize:'.52rem',padding:'.28rem .55rem'}} onClick={()=>approveSweat(s.id,'deny',sweatApprove.value,sweatApprove.notes||'')} disabled={saving}>✕</button>
                                  <button className="du-btn muted" style={{fontSize:'.52rem',padding:'.28rem .55rem'}} onClick={()=>setSweatApprove(null)}>—</button>
                                </div>
                              </>
                            ) : (
                              <button className="du-btn ghost" style={{fontSize:'.52rem',padding:'.28rem .6rem',alignSelf:'flex-start'}} onClick={()=>setSweatApprove({id:s.id,value:s.value_requested?.toString()||'',notes:''})}>Review</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Timer + Waive */}
                    <div className="du-action-section">
                      <div className="du-action-title">Record</div>
                      <button className="du-btn ghost" style={{width:'100%',justifyContent:'center'}} onClick={()=>setTimerEdit({record_id:selRecord.id,expires_at:selRecord.expires_at||'',casper_expiry_text:selRecord.casper_expiry_text||''})}>⏱ Edit Timer</button>
                      {selRecord.status !== 'waived' && <button className="du-btn muted" style={{width:'100%',justifyContent:'center'}} onClick={()=>waveRecord(selRecord.id)}>Waive Dues</button>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* ══ BROTHER VIEW ══ */}
        {!canManage && (
          <div className="du-bro-wrap"><div className="du-bro-body">
            {/* LEFT: status + history */}
            <div className="du-bro-main">
              {myRecords.length === 0 && (
                <div style={{textAlign:'center',padding:'3rem',fontFamily:'var(--cinzel)',fontSize:'.65rem',letterSpacing:'2px',color:'var(--bone-faint)'}}>No dues records yet.</div>
              )}
              {myRecords.map(rec=>{
                const period = periods.find(p=>p.id===rec.period_id);
                const totalPaid = rec.linden_paid + rec.sweat_equity_value;
                const remaining = Math.max(0, rec.amount_due - totalPaid);
                const progress  = pct(rec.linden_paid, rec.sweat_equity_value, rec.amount_due);
                return (
                  <div key={rec.id}>
                    {/* Status card */}
                    <div className="du-status-card">
                      <div className="du-status-top">
                        <div>
                          <div className="du-status-lbl">{period?.label || 'Current Period'} · Active Period</div>
                          <div className="du-status-amount">{fmt(remaining)}</div>
                          <div style={{display:'flex',alignItems:'center',gap:'.6rem',marginTop:'.4rem'}}>
                            <span className={`du-badge ${rec.status}`}>{rec.status}</span>
                            <span className="du-status-sub">{fmt(totalPaid)} paid · {fmt(rec.amount_due)} total</span>
                          </div>
                        </div>
                        {rec.expires_at && (
                          <div className="du-timer-wrap">
                            <div className="du-timer-lbl">Expires In</div>
                            <Countdown expiresAt={rec.expires_at} />
                            {rec.casper_expiry_text && <div className="du-casper-text" style={{marginTop:'.2rem'}}>{rec.casper_expiry_text}</div>}
                          </div>
                        )}
                      </div>
                      <div className="du-prog-track"><div className={`du-prog-fill ${progCls(rec.status,progress)}`} style={{width:`${progress}%`}}/></div>
                      <div className="du-prog-row"><span>{progress}% covered</span><span>{fmt(remaining)} remaining</span></div>
                    </div>

                    {/* Breakdown */}
                    <div className="du-breakdown">
                      <div className="du-bk-cell"><div className="du-bk-lbl">Amount Due</div><div className="du-bk-val">{fmt(rec.amount_due)}</div></div>
                      <div className="du-bk-cell"><div className="du-bk-lbl">Linden Paid</div><div className="du-bk-val green">{fmt(rec.linden_paid)}</div></div>
                      <div className="du-bk-cell"><div className="du-bk-lbl">Sweat Equity</div><div className="du-bk-val gold">{fmt(rec.sweat_equity_value)}</div></div>
                    </div>

                    {/* Sweat equity */}
                    {rec.sweat_equity?.length > 0 && (
                      <div style={{marginTop:'.9rem'}}>
                        <div className="du-clbl">My Sweat Equity</div>
                        <div style={{display:'flex',flexDirection:'column',gap:'1px'}}>
                          {rec.sweat_equity.map((s:any)=>(
                            <div key={s.id} className="du-entry-row">
                              <span className={`du-entry-dot ${s.status==='approved'?'green':s.status==='pending'?'gold':'red'}`}/>
                              <div style={{flex:1}}>
                                <div className="du-entry-name">{s.contribution}</div>
                                <div className="du-entry-meta">{s.category} · {dateFmt(s.created_at)}</div>
                              </div>
                              <span className={`du-sweat-tag ${s.status}`}>{s.status}</span>
                              {s.value_approved > 0 && <span className="du-entry-amt" style={{color:'var(--green)'}}>{fmt(s.value_approved)}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Payments */}
                    {rec.payments?.length > 0 && (
                      <div style={{marginTop:'.9rem'}}>
                        <div className="du-clbl">My Linden Payments</div>
                        <div style={{display:'flex',flexDirection:'column',gap:'1px'}}>
                          {rec.payments.map((p:any)=>(
                            <div key={p.id} className="du-entry-row">
                              <span className="du-entry-dot green"/>
                              <div style={{flex:1}}>
                                <div className="du-entry-name">{fmt(p.amount_ls)}</div>
                                {p.transaction_id && <div className="du-entry-meta">Tx: {p.transaction_id}</div>}
                                <div className="du-entry-meta">{dateFmt(p.created_at)}</div>
                              </div>
                              <span className="du-entry-amt" style={{color:'var(--green)'}}>{fmt(p.amount_ls)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* RIGHT: submit + past periods */}
            <div className="du-bro-side">
              <div className="du-clbl">Submit Sweat Equity</div>
              <div className="du-form-card">
                <div><label className="du-flbl">Contribution</label><input className="du-fld" placeholder="What did you contribute?" value={sweatForm.contribution} onChange={e=>setSweatForm(f=>({...f,contribution:e.target.value}))}/></div>
                <div><label className="du-flbl">Category</label>
                  <select className="du-fld" value={sweatForm.category} onChange={e=>setSweatForm(f=>({...f,category:e.target.value}))}>
                    {SWEAT_CATS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="du-flbl">Value Requested (L$)</label><input className="du-fld" type="number" placeholder="e.g. 300" value={sweatForm.value_requested} onChange={e=>setSweatForm(f=>({...f,value_requested:e.target.value}))}/></div>
                <div><label className="du-flbl">Notes</label><textarea className="du-fld du-fta" placeholder="Any additional context..." value={sweatForm.notes} onChange={e=>setSweatForm(f=>({...f,notes:e.target.value}))}/></div>
                {msgText && <div className={`du-msg ${msgType}`}>{msgText}</div>}
                <button className="du-btn gold du-btn full" onClick={submitSweat} disabled={saving}>{saving?'Submitting...':'Submit Contribution'}</button>
              </div>

              <div style={{height:'1px',background:'var(--border)'}}/>
              <div className="du-clbl">Past Periods</div>
              <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
                {periods.map(p=>{
                  const rec = myRecords.find(r=>r.period_id===p.id);
                  return (
                    <div key={p.id} className="du-period-item">
                      <span className="du-period-item-name">{p.label}</span>
                      {rec && <span className={`du-badge ${rec.status}`} style={{fontSize:'.44rem',padding:'1px 6px'}}>{rec.status}</span>}
                    </div>
                  );
                })}
              </div>

              <div style={{height:'1px',background:'var(--border)'}}/>
              <div style={{fontFamily:'var(--cinzel)',fontSize:'.58rem',letterSpacing:'1px',color:'var(--bone-faint)',lineHeight:'1.6'}}>⚓ Pay via the in-world KΘΦ II Dues Terminal</div>
            </div>
          </div></div>
        )}
      </main>

      {/* ── NEW PERIOD MODAL ── */}
      {modal==='period' && (
        <div className="du-overlay" onClick={()=>setModal(null)}>
          <div className="du-modal" onClick={e=>e.stopPropagation()}>
            <div className="du-modal-hdr"><div className="du-modal-title">Open Billing Period</div><button className="du-modal-close" onClick={()=>setModal(null)}>✕</button></div>
            <div className="du-modal-body">
              {msgText && <div className={`du-msg ${msgType}`}>{msgText}</div>}
              <div><label className="du-modal-lbl">Month</label>
                <select className="du-modal-fld" value={periodForm.month} onChange={e=>setPeriodForm(f=>({...f,month:parseInt(e.target.value)}))}>
                  {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div><label className="du-modal-lbl">Year</label><input className="du-modal-fld" type="number" value={periodForm.year} onChange={e=>setPeriodForm(f=>({...f,year:parseInt(e.target.value)}))}/></div>
              <div><label className="du-modal-lbl">Amount Due (L$)</label><input className="du-modal-fld" type="number" value={periodForm.amount_due} onChange={e=>setPeriodForm(f=>({...f,amount_due:parseInt(e.target.value)}))}/></div>
              <button className="du-btn gold" onClick={createPeriod} disabled={saving}>{saving?'Creating...':'Create Period'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TIMER EDIT MODAL ── */}
      {timerEdit && (
        <div className="du-overlay" onClick={()=>setTimerEdit(null)}>
          <div className="du-modal" onClick={e=>e.stopPropagation()}>
            <div className="du-modal-hdr"><div className="du-modal-title">Edit CasperLet Timer</div><button className="du-modal-close" onClick={()=>setTimerEdit(null)}>✕</button></div>
            <div className="du-modal-body">
              <div><label className="du-modal-lbl">CasperLet Expiry Date</label><input className="du-modal-fld" type="datetime-local" value={timerEdit.expires_at?timerEdit.expires_at.slice(0,16):''} onChange={e=>setTimerEdit(p=>({...p,expires_at:e.target.value}))}/></div>
              <div><label className="du-modal-lbl">CasperLet Expiry Text</label><input className="du-modal-fld" placeholder="e.g. expires Wed, 13th May, at 5:09 AM" value={timerEdit.casper_expiry_text} onChange={e=>setTimerEdit(p=>({...p,casper_expiry_text:e.target.value}))}/></div>
              <button className="du-btn gold" onClick={()=>updateTimer(timerEdit.record_id,timerEdit.expires_at,timerEdit.casper_expiry_text)} disabled={saving}>{saving?'Saving...':'Save Timer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
