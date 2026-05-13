'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../dash.css';
import './ssp.css';
import DashSidebar from '../DashSidebar';

const LESSONS = [
  { key:'lesson_1', num:1, title:'What Brotherhood Really Means',
    points:['Brotherhood is responsibility, not just friendship.','Wearing letters means representing something bigger than yourself.','Trust: how one person\'s actions affect the entire group unit.'],
    questions:['In your own words, what does brotherhood mean to you — not the textbook definition, what does it actually mean?','Can you give me an example of a time you truly represented your brothers well?','What does it mean to you that your actions affect every member of this chapter?'] },
  { key:'lesson_2', num:2, title:'Respect: The Foundation of Character',
    points:['Respect for your brothers.','Respect for women.','Respect for property and shared spaces.','Respect in disagreement.'],
    questions:['What does respect actually look like in practice — give me a specific example.','Was the incident that led to your violation a moment of disrespect? To whom?','What would you do differently if that situation happened again tomorrow?'] },
  { key:'lesson_3', num:3, title:'Accountability: Owning Your Actions',
    points:['The difference between an explanation and an excuse.','Apology vs. actual change.','Consequences are part of growth.','Trust is rebuilt through consistent actions, not words.'],
    questions:['What is the difference between an explanation and an excuse? Which did you give?','Have you actually apologised to anyone affected — and if so, what did you say?','What specific action — not a promise, an action — have you taken since the violation?'] },
  { key:'lesson_4', num:4, title:'Public Behavior = Public Representation',
    points:['Wearing letters is always on.','Social media and public life.','The chapter\'s reputation is shared.'],
    questions:['When the incident happened, were you representing the fraternity whether you intended to or not?','If someone outside the chapter saw what happened, what would they think of KΘΦ II?','How do you think your brothers felt when they found out?'] },
  { key:'lesson_5', num:5, title:'Conflict Resolution Without Escalation',
    points:['De-escalation as strength.','When to walk away.','The right way to raise grievances internally.'],
    questions:['Walk me through what happened — at what point could you have walked away?','What would you have needed to feel in that moment to make a different choice?','Who in the chapter do you trust to talk to when things feel tense?'] },
  { key:'lesson_6', num:6, title:'Your Role in the Chapter Going Forward',
    points:['How to rebuild trust after a violation.','Contribution vs. consumption in a brotherhood.','Being a positive example going forward.'],
    questions:['What do you think your brothers need to see from you before they fully trust you again?','What does contributing to this chapter actually look like for you day to day?','If a new pledge came to you with a similar situation, what would you tell them?'] },
  { key:'reflections_done', num:7, title:'Final Reflection',
    points:[],
    questions:['Looking back at all six sessions — what was the hardest thing to sit with?','What has genuinely changed in how you think about your role in this chapter?','What would you say to yourself right before the incident happened, if you could go back?'] },
];

const COLORS: Record<string,string> = {
  grey:'rgba(160,160,180,.7)', navy_blue:'#6b83b8', gold:'#c6930a', crimson_red:'#e05070',
};

function completedCount(ssp:any){ return LESSONS.filter(l=>ssp[l.key]).length; }
function progressPct(ssp:any){ return Math.round((completedCount(ssp)/7)*100); }
function timeAgo(d:string){ const s=Math.floor((Date.now()-new Date(d).getTime())/1000); if(s<3600)return`${Math.floor(s/60)}m ago`; if(s<86400)return`${Math.floor(s/3600)}h ago`; return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short'}); }

function Ring({ done, total }: { done:number; total:number }) {
  const r=60, cx=72, cy=72;
  const circ=2*Math.PI*r;
  const pct=Math.min(1,done/total);
  const dash=circ*pct;
  return (
    <svg width="144" height="144" className="ssp-ring-svg">
      <defs>
        <linearGradient id="sspGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c6930a"/>
          <stop offset="100%" stopColor="#e8b84b"/>
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="9"/>
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="url(#sspGrad)" strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{transition:'stroke-dasharray 1s ease'}}
      />
      <text x={cx} y={cy-6} textAnchor="middle" fill="#e8b84b"
        style={{fontFamily:'var(--display)',fontSize:'20px',fontWeight:700,letterSpacing:'1px'}}>
        {done}
      </text>
      <text x={cx} y={cy+10} textAnchor="middle" fill="rgba(198,147,10,.45)"
        style={{fontFamily:'var(--cinzel)',fontSize:'7px',letterSpacing:'3px'}}>
        OF {total}
      </text>
    </svg>
  );
}

