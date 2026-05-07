'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import './report.css';
import DashSidebar from '../../DashSidebar';

const LESSONS = [
  { key:'lesson_1',        title:'What Brotherhood Really Means' },
  { key:'lesson_2',        title:'Respect: The Foundation of Character' },
  { key:'lesson_3',        title:'Accountability: Owning Your Actions' },
  { key:'lesson_4',        title:'Public Behavior = Public Representation' },
  { key:'lesson_5',        title:'Conflict Resolution Without Escalation' },
  { key:'lesson_6',        title:'Your Role in the Chapter Going Forward' },
  { key:'reflections_done',title:'Final Reflection' },
];

const OFFENSE_STYLE: Record<string,{border:string;bg:string;color:string}> = {
  grey:       { border:'rgba(160,160,180,.3)',  bg:'rgba(160,160,180,.07)', color:'rgba(160,160,180,.8)' },
  navy_blue:  { border:'rgba(107,131,184,.3)',  bg:'rgba(107,131,184,.07)', color:'#6b83b8' },
  gold:       { border:'rgba(198,147,10,.3)',   bg:'rgba(198,147,10,.07)',  color:'var(--gold-b)' },
  crimson_red:{ border:'rgba(224,80,112,.3)',   bg:'rgba(224,80,112,.07)',  color:'#e05070' },
};

function progressPct(ssp:any){ return Math.round((LESSONS.filter(l=>ssp[l.key]).length/7)*100); }
function fmt(d:string){ return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }
function fmtTime(d:string){ return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); }

type FilterType = 'all'|'in_progress'|'completed'|'opted_out';

