'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../dash.css';
import './dues.css';

const SWEAT_CATEGORIES = ['Planning','Advertising','Recruitment','Design','Content Creation','Event Support','Administrative','General'];
const STATUS_COLOURS: Record<string,string> = { paid:'#4ade80', partial:'#c6930a', unpaid:'#e05070', waived:'rgba(240,232,208,0.2)' };

function fmt(n: number) { return `L$${n.toLocaleString()}`; }
function pct(paid: number, sweat: number, due: number) { return Math.min(100, Math.round(((paid + sweat) / due) * 100)); }
function timeAgo(d:string){ return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }


function Countdown({ expiresAt }) {
  const [time, setTime] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function tick() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setExpired(true); setTime('Expired'); return; }
      const days    = Math.floor(diff / 86400000);
      const hours   = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setUrgent(diff < 86400000 * 3);
      if (days > 0) setTime(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      else if (hours > 0) setTime(`${hours}h ${minutes}m ${seconds}s`);
      else setTime(`${minutes}m ${seconds}s`);
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  if (expired) return <span style={{color:'#e05070',fontSize:'0.78rem',fontWeight:700}}>EXPIRED</span>;
  return <span style={{color: urgent ? '#e05070' : '#4ade80', fontSize:'0.78rem', fontWeight:700, fontFamily:'monospace'}}>{time}</span>;
}

