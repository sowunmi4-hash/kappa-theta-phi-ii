'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../dash.css';
import './activity.css';
import DashSidebar from '../DashSidebar';

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60)   return 'Just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  if (s < 604800) return `${Math.floor(s/86400)}d ago`;
  return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short' });
}

const STATUS_CONFIG = {
  online:     { label:'Online Now',    dot:'#4ade80', badge:'rgba(74,222,128,.12)',   border:'rgba(74,222,128,.3)',  text:'var(--green)' },
  today:      { label:'Active Today',  dot:'#86efac', badge:'rgba(74,222,128,.07)',   border:'rgba(74,222,128,.2)',  text:'#86efac' },
  this_week:  { label:'This Week',     dot:'#FFD740', badge:'rgba(244,195,0,.08)',    border:'rgba(244,195,0,.25)', text:'#FFD740' },
  this_month: { label:'This Month',    dot:'#60a5fa', badge:'rgba(96,165,250,.07)',   border:'rgba(96,165,250,.2)', text:'#60a5fa' },
  inactive:   { label:'30+ Days Ago',  dot:'#e05070', badge:'rgba(224,80,112,.07)',   border:'rgba(224,80,112,.2)', text:'#e05070' },
  never:      { label:'Never Logged In',dot:'rgba(255,255,255,.2)', badge:'rgba(255,255,255,.04)', border:'rgba(255,255,255,.1)', text:'rgba(245,240,232,.35)' },
};

type Filter = 'all' | 'online' | 'today' | 'this_week' | 'this_month' | 'inactive' | 'never';

export default function ActivityPage() {
  const [member, setMember] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetch('/api/dashboard/profile').then(r => r.json()).then(d => {
      if (d.error) { window.location.href = '/login'; return; }
      if (d.member?.frat_name !== 'Big Brother Wildwon') { window.location.href = '/dashboard'; return; }
      setMember(d.member); setProfile(d.profile);
      load();
    });
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const t = setInterval(() => { load(); setLastRefresh(new Date()); }, 60000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    const d = await fetch('/api/dashboard/activity').then(r => r.json());
    setData(d); setLoading(false);
  }

  if (!member || loading) return <div className="dash-loading">LOADING...</div>;

  const { members = [], summary = {} } = data;
  const filtered = filter === 'all' ? members : members.filter((m: any) => m.status === filter);

  // Sort: online first, then by last_seen desc, never last
  const sorted = [...filtered].sort((a: any, b: any) => {
    const order = ['online','today','this_week','this_month','inactive','never'];
    const ai = order.indexOf(a.status), bi = order.indexOf(b.status);
    if (ai !== bi) return ai - bi;
    if (a.last_seen && b.last_seen) return new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime();
    return 0;
  });

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile}/>
      <main className="dash-main">

        <div className="dash-page-header">
          <div>
            <div style={{fontFamily:'var(--cinzel)',fontSize:'.52rem',letterSpacing:'4px',color:'rgba(244,195,0,.45)',textTransform:'uppercase',marginBottom:'.25rem'}}>
              Big Brother Wildwon · Confidential
            </div>
            <div className="dash-page-title">Member Activity</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <span style={{fontFamily:'var(--cinzel)',fontSize:'.5rem',letterSpacing:'2px',color:'rgba(196,30,58,.45)'}}>Admin logins excluded</span>
          <span style={{fontFamily:'var(--cinzel)',fontSize:'.52rem',letterSpacing:'2px',color:'var(--bone-faint)'}}>
              Refreshed {timeAgo(lastRefresh.toISOString())}
            </span>
            <button className="dash-btn gold-ghost" onClick={() => { load(); setLastRefresh(new Date()); }}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="act-stats">
          {[
            { key:'online',     label:'Online Now',  val:summary.online||0 },
            { key:'today',      label:'Today',       val:summary.today||0 },
            { key:'this_week',  label:'This Week',   val:summary.this_week||0 },
            { key:'this_month', label:'This Month',  val:summary.this_month||0 },
            { key:'inactive',   label:'Inactive 30d',val:summary.inactive||0 },
            { key:'never',      label:'Never',       val:summary.never||0 },
          ].map(s => {
            const cfg = STATUS_CONFIG[s.key as keyof typeof STATUS_CONFIG];
            return (
              <div key={s.key} className={`act-stat-cell${filter===s.key?' active':''}`}
                onClick={() => setFilter(filter === s.key ? 'all' : s.key as Filter)}>
                <div className="act-stat-dot" style={{background:cfg.dot, boxShadow:`0 0 6px ${cfg.dot}60`}}/>
                <div>
                  <div className="act-stat-val" style={{color:cfg.text}}>{s.val}</div>
                  <div className="act-stat-lbl">{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter bar */}
        <div className="act-filter-bar">
          <button className={`act-filter-btn${filter==='all'?' active':''}`} onClick={()=>setFilter('all')}>
            All Brothers ({members.length})
          </button>
          {(['online','today','this_week','this_month','inactive','never'] as Filter[]).map(f => {
            const cfg = STATUS_CONFIG[f as keyof typeof STATUS_CONFIG];
            const count = members.filter((m:any) => m.status === f).length;
            return (
              <button key={f} className={`act-filter-btn${filter===f?' active':''}`}
                style={filter===f ? {borderColor:cfg.border, color:cfg.text, background:cfg.badge} : {}}
                onClick={() => setFilter(f)}>
                <span className="act-filter-dot" style={{background:cfg.dot}}/>
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Member rows */}
        <div className="act-rows">
          {sorted.map((m: any) => {
            const cfg = STATUS_CONFIG[m.status as keyof typeof STATUS_CONFIG];
            const initials = m.frat_name?.split(' ').filter((w:string)=>!['Big','Brother'].includes(w)).map((w:string)=>w[0]).slice(0,2).join('') || '?';
            return (
              <div key={m.id} className="act-row">
                {/* Avatar */}
                <div className="act-avatar" style={{background:cfg.badge, border:`1px solid ${cfg.border}`}}>
                  <span style={{fontFamily:'var(--cinzel)',fontSize:'.62rem',letterSpacing:'1px',color:cfg.text}}>
                    {initials}
                  </span>
                  <div className="act-status-dot" style={{background:cfg.dot, boxShadow:`0 0 5px ${cfg.dot}`}}/>
                </div>

                {/* Name + faction */}
                <div className="act-info">
                  <div className="act-name">{m.frat_name}</div>
                  <div className="act-meta">
                    {m.role && <span>{m.role}</span>}
                    {m.faction && <span>· {m.faction.replace(' Fraction','').replace(' Faction','')}</span>}
                  </div>
                </div>

                {/* Status badge */}
                <div className="act-status-badge"
                  style={{background:cfg.badge, border:`1px solid ${cfg.border}`, color:cfg.text}}>
                  {cfg.label}
                </div>

                {/* Last seen */}
                <div className="act-last-seen">
                  {m.last_seen ? (
                    <>
                      <div className="act-last-seen-time">{timeAgo(m.last_seen)}</div>
                      <div className="act-last-seen-date">
                        {new Date(m.last_seen).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                      </div>
                    </>
                  ) : (
                    <div className="act-never">Never signed in</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}
