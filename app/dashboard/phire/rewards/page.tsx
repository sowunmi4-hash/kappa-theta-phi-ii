'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import './rewards.css';
import DashSidebar from '../../DashSidebar';

export default function PhireRewards() {
  const [member, setMember]   = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [data, setData]       = useState<any>(null);
  const [redeeming, setRedeeming] = useState<string|null>(null);
  const [msg, setMsg]         = useState('');

  useEffect(() => {
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>{if(d.error){window.location.href='/login';return;}setMember(d.member);setProfile(d.profile||{});});
    load();
  }, []);

  async function load(){const d=await fetch('/api/dashboard/phire/rewards').then(r=>r.json());setData(d);}

  async function redeem(tier_id:string){
    setRedeeming(tier_id);setMsg('');
    const res=await fetch('/api/dashboard/phire/redeem',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tier_id})}).then(r=>r.json());
    setMsg(res.error?`err:${res.error}`:'ok:Redemption submitted — leadership will be in touch.');
    setRedeeming(null);load();
  }

  function daysLeft(d:string){const days=Math.ceil((new Date(d).getTime()-Date.now())/864e5);return days>0?`${days}d cooldown`:'';}

  if(!member||!data) return <div className="dash-loading">LOADING...</div>;
  const {tiers,balance}=data;
  const msgType=msg.startsWith('ok:')?'ok':'err';
  const msgText=msg.replace(/^(ok|err):/,'');

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />
      <main className="dash-main">
        <div className="dash-page-header">
          <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <a href="/dashboard/phire" style={{fontFamily:'var(--cinzel)',fontSize:'.65rem',letterSpacing:'2px',color:'var(--bone-faint)',textDecoration:'none'}}>← PHIRE</a>
            <div className="dash-page-title">Rewards</div>
          </div>
        </div>

        <div className="rw-wrap">
          {/* Balance bar */}
          <div className="rw-balance-bar">
            <span className="rw-balance-label">Available Balance</span>
            <span className="rw-balance-val">{balance.toLocaleString()} pts</span>
          </div>

          {msgText && <div className={`rw-msg ${msgType}`}>{msgText}</div>}

          {(tiers||[]).map((t:any)=>(
            <div key={t.id} className={`rw-card${t.unlocked?' unlocked':' locked'}`}>
              <div className="rw-card-tier">
                <div className="rw-tier-name">{t.name}</div>
              </div>
              <div className="rw-card-body">
                <div className="rw-card-title">{t.name} Reward</div>
                <div className="rw-card-desc">{t.description}</div>
                <div className="rw-card-req">{t.points_required.toLocaleString()} pts required</div>
                {!t.unlocked && <div className="rw-card-locked-msg">🔒 {(t.points_required-balance).toLocaleString()} more pts needed</div>}
              </div>
              <div className="rw-card-action">
                {t.unlocked&&!t.has_pending&&!t.onCooldown&&(
                  <button className="rw-redeem-btn" onClick={()=>redeem(t.id)} disabled={redeeming===t.id}>
                    {redeeming===t.id?'Requesting...':'Redeem →'}
                  </button>
                )}
                {t.has_pending&&<span className="rw-badge pending">Pending</span>}
                {t.onCooldown&&<span className="rw-badge cooldown">{daysLeft(t.cooldown_ends)}</span>}
                {!t.unlocked&&<span className="rw-badge locked">Locked</span>}
                {t.unlocked&&!t.has_pending&&!t.onCooldown&&<span className="rw-badge available" style={{marginLeft:'.6rem'}}>Available</span>}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