export default function DuesPage() {
  const [member, setMember]       = useState<any>(null);
  const [canManage, setCanManage] = useState(false);
  const [periods, setPeriods]     = useState<any[]>([]);
  const [activePeriod, setActivePeriod] = useState<string|null>(null);
  const [records, setRecords]     = useState<any[]>([]);
  const [myRecords, setMyRecords] = useState<any[]>([]);
  const [openCards, setOpenCards] = useState<Set<string>>(new Set());
  const [modal, setModal]         = useState<any>(null);
  const [loading, setLoading]     = useState(true);

  // Form states
  const [payForm, setPayForm]     = useState({ amount_ls:'', transaction_id:'', expires_at:'', casper_expiry_text:'', notes:'', target_member_id:'' });
  const [sweatForm, setSweatForm] = useState({ contribution:'', category:'General', value_requested:'', notes:'' });
  const [periodForm, setPeriodForm] = useState({ month: new Date().getMonth()+1, year: new Date().getFullYear(), amount_due: 4000 });
  const [sweatApprove, setSweatApprove] = useState<{id:string, value:string, notes:string}|null>(null);
  const [timerEdit, setTimerEdit]       = useState<{record_id:string, expires_at:string, casper_expiry_text:string}|null>(null);
  const [sweatTarget, setSweatTarget]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState('');

  const NAV = [
    { href:'/dashboard', label:'Home' },
    { href:'/dashboard/news', label:'Wokou News' },
    { href:'/dashboard/events', label:'Events' },
    { href:'/dashboard/phire', label:'PHIRE' },
    { href:'/dashboard/discipline', label:'Discipline' },
  { href:'/dashboard/dues-report', label:'Dues Report' },
    { href:'/dashboard/ssp', label:'SSP' },
    { href:'/dashboard/gallery', label:'My Gallery' },
    { href:'/dashboard/edit', label:'Edit Profile' },
  ];

  useEffect(() => {
    fetch('/api/dashboard/dues/periods').then(r=>r.json()).then(async d => {
      if (d.error) { window.location.href='/login'; return; }
      setMember(d.member);
      setCanManage(d.can_manage);
      setPeriods(d.periods||[]);
      const first = d.periods?.[0]?.id || null;
      setActivePeriod(first);
      if (d.can_manage && first) await loadRecords(first);
      await loadMyRecords();
      setLoading(false);
    });
  }, []);

  async function loadRecords(pid: string) {
    const d = await fetch(`/api/dashboard/dues/record?period_id=${pid}&view=all`).then(r=>r.json());
    setRecords(d.records||[]);
  }

  async function loadMyRecords() {
    const d = await fetch('/api/dashboard/dues/record').then(r=>r.json());
    setMyRecords(d.records||[]);
  }

  async function selectPeriod(pid: string) {
    setActivePeriod(pid);
    if (canManage) await loadRecords(pid);
  }

  function toggleCard(id:string) {
    setOpenCards(p => { const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  }

  async function createPeriod() {
    setSaving(true);
    const res = await fetch('/api/dashboard/dues/periods', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(periodForm) }).then(r=>r.json());
    if (res.error) { setMsg(`Error: ${res.error}`); setSaving(false); return; }
    setMsg('Period created. All brothers have been added.');
    setPeriods(p => [res.period, ...p]);
    setActivePeriod(res.period.id);
    await loadRecords(res.period.id);
    setSaving(false);
    setTimeout(() => { setModal(null); setMsg(''); }, 2000);
  }

  async function logPayment() {
    if (!payForm.amount_ls) { setMsg('Enter the payment amount.'); return; }
    setSaving(true);
    const body: any = { period_id: activePeriod, amount_ls: parseInt(payForm.amount_ls), transaction_id: payForm.transaction_id||null, notes: payForm.notes||null, expires_at: payForm.expires_at||null, casper_expiry_text: payForm.casper_expiry_text||null };
    if (canManage && payForm.target_member_id) body.target_member_id = payForm.target_member_id;
    const res = await fetch('/api/dashboard/dues/payments', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }).then(r=>r.json());
    if (res.error) { setMsg(`Error: ${res.error}`); setSaving(false); return; }
    setMsg('Payment logged.');
    setPayForm({ amount_ls:'', transaction_id:'', expires_at:'', casper_expiry_text:'', notes:'', target_member_id:'' });
    if (canManage) await loadRecords(activePeriod!);
    await loadMyRecords();
    setSaving(false);
    setTimeout(() => { setModal(null); setMsg(''); }, 1500);
  }

  async function submitSweat() {
    if (!sweatForm.contribution.trim()) { setMsg('Describe your contribution.'); return; }
    setSaving(true);
    const body = { period_id: activePeriod, ...sweatForm, value_requested: sweatForm.value_requested ? parseInt(sweatForm.value_requested) : null, target_member_id: sweatTarget||null };
    const res = await fetch('/api/dashboard/dues/sweat-equity', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }).then(r=>r.json());
    if (res.error) { setMsg(`Error: ${res.error}`); setSaving(false); return; }
    setMsg('Sweat equity submitted for review.');
    setSweatForm({ contribution:'', category:'General', value_requested:'', notes:'' });
    await loadMyRecords();
    setSaving(false);
    setTimeout(() => { setModal(null); setMsg(''); }, 1500);
  }

  async function approveSweat(sweat_id:string, action:string, value:string, notes:string) {
    setSaving(true);
    await fetch('/api/dashboard/dues/sweat-equity', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ sweat_id, action, value_approved:parseInt(value)||0, notes }) });
    setSweatApprove(null);
    if (canManage) await loadRecords(activePeriod!);
    await loadMyRecords();
    setSaving(false);
  }

  async function updateTimer(record_id:string, expires_at:string, casper_expiry_text:string) {
    setSaving(true);
    await fetch('/api/dashboard/dues/payments', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ record_id, expires_at, casper_expiry_text }) });
    setTimerEdit(null);
    if (canManage) await loadRecords(activePeriod!);
    setSaving(false);
  }

  async function waveRecord(record_id:string) {
    if (!confirm('Waive dues for this brother this period?')) return;
    await fetch('/api/dashboard/dues/record', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ record_id, status:'waived' }) });
    if (canManage) await loadRecords(activePeriod!);
  }

  const currentPeriod = periods.find(p => p.id === activePeriod);
  const slug = member?.frat_name?.toLowerCase().replace(/\s+/g,'-').replace('big-brother-','') || '';

  const stats = canManage ? {
    total: records.length,
    paid: records.filter(r=>r.status==='paid').length,
    partial: records.filter(r=>r.status==='partial').length,
    unpaid: records.filter(r=>r.status==='unpaid').length,
  } : null;

  if (loading || !member) return <div className="dash-loading">LOADING...</div>;

  return (
    <div className="dash-app">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-logo"><img src="/logo.png" alt="KΘΦ II"/><span className="dash-sidebar-logo-text">KΘΦ II</span></div>
        <div className="dash-sidebar-member">
          <div className="dash-sidebar-portrait"><img src={`/brothers/${slug}.png`} alt="" onError={(e:any)=>e.target.src='/logo.png'}/></div>
          <div className="dash-sidebar-name">{member.frat_name}</div>
          <div className="dash-sidebar-role">{member.role}</div>
        </div>
        <nav className="dash-nav">
          {NAV.map(n=><a key={n.href} href={n.href} className={`dash-nav-item ${n.href==='/dashboard/dues'?'active':''}`}><span>{n.label}</span></a>)}
          <div className="dash-nav-divider"/>
          <a href="/" className="dash-nav-item"><span>Back to Site</span></a>
            <button onClick={async()=>{await fetch('/api/logout',{method:'POST'});window.location.href='/login';}} className="dash-nav-item" style={{width:'100%',textAlign:'left',background:'none',border:'none',cursor:'pointer',color:'#e05070',fontFamily:'inherit'}}><span>Sign Out</span></button>
        </nav>
      </aside>

      <main className="dash-main">
        <div className="dues-hero">
          <div className="dues-hero-title">Dues & Contributions</div>
          <div className="dues-hero-sub">L$4,000 monthly dues — Linden payments and sweat equity contributions</div>
        </div>

        <div className="dues-wrap">

          {/* Period selector */}
          <div className="dues-period-bar">
            {periods.map(p => (
              <button key={p.id} className={`dues-period-btn ${activePeriod===p.id?'active':''}`} onClick={()=>selectPeriod(p.id)}>
                {p.label}
              </button>
            ))}
            {canManage && (
              <button className="dues-action-btn gold" onClick={()=>setModal('period')}>+ New Period</button>
            )}
          </div>

          {/* ── MANAGER VIEW ── */}
          {canManage && activePeriod && (
            <>
              {stats && (
                <div className="dues-stats">
                  <div className="dues-stat"><div className="dues-stat-num" style={{color:'#4ade80'}}>{stats.paid}</div><div className="dues-stat-label">Paid</div></div>
                  <div className="dues-stat"><div className="dues-stat-num" style={{color:'#c6930a'}}>{stats.partial}</div><div className="dues-stat-label">Partial</div></div>
                  <div className="dues-stat"><div className="dues-stat-num" style={{color:'#e05070'}}>{stats.unpaid}</div><div className="dues-stat-label">Unpaid</div></div>
                  <div className="dues-stat"><div className="dues-stat-num">{stats.total}</div><div className="dues-stat-label">Total</div></div>
                </div>
              )}

              {/* Sweat equity queue */}
              {records.flatMap(r => r.sweat_equity?.filter((s:any) => s.status==='pending') || []).length > 0 && (
                <div style={{background:'rgba(198,147,10,0.06)',border:'1px solid rgba(198,147,10,0.2)',borderRadius:'8px',padding:'1rem 1.2rem',marginBottom:'1.5rem'}}>
                  <div className="dues-section-title" style={{marginTop:0}}>Sweat Equity — Pending Approval</div>
                  {records.flatMap(r => (r.sweat_equity||[]).filter((s:any)=>s.status==='pending').map((s:any) => ({...s, member_name: r.member_name}))).map((s:any) => (
                    <div key={s.id} className="dues-entry">
                      <div className="dues-entry-main">
                        <div className="dues-entry-title">{s.member_name}</div>
                        <div className="dues-entry-detail">{s.category} — {s.contribution}</div>
                        {s.value_requested && <div className="dues-entry-detail">Requested: {fmt(s.value_requested)}</div>}
                        {s.notes && <div className="dues-entry-detail" style={{fontStyle:'italic'}}>{s.notes}</div>}
                      </div>
                      {sweatApprove?.id===s.id ? (
                        <div style={{display:'flex',flexDirection:'column',gap:'5px',minWidth:'180px'}}>
                          <input className="field-input" style={{padding:'4px 8px',fontSize:'0.82rem'}} placeholder="Approved value (L$)..." value={sweatApprove.value} onChange={e=>setSweatApprove(p=>p?{...p,value:e.target.value}:p)} type="number"/>
                          <input className="field-input" style={{padding:'4px 8px',fontSize:'0.82rem'}} placeholder="Notes..." value={sweatApprove.notes} onChange={e=>setSweatApprove(p=>p?{...p,notes:e.target.value}:p)}/>
                          <div style={{display:'flex',gap:'4px'}}>
                            <button className="dues-action-btn green" onClick={()=>approveSweat(s.id,'approve',sweatApprove.value,sweatApprove.notes)} disabled={saving}>Approve</button>
                            <button className="dues-action-btn red" onClick={()=>approveSweat(s.id,'deny',sweatApprove.value,sweatApprove.notes)} disabled={saving}>Deny</button>
                            <button className="dues-action-btn" style={{color:'var(--muted)',borderColor:'var(--border)'}} onClick={()=>setSweatApprove(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button className="dues-action-btn gold" onClick={()=>setSweatApprove({id:s.id,value:s.value_requested?.toString()||'',notes:''})}>Review</button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Roster */}
              {records.map(rec => {
                const totalPaid = rec.linden_paid + rec.sweat_equity_value;
                const remaining = Math.max(0, rec.amount_due - totalPaid);
                const progress = pct(rec.linden_paid, rec.sweat_equity_value, rec.amount_due);
                return (
                  <div key={rec.id} className={`dues-card ${rec.status} ${openCards.has(rec.id)?'open':''}`}>
                    <div className="dues-card-header" onClick={()=>toggleCard(rec.id)}>
                      <div style={{flex:1}}>
                        <div className="dues-card-name">{rec.member_name}</div>
                        <div className="dues-card-meta">{fmt(totalPaid)} of {fmt(rec.amount_due)} — {fmt(remaining)} remaining</div>
                        {rec.expires_at && (
                          <div style={{marginTop:'4px',fontSize:'0.7rem',color:'rgba(240,232,208,0.4)'}}>
                            Expires: <Countdown expiresAt={rec.expires_at} />
                          </div>
                        )}
                      </div>
                      <div className="dues-card-right">
                        <span className={`dues-badge ${rec.status}`}>{rec.status}</span>
                        <span className="dues-card-chevron">›</span>
                      </div>
                    </div>
                    <div className="dues-progress-wrap">
                      <div className="dues-progress-bar"><div className="dues-progress-fill" style={{width:`${progress}%`,background:STATUS_COLOURS[rec.status]}}/></div>
                    </div>
                    <div className="dues-card-body">
                      <div className="dues-breakdown">
                        <div className="dues-breakdown-item"><div className="dues-breakdown-amount" style={{color:'#4ade80'}}>{fmt(rec.linden_paid)}</div><div className="dues-breakdown-label">Linden Paid</div></div>
                        <div className="dues-breakdown-item"><div className="dues-breakdown-amount" style={{color:'#c6930a'}}>{fmt(rec.sweat_equity_value)}</div><div className="dues-breakdown-label">Sweat Equity</div></div>
                        <div className="dues-breakdown-item"><div className="dues-breakdown-amount" style={{color:'#e05070'}}>{fmt(remaining)}</div><div className="dues-breakdown-label">Remaining</div></div>
                      </div>

                      {/* Payments */}
                      {rec.payments?.length > 0 && (
                        <>
                          <div className="dues-section-title">Linden Payments</div>
                          {rec.payments.map((p:any) => (
                            <div key={p.id} className="dues-entry">
                              <div className="dues-entry-main">
                                <div className="dues-entry-title">{fmt(p.amount_ls)} — logged by {p.logged_by_name}</div>
                                {p.transaction_id && <div className="dues-entry-txid">Tx: {p.transaction_id}</div>}
                                <div className="dues-entry-detail">{timeAgo(p.created_at)}</div>
                              </div>
                              <div className="dues-entry-amount">{fmt(p.amount_ls)}</div>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Sweat equity */}
                      {rec.sweat_equity?.length > 0 && (
                        <>
                          <div className="dues-section-title">Sweat Equity</div>
                          {rec.sweat_equity.map((s:any) => (
                            <div key={s.id} className="dues-entry">
                              <div className="dues-entry-main">
                                <div className="dues-entry-title">{s.contribution}</div>
                                <div className="dues-entry-detail">{s.category} · {timeAgo(s.created_at)}</div>
                                {s.value_approved > 0 && <div className="dues-entry-detail" style={{color:'#4ade80'}}>Approved: {fmt(s.value_approved)}</div>}
                              </div>
                              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'4px'}}>
                                <span className={`sweat-tag ${s.status}`}>{s.status}</span>
                                {s.status==='pending' && (
                                  <button className="dues-action-btn gold" style={{fontSize:'0.6rem',padding:'2px 8px'}} onClick={()=>setSweatApprove({id:s.id,value:s.value_requested?.toString()||'',notes:''})}>Review</button>
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      )}

                      <div className="dues-actions">
                        <button className="dues-action-btn green" onClick={()=>{ setPayForm(f=>({...f,target_member_id:rec.member_id})); setModal('payment'); }}>Log Payment</button>
                        <button className="dues-action-btn gold" onClick={()=>{ setSweatTarget(rec.member_id); setModal('sweat'); }}>Log Sweat Equity</button>
                        <button className="dues-action-btn" style={{color:'#4ade80',borderColor:'rgba(74,222,128,0.3)'}} onClick={()=>setTimerEdit({record_id:rec.id,expires_at:rec.expires_at||'',casper_expiry_text:rec.casper_expiry_text||''})}>Edit Timer</button>
                        {rec.status !== 'waived' && <button className="dues-action-btn" style={{color:'var(--muted)',borderColor:'var(--border)'}} onClick={()=>waveRecord(rec.id)}>Waive</button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ── MY DUES VIEW ── */}
          {!canManage && (
            <>
              {myRecords.length === 0 && <div style={{textAlign:'center',padding:'3rem',color:'var(--muted)',fontSize:'0.85rem'}}>No dues records yet. Check back when a billing period has been opened.</div>}
              {myRecords.map(rec => {
                const period = periods.find(p=>p.id===rec.period_id);
                const totalPaid = rec.linden_paid + rec.sweat_equity_value;
                const remaining = Math.max(0, rec.amount_due - totalPaid);
                const progress = pct(rec.linden_paid, rec.sweat_equity_value, rec.amount_due);
                return (
                  <div key={rec.id} className="dues-my-card">
                    <div className="dues-my-period">{period?.label || 'Unknown Period'}</div>
                    <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'0.5rem'}}>
                      <div className="dues-my-balance">{fmt(remaining)} remaining</div>
                      <span className={`dues-badge ${rec.status}`}>{rec.status}</span>
                    </div>
                    {rec.expires_at && (
                      <div style={{marginBottom:'0.8rem',padding:'0.6rem 0.8rem',background:'var(--raised)',border:'1px solid var(--border)',borderRadius:'6px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:'0.65rem',letterSpacing:'2px',color:'var(--muted)',textTransform:'uppercase'}}>Time Remaining</span>
                        <Countdown expiresAt={rec.expires_at} />
                      </div>
                    )}
                    {rec.casper_expiry_text && <div style={{fontSize:'0.7rem',color:'rgba(240,232,208,0.25)',marginBottom:'0.8rem'}}>{rec.casper_expiry_text}</div>}
                    <div className="dues-progress-bar" style={{marginBottom:'0.8rem'}}>
                      <div className="dues-progress-fill" style={{width:`${progress}%`,background:STATUS_COLOURS[rec.status],height:'4px'}}/>
                    </div>
                    <div className="dues-breakdown" style={{marginBottom:'1rem'}}>
                      <div className="dues-breakdown-item"><div className="dues-breakdown-amount" style={{color:'#4ade80'}}>{fmt(rec.linden_paid)}</div><div className="dues-breakdown-label">Linden Paid</div></div>
                      <div className="dues-breakdown-item"><div className="dues-breakdown-amount" style={{color:'#c6930a'}}>{fmt(rec.sweat_equity_value)}</div><div className="dues-breakdown-label">Sweat Equity</div></div>
                      <div className="dues-breakdown-item"><div className="dues-breakdown-amount">{fmt(rec.amount_due)}</div><div className="dues-breakdown-label">Total Due</div></div>
                    </div>

                    {rec.payments?.length > 0 && (
                      <>
                        <div className="dues-section-title">Your Linden Payments</div>
                        {rec.payments.map((p:any) => (
                          <div key={p.id} className="dues-entry">
                            <div className="dues-entry-main">
                              <div className="dues-entry-title">{fmt(p.amount_ls)}</div>
                              {p.transaction_id && <div className="dues-entry-txid">Tx: {p.transaction_id}</div>}
                              <div className="dues-entry-detail">{timeAgo(p.created_at)}</div>
                            </div>
                            <div className="dues-entry-amount">{fmt(p.amount_ls)}</div>
                          </div>
                        ))}
                      </>
                    )}

                    {rec.sweat_equity?.length > 0 && (
                      <>
                        <div className="dues-section-title">Your Sweat Equity</div>
                        {rec.sweat_equity.map((s:any) => (
                          <div key={s.id} className="dues-entry">
                            <div className="dues-entry-main">
                              <div className="dues-entry-title">{s.contribution}</div>
                              <div className="dues-entry-detail">{s.category} · {timeAgo(s.created_at)}</div>
                              {s.value_approved > 0 && <div className="dues-entry-detail" style={{color:'#4ade80'}}>Credited: {fmt(s.value_approved)}</div>}
                            </div>
                            <span className={`sweat-tag ${s.status}`}>{s.status}</span>
                          </div>
                        ))}
                      </>
                    )}

                    {rec.status !== 'waived' && (
                      <div className="dues-actions">
                        <button className="dues-action-btn green" onClick={()=>{ setActivePeriod(rec.period_id); setModal('payment'); }}>Log Linden Payment</button>
                        <button className="dues-action-btn gold" onClick={()=>{ setActivePeriod(rec.period_id); setModal('sweat'); }}>Submit Sweat Equity</button>
                        {rec.status === 'paid' && (
                          <div style={{fontSize:'0.65rem',color:'rgba(240,232,208,0.3)',marginTop:'6px',width:'100%'}}>
                            Extra payments will carry forward as credit to your next billing period.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </main>

      {/* ── MODALS ── */}

      {/* New Period */}
      {modal==='period' && (
        <div className="dues-modal-overlay" onClick={()=>setModal(null)}>
          <div className="dues-modal" onClick={e=>e.stopPropagation()}>
            <div className="dues-modal-header">
              <div className="dues-modal-title">Open New Billing Period</div>
              <button className="dues-modal-close" onClick={()=>setModal(null)}>✕</button>
            </div>
            <div className="dues-modal-body">
              {msg && <div style={{padding:'0.6rem 0.8rem',marginBottom:'1rem',borderRadius:'5px',fontSize:'0.8rem',background:'rgba(74,222,128,0.08)',border:'1px solid rgba(74,222,128,0.2)',color:'#4ade80'}}>{msg}</div>}
              <div className="field-group" style={{marginBottom:'0.9rem'}}>
                <label className="field-label">Month</label>
                <select className="field-input" value={periodForm.month} onChange={e=>setPeriodForm(f=>({...f,month:parseInt(e.target.value)}))}>
                  {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i)=>(
                    <option key={i+1} value={i+1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="field-group" style={{marginBottom:'0.9rem'}}>
                <label className="field-label">Year</label>
                <input className="field-input" type="number" value={periodForm.year} onChange={e=>setPeriodForm(f=>({...f,year:parseInt(e.target.value)}))} />
              </div>
              <div className="field-group" style={{marginBottom:'1.2rem'}}>
                <label className="field-label">Amount Due (L$)</label>
                <input className="field-input" type="number" value={periodForm.amount_due} onChange={e=>setPeriodForm(f=>({...f,amount_due:parseInt(e.target.value)}))} />
              </div>
              <button className="btn btn-gold" onClick={createPeriod} disabled={saving}>{saving?'Creating...':'Create Period'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Log Payment */}
      {modal==='payment' && (
        <div className="dues-modal-overlay" onClick={()=>{ setModal(null); setMsg(''); }}>
          <div className="dues-modal" onClick={e=>e.stopPropagation()}>
            <div className="dues-modal-header">
              <div className="dues-modal-title">Log Linden Payment</div>
              <button className="dues-modal-close" onClick={()=>{ setModal(null); setMsg(''); }}>✕</button>
            </div>
            <div className="dues-modal-body">
              {msg && <div style={{padding:'0.6rem 0.8rem',marginBottom:'1rem',borderRadius:'5px',fontSize:'0.8rem',background:msg.startsWith('Error')?'rgba(178,34,52,0.08)':'rgba(74,222,128,0.08)',border:`1px solid ${msg.startsWith('Error')?'rgba(178,34,52,0.2)':'rgba(74,222,128,0.2)'}`,color:msg.startsWith('Error')?'#e05070':'#4ade80'}}>{msg}</div>}
              {canManage && (
                <div className="field-group" style={{marginBottom:'0.9rem'}}>
                  <label className="field-label">Brother</label>
                  <select className="field-input" value={payForm.target_member_id} onChange={e=>setPayForm(f=>({...f,target_member_id:e.target.value}))}>
                    <option value="">Select brother...</option>
                    {records.map(r=><option key={r.member_id} value={r.member_id}>{r.member_name}</option>)}
                  </select>
                </div>
              )}
              <div className="field-group" style={{marginBottom:'0.9rem'}}>
                <label className="field-label">Amount (L$)</label>
                <input className="field-input" type="number" placeholder="e.g. 4000" value={payForm.amount_ls} onChange={e=>setPayForm(f=>({...f,amount_ls:e.target.value}))} />
              </div>
              <div className="field-group" style={{marginBottom:'0.9rem'}}>
                <label className="field-label">CasperLet Transaction ID (optional)</label>
                <input className="field-input" placeholder="Paste transaction ID..." value={payForm.transaction_id} onChange={e=>setPayForm(f=>({...f,transaction_id:e.target.value}))} />
              </div>
              <div className="field-group" style={{marginBottom:'0.9rem'}}>
                <label className="field-label">CasperLet Expiry Date</label>
                <input className="field-input" type="datetime-local" value={payForm.expires_at} onChange={e=>setPayForm(f=>({...f,expires_at:e.target.value}))} />
                <div style={{fontSize:'0.65rem',color:'rgba(240,232,208,0.25)',marginTop:'3px'}}>Set from your CasperLet message e.g. "expires Wed, 13th May at 5:09 AM"</div>
              </div>
              <div className="field-group" style={{marginBottom:'0.9rem'}}>
                <label className="field-label">CasperLet Expiry Text (paste from message)</label>
                <input className="field-input" placeholder="e.g. expires Wed, 13th May, at 5:09 AM" value={payForm.casper_expiry_text} onChange={e=>setPayForm(f=>({...f,casper_expiry_text:e.target.value}))} />
              </div>
              <div className="field-group" style={{marginBottom:'1.2rem'}}>
                <label className="field-label">Notes (optional)</label>
                <input className="field-input" placeholder="Any notes..." value={payForm.notes} onChange={e=>setPayForm(f=>({...f,notes:e.target.value}))} />
              </div>
              <button className="btn btn-gold" onClick={logPayment} disabled={saving}>{saving?'Logging...':'Log Payment'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Sweat Equity */}
      {modal==='sweat' && (
        <div className="dues-modal-overlay" onClick={()=>{ setModal(null); setMsg(''); }}>
          <div className="dues-modal" onClick={e=>e.stopPropagation()}>
            <div className="dues-modal-header">
              <div className="dues-modal-title">Submit Sweat Equity</div>
              <button className="dues-modal-close" onClick={()=>{ setModal(null); setMsg(''); }}>✕</button>
            </div>
            <div className="dues-modal-body">
              {msg && <div style={{padding:'0.6rem 0.8rem',marginBottom:'1rem',borderRadius:'5px',fontSize:'0.8rem',background:msg.startsWith('Error')?'rgba(178,34,52,0.08)':'rgba(74,222,128,0.08)',border:`1px solid ${msg.startsWith('Error')?'rgba(178,34,52,0.2)':'rgba(74,222,128,0.2)'}`,color:msg.startsWith('Error')?'#e05070':'#4ade80'}}>{msg}</div>}
              <div className="field-group" style={{marginBottom:'0.9rem'}}>
                <label className="field-label">Category</label>
                <select className="field-input" value={sweatForm.category} onChange={e=>setSweatForm(f=>({...f,category:e.target.value}))}>
                  {SWEAT_CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="field-group" style={{marginBottom:'0.9rem'}}>
                <label className="field-label">What did you contribute?</label>
                <textarea className="field-textarea" style={{minHeight:'80px'}} placeholder="Describe your contribution in detail..." value={sweatForm.contribution} onChange={e=>setSweatForm(f=>({...f,contribution:e.target.value}))} />
              </div>
              <div className="field-group" style={{marginBottom:'0.9rem'}}>
                <label className="field-label">Suggested value (L$) — optional</label>
                <input className="field-input" type="number" placeholder="What value do you think this is worth?" value={sweatForm.value_requested} onChange={e=>setSweatForm(f=>({...f,value_requested:e.target.value}))} />
              </div>
              <div className="field-group" style={{marginBottom:'1.2rem'}}>
                <label className="field-label">Additional notes (optional)</label>
                <input className="field-input" placeholder="Links, proof, context..." value={sweatForm.notes} onChange={e=>setSweatForm(f=>({...f,notes:e.target.value}))} />
              </div>
              <div style={{fontSize:'0.72rem',color:'rgba(240,232,208,0.3)',marginBottom:'1rem',lineHeight:'1.6'}}>
                Your submission will be reviewed by leadership. The approved value will be credited toward your L$4,000 dues.
              </div>
              <button className="btn btn-gold" onClick={submitSweat} disabled={saving}>{saving?'Submitting...':'Submit for Review'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Timer Edit Modal */}
      {timerEdit && (
        <div className="dues-modal-overlay" onClick={()=>setTimerEdit(null)}>
          <div className="dues-modal" onClick={e=>e.stopPropagation()}>
            <div className="dues-modal-header"><div className="dues-modal-title">Edit CasperLet Timer</div><button className="dues-modal-close" onClick={()=>setTimerEdit(null)}>✕</button></div>
            <div className="dues-modal-body">
              <div className="field-group" style={{marginBottom:'0.9rem'}}>
                <label className="field-label">CasperLet Expiry Date</label>
                <input className="field-input" type="datetime-local" value={timerEdit.expires_at ? timerEdit.expires_at.slice(0,16) : ''} onChange={e=>setTimerEdit(p=>({...p,expires_at:e.target.value}))} />
              </div>
              <div className="field-group" style={{marginBottom:'1.2rem'}}>
                <label className="field-label">CasperLet Expiry Text</label>
                <input className="field-input" placeholder="e.g. expires Wed, 13th May, at 5:09 AM" value={timerEdit.casper_expiry_text} onChange={e=>setTimerEdit(p=>({...p,casper_expiry_text:e.target.value}))} />
              </div>
              <button className="btn btn-gold" onClick={()=>updateTimer(timerEdit.record_id, timerEdit.expires_at, timerEdit.casper_expiry_text)} disabled={saving}>{saving?'Saving...':'Save Timer'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
