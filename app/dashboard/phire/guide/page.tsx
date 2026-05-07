'use client';
export const dynamic = 'force-dynamic';
import React, { useState, useEffect } from 'react';
import '../../dash.css';
import '../phire-sub.css';
import DashSidebar from '../../DashSidebar';

const LEADERS = ['Head Founder','Co-Founder','Iron Fleet'];

const SECTIONS = [
  { id:'overview',    label:'Overview',           leader:false },
  { id:'earning',     label:'Earning Points',      leader:false },
  { id:'rewards',     label:'Rewards',             leader:false },
  { id:'history',     label:'Your History',        leader:false },
  { id:'faq',         label:'FAQ',                 leader:false },
  { id:'approvals',   label:'Approval Queue',      leader:true  },
  { id:'activities',  label:'Managing Activities', leader:true  },
  { id:'adjust',      label:'Point Adjustments',   leader:true  },
];

export default function PhireGuide() {
  const [member, setMember]   = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [active, setActive]   = useState('overview');

  useEffect(() => {
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>{
      if(d.error){window.location.href='/login';return;}
      setMember(d.member); setProfile(d.profile||{});
    });
  }, []);

  if (!member) return <div className="dash-loading">LOADING...</div>;
  const isLeader = LEADERS.includes(member.role);
  const sections = SECTIONS.filter(s => !s.leader || isLeader);

  const content: Record<string,React.ReactElement> = {
    overview: <>
      <p>PHIRE Points is the chapter's points and rewards system. Brothers earn points by logging approved activities — attending events, contributing to the chapter, and more.</p>
      <p>Points unlock tier rewards and determine your standing for <strong>Brother of the Year</strong>.</p>
      <ul><li>Earn points by logging activities for leadership approval</li><li>Redeem points for rewards as you unlock tiers</li><li>Track your history and see where you rank</li></ul>
    </>,
    earning: <>
      <p>Go to <strong>Log Activity</strong> and select an activity from the list. Your submission goes to leadership for approval.</p>
      <p>Once approved, points are added to your balance automatically. You'll see them in Recent Activity on your PHIRE dashboard.</p>
      <p><strong>Tip:</strong> Check the activity list regularly — new categories and activities are added by leadership.</p>
    </>,
    rewards: <>
      <p>Each tier unlocks a reward that can be redeemed from the <strong>Rewards</strong> page. You can only redeem a tier reward once per cooldown period.</p>
      <p>Tier thresholds: Bronze (0), Silver (500), Gold (1,000), Platinum (2,500), Diamond (5,000).</p>
    </>,
    history: <>
      <p>Your <strong>History</strong> page shows all your activity submissions and their approval status, plus every point transaction on your account.</p>
      <p>Pending submissions are reviewed by leadership within 48 hours. Denied submissions include a reason.</p>
    </>,
    faq: <>
      <p><strong>My submission is stuck on pending.</strong> Leadership reviews within 48h. If it's been longer, reach out to a founder.</p>
      <p><strong>My points don't look right.</strong> Check your transaction history. If something looks wrong, contact leadership for a manual adjustment.</p>
      <p><strong>Can I submit the same activity twice?</strong> Only after the first submission has been reviewed. You can't have two pending submissions for the same activity at once.</p>
    </>,
    approvals: <>
      <p>Pending submissions appear in the <strong>Approval Queue</strong> on the Manage page. Approve or deny each one — denied submissions should include a reason.</p>
      <p>Approved submissions immediately add points to the brother's balance.</p>
    </>,
    activities: <>
      <p>You can create, activate, and deactivate activities from the Manage → Activities tab. Deactivated activities are hidden from brothers but not deleted.</p>
      <p>Set appropriate point values — consider how much effort each activity requires relative to others.</p>
    </>,
    adjust: <>
      <p>Use <strong>Adjust Points</strong> to manually add or deduct points from any brother's balance. This creates a transaction record visible to both you and the brother.</p>
      <p>Always include a clear reason. Use negative values to deduct.</p>
    </>,
  };

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />
      <main className="dash-main">
        <div className="dash-page-header">
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            <a href="/dashboard/phire" className="ps-back">← PHIRE</a>
            <div className="dash-page-title">PHIRE Guide</div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', minHeight:'calc(100vh - 60px)', gap:'1px', background:'var(--border)' }}>
          {/* Nav */}
          <div style={{ background:'rgba(6,9,18,.95)', display:'flex', flexDirection:'column', padding:'.8rem .6rem', gap:'2px' }}>
            {sections.map(s => (
              <button
                key={s.id}
                onClick={()=>setActive(s.id)}
                style={{
                  fontFamily:'var(--cinzel)', fontSize:'.65rem', letterSpacing:'2px',
                  padding:'.6rem .8rem', border:'1px solid', borderRadius:'2px',
                  textAlign:'left', cursor:'pointer', textTransform:'uppercase',
                  background: active===s.id ? 'rgba(198,147,10,.1)' : 'none',
                  borderColor: active===s.id ? 'rgba(198,147,10,.35)' : 'transparent',
                  color: active===s.id ? 'var(--gold-b)' : 'var(--bone-faint)',
                  transition:'all .15s',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ background:'rgba(5,8,16,.92)', padding:'2rem 2.5rem' }}>
            <div style={{ fontFamily:'var(--display)', fontSize:'1.4rem', letterSpacing:'3px', color:'var(--bone)', marginBottom:'1.2rem', textTransform:'uppercase' }}>
              {sections.find(s=>s.id===active)?.label}
            </div>
            <div style={{ fontFamily:'var(--body)', fontSize:'.95rem', color:'var(--bone-dim)', lineHeight:'1.85', maxWidth:'620px' }}>
              {content[active]}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
