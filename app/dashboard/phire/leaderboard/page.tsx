'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import './leaderboard.css';
import DashSidebar from '../../DashSidebar';

const TIER_T: Record<string,number> = {Bronze:0,Silver:500,Gold:1000,Platinum:2500,Diamond:5000};
function getTier(pts:number){for(const t of ['Diamond','Platinum','Gold','Silver','Bronze'])if(pts>=TIER_T[t])return t;return 'Bronze';}
const MEDALS=['🥇','🥈','🥉'];

export default function PhireLeaderboard() {
  const [member, setMember]   = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [data, setData]       = useState<any>(null);

  useEffect(()=>{
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>{if(d.error){window.location.href='/login';return;}setMember(d.member);setProfile(d.profile||{});});
    fetch('/api/dashboard/phire/leaderboard').then(r=>r.json()).then(setData);
  },[]);

  if(!member) return <div className="dash-loading">LOADING...</div>;
  const board=data?.leaderboard||[];
  const myRank=board.findIndex((b:any)=>b.member_id===member.id)+1;

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />
      <main className="dash-main">
        <div className="dash-page-header">
          <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <a href="/dashboard/phire" style={{fontFamily:'var(--cinzel)',fontSize:'.65rem',letterSpacing:'2px',color:'var(--bone-faint)',textDecoration:'none'}}>← PHIRE</a>
            <div className="dash-page-title">Leaderboard</div>
          </div>
        </div>

        <div className="lb-subbar">
          <span>Ranked by lifetime points — Brother of the Year</span>
          {myRank>0&&<span className="lb-my-rank">Your Rank #{myRank}</span>}
        </div>

        {data?.error&&<div style={{padding:'2rem',fontFamily:'var(--cinzel)',fontSize:'.7rem',color:'#e05070'}}>Access restricted.</div>}
        {!data?.error&&board.length===0&&<div className="lb-empty">No data yet — brothers need to earn points first.</div>}

        <div className="lb-list">
          {board.map((b:any,i:number)=>{
            const isMe=b.member_id===member.id;
            return (
              <div key={b.member_id} className={`lb-row${isMe?' me':''}`}>
                <div className="lb-rank-cell">
                  {i<3?<div className="lb-rank-medal">{MEDALS[i]}</div>:<div className="lb-rank-num">#{i+1}</div>}
                </div>
                <div>
                  <div className="lb-name">
                    {b.frat_name}
                    {isMe&&<span className="lb-you-tag">YOU</span>}
                    <span className="lb-tier-tag">{getTier(b.lifetime_earned)}</span>
                  </div>
                  <div className="lb-role">{b.role}{b.faction?` · ${b.faction}`:''}</div>
                </div>
                <div className="lb-pts-cell">
                  <div className="lb-lifetime">{b.lifetime_earned.toLocaleString()}</div>
                  <div className="lb-lifetime-label">lifetime pts</div>
                  <div className="lb-current">{b.balance.toLocaleString()} current</div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