export default function SSPPage() {
  const [member, setMember]       = useState<any>(null);
  const [profile, setProfile]     = useState<any>(null);
  const [canManage, setCanManage] = useState(false);
  const [ssps, setSsps]           = useState<any[]>([]);
  const [active, setActive]       = useState<string|null>(null);
  const [loading, setLoading]     = useState(true);
  const [sessionLesson, setSessionLesson] = useState<string|null>(null);
  const [sessionNote, setSessionNote]     = useState('');
  const [sessionPassed, setSessionPassed] = useState(true);
  const [saving, setSaving]               = useState('');
  const [sessionLogs, setSessionLogs]     = useState<any[]>([]);

  useEffect(()=>{
    fetch('/api/dashboard/phire/balance').then(r=>r.json()).then(d=>{
      if(d.error){window.location.href='/login';return;}
      setMember(d.member); setProfile(d.profile||{});
    });
  },[]);

  useEffect(()=>{
    if(!member) return;
    const manage = member.faction==='Ishi No Faction' || member.role==='Head Founder' || member.role==='Co-Founder';
    setCanManage(manage);
    loadSSPs(manage);
  },[member]);

  async function loadSSPs(manage:boolean){
    const d=await fetch(manage?'/api/dashboard/ssp?view=all':'/api/dashboard/ssp').then(r=>r.json());
    setSsps(d.ssps||[]);
    if(d.ssps?.length&&!active) setActive(d.ssps[0].id);
    setLoading(false);
  }

  async function loadLogs(sspId:string){
    const d=await fetch(`/api/dashboard/ssp/sessions?ssp_id=${sspId}`).then(r=>r.json());
    setSessionLogs(d.logs||[]);
  }

  useEffect(()=>{ if(active&&canManage) loadLogs(active); },[active,canManage]);

  async function conductSession(sspId:string, lessonKey:string, passed:boolean, note:string){
    setSaving(lessonKey);
    await fetch('/api/dashboard/ssp/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ssp_id:sspId,lesson_key:lessonKey,passed,private_notes:note})});
    await fetch('/api/dashboard/ssp',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ssp_id:sspId,[lessonKey]:true})});
    setSessionLesson(null); setSessionNote(''); setSessionPassed(true); setSaving('');
    await loadSSPs(true); await loadLogs(sspId);
  }

  async function clearBrother(sspId:string){
    if(!confirm('Mark this Sage Solution as fully completed and dismiss all charges?')) return;
    setSaving('clear');
    await fetch('/api/dashboard/ssp',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ssp_id:sspId,cleared:true})});
    setSaving(''); await loadSSPs(true);
  }

  const currentSsp = ssps.find(s=>s.id===active);
  const allDone = currentSsp && completedCount(currentSsp)===7;

  if(!member||loading) return <div className="dash-loading">LOADING...</div>;

  /* ══ BROTHER VIEW ══ */
  if(!canManage){
    const ssp = ssps[0];
    const done = ssp ? completedCount(ssp) : 0;
    const firstPending = LESSONS.find(l=>ssp&&!ssp[l.key]);
    return (
      <div className="dash-app">
        <DashSidebar member={member} profile={profile}/>
        <main className="dash-main">
          <div className="dash-page-header">
            <div className="dash-page-title">Sage Solution Program</div>
          </div>
          {!ssp ? (
            <div className="ssp-bro-empty">No active Sage session.</div>
          ) : (
            <div className="ssp-bro-wrap">
              <div className="ssp-bro-body">
                {/* LEFT */}
                <div className="ssp-bro-left">
                  <Ring done={done} total={7}/>
                  <div className="ssp-ring-label">{ssp.cleared?'Completed':done===7?'Final Review':'In Progress'}</div>
                  <div className="ssp-ring-sub">{done} of 7 sessions</div>
                  <span className="ssp-offer-tag">Offer {ssp.offer_number} of 3</span>
                  {ssp.violation?.offense_color && (
                    <span className="ssp-offense-tag" style={{borderColor:`${COLORS[ssp.violation.offense_color]}40`,color:COLORS[ssp.violation.offense_color],background:`${COLORS[ssp.violation.offense_color]}12`}}>
                      {ssp.violation.offense_color.replace('_',' ').toUpperCase()} CARD
                    </span>
                  )}
                  <span className={`ssp-status-badge ${ssp.cleared?'cleared':ssp.status}`}>
                    {ssp.cleared?'Cleared':ssp.status==='opted_out'?'Opted Out':'Enrolled'}
                  </span>
                </div>
                {/* RIGHT */}
                <div className="ssp-bro-right">
                  <div className="ssp-step-list">
                    {LESSONS.map(l=>{
                      const isDone=ssp[l.key];
                      const isCurrent=!isDone && l===firstPending;
                      return (
                        <div key={l.key} className={`ssp-step${isDone?' done':''}${isCurrent?' current':''}`}>
                          <div className={`ssp-step-dot${isDone?' done':isCurrent?' current':' pending'}`}>
                            {isDone?'✓':isCurrent?l.num:l.num}
                          </div>
                          <div>
                            <div className="ssp-step-num">Session {l.num}</div>
                            <div className="ssp-step-title">{l.title}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="ssp-bro-notice">
                    <span>⚓</span>
                    <span>Each session is conducted in-person with an Ishi No Faction member. Attend when called and engage honestly.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  /* ══ FACILITATOR VIEW ══ */
  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile}/>
      <main className="dash-main">
        <div className="dash-page-header">
          <div className="dash-page-title">Sage Solution Program</div>
          <span style={{fontFamily:'var(--cinzel)',fontSize:'.55rem',letterSpacing:'3px',color:'rgba(198,147,10,.5)'}}>Facilitator View</span>
        </div>

        {ssps.length===0 ? (
          <div className="ssp-fac-empty">No active Sage Solution records.</div>
        ) : (
          <div className="ssp-fac-layout">

            {/* LEFT: enrolled brothers */}
            <div className="ssp-roster">
              <div className="ssp-roster-hdr">Brothers ({ssps.length})</div>
              <div className="ssp-roster-items">
                {ssps.map(s=>{
                  const pct=progressPct(s);
                  return (
                    <div key={s.id} className={`ssp-roster-item${active===s.id?' sel':''}${s.cleared?' cleared':''}`} onClick={()=>setActive(s.id)}>
                      <div className="ssp-roster-item-top">
                        <span className="ssp-roster-name">{s.member_name}</span>
                        <span style={{fontFamily:'var(--cinzel)',fontSize:'.5rem',color:s.cleared?'var(--green)':'var(--gold-b)'}}>{pct}%</span>
                      </div>
                      <div className="ssp-roster-prog">
                        <div className="ssp-roster-prog-fill" style={{width:`${pct}%`,background:s.cleared?'var(--green)':'var(--gold)'}}/>
                      </div>
                      {s.violation?.offense_color && (
                        <div className="ssp-roster-meta" style={{color:COLORS[s.violation.offense_color]}}>
                          {s.violation.offense_color.replace('_',' ').toUpperCase()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CENTRE: lesson tracker */}
            <div className="ssp-tracker">
              {!currentSsp ? (
                <div className="ssp-fac-empty">Select a brother</div>
              ) : (
                <>
                  <div className="ssp-tracker-hdr">
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'1rem'}}>
                      <div>
                        <div className="ssp-tracker-name">{currentSsp.member_name}</div>
                        <div className="ssp-tracker-sub">
                          Offer {currentSsp.offer_number} of 3 · {progressPct(currentSsp)}% complete
                          {currentSsp.cleared && <span style={{color:'var(--green)',marginLeft:'.5rem'}}>· Cleared ✓</span>}
                        </div>
                      </div>
                      {allDone && !currentSsp.cleared && (
                        <button className="ssp-clear-btn" onClick={()=>clearBrother(currentSsp.id)} disabled={saving==='clear'}>
                          {saving==='clear'?'Clearing...':'✓ Clear & Dismiss'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="ssp-lesson-rows">
                    {LESSONS.map(lesson=>{
                      const isDone=currentSsp[lesson.key];
                      const isOpen=sessionLesson===lesson.key;
                      const log=sessionLogs.find(l=>l.lesson_key===lesson.key);
                      return (
                        <div key={lesson.key} className={`ssp-lesson-row${isDone?' done':''}`}>
                          <div className="ssp-lesson-row-hdr" onClick={()=>!isDone&&setSessionLesson(isOpen?null:lesson.key)}>
                            <div className={`ssp-lesson-check${isDone?' done':' pending'}`}>
                              {isDone?'✓':lesson.num}
                            </div>
                            <div className="ssp-lesson-info">
                              <div className="ssp-lesson-num">Session {lesson.num}</div>
                              <div className="ssp-lesson-title">{lesson.title}</div>
                              {isDone&&log&&<div className="ssp-lesson-log">{log.facilitator_name} · {timeAgo(log.session_at)}{log.passed===false&&<span style={{color:'#e05070'}}> · Did not pass</span>}</div>}
                            </div>
                            {!isDone&&(
                              <button className="ssp-lesson-conduct-btn" onClick={e=>{e.stopPropagation();setSessionLesson(isOpen?null:lesson.key);setSessionNote('');setSessionPassed(true);}}>
                                {isOpen?'Cancel':'Conduct'}
                              </button>
                            )}
                          </div>
                          {isOpen&&(
                            <div className="ssp-lesson-body">
                              {lesson.points.length>0&&(
                                <div>
                                  <div className="ssp-lesson-body-section-lbl">Topics to cover</div>
                                  {lesson.points.map((p,i)=><div key={i} className="ssp-lesson-topic-item">· {p}</div>)}
                                </div>
                              )}
                              <div>
                                <div className="ssp-lesson-q-warning">⚠ Ask verbally — do not share with the brother</div>
                                {lesson.questions.map((q,i)=>(
                                  <div key={i} className="ssp-lesson-q">
                                    <span className="ssp-lesson-q-num">{i+1}</span>
                                    <span className="ssp-lesson-q-text">{q}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* RIGHT: session log */}
            <div className="ssp-session-panel">
              <div className="ssp-session-panel-hdr">
                <span>Session Log</span>
              </div>

              {/* Conduct form — shows when lesson is open */}
              {sessionLesson&&currentSsp&&(
                <div className="ssp-conduct-form">
                  <div className="ssp-conduct-title">Conduct Session</div>
                  <div className="ssp-conduct-for">{LESSONS.find(l=>l.key===sessionLesson)?.title}</div>
                  <div style={{fontFamily:'var(--cinzel)',fontSize:'.52rem',letterSpacing:'1px',color:'var(--bone-faint)'}}>With {currentSsp.member_name}</div>
                  <div>
                    <div style={{fontFamily:'var(--cinzel)',fontSize:'.5rem',letterSpacing:'2px',color:'rgba(198,147,10,.45)',marginBottom:'.3rem',textTransform:'uppercase'}}>Outcome</div>
                    <div className="ssp-conduct-pass-row">
                      <button className={`ssp-conduct-pass${sessionPassed?' active':''}`} onClick={()=>setSessionPassed(true)}>✓ Passed</button>
                      <button className={`ssp-conduct-fail${!sessionPassed?' active':''}`} onClick={()=>setSessionPassed(false)}>✗ Failed</button>
                    </div>
                  </div>
                  <textarea className="ssp-conduct-notes" placeholder="Private notes (not visible to brother)..." value={sessionNote} onChange={e=>setSessionNote(e.target.value)} rows={3}/>
                  <button className="ssp-conduct-submit" disabled={!!saving} onClick={()=>conductSession(currentSsp.id,sessionLesson,sessionPassed,sessionNote)}>
                    {saving===sessionLesson?'Saving...':'Mark Complete'}
                  </button>
                </div>
              )}

              {/* Session history */}
              {sessionLogs.length>0&&(
                <div className="ssp-history-section">
                  <div className="ssp-history-lbl">History</div>
                  {sessionLogs.map(log=>(
                    <div key={log.id} className="ssp-history-item">
                      <div className="ssp-history-lesson">{LESSONS.find(l=>l.key===log.lesson_key)?.title||'Final Reflection'}</div>
                      <div className="ssp-history-meta">{log.facilitator_name} · {timeAgo(log.session_at)}{log.passed===false&&<span style={{color:'#e05070'}}> · Did not pass</span>}</div>
                      {log.private_notes&&<div className="ssp-history-note">📝 {log.private_notes}</div>}
                    </div>
                  ))}
                </div>
              )}

              {!currentSsp&&<div className="ssp-fac-empty" style={{flex:1}}>Select a brother</div>}
              {currentSsp&&sessionLogs.length===0&&!sessionLesson&&(
                <div style={{padding:'2rem',fontFamily:'var(--cinzel)',fontSize:'.55rem',letterSpacing:'2px',color:'var(--bone-faint)',textAlign:'center'}}>
                  No sessions yet — conduct a lesson to log it here.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
