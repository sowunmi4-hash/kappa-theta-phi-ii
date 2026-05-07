'use client';
export const dynamic = 'force-dynamic';
import React, { useState, useEffect } from 'react';
import '../../dash.css';
import './guide.css';
import DashSidebar from '../../DashSidebar';

const LEADERS=['Head Founder','Co-Founder','Iron Fleet'];
const MEMBER_SECTIONS=[{id:'overview',label:'Overview'},{id:'earning',label:'Earning Points'},{id:'rewards',label:'Rewards'},{id:'history',label:'Your History'},{id:'faq',label:'FAQ'}];
const LEADER_SECTIONS=[{id:'approvals',label:'Approval Queue'},{id:'activities',label:'Managing Activities'},{id:'adjust',label:'Point Adjustments'}];

const CONTENT: Record<string, React.ReactElement> = {
  overview: <><p>PHIRE Points is the chapter's rewards system. Earn points by logging approved activities — events, contributions, service, and more.</p><p>Points unlock tier rewards and determine your standing for <strong>Brother of the Year</strong>.</p><ul><li>Log activities for leadership approval</li><li>Redeem points for tier rewards</li><li>Track your history and rank</li></ul></>,
  earning:  <><p>Go to <strong>Log Activity</strong> and select an activity. Your submission goes to leadership for approval. Once approved, points are added automatically.</p><div className="gd-callout">Tip: Check the activity list regularly — leadership adds new categories.</div></>,
  rewards:  <><p>Each tier unlocks a reward you can redeem from the <strong>Rewards</strong> page. One redemption per cooldown period.</p><p>Tiers: Bronze (0) → Silver (500) → Gold (1,000) → Platinum (2,500) → Diamond (5,000).</p></>,
  history:  <><p>Your <strong>History</strong> page shows all activity submissions and their approval status, plus every point transaction.</p><p>Pending submissions are reviewed within 48 hours. Denied submissions include a reason.</p></>,
  faq:      <><p><strong>My submission is stuck on pending.</strong> Leadership reviews within 48h. If longer, reach out to a Founder.</p><p><strong>Points don't look right.</strong> Check your transaction history. Contact leadership for a manual adjustment.</p><p><strong>Can I submit the same activity twice?</strong> Only after the first submission is reviewed.</p></>,
  approvals: <><p>Pending submissions appear in <strong>Manage → Approval Queue</strong>. Approve or deny each — denials should include a reason.</p><p>Approvals immediately credit the brother's balance.</p></>,
  activities: <><p>Create, activate, and deactivate activities from <strong>Manage → Activities</strong>. Deactivated activities are hidden from brothers but not deleted.</p><p>Set point values that reflect the effort required relative to other activities.</p></>,
  adjust: <><p>Use <strong>Manage → Adjust Points</strong> to manually add or deduct from any brother's balance. The transaction is visible to both parties.</p><div className="gd-callout">Always include a clear reason. Use negative values to deduct.</div></>,
};

export default function PhireGuide() {
  const [member, setMember]   = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [active, setActive]   = useState('overview');

  useEffect(()=>{
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>{
      if(d.error){window.location.href='/login';return;}
      setMember(d.member);setProfile(d.profile||{});
    });
  },[]);

  if(!member) return <div className="dash-loading">LOADING...</div>;
  const isLeader=LEADERS.includes(member.role);
  const sections=[...MEMBER_SECTIONS,...(isLeader?LEADER_SECTIONS:[])];

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />
      <main className="dash-main">
        <div className="dash-page-header">
          <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <a href="/dashboard/phire" style={{fontFamily:'var(--cinzel)',fontSize:'.65rem',letterSpacing:'2px',color:'var(--bone-faint)',textDecoration:'none'}}>← PHIRE</a>
            <div className="dash-page-title">PHIRE Guide</div>
          </div>
        </div>

        <div className="gd-layout">
          <div className="gd-nav">
            <div className="gd-nav-section">For Brothers</div>
            {MEMBER_SECTIONS.map(s=>(
              <button key={s.id} className={`gd-nav-btn${active===s.id?' active':''}`} onClick={()=>setActive(s.id)}>{s.label}</button>
            ))}
            {isLeader&&<>
              <div className="gd-nav-section">For Leadership</div>
              {LEADER_SECTIONS.map(s=>(
                <button key={s.id} className={`gd-nav-btn${active===s.id?' active':''}`} onClick={()=>setActive(s.id)}>{s.label}</button>
              ))}
            </>}
          </div>
          <div className="gd-content">
            <div className="gd-content-title">{sections.find(s=>s.id===active)?.label}</div>
            <div className="gd-body">{CONTENT[active]}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
