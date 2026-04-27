'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import '../phire.css';

export default function PhireHistory() {
  const [member, setMember] = useState<any>(null);
  const [tab, setTab] = useState<'submissions'|'transactions'>('submissions');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const slug = member?.frat_name?.toLowerCase().replace(/\s+/g,'-').replace('big-brother-','') || '';
  const portrait = `/brothers/${slug}.png`;
  const NAV = [
    { href: '/dashboard', label: 'Home' },
    { href: '/dashboard/news', label: 'Wokou News' },
    { href: '/dashboard/events', label: 'Events' },
    { href: '/dashboard/phire', label: 'PHIRE' },
    { href: '/dashboard/discipline', label: 'Discipline' },
    { href: '/dashboard/ssp', label: 'SSP' },
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
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>{ if(d.error){window.location.href='/login';return;} setMember(d.member); });
    fetch('/api/dashboard/phire/submissions?view=own').then(r=>r.json()).then(d=>setSubmissions(d.submissions||[]));
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>setTransactions(d.recent_transactions||[]));
  }, []);

  // POLLING
  useEffect(() => {
    const poll = setInterval(() => {
      fetch('/api/dashboard/phire/submissions?view=own').then(r=>r.json()).then(d=>setSubmissions(d.submissions||[]));
      fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>setTransactions(d.recent_transactions||[]));
    }, 30000);
    return () => clearInterval(poll);
  }, []);

  function timeAgo(d:string){ const s=Math.floor((Date.now()-new Date(d).getTime())/1000); if(s<60) return 'just now'; if(s<3600) return `${Math.floor(s/60)}m ago`; if(s<86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`; }

  if (!member) return <div className="dash-loading">LOADING...</div>;
  return (
    <div className="dash-app phire-root">
      <Sidebar />
      <main className="dash-main">
        <div className="phire-history-wrap">
          <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'1.5rem'}}>
            <a href="/dashboard/phire" style={{color:'var(--muted)',textDecoration:'none',fontSize:'0.75rem',letterSpacing:'2px'}}>← PHIRE</a>
            <div className="phire-submit-title" style={{margin:0}}>My History</div>
          </div>
          <div className="phire-tabs">
            <button className={`phire-tab ${tab==='submissions'?'active':''}`} onClick={()=>setTab('submissions')}>Submissions ({submissions.length})</button>
            <button className={`phire-tab ${tab==='transactions'?'active':''}`} onClick={()=>setTab('transactions')}>Transactions</button>
          </div>

          {tab === 'submissions' && (
            <>
              {submissions.length === 0 && <div className="phire-empty">No submissions yet. <a href="/dashboard/phire/submit" style={{color:'var(--gold)'}}>Log your first activity →</a></div>}
              {submissions.map((s:any) => (
                <div key={s.id} className="submission-row">
                  <div className={`sub-status ${s.status}`} />
                  <div style={{flex:1}}>
                    <div className="sub-name">{s.activity_name}</div>
                    <div style={{fontSize:'0.65rem',color:'var(--muted)',marginTop:'2px'}}>{timeAgo(s.created_at)}{s.reviewed_by_name ? ` · Reviewed by ${s.reviewed_by_name}` : ''}</div>
                    {s.note && s.status==='denied' && <div style={{fontSize:'0.7rem',color:'#e05070',marginTop:'3px'}}>Reason: {s.note}</div>}
                  </div>
                  <div className="sub-pts">+{s.point_value}</div>
                  <span className={`sub-tag ${s.status}`}>{s.status.toUpperCase()}</span>
                </div>
              ))}
            </>
          )}

          {tab === 'transactions' && (
            <>
              {transactions.length === 0 && <div className="phire-empty">No transactions yet.</div>}
              {transactions.map((tx:any) => (
                <div key={tx.id} className="submission-row">
                  <div className={`sub-status ${tx.points>0?'approved':'denied'}`} />
                  <div style={{flex:1}}>
                    <div className="sub-name">{tx.note||'Manual Adjustment'}</div>
                    <div style={{fontSize:'0.65rem',color:'var(--muted)',marginTop:'2px'}}>{timeAgo(tx.created_at)}{tx.created_by_name ? ` · by ${tx.created_by_name}` : ''}</div>
                  </div>
                  <div className={`sub-pts ${tx.points>0?'':'negative'}`} style={{color:tx.points>0?'#4ade80':'var(--crimson)'}}>{tx.points>0?'+':''}{tx.points} pts</div>
                </div>
              ))}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
