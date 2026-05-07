'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import '../phire-sub.css';
import DashSidebar from '../../DashSidebar';

export default function PhireRewards() {
  const [member, setMember]   = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [data, setData]       = useState<any>(null);
  const [redeeming, setRedeeming] = useState<string|null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>{ if(d.error){window.location.href='/login';return;} setMember(d.member); setProfile(d.profile||{}); });
    load();
  }, []);

  async function load() { const d = await fetch('/api/dashboard/phire/rewards').then(r=>r.json()); setData(d); }

  async function redeem(tier_id: string) {
    setRedeeming(tier_id); setMsg('');
    const res = await fetch('/api/dashboard/phire/redeem', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ tier_id }) }).then(r=>r.json());
    setMsg(res.error ? `err:${res.error}` : 'ok:Redemption submitted — leadership will be in touch.');
    setRedeeming(null); load();
  }

  function daysLeft(d: string) {
    const days = Math.ceil((new Date(d).getTime() - Date.now()) / 864e5);
    return days > 0 ? `${days}d cooldown` : '';
  }

  if (!member || !data) return <div className="dash-loading">LOADING...</div>;
  const { tiers, balance } = data;
  const msgType = msg.startsWith('ok:') ? 'ok' : msg.startsWith('err:') ? 'err' : '';
  const msgText = msg.replace(/^(ok|err):/, '');

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />
      <main className="dash-main">
        <div className="dash-page-header">
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            <a href="/dashboard/phire" className="ps-back">← PHIRE</a>
            <div className="dash-page-title">Rewards</div>
          </div>
          <span style={{ fontFamily:'var(--cinzel)', fontSize:'.68rem', letterSpacing:'2px', color:'var(--gold-b)' }}>{balance.toLocaleString()} pts available</span>
        </div>

        <div className="ps-wrap">
          {msgText && <div className={`ps-msg ${msgType}`}>{msgText}</div>}

          {(tiers||[]).map((t:any) => (
            <div key={t.id} className="ps-card" style={{ borderColor: t.unlocked ? 'rgba(198,147,10,.3)' : 'var(--border)' }}>
              <div className="ps-card-hdr">
                <div style={{ display:'flex', alignItems:'center', gap:'.8rem' }}>
                  <span style={{ fontFamily:'var(--cinzel)', fontSize:'.72rem', letterSpacing:'3px', color: t.unlocked ? 'var(--gold-b)' : 'var(--bone-faint)', textTransform:'uppercase' }}>{t.name} Tier</span>
                  {t.unlocked && !t.has_pending && !t.onCooldown && <span className="ps-badge approved">Available</span>}
                  {t.has_pending && <span className="ps-badge pending">Pending</span>}
                  {t.onCooldown && <span className="ps-badge" style={{ borderColor:'var(--border)', color:'var(--bone-faint)' }}>{daysLeft(t.cooldown_ends)}</span>}
                  {!t.unlocked && <span className="ps-badge denied">Locked</span>}
                </div>
                <span style={{ fontFamily:'var(--cinzel)', fontSize:'.65rem', letterSpacing:'2px', color:'rgba(198,147,10,.45)' }}>{t.points_required.toLocaleString()} pts</span>
              </div>
              <div className="ps-card-body">
                <p style={{ fontFamily:'var(--body)', fontSize:'.92rem', color:'var(--bone-dim)', lineHeight:'1.7', margin:0 }}>{t.description}</p>
                {t.unlocked && !t.has_pending && !t.onCooldown && (
                  <button className="ps-btn gold" onClick={()=>redeem(t.id)} disabled={redeeming===t.id} style={{ alignSelf:'flex-start', marginTop:'.3rem' }}>
                    {redeeming===t.id ? 'Requesting...' : 'Redeem →'}
                  </button>
                )}
                {!t.unlocked && (
                  <div style={{ fontFamily:'var(--cinzel)', fontSize:'.62rem', letterSpacing:'2px', color:'var(--bone-faint)' }}>
                    🔒 {(t.points_required - balance).toLocaleString()} more pts needed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
