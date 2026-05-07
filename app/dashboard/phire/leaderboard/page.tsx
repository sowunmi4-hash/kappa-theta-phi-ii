'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import '../phire-sub.css';
import DashSidebar from '../../DashSidebar';

const TIER_THRESHOLDS: Record<string,number> = { Bronze:0, Silver:500, Gold:1000, Platinum:2500, Diamond:5000 };
function getTier(pts: number) {
  const tiers = ['Diamond','Platinum','Gold','Silver','Bronze'];
  for (const t of tiers) if (pts >= TIER_THRESHOLDS[t]) return t;
  return 'Bronze';
}

export default function PhireLeaderboard() {
  const [member, setMember]   = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [data, setData]       = useState<any>(null);

  useEffect(() => {
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>{ if(d.error){window.location.href='/login';return;} setMember(d.member); setProfile(d.profile||{}); });
    fetch('/api/dashboard/phire/leaderboard').then(r=>r.json()).then(setData);
  }, []);

  if (!member) return <div className="dash-loading">LOADING...</div>;

  const MEDALS = ['🥇','🥈','🥉'];
  const board = data?.leaderboard || [];
  const myRank = board.findIndex((b:any) => b.member_id === member.id) + 1;

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />
      <main className="dash-main">
        <div className="dash-page-header">
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            <a href="/dashboard/phire" className="ps-back">← PHIRE</a>
            <div className="dash-page-title">Leaderboard</div>
          </div>
          {myRank > 0 && (
            <span style={{ fontFamily:'var(--cinzel)', fontSize:'.68rem', letterSpacing:'2px', color:'var(--gold-b)' }}>Your Rank #{myRank}</span>
          )}
        </div>

        <div style={{ padding:'.5rem 2rem .65rem', fontFamily:'var(--cinzel)', fontSize:'.62rem', letterSpacing:'2px', color:'var(--bone-faint)', borderBottom:'1px solid var(--border)' }}>
          Ranked by lifetime points — used for Brother of the Year
        </div>

        {data?.error && (
          <div className="ps-wrap"><div className="ps-msg err">Access restricted to leadership.</div></div>
        )}

        {board.length === 0 && !data?.error && (
          <div className="ps-wrap"><div className="ps-empty">No data yet — brothers need to earn points first.</div></div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'1px', background:'var(--border)' }}>
          {board.map((b:any, i:number) => {
            const isMe = b.member_id === member.id;
            const tier = getTier(b.lifetime_earned);
            return (
              <div key={b.member_id} style={{
                display:'flex', alignItems:'center', gap:'1rem',
                padding:'1rem 1.5rem',
                background: isMe ? 'rgba(198,147,10,.09)' : 'rgba(7,11,20,.75)',
                borderLeft: isMe ? '2px solid var(--gold)' : '2px solid transparent',
                transition: 'background .15s',
              }}>
                {/* Rank */}
                <div style={{ width:'36px', textAlign:'center', fontFamily:'var(--display)', fontSize: i < 3 ? '1.5rem' : '1rem', color: i < 3 ? 'var(--gold-b)' : 'var(--bone-faint)', flexShrink:0 }}>
                  {MEDALS[i] || `#${i+1}`}
                </div>

                {/* Name + role */}
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--display)', fontSize:'1.05rem', letterSpacing:'1px', color: isMe ? 'var(--gold-b)' : 'var(--bone)', textTransform:'uppercase' }}>
                    {b.frat_name}{isMe && <span style={{ fontFamily:'var(--cinzel)', fontSize:'.55rem', letterSpacing:'2px', color:'var(--gold)', marginLeft:'.6rem' }}>YOU</span>}
                  </div>
                  <div style={{ fontFamily:'var(--cinzel)', fontSize:'.6rem', letterSpacing:'2px', color:'var(--bone-faint)', marginTop:'2px' }}>
                    {b.role}{b.fraction ? ` · ${b.fraction}` : ''} · {tier} Tier
                  </div>
                </div>

                {/* Points */}
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'var(--display)', fontSize:'1.35rem', letterSpacing:'1px', color:'var(--gold-b)' }}>{b.lifetime_earned.toLocaleString()}</div>
                  <div style={{ fontFamily:'var(--cinzel)', fontSize:'.55rem', letterSpacing:'2px', color:'var(--bone-faint)' }}>lifetime pts</div>
                  <div style={{ fontFamily:'var(--cinzel)', fontSize:'.58rem', letterSpacing:'1px', color:'var(--green)', marginTop:'2px' }}>{b.balance.toLocaleString()} current</div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
