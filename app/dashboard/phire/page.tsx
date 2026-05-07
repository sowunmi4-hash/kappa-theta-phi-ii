'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../dash.css';
import DashSidebar from '../DashSidebar';
import './phire.css';

const LEADERS = ['Head Founder','Co-Founder','Iron Fleet'];
const TIER_ORDER = ['Bronze','Silver','Gold','Platinum','Diamond'];
const TIER_THRESHOLDS: Record<string,number> = { Bronze:0, Silver:500, Gold:1000, Platinum:2500, Diamond:5000 };

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60)   return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400)return `${Math.floor(s/3600)}h ago`;
  if (s < 604800)return `${Math.floor(s/86400)}d ago`;
  return `${Math.floor(s/604800)}w ago`;
}

// SVG progress ring
function BalanceRing({ balance, max }: { balance: number; max: number }) {
  const r = 70, cx = 90, cy = 90;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, balance / Math.max(max, 1));
  const dash = circ * pct;
  return (
    <svg width="180" height="180" className="phire-ring-svg">
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(198,147,10,.1)" strokeWidth="10" />
      {/* Progress */}
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="url(#ringGrad)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset="0"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c6930a" />
          <stop offset="100%" stopColor="#e8b84b" />
        </linearGradient>
      </defs>
      {/* Balance */}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#e8b84b"
        style={{ fontFamily:'var(--display)', fontSize:'22px', fontWeight:700, letterSpacing:'1px' }}>
        {balance.toLocaleString()}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(198,147,10,.55)"
        style={{ fontFamily:'var(--cinzel)', fontSize:'9px', letterSpacing:'3px' }}>
        POINTS
      </text>
    </svg>
  );
}

export default function PhireHome() {
  const [data, setData]   = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);

  function loadData() {
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d => {
      if (d.error) { window.location.href='/login'; return; }
      setData(d);
    });
    fetch('/api/dashboard/phire/rewards').then(r=>r.json()).then(d => setTiers(d.tiers||[]));
  }

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    const poll = setInterval(() => {
      if (document.activeElement instanceof HTMLInputElement) return;
      loadData();
    }, 30000);
    return () => clearInterval(poll);
  }, []);

  if (!data) return <div className="dash-loading">LOADING...</div>;
  const { member, balance, recent_transactions, pending_count, pending_redemptions } = data;

  // Determine current tier
  const pts = balance?.balance || 0;
  const currentTierName = TIER_ORDER.reduce((acc, t) => pts >= (TIER_THRESHOLDS[t] || 0) ? t : acc, 'Bronze');
  const currentTierIdx  = TIER_ORDER.indexOf(currentTierName);
  const nextTier        = TIER_ORDER[currentTierIdx + 1];
  const nextThreshold   = nextTier ? (TIER_THRESHOLDS[nextTier] || 0) : TIER_THRESHOLDS['Diamond'];
  const curThreshold    = TIER_THRESHOLDS[currentTierName] || 0;
  const ringMax         = nextThreshold - curThreshold;
  const ringBalance     = Math.min(pts - curThreshold, ringMax);

  // Build tier rows using API tiers or fallback
  const tierRows = TIER_ORDER.map(name => {
    const apiTier = tiers.find((t: any) => t.name === name);
    const req     = apiTier?.points_required ?? TIER_THRESHOLDS[name];
    const unlocked = pts >= req;
    const isCurrent = name === currentTierName;
    const pct = unlocked ? 100 : Math.min(100, Math.round((pts / req) * 100));
    return { name, req, unlocked, isCurrent, pct };
  });

  const isLeader = LEADERS.includes(member?.role);

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={data?.profile} />
      <main className="dash-main">

        {/* Header */}
        <div className="dash-page-header">
          <div className="dash-page-title">PHIRE Points</div>
          <a href="/dashboard/phire/submit" className="phire-log-btn">
            <span>⚡</span> Log Activity
          </a>
        </div>

        {/* Two-column body */}
        <div className="phire-layout">

          {/* LEFT: Ring + tiers */}
          <div className="phire-left">
            {/* Balance ring */}
            <div className="phire-ring-wrap">
              <BalanceRing balance={pts} max={nextThreshold} />
              <div className="phire-tier-name">{currentTierName} Tier</div>
            </div>

            {/* Tier progression */}
            <div className="phire-tier-list">
              {tierRows.map(t => (
                <div key={t.name} className={`phire-tier-row${t.unlocked?' unlocked':''}${t.isCurrent?' current':''}`}>
                  <span className="phire-tier-row-name">{t.name}</span>
                  {t.unlocked
                    ? <span className="phire-tier-check">✓</span>
                    : <div className="phire-tier-bar-wrap">
                        <div className="phire-tier-bar-fill" style={{ width: `${t.pct}%` }} />
                      </div>
                  }
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="phire-left-stats">
              <div className="phire-left-stat">
                <span className="phire-left-stat-label">Lifetime</span>
                <span className="phire-left-stat-val">{(balance?.lifetime_earned||0).toLocaleString()}</span>
              </div>
              {pending_count > 0 && (
                <div className="phire-left-stat">
                  <span className="phire-left-stat-label">Pending</span>
                  <span className="phire-left-stat-val" style={{ color:'var(--gold)' }}>{pending_count}</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Actions + Activity */}
          <div className="phire-right">

            {/* Actions */}
            <div className="phire-section-label">Actions</div>
            <div className="phire-actions-grid">
              <a href="/dashboard/phire/submit" className="phire-action-btn">
                <span className="phire-action-icon">⚡</span>Log Activity
              </a>
              <a href="/dashboard/phire/rewards" className="phire-action-btn">
                <span className="phire-action-icon">🎁</span>Rewards
              </a>
              <a href="/dashboard/phire/history" className="phire-action-btn">
                <span className="phire-action-icon">📋</span>History
              </a>
              <a href="/dashboard/phire/leaderboard" className="phire-action-btn">
                <span className="phire-action-icon">🏆</span>Leaderboard
              </a>
              {isLeader && (
                <a href="/dashboard/phire/manage" className="phire-action-btn">
                  <span className="phire-action-icon">⚙</span>Manage
                </a>
              )}
              <a href="/dashboard/phire/guide" className="phire-action-btn">
                <span className="phire-action-icon">?</span>Guide
              </a>
            </div>

            {/* Recent Activity */}
            <div className="phire-section-label" style={{ marginTop:'1.5rem' }}>Recent Activity</div>
            <div className="phire-activity-list">
              {(recent_transactions||[]).length === 0 && (
                <div className="phire-empty">No activity yet — log your first activity!</div>
              )}
              {(recent_transactions||[]).map((tx: any) => (
                <div key={tx.id} className="phire-tx-row">
                  <span className={`phire-tx-dot ${tx.points > 0 ? 'earn' : 'spend'}`} />
                  <span className="phire-tx-desc">{tx.note || 'Manual Adjustment'}</span>
                  <span className="phire-tx-time">{timeAgo(tx.created_at)}</span>
                  <span className={`phire-tx-pts ${tx.points > 0 ? 'earn' : 'spend'}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
