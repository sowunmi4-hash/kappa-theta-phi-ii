'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import '../phire-sub.css';
import DashSidebar from '../../DashSidebar';

function timeAgo(d:string){ const s=Math.floor((Date.now()-new Date(d).getTime())/1000); if(s<60) return 'just now'; if(s<3600) return `${Math.floor(s/60)}m ago`; if(s<86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`; }

export default function PhireHistory() {
  const [member, setMember]   = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [tab, setTab]         = useState<'submissions'|'transactions'>('submissions');
  const [submissions, setSubmissions]   = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  function load() {
    fetch('/api/dashboard/phire/submissions?view=own').then(r=>r.json()).then(d=>setSubmissions(d.submissions||[]));
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>setTransactions(d.recent_transactions||[]));
  }

  useEffect(() => {
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>{ if(d.error){window.location.href='/login';return;} setMember(d.member); setProfile(d.profile||{}); });
    load();
  }, []);

  useEffect(() => {
    const poll = setInterval(load, 30000);
    return () => clearInterval(poll);
  }, []);

  if (!member) return <div className="dash-loading">LOADING...</div>;

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />
      <main className="dash-main">
        <div className="dash-page-header">
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            <a href="/dashboard/phire" className="ps-back">← PHIRE</a>
            <div className="dash-page-title">My History</div>
          </div>
        </div>

        <div className="ps-tabs">
          <button className={`ps-tab${tab==='submissions'?' active':''}`} onClick={()=>setTab('submissions')}>
            Submissions ({submissions.length})
          </button>
          <button className={`ps-tab${tab==='transactions'?' active':''}`} onClick={()=>setTab('transactions')}>
            Transactions ({transactions.length})
          </button>
        </div>

        <div className="ps-wrap">
          {tab === 'submissions' && (
            <>
              {submissions.length === 0 && (
                <div className="ps-empty">No submissions yet — <a href="/dashboard/phire/submit" style={{ color:'var(--gold)' }}>log your first activity →</a></div>
              )}
              {submissions.map((s:any) => (
                <div key={s.id} className="ps-row">
                  <span className={`ps-dot ${s.status}`} />
                  <div style={{ flex:1 }}>
                    <div className="ps-row-title">{s.activity_name}</div>
                    <div className="ps-row-sub">{timeAgo(s.created_at)}{s.reviewed_by_name ? ` · Reviewed by ${s.reviewed_by_name}` : ''}</div>
                    {s.note && s.status==='denied' && <div style={{ fontFamily:'var(--cinzel)', fontSize:'.6rem', color:'#e05070', marginTop:'3px' }}>Reason: {s.note}</div>}
                  </div>
                  <div className="ps-row-pts earn">+{s.point_value}</div>
                  <span className={`ps-badge ${s.status}`}>{s.status}</span>
                </div>
              ))}
            </>
          )}

          {tab === 'transactions' && (
            <>
              {transactions.length === 0 && <div className="ps-empty">No transactions yet.</div>}
              {transactions.map((tx:any) => (
                <div key={tx.id} className="ps-row">
                  <span className={`ps-dot ${tx.points>0?'earn':'spend'}`} />
                  <div style={{ flex:1 }}>
                    <div className="ps-row-title">{tx.note || 'Manual Adjustment'}</div>
                    <div className="ps-row-sub">{timeAgo(tx.created_at)}{tx.created_by_name ? ` · by ${tx.created_by_name}` : ''}</div>
                  </div>
                  <div className={`ps-row-pts ${tx.points>0?'earn':'spend'}`}>{tx.points>0?'+':''}{tx.points}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
