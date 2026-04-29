'use client';
import { useState, useEffect } from 'react';
import '../discipline/discipline.css';
const NAV = [
  { href:'/dashboard', label:'Dashboard' },
  { href:'/dashboard/phire', label:'PHIRE' },
  { href:'/dashboard/discipline', label:'Discipline' },
  { href:'/dashboard/dues-report', label:'Dues Report' },
  { href:'/dashboard/ssp', label:'SSP' },
  { href:'/dashboard/dues', label:'Dues' },
  { href:'/dashboard/events', label:'Events' },
  { href:'/dashboard/news', label:'News' },
  { href:'/dashboard/gallery', label:'Gallery' },
  { href:'/dashboard/edit', label:'Edit Profile' },
];

export default function DuesReportPage() {
  const [member, setMember]   = useState<any>(null);
  const [report, setReport]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [period, setPeriod]   = useState('');
  const [view, setView]       = useState<'disciplinary'|'full'>('disciplinary');

  useEffect(() => {
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d => {
      if (d.error) { window.location.href='/login'; return; }
      setMember(d.member);
      const canSee = d.member?.fraction === 'Ishi No Fraction' || d.member?.frat_name === 'Big Brother Substance';
      if (!canSee) { window.location.href='/dashboard'; return; }
      loadReport('');
    });
  }, []);

  async function loadReport(pid: string) {
    setLoading(true);
    setError('');
    try {
      const url = pid ? `/api/dashboard/dues/report?period_id=${pid}` : '/api/dashboard/dues/report';
      const res = await fetch(url);
      const d = await res.json();
      if (d.error) { setError(d.error); }
      else { setReport(d); }
    } catch(e:any) { setError('Network error: ' + e.message); }
    setLoading(false);
  }

  if (!member || (!report && loading)) return <div className="dash-loading">LOADING...</div>;

  const slug = member.frat_name?.toLowerCase().replace(/\s+/g,'-');
  const canSeeFull = member.frat_name === 'Big Brother Substance';

  const fmt = (n:number) => `L$${(n||0).toLocaleString()}`;
  const statusColor:any = { paid:'#4ade80', partial:'#c6930a', unpaid:'#e05070', waived:'rgba(240,232,208,0.2)' };

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
          <div className="dash-nav-divider"/>
          <a href="/" className="dash-nav-item"><span>Back to Site</span></a>
          <button onClick={async()=>{await fetch('/api/logout',{method:'POST'});window.location.href='/login';}} className="dash-nav-item" style={{width:'100%',textAlign:'left',background:'none',border:'none',cursor:'pointer',color:'#e05070',fontFamily:'inherit'}}><span>Sign Out</span></button>
        </nav>
      </aside>
      <main className="dash-main">
        <div className="disc-hero">
          <div className="disc-hero-title">Dues Report</div>
          <div className="disc-hero-sub">KΘΦ II — Billing Period Overview</div>
        </div>

        {/* Period selector */}
        {report?.periods?.length > 0 && (
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap',padding:'0 1.5rem 1rem',alignItems:'center'}}>
            <span style={{fontSize:'0.6rem',letterSpacing:'3px',color:'var(--muted)',textTransform:'uppercase'}}>Period:</span>
            {report.periods.map((p:any) => (
              <button key={p.id} onClick={()=>{ setPeriod(p.id); loadReport(p.id); }}
                style={{padding:'4px 14px',borderRadius:'20px',fontSize:'0.72rem',cursor:'pointer',fontFamily:'Rajdhani,sans-serif',
                  background: period===p.id || (!period && p.id===report?.period?.id) ? 'rgba(198,147,10,0.1)' : 'var(--surface)',
                  border: period===p.id || (!period && p.id===report?.period?.id) ? '1px solid rgba(198,147,10,0.4)' : '1px solid var(--border)',
                  color: period===p.id || (!period && p.id===report?.period?.id) ? 'var(--gold)' : 'var(--muted)'}}>
                {p.label}
              </button>
            ))}
          </div>
        )}

        <div style={{padding:'0 1.5rem 1.5rem'}}>
          {error && <div style={{padding:'1rem',background:'rgba(178,34,52,0.08)',border:'1px solid rgba(178,34,52,0.2)',borderRadius:'6px',color:'#e05070',fontSize:'0.85rem',marginBottom:'1rem'}}>Error: {error}</div>}
          {loading && <div style={{textAlign:'center',padding:'3rem',color:'var(--muted)'}}>Loading report...</div>}

          {!loading && report && (
            <>
              {/* Summary */}
              {report.summary && (
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',marginBottom:'1.5rem'}}>
                  {[
                    {label:'Paid',val:report.summary.paid,color:'#4ade80'},
                    {label:'Partial',val:report.summary.partial,color:'#c6930a'},
                    {label:'Unpaid',val:report.summary.unpaid,color:'#e05070'},
                    {label:'Collected',val:fmt(report.summary.total_collected),color:'var(--bone)'},
                  ].map(s=>(
                    <div key={s.label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'8px',padding:'0.8rem',textAlign:'center'}}>
                      <div style={{fontSize:'1.4rem',fontWeight:800,color:s.color}}>{s.val}</div>
                      <div style={{fontSize:'0.6rem',letterSpacing:'2px',color:'var(--muted)',marginTop:'2px',textTransform:'uppercase'}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* View toggle for Substance */}
              {canSeeFull && (
                <div className="disc-tabs" style={{marginBottom:'1rem'}}>
                  <button className={`disc-tab ${view==='disciplinary'?'active':''}`} onClick={()=>setView('disciplinary')}>⚔ Disciplinary</button>
                  <button className={`disc-tab ${view==='full'?'active':''}`} onClick={()=>setView('full')}>◈ Full Report</button>
                </div>
              )}

              {/* DISCIPLINARY REPORT */}
              {view === 'disciplinary' && (
                <div style={{background:'rgba(178,34,52,0.06)',border:'1px solid rgba(178,34,52,0.2)',borderRadius:'10px',padding:'1.2rem'}}>
                  <div style={{fontSize:'0.6rem',letterSpacing:'3px',color:'#e05070',textTransform:'uppercase',marginBottom:'1rem',fontWeight:700}}>
                    ⚔ Outstanding Dues — {report.disciplinary?.length || 0} Brothers
                  </div>
                  {!report.disciplinary?.length && <div style={{textAlign:'center',padding:'1rem',color:'var(--muted)',fontSize:'0.85rem'}}>All brothers in good standing.</div>}
                  {report.disciplinary?.map((rec:any) => {
                    const owed = rec.amount_due - rec.linden_paid - rec.sweat_equity_value;
                    return (
                      <div key={rec.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.7rem 0.9rem',background:'var(--raised)',border:'1px solid var(--border)',borderRadius:'6px',marginBottom:'4px'}}>
                        <div>
                          <div style={{fontWeight:700,color:'var(--bone)',fontSize:'0.9rem'}}>{rec.member_name}</div>
                          <div style={{fontSize:'0.7rem',color:'var(--muted)',marginTop:'2px'}}>Paid {fmt(rec.linden_paid)} + {fmt(rec.sweat_equity_value)} sweat — owes {fmt(owed)}</div>
                        </div>
                        <span style={{fontSize:'0.6rem',letterSpacing:'2px',padding:'2px 10px',borderRadius:'3px',fontWeight:700,textTransform:'uppercase',
                          color:statusColor[rec.status],background:'rgba(0,0,0,0.2)',border:`1px solid ${statusColor[rec.status]}44`}}>
                          {rec.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* FULL REPORT */}
              {view === 'full' && canSeeFull && report.full_records && (
                <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'10px',padding:'1.2rem'}}>
                  <div style={{fontSize:'0.6rem',letterSpacing:'3px',color:'var(--gold)',textTransform:'uppercase',marginBottom:'1rem',fontWeight:700}}>
                    ◈ Full Report — All {report.full_records.length} Brothers
                  </div>
                  {report.full_records.map((rec:any) => {
                    const remaining = Math.max(0, rec.amount_due - rec.linden_paid - rec.sweat_equity_value);
                    const progress = Math.min(100, Math.round(((rec.linden_paid + rec.sweat_equity_value) / rec.amount_due) * 100));
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
                        <div style={{display:'flex',gap:'1rem',fontSize:'0.7rem',color:'var(--muted)',flexWrap:'wrap'}}>
                          <span style={{color:'#4ade80'}}>{fmt(rec.linden_paid)} cash</span>
                          <span style={{color:'#c6930a'}}>{fmt(rec.sweat_equity_value)} sweat</span>
                          <span style={{color:'#e05070'}}>{fmt(remaining)} remaining</span>
                          {rec.payments?.length > 0 && <span>{rec.payments.length} payment{rec.payments.length!==1?'s':''}</span>}
                        </div>
                        {rec.payments?.map((p:any) => (
                          <div key={p.id} style={{marginTop:'3px',fontSize:'0.68rem',color:'rgba(240,232,208,0.3)',paddingLeft:'8px'}}>
                            └ {fmt(p.amount_ls)} · {new Date(p.created_at).toLocaleDateString('en-GB')}
                            {p.transaction_id && <span style={{fontFamily:'monospace',marginLeft:'6px',fontSize:'0.65rem'}}>{p.transaction_id}</span>}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  <div style={{marginTop:'1rem',padding:'0.8rem',background:'var(--raised)',borderRadius:'6px',fontSize:'0.78rem',color:'var(--muted)',display:'flex',gap:'2rem',flexWrap:'wrap'}}>
                    <span>Collected: <strong style={{color:'#4ade80'}}>{fmt(report.summary.total_collected)}</strong></span>
                    <span>Sweat equity: <strong style={{color:'#c6930a'}}>{fmt(report.summary.total_sweat)}</strong></span>
                    <span>Paid in full: <strong style={{color:'var(--bone)'}}>{report.summary.paid}/{report.summary.total}</strong></span>
                  </div>
                </div>
              )}
            </>
          )}

          {!loading && !report && !error && (
            <div style={{textAlign:'center',padding:'3rem',color:'var(--muted)'}}>No dues periods found.</div>
          )}
        </div>
      </main>
    </div>
  );
}