export default function SSPReportPage() {
  const [member, setMember]   = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [report, setReport]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string|null>(null);
  const [filter, setFilter]   = useState<FilterType>('all');

  useEffect(()=>{
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>{
      if(d.error){window.location.href='/login';return;}
      const m=d.member;
      const ok=m?.fraction==='Ishi No Faction'||m?.role==='Head Founder'||m?.role==='Co-Founder';
      if(!ok){window.location.href='/dashboard';return;}
      setMember(m); setProfile(d.profile||{});
      fetch('/api/dashboard/ssp/report').then(r=>r.json()).then(rd=>{setReport(rd);setLoading(false);});
    });
  },[]);

  if(!member||loading) return <div className="dash-loading">LOADING...</div>;

  const { ssps=[], summary={} } = report||{};
  const filtered = ssps.filter((s:any)=>{
    if(filter==='completed')  return s.cleared;
    if(filter==='opted_out')  return s.status==='opted_out';
    if(filter==='in_progress')return !s.cleared&&s.status!=='opted_out';
    return true;
  });

  const STATS = [
    { val:summary.total||0,                    lbl:'Total',    color:'var(--bone)' },
    { val:summary.in_progress||0,              lbl:'Active',   color:'#60a5fa' },
    { val:summary.completed||0,                lbl:'Cleared',  color:'var(--green)' },
    { val:summary.opted_out||0,                lbl:'Opted Out',color:'#e05070' },
    { val:summary.total_sessions_conducted||0, lbl:'Sessions', color:'var(--gold-b)' },
    { val:summary.failed_sessions||0,          lbl:'Failed',   color:'#e05070' },
  ];

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile}/>
      <main className="dash-main">

        {/* Header */}
        <div className="dash-page-header">
          <div>
            <div style={{fontFamily:'var(--cinzel)',fontSize:'.52rem',letterSpacing:'4px',color:'rgba(198,147,10,.45)',textTransform:'uppercase',marginBottom:'.25rem'}}>
              Ishi No Faction · Confidential
            </div>
            <div className="dash-page-title">Sage Solution Report</div>
          </div>
          <span style={{fontFamily:'var(--cinzel)',fontSize:'.52rem',letterSpacing:'2px',color:'var(--bone-faint)'}}>
            Full session history · All facilitators
          </span>
        </div>

        {/* Stats */}
        <div className="sr-stats">
          {STATS.map(s=>(
            <div key={s.lbl} className="sr-stat-cell">
              <div className="sr-stat-val" style={{color:s.color}}>{s.val}</div>
              <div className="sr-stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="sr-filter-bar">
          {(['all','in_progress','completed','opted_out'] as FilterType[]).map(f=>(
            <button key={f} className={`sr-filter-btn${filter===f?' active':''}`} onClick={()=>setFilter(f)}>
              {f.replace('_',' ')} {f==='all'?`(${ssps.length})`:f==='completed'?`(${summary.completed||0})`:f==='in_progress'?`(${summary.in_progress||0})`:`(${summary.opted_out||0})`}
            </button>
          ))}
        </div>

        {/* Column headers */}
        <div className="sr-col-hdr">
          <span/>
          <span className="sr-col-label">Brother</span>
          <span className="sr-col-label">Offense</span>
          <span className="sr-col-label">Progress</span>
          <span className="sr-col-label">Status</span>
          <span className="sr-col-label">Started</span>
          <span className="sr-col-label">Sessions</span>
          <span/>
        </div>

        {/* Records */}
        <div className="sr-rows">
          {filtered.length===0 && <div className="sr-empty">No records found.</div>}
          {filtered.map((ssp:any)=>{
            const pct=progressPct(ssp);
            const isOpen=expanded===ssp.id;
            const offStyle=OFFENSE_STYLE[ssp.violation?.offense_color]||OFFENSE_STYLE.grey;
            const initials=ssp.member_name?.split(' ').map((w:string)=>w[0]).slice(0,2).join('')||'?';
            return (
              <div key={ssp.id} className={`sr-row${isOpen?' open':''}`}>
                <div className="sr-row-main" onClick={()=>setExpanded(isOpen?null:ssp.id)}>
                  {/* Avatar */}
                  <div className="sr-avatar" style={{background:offStyle.bg,borderColor:offStyle.border,color:offStyle.color}}>
                    {initials}
                  </div>

                  {/* Name */}
                  <div>
                    <div className="sr-name">{ssp.member_name}</div>
                    <div className="sr-meta">Offer {ssp.offer_number} of 3</div>
                  </div>

                  {/* Offense */}
                  <span className="sr-offense" style={{background:offStyle.bg,borderColor:offStyle.border,color:offStyle.color}}>
                    {ssp.violation?.offense_color?.replace('_',' ')||'—'}
                  </span>

                  {/* Progress */}
                  <div className="sr-prog-wrap">
                    <div className="sr-prog-pct" style={{color:ssp.cleared?'var(--green)':'var(--gold-b)'}}>{pct}%</div>
                    <div className="sr-prog-track">
                      <div className="sr-prog-fill" style={{width:`${pct}%`,background:ssp.cleared?'var(--green)':'var(--gold)'}}/>
                    </div>
                  </div>

                  {/* Status */}
                  <span className={`sr-status-badge${ssp.cleared?' completed':ssp.status==='opted_out'?' opted_out':' in_progress'}`}>
                    {ssp.cleared?'Cleared':ssp.status==='opted_out'?'Opted Out':'Active'}
                  </span>

                  {/* Started */}
                  <span style={{fontFamily:'var(--cinzel)',fontSize:'.55rem',letterSpacing:'1px',color:'var(--bone-faint)'}}>
                    {fmt(ssp.created_at)}
                  </span>

                  {/* Sessions */}
                  <span className="sr-sessions-count">{ssp.sessions?.length||0}</span>

                  {/* Chevron */}
                  <span className="sr-chevron">▼</span>
                </div>

                {/* Expanded */}
                {isOpen&&(
                  <div className="sr-detail">
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem'}}>

                      {/* Checklist */}
                      <div>
                        <div className="sr-section-lbl">Session Checklist</div>
                        <div className="sr-checklist">
                          {LESSONS.map(l=>{
                            const done=ssp[l.key];
                            const log=ssp.sessions?.find((s:any)=>s.lesson_key===l.key);
                            return (
                              <div key={l.key} className={`sr-check-row${done?' done':''}`}>
                                <span className={`sr-check-icon${done?' done':' pending'}`}>{done?'✓':'○'}</span>
                                <div>
                                  <div className="sr-check-lesson">{l.title}</div>
                                  {log&&<div className="sr-check-log">{log.facilitator_name} · {fmtTime(log.session_at)}{log.passed===false&&<span style={{color:'#e05070'}}> · Failed</span>}</div>}
                                  {log?.private_notes&&<div className="sr-check-note">📝 {log.private_notes}</div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {ssp.cleared&&(
                          <div className="sr-cleared-notice" style={{marginTop:'.8rem'}}>
                            ✓ Cleared by {ssp.cleared_by_name} on {fmt(ssp.cleared_at)}
                          </div>
                        )}
                      </div>

                      {/* Timeline */}
                      {ssp.sessions?.length>0&&(
                        <div>
                          <div className="sr-timeline-lbl sr-section-lbl">Session Timeline</div>
                          <div className="sr-timeline">
                            {ssp.sessions.map((s:any,i:number)=>(
                              <div key={s.id} className="sr-timeline-item">
                                <div className="sr-timeline-track">
                                  <div className={`sr-timeline-dot${s.passed===false?' failed':' passed'}`}/>
                                  {i<ssp.sessions.length-1&&<div className="sr-timeline-line"/>}
                                </div>
                                <div className="sr-timeline-content">
                                  <div className="sr-timeline-title">
                                    {LESSONS.find(l=>l.key===s.lesson_key)?.title||'Unknown'}
                                    {s.passed===false&&<span style={{color:'#e05070',fontFamily:'var(--cinzel)',fontSize:'.48rem',letterSpacing:'2px',marginLeft:'.5rem'}}>FAILED</span>}
                                  </div>
                                  <div className="sr-timeline-by">{s.facilitator_name} · {fmtTime(s.session_at)}</div>
                                  {s.private_notes&&<div className="sr-timeline-note">📝 {s.private_notes}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
