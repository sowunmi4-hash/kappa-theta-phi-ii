'use client';
import { useState, useEffect } from 'react';
import '../dash.css';

const NAV = [
  { href: '/dashboard', label: 'Home' },
  { href: '/dashboard/news', label: 'Wokou News' },
  { href: '/dashboard/events', label: 'Events' },
  { href: '/dashboard/phire', label: 'PHIRE' },
  { href: '/dashboard/discipline', label: 'Discipline' },
  { href: '/dashboard/dues-report', label: 'Dues Report' },
  { href: '/dashboard/ssp', label: 'Sage Solution' },
  { href: '/dashboard/dues', label: 'Dues' },
  { href: '/dashboard/gallery', label: 'My Gallery' },
  { href: '/dashboard/edit', label: 'Edit Profile' },
];

export default function DuesReportPage() {
  const [member, setMember]   = useState<any>(null);
  const [report, setReport]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [period, setPeriod]   = useState('');
  const [view, setView]       = useState<'disciplinary'|'full'>('disciplinary');

  useEffect(() => {
    fetch('/api/dashboard/profile').then(r=>r.json()).then(d => {
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
      if (d.error) setError(d.error);
      else setReport(d);
    } catch(e:any) { setError('Network error: ' + e.message); }
    setLoading(false);
  }

  if (!member || (loading && !report)) return <div className="dash-loading">LOADING...</div>;

  const slug = member.frat_name?.toLowerCase().replace(/\s+/g,'-');
  const canSeeFull = member.frat_name === 'Big Brother Substance';
  const fmt = (n:number) => `L$${(n||0).toLocaleString()}`;
  const statusColor: Record<string,string> = {
    paid: '#4ade80', partial: '#c6930a', unpaid: '#e05070', waived: 'rgba(240,232,208,0.2)'
  };

  return (
    <div className="dash-app">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-logo">
          <img src="/logo.png" alt="KΘΦ II"/>
          <span className="dash-sidebar-logo-text">KΘΦ II</span>
        </div>
        <div className="dash-sidebar-member">
          <div className="dash-sidebar-portrait">
            <img src={`/brothers/${slug}.png`} alt="" onError={(e:any)=>e.target.src='/logo.png'}/>
          </div>
          <div className="dash-sidebar-name">{member.frat_name}</div>
          <div className="dash-sidebar-role">{member.role}</div>
        </div>
        <nav className="dash-nav">
          {NAV.map(n => (
            <a key={n.href} href={n.href} className={`dash-nav-item${n.href==='/dashboard/dues-report'?' active':''}`}>
              <span>{n.label}</span>
            </a>
          ))}
          {(member?.fraction === 'Ishi No Fraction' || member?.role === 'Head Founder' || member?.role === 'Co-Founder') && <a href="/dashboard/ssp/report" className="dash-nav-item"><span>SSP Report</span></a>}
          <div className="dash-nav-divider"/>
          <a href="/" className="dash-nav-item"><span>Back to Site</span></a>
          <button onClick={async()=>{await fetch('/api/logout',{method:'POST'});window.location.href='/login';}}
            className="dash-nav-item"
            style={{width:'100%',textAlign:'left',background:'none',border:'none',cursor:'pointer',color:'#e05070',fontFamily:'inherit'}}>
            <span>Sign Out</span>
          </button>
        </nav>
      </aside>

      <main className="dash-main">
        {/* Header */}
        <div style={{padding:'2rem 2rem 0',borderBottom:'1px solid var(--border)',marginBottom:'1.5rem'}}>
          <div style={{fontSize:'0.55rem',letterSpacing:'4px',color:'var(--muted)',textTransform:'uppercase',marginBottom:'4px'}}>KΘΦ II Wokou-Corsairs</div>
          <h1 style={{fontSize:'1.6rem',fontWeight:800,color:'var(--bone)',margin:0,letterSpacing:'1px'}}>Dues Report</h1>
          <div style={{fontSize:'0.75rem',color:'var(--muted)',marginTop:'4px',paddingBottom:'1.5rem'}}>Billing period overview — {canSeeFull ? 'Full access' : 'Ishi No Faction view'}</div>
        </div>

        <div style={{padding:'0 2rem 2rem'}}>

          {/* Period selector */}
          {report?.periods?.length > 0 && (
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'1.5rem',alignItems:'center'}}>
              <span style={{fontSize:'0.6rem',letterSpacing:'3px',color:'var(--muted)',textTransform:'uppercase'}}>Period:</span>
              {report.periods.map((p:any) => (
                <button key={p.id} onClick={()=>{ setPeriod(p.id); loadReport(p.id); }}
                  style={{padding:'4px 14px',borderRadius:'20px',fontSize:'0.75rem',cursor:'pointer',fontFamily:'Rajdhani,sans-serif',fontWeight:600,
                    background: period===p.id || (!period && p.id===report?.period?.id) ? 'rgba(198,147,10,0.15)' : 'var(--surface)',
                    border: period===p.id || (!period && p.id===report?.period?.id) ? '1px solid var(--gold)' : '1px solid var(--border)',
                    color: period===p.id || (!period && p.id===report?.period?.id) ? 'var(--gold)' : 'var(--muted)'}}>
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div style={{padding:'1rem',background:'rgba(178,34,52,0.08)',border:'1px solid rgba(178,34,52,0.2)',borderRadius:'8px',color:'#e05070',fontSize:'0.85rem',marginBottom:'1.5rem'}}>
              Error loading report: {error}
            </div>
          )}

          {loading && <div style={{textAlign:'center',padding:'3rem',color:'var(--muted)',fontSize:'0.85rem'}}>Loading report...</div>}

          {!loading && report && (
            <>
              {/* Summary stats */}
              {report.summary && (
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginBottom:'1.5rem'}}>
                  {[
                    { label:'Paid in Full', val: report.summary.paid, color:'#4ade80' },
                    { label:'Partial', val: report.summary.partial, color:'#c6930a' },
                    { label:'Unpaid', val: report.summary.unpaid, color:'#e05070' },
                    { label:'Total Collected', val: fmt(report.summary.total_collected), color:'var(--bone)' },
                  ].map(s => (
                    <div key={s.label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'10px',padding:'1rem',textAlign:'center'}}>
                      <div style={{fontSize:'1.6rem',fontWeight:800,color:s.color,fontFamily:'Rajdhani,sans-serif'}}>{s.val}</div>
                      <div style={{fontSize:'0.6rem',letterSpacing:'2px',color:'var(--muted)',marginTop:'4px',textTransform:'uppercase'}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* View toggle (Substance only) */}
              {canSeeFull && (
                <div style={{display:'flex',gap:'8px',marginBottom:'1.5rem'}}>
                  <button onClick={()=>setView('disciplinary')} style={{
                    padding:'6px 16px',borderRadius:'6px',fontSize:'0.75rem',fontWeight:700,cursor:'pointer',fontFamily:'Rajdhani,sans-serif',letterSpacing:'1px',textTransform:'uppercase',
                    background: view==='disciplinary' ? 'rgba(178,34,52,0.12)' : 'var(--surface)',
                    border: view==='disciplinary' ? '1px solid rgba(178,34,52,0.4)' : '1px solid var(--border)',
                    color: view==='disciplinary' ? '#e05070' : 'var(--muted)'
                  }}>⚔ Disciplinary</button>
                  <button onClick={()=>setView('full')} style={{
                    padding:'6px 16px',borderRadius:'6px',fontSize:'0.75rem',fontWeight:700,cursor:'pointer',fontFamily:'Rajdhani,sans-serif',letterSpacing:'1px',textTransform:'uppercase',
                    background: view==='full' ? 'rgba(198,147,10,0.12)' : 'var(--surface)',
                    border: view==='full' ? '1px solid rgba(198,147,10,0.4)' : '1px solid var(--border)',
                    color: view==='full' ? 'var(--gold)' : 'var(--muted)'
                  }}>◈ Full Report</button>
                </div>
              )}

              {/* DISCIPLINARY REPORT */}
              {view === 'disciplinary' && (
                <div style={{background:'rgba(178,34,52,0.05)',border:'1px solid rgba(178,34,52,0.2)',borderRadius:'12px',padding:'1.5rem'}}>
                  <div style={{fontSize:'0.55rem',letterSpacing:'4px',color:'#e05070',textTransform:'uppercase',marginBottom:'1.2rem',fontWeight:700}}>
                    ⚔ Outstanding Dues — {report.disciplinary?.length || 0} Brothers
                  </div>
                  {!report.disciplinary?.length ? (
                    <div style={{textAlign:'center',padding:'2rem',color:'var(--muted)',fontSize:'0.85rem'}}>All brothers are in good standing this period.</div>
                  ) : report.disciplinary.map((rec:any) => {
                    const owed = rec.amount_due - rec.linden_paid - rec.sweat_equity_value;
                    return (
                      <div key={rec.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.8rem 1rem',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'8px',marginBottom:'6px'}}>
                        <div>
                          <div style={{fontWeight:700,color:'var(--bone)',fontSize:'0.95rem'}}>{rec.member_name}</div>
                          <div style={{fontSize:'0.7rem',color:'var(--muted)',marginTop:'2px'}}>
                            Paid {fmt(rec.linden_paid)} cash + {fmt(rec.sweat_equity_value)} sweat — owes {fmt(owed)}
                          </div>
                        </div>
                        <span style={{
                          fontSize:'0.55rem',letterSpacing:'2px',padding:'3px 10px',borderRadius:'4px',fontWeight:700,textTransform:'uppercase',
                          color:statusColor[rec.status],
                          background: rec.status==='partial' ? 'rgba(198,147,10,0.1)' : 'rgba(178,34,52,0.1)',
                          border:`1px solid ${statusColor[rec.status]}44`
                        }}>{rec.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* FULL REPORT (Substance only) */}
              {view === 'full' && canSeeFull && report.full_records && (
                <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'12px',padding:'1.5rem'}}>
                  <div style={{fontSize:'0.55rem',letterSpacing:'4px',color:'var(--gold)',textTransform:'uppercase',marginBottom:'1.2rem',fontWeight:700}}>
                    ◈ Full Report — All {report.full_records.length} Brothers
                  </div>
                  {report.full_records.map((rec:any) => {
                    const remaining = Math.max(0, rec.amount_due - rec.linden_paid - rec.sweat_equity_value);
                    const progress = Math.min(100, Math.round(((rec.linden_paid + rec.sweat_equity_value) / rec.amount_due) * 100));
                    return (
                      <div key={rec.id} style={{borderLeft:`3px solid ${statusColor[rec.status]}`,background:'var(--raised)',borderRadius:'8px',padding:'0.9rem 1.1rem',marginBottom:'8px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                          <span style={{fontWeight:700,color:'var(--bone)',fontSize:'0.95rem'}}>{rec.member_name}</span>
                          <span style={{
                            fontSize:'0.55rem',letterSpacing:'2px',padding:'2px 10px',borderRadius:'4px',fontWeight:700,textTransform:'uppercase',
                            color:statusColor[rec.status],background:'rgba(0,0,0,0.2)',border:`1px solid ${statusColor[rec.status]}44`
                          }}>{rec.status}</span>
                        </div>
                        <div style={{height:'3px',background:'var(--border)',borderRadius:'3px',marginBottom:'6px'}}>
                          <div style={{height:'100%',width:`${progress}%`,background:statusColor[rec.status],borderRadius:'3px',transition:'width 0.3s'}}/>
                        </div>
                        <div style={{display:'flex',gap:'1rem',fontSize:'0.72rem',color:'var(--muted)',flexWrap:'wrap'}}>
                          <span style={{color:'#4ade80'}}>{fmt(rec.linden_paid)} cash</span>
                          <span style={{color:'#c6930a'}}>{fmt(rec.sweat_equity_value)} sweat</span>
                          <span style={{color:'#e05070'}}>{fmt(remaining)} remaining</span>
                          {rec.payments?.length > 0 && <span>{rec.payments.length} payment{rec.payments.length!==1?'s':''}</span>}
                        </div>
                        {rec.payments?.map((p:any) => (
                          <div key={p.id} style={{marginTop:'4px',fontSize:'0.68rem',color:'rgba(240,232,208,0.25)',paddingLeft:'10px',borderLeft:'1px solid var(--border)'}}>
                            └ {fmt(p.amount_ls)} · {new Date(p.created_at).toLocaleDateString('en-GB')}
                            {p.transaction_id && <span style={{fontFamily:'monospace',marginLeft:'8px',fontSize:'0.65rem',color:'rgba(240,232,208,0.15)'}}>{p.transaction_id}</span>}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  <div style={{marginTop:'1.2rem',padding:'0.9rem 1rem',background:'var(--raised)',borderRadius:'8px',display:'flex',gap:'2rem',flexWrap:'wrap',fontSize:'0.8rem',color:'var(--muted)'}}>
                    <span>Collected: <strong style={{color:'#4ade80'}}>{fmt(report.summary.total_collected)}</strong></span>
                    <span>Sweat credited: <strong style={{color:'#c6930a'}}>{fmt(report.summary.total_sweat)}</strong></span>
                    <span>Paid in full: <strong style={{color:'var(--bone)'}}>{report.summary.paid} / {report.summary.total} brothers</strong></span>
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
