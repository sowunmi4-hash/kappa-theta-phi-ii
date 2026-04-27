'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../dash.css';
import './phire.css';

const TIER_COLOURS: Record<string,string> = { Bronze:'bronze', Silver:'silver', Gold:'gold', Platinum:'platinum', Diamond:'diamond' };

export default function PhireHome() {
  const [data, setData] = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d => {
      if (d.error) { window.location.href='/login'; return; }
      setData(d);
    });
    fetch('/api/dashboard/phire/rewards').then(r=>r.json()).then(d => setTiers(d.tiers||[]));
  }, []);

  if (!data) return <div className="dash-loading">LOADING...</div>;
  const { member, balance, recent_transactions, pending_count, pending_redemptions } = data;
  const LEADERS = ['Head Founder','Co-Founder','Iron Fleet'];

  const slug = member?.frat_name?.toLowerCase().replace(/\s+/g,'-').replace('big-brother-','') || '';
  const portrait = `/brothers/${slug}.png`;
  const NAV = [
    { href: '/dashboard', label: 'Home' },
    { href: '/dashboard/news', label: 'Wokou News' },
    { href: '/dashboard/events', label: 'Events' },
    { href: '/dashboard/phire', label: 'PHIRE' },
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
  function timeAgo(d: string) {
    const s = Math.floor((Date.now() - new Date(d).getTime())/1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  }

  return (
    <div className="dash-app phire-root">
      <Sidebar />
      <main className="dash-main">
        {/* Hero */}
        <div className="phire-hero">
          <div className="phire-hero-left">
            <div className="phire-hero-label">PHIRE Balance</div>
            <div className="phire-hero-balance">{balance.balance.toLocaleString()}</div>
            <div className="phire-hero-sub">POINTS</div>
          </div>
          <div className="phire-hero-stats">
            <div className="phire-stat"><div className="phire-stat-value">{balance.lifetime_earned.toLocaleString()}</div><div className="phire-stat-label">Lifetime Earned</div></div>
            {pending_count > 0 && <div className="phire-stat"><div className="phire-stat-value" style={{color:'#c6930a'}}>{pending_count}</div><div className="phire-stat-label">Pending</div></div>}
            {pending_redemptions > 0 && <div className="phire-stat"><div className="phire-stat-value" style={{color:'#e05070'}}>{pending_redemptions}</div><div className="phire-stat-label">Redemptions</div></div>}
          </div>
        </div>

        {/* Tier bar */}
        <div className="phire-tier-bar">
          {tiers.map(t => (
            <div key={t.id} className={`phire-tier ${t.unlocked?'unlocked':''}`}>
              <div className="phire-tier-name">{t.name}</div>
              <div className="phire-tier-pts">{t.points_required.toLocaleString()} pts</div>
              <div className="phire-tier-badge">{t.unlocked ? (t.has_pending ? '⏳' : t.onCooldown ? '🔄' : '✅') : '🔒'}</div>
            </div>
          ))}
        </div>

        <div className="phire-content">
          <div className="phire-grid">
            <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              {/* Quick actions */}
              <div className="phire-card">
                <div className="phire-card-header"><div className="phire-card-title">Quick Actions</div></div>
                <div className="phire-card-body">
                  <div className="phire-actions">
                    <a href="/dashboard/phire/submit" className="phire-action-btn primary">
                      <span className="phire-action-icon">⚡</span>Log Activity
                    </a>
                    <a href="/dashboard/phire/rewards" className="phire-action-btn">
                      <span className="phire-action-icon">🎁</span>Rewards
                    </a>
                    <a href="/dashboard/phire/history" className="phire-action-btn">
                      <span className="phire-action-icon">📋</span>My History
                    </a>
                    {LEADERS.includes(member.role) && (
                      <a href="/dashboard/phire/manage" className="phire-action-btn">
                        <span className="phire-action-icon">👑</span>Manage
                      </a>
                    )}
                    {LEADERS.includes(member.role) && (
                      <a href="/dashboard/phire/leaderboard" className="phire-action-btn">
                        <span className="phire-action-icon">🏆</span>Leaderboard
                      </a>
                    )}
                    <a href="/dashboard/phire/guide" className="phire-action-btn" style={{gridColumn:'span 2'}}>
                      <span className="phire-action-icon">📖</span>How to Use PHIRE
                    </a>
                  </div>
                </div>
              </div>

              {/* Recent activity */}
              <div className="phire-card">
                <div className="phire-card-header">
                  <div className="phire-card-title">Recent Activity</div>
                  <a href="/dashboard/phire/history" style={{fontSize:'0.65rem',color:'var(--gold)',textDecoration:'none',letterSpacing:'1px'}}>View All →</a>
                </div>
                <div className="phire-card-body">
                  {recent_transactions.length === 0 && <div className="phire-empty">No activity yet. Log your first activity!</div>}
                  <div className="phire-tx-list">
                    {recent_transactions.map((tx:any) => (
                      <div key={tx.id} className="phire-tx">
                        <div className={`phire-tx-dot ${tx.points>0?'positive':tx.type==='manual'?'manual':'negative'}`} />
                        <div style={{flex:1}}>
                          <div className="phire-tx-name">{tx.note || 'Manual Adjustment'}</div>
                          <div className="phire-tx-time">{timeAgo(tx.created_at)}</div>
                        </div>
                        <div className={`phire-tx-pts ${tx.points>0?'positive':'negative'}`}>{tx.points>0?'+':''}{tx.points}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar: tier progress */}
            <div className="phire-card">
              <div className="phire-card-header"><div className="phire-card-title">Tier Progress</div></div>
              <div className="phire-card-body" style={{display:'flex',flexDirection:'column',gap:'0.8rem'}}>
                {tiers.map(t => {
                  const pct = Math.min(100, Math.round((balance.balance / t.points_required) * 100));
                  return (
                    <div key={t.id}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                        <span style={{fontSize:'0.72rem',color:t.unlocked?'var(--gold)':'var(--muted)',letterSpacing:'2px',textTransform:'uppercase'}}>{t.name}</span>
                        <span style={{fontSize:'0.68rem',color:'var(--muted)'}}>{t.points_required.toLocaleString()} pts</span>
                      </div>
                      <div style={{height:'4px',background:'var(--raised)',borderRadius:'2px',overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${pct}%`,background:t.unlocked?'var(--gold)':'var(--crimson)',borderRadius:'2px',transition:'width 0.6s'}} />
                      </div>
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
