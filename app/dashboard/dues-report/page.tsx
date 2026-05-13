'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../dash.css';
import './dues-report.css';
import DashSidebar from '../DashSidebar';

function fmt(n: number) { return `L$${(n||0).toLocaleString()}`; }
function pct(paid: number, sweat: number, due: number) { return Math.min(100, Math.round(((paid+sweat)/due)*100))||0; }
function dateFmt(d: string) { return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }

function fmtTimeLeft(ms: number): string {
  if (ms <= 0) return 'EXPIRED';
  const months  = Math.floor(ms / (30*86400000));
  const days    = Math.floor((ms % (30*86400000)) / 86400000);
  const hours   = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const parts: string[] = [];
  if (months  > 0) parts.push(`${months} ${months  === 1 ? 'month'   : 'months'}`);
  if (days    > 0) parts.push(`${days} ${days    === 1 ? 'day'     : 'days'}`);
  if (hours   > 0) parts.push(`${hours} ${hours   === 1 ? 'hour'    : 'hours'}`);
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minute'  : 'minutes'}`);
  parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
  return parts.join(', ') + ' left';
}

function Countdown({ expiresAt }: { expiresAt: string | null }) {
  const [display, setDisplay] = useState('— No timer set');
  const [cls, setCls] = useState('none');
  useEffect(() => {
    if (!expiresAt) { setDisplay('— No timer set'); setCls('none'); return; }
    function tick() {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) { setDisplay('EXPIRED'); setCls('urgent'); return; }
      setCls(ms < 86400000 ? 'urgent' : ms < 86400000*3 ? 'warn' : 'ok');
      setDisplay(fmtTimeLeft(ms));
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  const col = cls === 'none' ? 'var(--bone-faint)' : undefined;
  return <span className={`dr-brother-timer ${cls}`} style={{color:col}}>{display}</span>;
}
function timerCls(r: any) {
  if(!r.expires_at) return 'ok';
  const ms=new Date(r.expires_at).getTime()-Date.now();
  if(ms<=0) return 'urgent';
  if(ms<3*86400000) return 'warn';
  return 'ok';
}
function progCls(status:string, p:number) { if(status==='paid') return 'green'; return p>40?'gold':'red'; }
function statusCls(status:string) { if(status==='paid') return 'paid'; if(status==='partial') return 'partial'; return 'unpaid'; }

export default function DuesReportPage() {
  const [member, setMember]   = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [report, setReport]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [periodId, setPeriodId] = useState('');
  const [filter, setFilter]   = useState<'all'|'outstanding'>('all');
  const [expanded, setExpanded] = useState<string|null>(null);

  useEffect(()=>{
    fetch('/api/dashboard/profile').then(r=>r.json()).then(d=>{
      if(d.error){window.location.href='/login';return;}
      const m=d.member;
      const canSee=m?.faction==='Ishi No Faction'||m?.frat_name==='Big Brother Substance'||m?.frat_name==='Big Brother Cool Breeze';
      if(!canSee){window.location.href='/dashboard';return;}
      setMember(m); setProfile(d.profile);
      loadReport('');
    });
  },[]);

  async function loadReport(pid:string){
    setLoading(true);
    const url=pid?`/api/dashboard/dues/report?period_id=${pid}`:'/api/dashboard/dues/report';
    const d=await fetch(url).then(r=>r.json());
    setReport(d); setLoading(false);
  }

  if(!member) return <div className="dash-loading">LOADING...</div>;

  const canSeeFull=member.frat_name==='Big Brother Substance'||member.frat_name==='Big Brother Cool Breeze';
  const { summary={}, full_records=[], disciplinary=[], periods=[] }=report||{};
  const activePeriod=periods.find((p:any)=>p.is_active);
  const currentPeriod=periods.find((p:any)=>p.id===periodId)||activePeriod||periods[0];
  const records=canSeeFull?full_records:disciplinary;
  const displayed=filter==='outstanding'?records.filter((r:any)=>r.status!=='paid'):records;

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile}/>
      <main className="dash-main">

        {/* Header */}
        <div className="dash-page-header">
          <div className="dash-page-title">Dues Report</div>
          <span className={`dr-access-tag ${canSeeFull?'full':'ishi'}`}>
            {canSeeFull?'Full Access':'Ishi No Faction'}
          </span>
        </div>

        {/* Period + filter bar */}
        <div className="dr-period-bar">
          <span className="dr-period-label">Period</span>
          <select className="dr-period-select" value={periodId||currentPeriod?.id||''} onChange={e=>{setPeriodId(e.target.value);loadReport(e.target.value);}}>
            {periods.map((p:any)=><option key={p.id} value={p.id}>{p.label||p.name}</option>)}
          </select>
          {currentPeriod && (
            <span className={`dr-period-badge ${currentPeriod.is_active?'active':'closed'}`}>
              {currentPeriod.is_active?'Active':'Closed'}
            </span>
          )}
        </div>

        {/* Stats */}
        {summary && (
          <div className="dr-stats">
            {[
              {val:summary.paid||0,             lbl:'Paid',      color:'var(--green)',  ic:'#4ade80', path:<polyline points="20 6 9 17 4 12"/>},
              {val:summary.partial||0,           lbl:'Partial',   color:'var(--gold-b)', ic:'#e8b84b', path:<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>},
              {val:summary.unpaid||0,            lbl:'Unpaid',    color:'#e05070',       ic:'#e05070', path:<><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>},
              {val:fmt(summary.total_collected||0),lbl:'Collected',color:'var(--gold)',  ic:'#c6930a', path:<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>},
            ].map((s,i)=>(
              <div key={i} className="dr-stat-cell" style={{borderLeft:`3px solid ${s.ic}40`}}>
                <div className="dr-stat-icon" style={{background:`${s.ic}14`,border:`1px solid ${s.ic}30`}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.ic} strokeWidth="2">{s.path}</svg>
                </div>
                <div>
                  <div className="dr-stat-val" style={{color:s.color}}>{s.val}</div>
                  <div className="dr-stat-lbl">{s.lbl}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter */}
        {canSeeFull && (
          <div className="dr-filter-bar">
            <button className={`dr-filter-btn${filter==='all'?' active':''}`} onClick={()=>setFilter('all')}>
              All Brothers ({records.length})
            </button>
            <button className={`dr-filter-btn${filter==='outstanding'?' active':''}`} onClick={()=>setFilter('outstanding')}>
              Outstanding ({records.filter((r:any)=>r.status!=='paid').length})
            </button>
          </div>
        )}

        {/* Records */}
        <div className="dr-records">
          {loading && <div className="dr-empty">Loading...</div>}
          {!loading && displayed.length===0 && <div className="dr-empty">No records found.</div>}

          {!loading && displayed.map((rec:any)=>{
            const remaining=Math.max(0,rec.amount_due-rec.linden_paid-rec.sweat_equity_value);
            const p=pct(rec.linden_paid,rec.sweat_equity_value,rec.amount_due);
            const isExp=expanded===rec.member_id;
            const hasPmts=(rec.payments?.length>0)||(rec.sweat_equity?.length>0);
            return (
              <div key={rec.member_id} className={`dr-row ${statusCls(rec.status)}${isExp?' open':''}`}>
                {/* Main row */}
                <div className="dr-row-main" onClick={()=>hasPmts&&setExpanded(isExp?null:rec.member_id)}>

                  {/* Brother name + timer */}
                  <div className="dr-brother-col">
                    <div className="dr-brother-name">{rec.member_name}</div>
                    <Countdown expiresAt={rec.expires_at} />
                  </div>

                  {/* Progress bar */}
                  <div className="dr-prog-col">
                    <div className="dr-prog-meta">
                      <span className="dr-prog-pct" style={{color:rec.status==='paid'?'var(--green)':p>40?'var(--gold-b)':'#e05070'}}>{p}%</span>
                      <span className="dr-prog-due">{fmt(rec.amount_due)} due</span>
                    </div>
                    <div className="dr-prog-track">
                      <div className={`dr-prog-fill ${progCls(rec.status,p)}`} style={{width:`${p}%`}}/>
                    </div>
                  </div>

                  {/* Linden */}
                  <div className="dr-amount-col">
                    <div className="dr-amount-val" style={{color:rec.linden_paid?'var(--green)':'var(--bone-faint)'}}>{rec.linden_paid?fmt(rec.linden_paid):'—'}</div>
                    <div className="dr-amount-lbl">Linden</div>
                  </div>

                  {/* Sweat */}
                  <div className="dr-amount-col">
                    <div className="dr-amount-val" style={{color:rec.sweat_equity_value?'var(--gold-b)':'var(--bone-faint)'}}>{rec.sweat_equity_value?fmt(rec.sweat_equity_value):'—'}</div>
                    <div className="dr-amount-lbl">Sweat</div>
                  </div>

                  {/* Remaining */}
                  <div className="dr-amount-col">
                    <div className="dr-amount-val" style={{color:remaining>0?'#e05070':'var(--green)'}}>{remaining>0?fmt(remaining):'—'}</div>
                    <div className="dr-amount-lbl">Remaining</div>
                  </div>

                  {/* Status badge */}
                  <div className="dr-status">
                    <span className={`dr-badge ${statusCls(rec.status)}`}>
                      {rec.status==='paid'?'Paid':rec.status==='partial'?`${p}% Paid`:'Unpaid'}
                    </span>
                  </div>

                  {hasPmts && <span className="dr-chevron">{isExp?'▲':'▼'}</span>}
                </div>

                {/* Expanded payment history */}
                {isExp && (
                  <div className="dr-detail">
                    {rec.payments?.length>0 && (
                      <div>
                        <div className="dr-detail-section-lbl">Linden Payments</div>
                        <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                          {rec.payments.map((p:any,i:number)=>(
                            <div key={i} className="dr-payment-row">
                              <span className="dr-payment-dot linden"/>
                              <span className="dr-payment-amount linden">{fmt(p.amount_ls)}</span>
                              <span className="dr-payment-desc">Logged by {p.logged_by_name||'Admin'}</span>
                              <span className="dr-payment-date">{dateFmt(p.created_at)}</span>
                              {p.transaction_id && <span className="dr-payment-txid">#{p.transaction_id}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {rec.sweat_equity?.filter((s:any)=>s.status==='approved').length>0 && (
                      <div>
                        <div className="dr-detail-section-lbl">Sweat Equity</div>
                        <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                          {rec.sweat_equity.filter((s:any)=>s.status==='approved').map((s:any,i:number)=>(
                            <div key={i} className="dr-payment-row">
                              <span className="dr-payment-dot sweat"/>
                              <span className="dr-payment-amount sweat">{fmt(s.value_approved||0)}</span>
                              <span className="dr-payment-desc">{s.contribution} · {s.category}</span>
                              <span className="dr-payment-date">{dateFmt(s.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Footer summary */}
          {!loading && summary.total_collected!==undefined && (
            <div className="dr-footer">
              <span className="dr-footer-stat">Total: <strong style={{color:'var(--green)'}}>{fmt(summary.total_collected)}</strong></span>
              <span className="dr-footer-stat">Sweat: <strong style={{color:'var(--gold-b)'}}>{fmt(summary.total_sweat||0)}</strong></span>
              <span className="dr-footer-stat">Outstanding: <strong style={{color:'#e05070'}}>{fmt(summary.total_outstanding||0)}</strong></span>
              <span className="dr-footer-stat">Paid in full: <strong style={{color:'var(--bone-dim)'}}>{summary.paid||0} of {summary.total||0}</strong></span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
