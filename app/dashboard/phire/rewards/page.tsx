'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import '../phire.css';

const TIER_COLOURS: Record<string,string> = { Bronze:'bronze', Silver:'silver', Gold:'gold', Platinum:'platinum', Diamond:'diamond' };

export default function PhireRewards() {
  const [member, setMember] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [redeeming, setRedeeming] = useState<string|null>(null);
  const [msg, setMsg] = useState('');

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
    load();
  }, []);

  async function load() { fetch('/api/dashboard/phire/rewards').then(r=>r.json()).then(setData); }

  async function redeem(tier_id: string) {
    setRedeeming(tier_id); setMsg('');
    const res = await fetch('/api/dashboard/phire/redeem', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ tier_id }) }).then(r=>r.json());
    setMsg(res.error || '✅ Redemption request submitted! Leadership will be notified.');
    setRedeeming(null);
    load();
  }

  function daysLeft(d: string) {
    const ms = new Date(d).getTime() - Date.now();
    const days = Math.ceil(ms / 864e5);
    return days > 0 ? `${days}d cooldown` : '';
  }

  if (!member || !data) return <div className="dash-loading">LOADING...</div>;
  const { tiers, balance } = data;

  return (
    <div className="dash-app phire-root">
      <Sidebar />
      <main className="dash-main">
        <div className="phire-rewards-wrap">
          <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'0.5rem'}}>
            <a href="/dashboard/phire" style={{color:'var(--muted)',textDecoration:'none',fontSize:'0.75rem',letterSpacing:'2px'}}>← PHIRE</a>
            <div className="phire-submit-title" style={{margin:0}}>Rewards</div>
          </div>
          <div style={{fontSize:'0.78rem',color:'var(--muted)',marginBottom:'1.5rem'}}>Current balance: <strong style={{color:'var(--gold)'}}>{balance.toLocaleString()} pts</strong></div>
          {msg && <div style={{padding:'0.8rem 1.2rem',background:msg.startsWith('✅')?'rgba(74,222,128,0.1)':'rgba(178,34,52,0.1)',border:`1px solid ${msg.startsWith('✅')?'rgba(74,222,128,0.2)':'rgba(178,34,52,0.2)'}`,borderRadius:'6px',fontSize:'0.82rem',color:msg.startsWith('✅')?'#4ade80':'#e05070',marginBottom:'1.5rem'}}>{msg}</div>}

          <div className="rewards-grid">
            {tiers.map((t:any) => (
              <div key={t.id} className={`reward-card ${t.unlocked?'unlocked':''}`}>
                <div className={`reward-card-tier ${TIER_COLOURS[t.name]||'gold'}`}>{t.name}</div>
                <div className="reward-card-name">{t.name} Reward</div>
                <div className="reward-card-desc">{t.description}</div>
                <div className="reward-card-cost">{t.points_required.toLocaleString()} pts required</div>
                {t.unlocked && !t.onCooldown && !t.has_pending && (
                  <button className="btn btn-gold" onClick={()=>redeem(t.id)} disabled={redeeming===t.id} style={{marginTop:'auto'}}>
                    {redeeming===t.id ? 'Requesting...' : 'Redeem →'}
                  </button>
                )}
                {t.has_pending && <div className="reward-pending-tag">⏳ Request Pending</div>}
                {t.onCooldown && t.cooldown_ends && <div className="reward-cooldown">🔄 {daysLeft(t.cooldown_ends)}</div>}
                {!t.unlocked && (
                  <div className="reward-card-locked">
                    <div className="reward-lock-text">🔒 {(t.points_required - balance).toLocaleString()} pts needed</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
