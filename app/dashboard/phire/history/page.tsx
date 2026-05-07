'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import './history.css';
import DashSidebar from '../../DashSidebar';

function timeAgo(d:string){const s=Math.floor((Date.now()-new Date(d).getTime())/1000);if(s<60)return 'just now';if(s<3600)return `${Math.floor(s/60)}m ago`;if(s<86400)return `${Math.floor(s/3600)}h ago`;return `${Math.floor(s/86400)}d ago`;}

export default function PhireHistory() {
  const [member, setMember]   = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [tab, setTab]         = useState<'submissions'|'transactions'>('submissions');
  const [submissions, setSubmissions]   = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  function load(){
    fetch('/api/dashboard/phire/submissions?view=own').then(r=>r.json()).then(d=>setSubmissions(d.submissions||[]));
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>setTransactions(d.recent_transactions||[]));
  }

  useEffect(()=>{
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>{if(d.error){window.location.href='/login';return;}setMember(d.member);setProfile(d.profile||{});});
    load();
  },[]);

  useEffect(()=>{const p=setInterval(load,30000);return()=>clearInterval(p);},[]);

  if(!member) return <div className="dash-loading">LOADING...</div>;

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />
      <main className="dash-main">
        <div className="dash-page-header">
          <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <a href="/dashboard/phire" style={{fontFamily:'var(--cinzel)',fontSize:'.65rem',letterSpacing:'2px',color:'var(--bone-faint)',textDecoration:'none'}}>← PHIRE</a>
            <div className="dash-page-title">My History</div>
          </div>
        </div>

        <div className="hy-tabs">
          <button className={`hy-tab${tab==='submissions'?' active':''}`} onClick={()=>setTab('submissions')}>Submissions ({submissions.length})</button>
          <button className={`hy-tab${tab==='transactions'?' active':''}`} onClick={()=>setTab('transactions')}>Transactions ({transactions.length})</button>
        </div>

        {tab==='submissions'&&(
          <div className="hy-wrap">
            {submissions.length===0&&<div className="hy-empty">No submissions yet — <a href="/dashboard/phire/submit" style={{color:'var(--gold)'}}>log your first activity →</a></div>}
            {submissions.length>0&&(
              <>
                <div className="hy-cols">
                  <span className="hy-col-label" />
                  <span className="hy-col-label">Activity</span>
                  <span className="hy-col-label">When</span>
                  <span className="hy-col-label">Points</span>
                  <span className="hy-col-label">Status</span>
                </div>
                {submissions.map((s:any)=>(
                  <div key={s.id} className="hy-row">
                    <span className={`hy-dot ${s.status}`} />
                    <div>
                      <div className="hy-row-name">{s.activity_name}</div>
                      {s.reviewed_by_name&&<div className="hy-row-sub">Reviewed by {s.reviewed_by_name}</div>}
                      {s.note&&s.status==='denied'&&<div style={{fontFamily:'var(--cinzel)',fontSize:'.58rem',color:'#e05070',marginTop:'3px'}}>Reason: {s.note}</div>}
                    </div>
                    <span className="hy-row-time">{timeAgo(s.created_at)}</span>
                    <span className="hy-row-pts earn">+{s.point_value}</span>
                    <span className={`hy-badge ${s.status}`}>{s.status}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {tab==='transactions'&&(
          <div className="hy-wrap">
            {transactions.length===0&&<div className="hy-empty">No transactions yet.</div>}
            {transactions.length>0&&(
              <>
                <div className="hy-cols">
                  <span className="hy-col-label"/>
                  <span className="hy-col-label">Description</span>
                  <span className="hy-col-label">When</span>
                  <span className="hy-col-label">Points</span>
                  <span className="hy-col-label"/>
                </div>
                {transactions.map((tx:any)=>(
                  <div key={tx.id} className="hy-row">
                    <span className={`hy-dot ${tx.points>0?'earn':'spend'}`} />
                    <div>
                      <div className="hy-row-name">{tx.note||'Manual Adjustment'}</div>
                      {tx.created_by_name&&<div className="hy-row-sub">by {tx.created_by_name}</div>}
                    </div>
                    <span className="hy-row-time">{timeAgo(tx.created_at)}</span>
                    <span className={`hy-row-pts ${tx.points>0?'earn':'spend'}`}>{tx.points>0?'+':''}{tx.points}</span>
                    <span/>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
