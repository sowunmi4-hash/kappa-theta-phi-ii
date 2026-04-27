'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import '../phire.css';

export default function PhireLeaderboard() {
  const [member, setMember] = useState<any>(null);
  const [data, setData] = useState<any>(null);

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
  useEffect(() => {
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>{ if(d.error){window.location.href='/login';return;} setMember(d.member); });
    fetch('/api/dashboard/phire/leaderboard').then(r=>r.json()).then(setData);
  }, []);

  if (!member) return <div className="dash-loading">LOADING...</div>;
  if (data?.error) return (
    <div className="dash-app phire-root"><Sidebar />
      <main className="dash-main"><div style={{padding:'3rem',color:'var(--muted)'}}>Access restricted to leadership.</div></main>
    </div>
  );

  const medals = ['🥇','🥈','🥉'];

  return (
    <div className="dash-app phire-root">
      <Sidebar />
      <main className="dash-main">
        <div className="phire-lb-wrap">
          <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'0.5rem'}}>
            <a href="/dashboard/phire" style={{color:'var(--muted)',textDecoration:'none',fontSize:'0.75rem',letterSpacing:'2px'}}>← PHIRE</a>
            <div className="phire-submit-title" style={{margin:0}}>Leaderboard</div>
          </div>
          <div style={{fontSize:'0.72rem',color:'var(--muted)',marginBottom:'1.5rem',letterSpacing:'1px'}}>Ranked by lifetime points earned — used for Big Brother of the Year</div>

          {(!data?.leaderboard || data.leaderboard.length === 0) && <div className="phire-empty">No data yet. Brothers need to earn points first.</div>}

          {(data?.leaderboard||[]).map((b:any, i:number) => (
            <div key={b.member_id} className="lb-row" style={{animationDelay:`${i*0.04}s`}}>
              <div className="lb-rank">{medals[i] || b.rank}</div>
              <div style={{flex:1}}>
                <div className="lb-name">{b.frat_name}</div>
                <div className="lb-role">{b.role}{b.fraction ? ` · ${b.fraction}` : ''}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div className="lb-pts">{b.lifetime_earned.toLocaleString()}</div>
                <div className="lb-lifetime">lifetime pts</div>
                <div style={{fontSize:'0.65rem',color:'var(--gold)',marginTop:'1px'}}>{b.balance.toLocaleString()} current</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
