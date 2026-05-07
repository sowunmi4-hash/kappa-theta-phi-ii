'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../dash.css';
import './dues.css';
import DashSidebar from '../DashSidebar';

const SWEAT_CATS = ['Planning','Advertising','Recruitment','Design','Content Creation','Event Support','Administrative','General'];
const STATUS_COL: Record<string,string> = { paid:'#4ade80', partial:'#c6930a', unpaid:'#e05070', waived:'rgba(240,232,208,0.15)' };
function fmt(n: number) { return `L$${n.toLocaleString()}`; }
function pct(paid: number, sweat: number, due: number) { return Math.min(100, Math.round(((paid+sweat)/due)*100)); }
function dateFmt(d:string){ return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [display, setDisplay] = useState('');
  const [state,   setState]   = useState<'ok'|'warn'|'urgent'|'expired'>('ok');
  useEffect(() => {
    function tick() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setState('expired'); setDisplay('EXPIRED'); return; }
      const d = Math.floor(diff/86400000), h = Math.floor((diff%86400000)/3600000),
            m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000);
      setState(diff < 86400000 ? 'urgent' : diff < 86400000*3 ? 'warn' : 'ok');
      setDisplay(d > 0 ? `${d}d ${h}h ${m}m ${s}s` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    }
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, [expiresAt]);
  return <span className={`du-countdown-time ${state}`}>{display}</span>;
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

  const [payForm,   setPayForm]   = useState({ amount_ls:'', transaction_id:'', expires_at:'', casper_expiry_text:'', notes:'', target_member_id:'' });
  const [sweatForm, setSweatForm] = useState({ contribution:'', category:'General', value_requested:'', notes:'' });
  const [periodForm, setPeriodForm] = useState({ month: new Date().getMonth()+1, year: new Date().getFullYear(), amount_due: 4000 });

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

  async function loadRecords(pid: string) {
    const d = await fetch(`/api/dashboard/dues/record?period_id=${pid}&view=all`).then(r=>r.json());
    const recs = d.records||[];
    setRecords(recs);
    if (selRecord) {
      const fresh = recs.find((r:any) => r.id === selRecord.id);
      if (fresh) setSelRecord(fresh);
    }
  }
  async function loadMyRecords() {
    const d = await fetch('/api/dashboard/dues/record').then(r=>r.json());
    setMyRecords(d.records||[]);
  }
  async function selectPeriod(pid: string) {
    setActivePeriod(pid);
    setSelRecord(null);
    if (canManage) await loadRecords(pid);
  }

  async function createPeriod() {
    setSaving(true);
    const res = await fetch('/api/dashboard/dues/periods',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(periodForm)}).then(r=>r.json());
    if (res.error) { setMsg(`err:${res.error}`); setSaving(false); return; }
    setMsg('ok:Period created.'); setPeriods(p=>[res.period,...p]); setActivePeriod(res.period.id);
    await loadRecords(res.period.id); setSaving(false);
    setTimeout(()=>{setModal(null);setMsg('');},1500);
  }

  async function logPayment() {
    if (!payForm.amount_ls) { setMsg('err:Enter payment amount.'); return; }
    setSaving(true);
    const body: any = { period_id: activePeriod, amount_ls: parseInt(payForm.amount_ls), transaction_id: payForm.transaction_id||null, notes: payForm.notes||null, expires_at: payForm.expires_at||null, casper_expiry_text: payForm.casper_expiry_text||null };
    if (canManage && payForm.target_member_id) body.target_member_id = payForm.target_member_id;
    const res = await fetch('/api/dashboard/dues/payments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json());
    if (res.error) { setMsg(`err:${res.error}`); setSaving(false); return; }
    setMsg('ok:Payment logged.');
    setPayForm({amount_ls:'',transaction_id:'',expires_at:'',casper_expiry_text:'',notes:'',target_member_id:''});
    if (canManage) await loadRecords(activePeriod!);
    await loadMyRecords(); setSaving(false);
    setTimeout(()=>{setModal(null);setMsg('');},1200);
  }

  async function submitSweat() {
    if (!sweatForm.contribution.trim()) { setMsg('err:Describe your contribution.'); return; }
    setSaving(true);
    const body = { period_id: activePeriod, ...sweatForm, value_requested: sweatForm.value_requested ? parseInt(sweatForm.value_requested) : null };
    const res = await fetch('/api/dashboard/dues/sweat-equity',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json());
    if (res.error) { setMsg(`err:${res.error}`); setSaving(false); return; }
    setMsg('ok:Submitted for review.');
    setSweatForm({contribution:'',category:'General',value_requested:'',notes:''});
    await loadMyRecords(); setSaving(false);
    setTimeout(()=>{setModal(null);setMsg('');},1200);
  }

  async function approveSweat(sweat_id:string, action:string, value:string, notes:string) {
    setSaving(true);
    await fetch('/api/dashboard/dues/sweat-equity',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({sweat_id,action,value_approved:parseInt(value)||0,notes})});
    setSweatApprove(null);
    if (canManage) await loadRecords(activePeriod!);
    await loadMyRecords(); setSaving(false);
  }

  async function updateTimer(record_id:string, expires_at:string, casper_expiry_text:string) {
    setSaving(true);
    await fetch('/api/dashboard/dues/payments',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({record_id,expires_at,casper_expiry_text})});
    setTimerEdit(null);
    if (canManage) await loadRecords(activePeriod!); setSaving(false);
  }

  async function waveRecord(record_id:string) {
    if (!confirm('Waive dues for this brother this period?')) return;
    await fetch('/api/dashboard/dues/record',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({record_id,status:'waived'})});
    if (canManage) await loadRecords(activePeriod!);
  }

  const currentPeriod = periods.find(p => p.id === activePeriod);
  const stats = canManage ? {
    paid:    records.filter(r=>r.status==='paid').length,
    partial: records.filter(r=>r.status==='partial').length,
    unpaid:  records.filter(r=>r.status==='unpaid').length,
    total:   records.length,
  } : null;
  const pendingSweat = canManage ? records.flatMap(r => (r.sweat_equity||[]).filter((s:any)=>s.status==='pending').map((s:any)=>({...s,member_name:r.member_name,member_id:r.member_id}))) : [];
  const msgType = msg.startsWith('ok:') ? 'ok' : 'err';
  const msgText = msg.replace(/^(ok|err):/,'');

  if (loading || !member) return <div className="dash-loading">LOADING...</div>;

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />
      <main className="dash-main">

        {/* Header */}
        <div className="dash-page-header">
          <div className="dash-page-title">Dues & Contributions</div>
          <div style={{display:'flex',alignItems:'center',gap:'.8rem'}}>
            {canManage && <button className="du-btn ghost" style={{fontSize:'.6rem'}} onClick={()=>setModal('period')}>+ New Period</button>}
          </div>
        </div>

        {/* Period selector */}
        <div className="du-period-bar">
          <span className="du-period-label">Period</span>
          <select className="du-period-select" value={activePeriod||''} onChange={e=>selectPeriod(e.target.value)}>
            {periods.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          {currentPeriod && <span style={{fontFamily:'var(--cinzel)',fontSize:'.6rem',letterSpacing:'2px',color:'var(--bone-faint)'}}>L${currentPeriod.amount_due?.toLocaleString()} due</span>}
        </div>

        {/* ═══ ADMIN VIEW ═══ */}
        {canManage && activePeriod && (
          <>
            {/* Stats strip */}
            {stats && (
              <div className="du-stats-strip">
                <div className="du-stat-cell"><div><div className="du-stat-num" style={{color:'#4ade80'}}>{stats.paid}</div><div className="du-stat-lbl">Paid</div></div></div>
                <div className="du-stat-cell"><div><div className="du-stat-num" style={{color:'#c6930a'}}>{stats.partial}</div><div className="du-stat-lbl">Partial</div></div></div>
                <div className="du-stat-cell"><div><div className="du-stat-num" style={{color:'#e05070'}}>{stats.unpaid}</div><div className="du-stat-lbl">Unpaid</div></div></div>
                <div className="du-stat-cell"><div><div className="du-stat-num">{stats.total}</div><div className="du-stat-lbl">Total</div></div></div>
              </div>
            )}

            {/* Sweat equity queue */}
            {pendingSweat.length > 0 && (
              <div className="du-sweat-queue">
                <div className="du-sweat-queue-hdr">
                  <span className="du-sweat-queue-lbl">Sweat Equity — Pending</span>
                  <span className="du-sweat-queue-badge">{pendingSweat.length}</span>
                </div>
                {pendingSweat.map((s:any) => (
                  <div key={s.id} className="du-sweat-queue-item">
                    <div style={{flex:1}}>
                      <div className="du-sweat-queue-name">{s.member_name}</div>
                      <div className="du-sweat-queue-desc">{s.category} — {s.contribution}</div>
                      {s.value_requested && <div className="du-sweat-queue-desc">Requested: {fmt(s.value_requested)}</div>}
                    </div>
                    {sweatApprove?.id === s.id ? (
                      <div style={{display:'flex',flexDirection:'column',gap:'4px',minWidth:'160px'}}>
                        <input className="du-action-input" placeholder="Value (L$)..." type="number" value={sweatApprove.value} onChange={e=>setSweatApprove(p=>p?{...p,value:e.target.value}:p)} />
                        <input className="du-action-input" placeholder="Notes..." value={sweatApprove.notes} onChange={e=>setSweatApprove(p=>p?{...p,notes:e.target.value}:p)} />
                        <div style={{display:'flex',gap:'4px'}}>
                          <button className="du-btn green" style={{fontSize:'.55rem',padding:'.3rem .65rem'}} onClick={()=>approveSweat(s.id,'approve',sweatApprove.value,sweatApprove.notes)} disabled={saving}>✓</button>
                          <button className="du-btn danger" style={{fontSize:'.55rem',padding:'.3rem .65rem'}} onClick={()=>approveSweat(s.id,'deny',sweatApprove.value,sweatApprove.notes)} disabled={saving}>✕</button>
                          <button className="du-btn muted" style={{fontSize:'.55rem',padding:'.3rem .65rem'}} onClick={()=>setSweatApprove(null)}>—</button>
                        </div>
                      </div>
                    ) : (
                      <button className="du-btn ghost" style={{fontSize:'.58rem',padding:'.32rem .75rem'}} onClick={()=>setSweatApprove({id:s.id,value:s.value_requested?.toString()||'',notes:''})}>Review</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Three-column admin layout */}
            <div className="du-admin-layout">

              {/* LEFT: Brother list */}
              <div className="du-admin-list">
                <div className="du-admin-list-hdr">Brothers ({records.length})</div>
                <div className="du-admin-items">
                  {records.map(rec => (
                    <div key={rec.id} className={`du-admin-item${selRecord?.id===rec.id?' sel':''}`} onClick={()=>setSelRecord(rec)}>
                      <div className="du-admin-item-name">{rec.member_name}</div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'.4rem'}}>
                        <span className={`du-badge ${rec.status}`} style={{fontSize:'.46rem',padding:'1px 7px'}}>{rec.status}</span>
                        {rec.expires_at && <Countdown expiresAt={rec.expires_at} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CENTRE: Detail */}
              <div className="du-admin-detail">
                {!selRecord ? (
                  <div className="du-admin-empty">Select a brother</div>
                ) : (
                  <>
                    {/* Hero */}
                    <div className="du-status-hero-top">
                      <div style={{flex:1}}>
                        <div style={{fontFamily:'var(--display)',fontWeight:700,fontSize:'1.15rem',letterSpacing:'2px',color:'var(--bone)',textTransform:'uppercase'}}>{selRecord.member_name}</div>
                        <div style={{fontFamily:'var(--cinzel)',fontSize:'.6rem',letterSpacing:'2px',color:'var(--bone-faint)',marginTop:'3px'}}>
                          {fmt(selRecord.linden_paid + selRecord.sweat_equity_value)} of {fmt(selRecord.amount_due)}
                        </div>
                      </div>
                      <span className={`du-badge ${selRecord.status}`}>{selRecord.status}</span>
                    </div>

                    {/* Countdown */}
                    {selRecord.expires_at && (
                      <div className="du-countdown">
                        <span className="du-countdown-label">CasperLet Timer</span>
                        <Countdown expiresAt={selRecord.expires_at} />
                      </div>
                    )}
                    {selRecord.casper_expiry_text && <div className="du-casper-text">{selRecord.casper_expiry_text}</div>}

                    {/* Progress */}
                    <div className="du-progress-wrap">
                      <div className="du-progress-track">
                        <div className="du-progress-fill" style={{width:`${pct(selRecord.linden_paid,selRecord.sweat_equity_value,selRecord.amount_due)}%`,background:STATUS_COL[selRecord.status]}} />
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="du-breakdown">
                      <div className="du-breakdown-cell"><div className="du-breakdown-val" style={{color:'#4ade80'}}>{fmt(selRecord.linden_paid)}</div><div className="du-breakdown-lbl">Linden</div></div>
                      <div className="du-breakdown-cell"><div className="du-breakdown-val" style={{color:'#c6930a'}}>{fmt(selRecord.sweat_equity_value)}</div><div className="du-breakdown-lbl">Sweat</div></div>
                      <div className="du-breakdown-cell"><div className="du-breakdown-val" style={{color:'#e05070'}}>{fmt(Math.max(0,selRecord.amount_due-selRecord.linden_paid-selRecord.sweat_equity_value))}</div><div className="du-breakdown-lbl">Remaining</div></div>
                    </div>

                    {/* Payments */}
                    {selRecord.payments?.length > 0 && (
                      <div className="du-section">
                        <div className="du-section-title">Linden Payments</div>
                        {selRecord.payments.map((p:any) => (
                          <div key={p.id} className="du-entry">
                            <div className="du-entry-main">
                              <div className="du-entry-name">{fmt(p.amount_ls)} — {p.logged_by_name}</div>
                              {p.transaction_id && <div className="du-entry-sub">Tx: {p.transaction_id}</div>}
                              <div className="du-entry-sub">{dateFmt(p.created_at)}</div>
                            </div>
                            <div className="du-entry-amt" style={{color:'#4ade80'}}>{fmt(p.amount_ls)}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sweat equity */}
                    {selRecord.sweat_equity?.length > 0 && (
                      <div className="du-section">
                        <div className="du-section-title">Sweat Equity</div>
                        {selRecord.sweat_equity.map((s:any) => (
                          <div key={s.id} className="du-entry">
                            <div className="du-entry-main">
                              <div className="du-entry-name">{s.contribution}</div>
                              <div className="du-entry-sub">{s.category} · {dateFmt(s.created_at)}</div>
                              {s.value_approved > 0 && <div className="du-entry-sub" style={{color:'#4ade80'}}>Approved: {fmt(s.value_approved)}</div>}
                            </div>
                            <span className={`du-sweat-tag ${s.status}`}>{s.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* RIGHT: Actions */}
              <div className="du-admin-actions">
                {selRecord && (
                  <>
                    <div className="du-action-section">
                      <div className="du-action-section-title">Log Payment</div>
                      <div className="du-action-field"><label className="du-action-label">Amount (L$)</label><input className="du-action-input" type="number" placeholder="e.g. 4000" value={payForm.amount_ls} onChange={e=>setPayForm(f=>({...f,amount_ls:e.target.value,target_member_id:selRecord.member_id}))} /></div>
                      <div className="du-action-field"><label className="du-action-label">Transaction ID</label><input className="du-action-input" placeholder="CasperLet Tx ID..." value={payForm.transaction_id} onChange={e=>setPayForm(f=>({...f,transaction_id:e.target.value}))} /></div>
                      <div className="du-action-field"><label className="du-action-label">Expiry Date</label><input className="du-action-input" type="datetime-local" value={payForm.expires_at} onChange={e=>setPayForm(f=>({...f,expires_at:e.target.value}))} /></div>
                      <div className="du-action-field"><label className="du-action-label">Expiry Text</label><input className="du-action-input" placeholder="e.g. expires Wed 13 May..." value={payForm.casper_expiry_text} onChange={e=>setPayForm(f=>({...f,casper_expiry_text:e.target.value}))} /></div>
                      <button className="du-btn gold" style={{marginTop:'.2rem'}} onClick={()=>{setPayForm(f=>({...f,target_member_id:selRecord.member_id}));logPayment();}} disabled={saving}>Log Payment</button>
                    </div>

                    <div className="du-action-section">
                      <div className="du-action-section-title">Sweat Equity</div>
                      <div className="du-action-field"><label className="du-action-label">Category</label><select className="du-action-select" value={sweatForm.category} onChange={e=>setSweatForm(f=>({...f,category:e.target.value}))}>{SWEAT_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
                      <div className="du-action-field"><label className="du-action-label">Contribution</label><input className="du-action-input" placeholder="What was contributed..." value={sweatForm.contribution} onChange={e=>setSweatForm(f=>({...f,contribution:e.target.value}))} /></div>
                      <div className="du-action-field"><label className="du-action-label">Value (L$)</label><input className="du-action-input" type="number" placeholder="Approved value..." value={sweatForm.value_requested} onChange={e=>setSweatForm(f=>({...f,value_requested:e.target.value}))} /></div>
                      <button className="du-btn ghost" style={{marginTop:'.2rem'}} onClick={submitSweat} disabled={saving}>Log Sweat Equity</button>
                    </div>

                    <div className="du-action-section">
                      <div className="du-action-section-title">Timer</div>
                      <div className="du-action-field"><label className="du-action-label">New Expiry</label><input className="du-action-input" type="datetime-local" value={timerEdit?.expires_at||''} onChange={e=>setTimerEdit(p=>({...p,record_id:selRecord.id,expires_at:e.target.value,casper_expiry_text:p?.casper_expiry_text||''}))} /></div>
                      <div className="du-action-field"><label className="du-action-label">Expiry Text</label><input className="du-action-input" placeholder="e.g. expires Wed 13 May..." value={timerEdit?.casper_expiry_text||''} onChange={e=>setTimerEdit(p=>({...p,record_id:selRecord.id,expires_at:p?.expires_at||'',casper_expiry_text:e.target.value}))} /></div>
                      <button className="du-btn green" style={{marginTop:'.2rem'}} onClick={()=>timerEdit&&updateTimer(timerEdit.record_id,timerEdit.expires_at,timerEdit.casper_expiry_text)} disabled={saving||!timerEdit?.expires_at}>Update Timer</button>
                    </div>

                    <div className="du-action-section">
                      <div className="du-action-section-title">Record</div>
                      {selRecord.status !== 'waived' && <button className="du-btn muted" onClick={()=>waveRecord(selRecord.id)}>Waive Dues</button>}
                    </div>
                  </>
                )}
                {!selRecord && <div style={{padding:'1rem',fontFamily:'var(--cinzel)',fontSize:'.6rem',letterSpacing:'2px',color:'var(--bone-faint)'}}>Select a brother first</div>}
              </div>
            </div>
          </>
        )}

        {/* ═══ BROTHER VIEW ═══ */}
        {!canManage && (
          <div className="du-brother-wrap">
            {myRecords.length === 0 && <div style={{textAlign:'center',padding:'3rem',fontFamily:'var(--cinzel)',fontSize:'.7rem',letterSpacing:'2px',color:'var(--bone-faint)'}}>No dues records yet. Check back when a billing period is opened.</div>}
            {myRecords.map(rec => {
              const period = periods.find(p=>p.id===rec.period_id);
              const totalPaid = rec.linden_paid + rec.sweat_equity_value;
              const remaining = Math.max(0, rec.amount_due - totalPaid);
              const progress  = pct(rec.linden_paid, rec.sweat_equity_value, rec.amount_due);
              return (
                <div key={rec.id} className="du-status-hero">
                  {/* Status top */}
                  <div className="du-status-hero-top">
                    <div>
                      <div className="du-status-period">{period?.label || 'Current Period'}</div>
                      <div className="du-status-remaining">{fmt(remaining)}</div>
                      <div className="du-status-remaining-label">Remaining</div>
                    </div>
                    <div style={{marginLeft:'auto',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'.4rem'}}>
                      <span className={`du-badge ${rec.status}`}>{rec.status}</span>
                      <span style={{fontFamily:'var(--cinzel)',fontSize:'.58rem',letterSpacing:'2px',color:'var(--bone-faint)'}}>{fmt(totalPaid)} paid</span>
                    </div>
                  </div>

                  {/* Countdown */}
                  {rec.expires_at && (
                    <div className="du-countdown">
                      <span className="du-countdown-label">CasperLet Timer</span>
                      <Countdown expiresAt={rec.expires_at} />
                    </div>
                  )}
                  {rec.casper_expiry_text && <div className="du-casper-text">{rec.casper_expiry_text}</div>}

                  {/* Progress */}
                  <div className="du-progress-wrap">
                    <div className="du-progress-track">
                      <div className="du-progress-fill" style={{width:`${progress}%`,background:STATUS_COL[rec.status]}} />
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="du-breakdown">
                    <div className="du-breakdown-cell"><div className="du-breakdown-val" style={{color:'#4ade80'}}>{fmt(rec.linden_paid)}</div><div className="du-breakdown-lbl">Linden Paid</div></div>
                    <div className="du-breakdown-cell"><div className="du-breakdown-val" style={{color:'#c6930a'}}>{fmt(rec.sweat_equity_value)}</div><div className="du-breakdown-lbl">Sweat Equity</div></div>
                    <div className="du-breakdown-cell"><div className="du-breakdown-val">{fmt(rec.amount_due)}</div><div className="du-breakdown-lbl">Total Due</div></div>
                  </div>

                  {/* Payments */}
                  {rec.payments?.length > 0 && (
                    <div className="du-section">
                      <div className="du-section-title">Linden Payments</div>
                      {rec.payments.map((p:any) => (
                        <div key={p.id} className="du-entry">
                          <div className="du-entry-main">
                            <div className="du-entry-name">{fmt(p.amount_ls)}</div>
                            {p.transaction_id && <div className="du-entry-sub">Tx: {p.transaction_id}</div>}
                            <div className="du-entry-sub">{dateFmt(p.created_at)}</div>
                          </div>
                          <div className="du-entry-amt" style={{color:'#4ade80'}}>{fmt(p.amount_ls)}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sweat equity */}
                  {rec.sweat_equity?.length > 0 && (
                    <div className="du-section">
                      <div className="du-section-title">Sweat Equity</div>
                      {rec.sweat_equity.map((s:any) => (
                        <div key={s.id} className="du-entry">
                          <div className="du-entry-main">
                            <div className="du-entry-name">{s.contribution}</div>
                            <div className="du-entry-sub">{s.category} · {dateFmt(s.created_at)}</div>
                            {s.value_approved > 0 && <div className="du-entry-sub" style={{color:'#4ade80'}}>Credited: {fmt(s.value_approved)}</div>}
                          </div>
                          <span className={`du-sweat-tag ${s.status}`}>{s.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {rec.status !== 'waived' && (
                    <div className="du-actions">
                      <div style={{fontFamily:'var(--cinzel)',fontSize:'.6rem',letterSpacing:'1px',color:'var(--bone-faint)',width:'100%'}}>⚓ Pay via the in-world KΘΦ II Dues Terminal</div>
                      <button className="du-btn ghost" onClick={()=>{ setActivePeriod(rec.period_id); setModal('sweat'); }}>Submit Sweat Equity</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* ── NEW PERIOD MODAL ── */}
      {modal==='period' && (
        <div className="du-overlay" onClick={()=>setModal(null)}>
          <div className="du-modal" onClick={e=>e.stopPropagation()}>
            <div className="du-modal-hdr"><div className="du-modal-title">Open Billing Period</div><button className="du-modal-close" onClick={()=>setModal(null)}>✕</button></div>
            <div className="du-modal-body">
              {msgText && <div className={`du-msg ${msgType}`}>{msgText}</div>}
              <div className="du-modal-field"><label className="du-modal-label">Month</label>
                <select className="du-modal-input" value={periodForm.month} onChange={e=>setPeriodForm(f=>({...f,month:parseInt(e.target.value)}))}>
                  {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div className="du-modal-field"><label className="du-modal-label">Year</label><input className="du-modal-input" type="number" value={periodForm.year} onChange={e=>setPeriodForm(f=>({...f,year:parseInt(e.target.value)}))} /></div>
              <div className="du-modal-field"><label className="du-modal-label">Amount Due (L$)</label><input className="du-modal-input" type="number" value={periodForm.amount_due} onChange={e=>setPeriodForm(f=>({...f,amount_due:parseInt(e.target.value)}))} /></div>
              <button className="du-btn gold" onClick={createPeriod} disabled={saving}>{saving?'Creating...':'Create Period'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SWEAT EQUITY MODAL (brothers) ── */}
      {modal==='sweat' && (
        <div className="du-overlay" onClick={()=>{setModal(null);setMsg('');}}>
          <div className="du-modal" onClick={e=>e.stopPropagation()}>
            <div className="du-modal-hdr"><div className="du-modal-title">Submit Sweat Equity</div><button className="du-modal-close" onClick={()=>{setModal(null);setMsg('');}}>✕</button></div>
            <div className="du-modal-body">
              {msgText && <div className={`du-msg ${msgType}`}>{msgText}</div>}
              <div className="du-modal-field"><label className="du-modal-label">Category</label>
                <select className="du-modal-input" value={sweatForm.category} onChange={e=>setSweatForm(f=>({...f,category:e.target.value}))}>
                  {SWEAT_CATS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="du-modal-field"><label className="du-modal-label">What did you contribute?</label>
                <textarea className="du-modal-input" style={{minHeight:'80px',resize:'vertical'}} placeholder="Describe in detail..." value={sweatForm.contribution} onChange={e=>setSweatForm(f=>({...f,contribution:e.target.value}))} />
              </div>
              <div className="du-modal-field"><label className="du-modal-label">Suggested Value (L$) — optional</label><input className="du-modal-input" type="number" placeholder="What's it worth?" value={sweatForm.value_requested} onChange={e=>setSweatForm(f=>({...f,value_requested:e.target.value}))} /></div>
              <div className="du-modal-field"><label className="du-modal-label">Notes / Links</label><input className="du-modal-input" placeholder="Proof, context, links..." value={sweatForm.notes} onChange={e=>setSweatForm(f=>({...f,notes:e.target.value}))} /></div>
              <div className="du-modal-hint">Leadership will review and credit the approved value toward your L$4,000 dues.</div>
              <button className="du-btn gold" onClick={submitSweat} disabled={saving}>{saving?'Submitting...':'Submit for Review'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
