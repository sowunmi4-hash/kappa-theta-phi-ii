'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../dash.css';
import './phire.css';
import DashSidebar from '../DashSidebar';

const LEADERS = ['Head Founder','Co-Founder','Iron Fleet'];
const TIER_ORDER = ['Bronze','Silver','Gold','Platinum','Diamond'];
const TIER_PTS:  Record<string,number> = { Bronze:0, Silver:500, Gold:1000, Platinum:2500, Diamond:5000 };

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60)     return 'Just now';
  if (s < 3600)   return `${Math.floor(s/60)}m ago`;
  if (s < 86400)  return `${Math.floor(s/3600)}h ago`;
  if (s < 604800) return `${Math.floor(s/86400)}d ago`;
  return `${Math.floor(s/604800)}w ago`;
}

function Ring({ pts, nextPts, curPts }: { pts:number; nextPts:number; curPts:number }) {
  const r = 68, cx = 88, cy = 88;
  const circ = 2 * Math.PI * r;
  const range = Math.max(nextPts - curPts, 1);
  const progress = Math.min(1, (pts - curPts) / range);
  const dash = circ * progress;

  return (
    <svg width="176" height="176" className="ph-ring-svg">
      <defs>
        <linearGradient id="phRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#c6930a" />
          <stop offset="100%" stopColor="#e8b84b" />
        </linearGradient>
      </defs>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(198,147,10,.1)" strokeWidth="10" />
      {/* Fill */}
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="url(#phRingGrad)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 1.2s ease' }}
      />
      {/* Balance */}
      <text x={cx} y={cy - 6} textAnchor="middle"
        fill="#e8b84b"
        style={{ fontFamily:'var(--display)', fontSize:'21px', fontWeight:700, letterSpacing:'1px' }}>
        {pts.toLocaleString()}
      </text>
      <text x={cx} y={cy + 13} textAnchor="middle"
        fill="rgba(198,147,10,.45)"
        style={{ fontFamily:'var(--cinzel)', fontSize:'8px', letterSpacing:'3px' }}>
        POINTS
      </text>
    </svg>
  );
}

export default function PhireHome() {
  const [data, setData]   = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);

  function load() {
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>{
      if(d.error){window.location.href='/login';return;}
      setData(d);
    });
    fetch('/api/dashboard/phire/rewards').then(r=>r.json()).then(d=>setTiers(d.tiers||[]));
  }

  useEffect(()=>{load();},[]);
  useEffect(()=>{const p=setInterval(()=>{if(document.activeElement instanceof HTMLInputElement)return;load();},30000);return()=>clearInterval(p);},[]);

  if(!data) return <div className="dash-loading">LOADING...</div>;
  const { member, balance, recent_transactions, pending_count } = data;
  const pts = balance?.balance || 0;

  // Tier logic
  const currentTierName = TIER_ORDER.reduce((acc,t)=>pts>=(TIER_PTS[t]||0)?t:acc,'Bronze');
  const currentTierIdx  = TIER_ORDER.indexOf(currentTierName);
  const nextTier        = TIER_ORDER[currentTierIdx+1];
  const curPts          = TIER_PTS[currentTierName]||0;
  const nextPts         = nextTier ? TIER_PTS[nextTier] : TIER_PTS['Diamond'];

  // Rank from leaderboard (approx from tiers or skip)
  const isLeader = LEADERS.includes(member?.role);

  // Build tier rows
  const tierRows = TIER_ORDER.map(name=>{
    const req = tiers.find((t:any)=>t.name===name)?.points_required ?? TIER_PTS[name];
    const done = pts >= req;
    const isCur = name === currentTierName;
    const pct = done ? 100 : Math.min(100,Math.round((pts/req)*100));
    return { name, req, done, isCur, pct };
  });

  // Tx dot type
  function dotType(tx:any) {
    if(tx.points<0) return 'spend';
    if(tx.type==='manual'||tx.note?.toLowerCase().includes('adjust')) return 'manual';
    return 'earn';
  }

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={data?.profile} />
      <main className="dash-main">

        {/* Header */}
        <div className="dash-page-header">
          <div className="dash-page-title">PHIRE Points</div>
          <a href="/dashboard/phire/submit" className="ph-log-btn">
            <span className="ph-log-btn-icon">⚡</span> Log Activity
          </a>
        </div>

        <div className="ph-layout">

          {/* ══ LEFT ══ */}
          <div className="ph-left">
            {/* Ring */}
            <div className="ph-ring-wrap">
              <Ring pts={pts} nextPts={nextPts} curPts={curPts} />
              <div className="ph-tier-name">{currentTierName} Tier</div>
            </div>

            {/* Tier rows */}
            <div className="ph-tiers">
              {tierRows.map(t=>(
                <div key={t.name} className={`ph-tier-row${t.done?' done':''}${t.isCur?' current':''}`}>
                  <span className="ph-tier-row-name">{t.name}</span>
                  {t.done
                    ? <span className="ph-tier-check">✓</span>
                    : <div className="ph-tier-bar-track"><div className="ph-tier-bar-fill" style={{width:`${t.pct}%`}}/></div>
                  }
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="ph-stats">
              <div className="ph-stat-row">
                <span className="ph-stat-label">Lifetime</span>
                <span className="ph-stat-val">{(balance?.lifetime_earned||0).toLocaleString()}</span>
              </div>
              {(pending_count||0) > 0 && (
                <div className="ph-stat-row">
                  <span className="ph-stat-label">Pending</span>
                  <span className="ph-stat-val" style={{color:'var(--gold)'}}>{pending_count}</span>
                </div>
              )}
            </div>
          </div>

          {/* ══ RIGHT ══ */}
          <div className="ph-right">

            {/* Actions */}
            <div>
              <div className="ph-section-label">Actions</div>
              <div className="ph-actions">
                <a href="/dashboard/phire/submit" className="ph-action-btn">
                  <span className="ph-action-icon">⚡</span><span className="ph-action-label">Log Activity</span>
                </a>
                <a href="/dashboard/phire/rewards" className="ph-action-btn">
                  <span className="ph-action-icon">🎁</span><span className="ph-action-label">Rewards</span>
                </a>
                <a href="/dashboard/phire/history" className="ph-action-btn">
                  <span className="ph-action-icon">📋</span><span className="ph-action-label">History</span>
                </a>
                <a href="/dashboard/phire/leaderboard" className="ph-action-btn">
                  <span className="ph-action-icon">🏆</span><span className="ph-action-label">Leaderboard</span>
                </a>
                {isLeader && (
                  <a href="/dashboard/phire/manage" className="ph-action-btn">
                    <span className="ph-action-icon">⚙</span><span className="ph-action-label">Manage</span>
                  </a>
                )}
                <a href="/dashboard/phire/guide" className="ph-action-btn">
                  <span className="ph-action-icon">?</span><span className="ph-action-label">Guide</span>
                </a>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <div className="ph-section-label">Recent Activity</div>
              <div className="ph-activity">
                {(!recent_transactions||recent_transactions.length===0) && (
                  <div className="ph-empty">No activity yet — log your first activity!</div>
                )}
                {(recent_transactions||[]).map((tx:any)=>{
                  const dt = dotType(tx);
                  return (
                    <div key={tx.id} className="ph-tx-row">
                      <span className={`ph-tx-dot ${dt}`}/>
                      <span className="ph-tx-desc">{tx.note||'Manual Adjustment'}</span>
                      <span className="ph-tx-time">{timeAgo(tx.created_at)}</span>
                      <span className={`ph-tx-pts ${dt}`}>{tx.points>0?'+':''}{tx.points}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
