'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../dash.css';
import './grievances.css';
import DashSidebar from '../DashSidebar';

const CATEGORIES = [
  { id:'bug',            icon:'⚙', name:'Broken Rigging',     desc:'Something is broken or not working' },
  { id:'incorrect_info', icon:'⚓', name:'False Bearings',     desc:'Wrong or outdated information' },
  { id:'suggestion',     icon:'🗺', name:'Chart Request',      desc:'Feature request or improvement idea' },
  { id:'complaint',      icon:'⚔', name:'Brotherhood Concern', desc:'Internal fraternity matter' },
  { id:'general',        icon:'🌊', name:'Open Waters',        desc:'General feedback or anything else' },
];

const STATUS_LABELS: Record<string,string> = {
  received:'Spotted', acknowledged:'On Deck', in_progress:'In the Works',
  resolved:'Charted', dismissed:'Dismissed',
};

const PAGES = [
  'Dashboard','Dues','PHIRE','Gallery','Brothers','Events',
  'News','Discipline','SSP','Dues Report','Terminal Log','Other',
];

function dateFmt(d:string){ return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }
function timeAgo(d:string){ const s=Math.floor((Date.now()-new Date(d).getTime())/1000); if(s<3600)return`${Math.floor(s/60)}m ago`; if(s<86400)return`${Math.floor(s/3600)}h ago`; if(s<604800)return`${Math.floor(s/86400)}d ago`; return dateFmt(d); }

export default function GrievancesPage() {
  const [member, setMember]     = useState<any>(null);
  const [profile, setProfile]   = useState<any>(null);
  const [isAdmin, setIsAdmin]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [items, setItems]       = useState<any[]>([]);
  const [openCard, setOpenCard] = useState<string|null>(null);

  // Form state
  const [category, setCategory]   = useState('bug');
  const [relatedPage, setRelatedPage] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]             = useState('');

  // Admin state
  const [selId, setSelId]         = useState<string|null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [activeStatus, setActiveStatus] = useState('');
  const [saving, setSaving]       = useState(false);

  useEffect(()=>{
    fetch('/api/dashboard/profile').then(r=>r.json()).then(d=>{
      if(d.error){window.location.href='/login';return;}
      setMember(d.member); setProfile(d.profile);
      const admin = d.member?.frat_name === 'Big Brother Cool Breeze';
      setIsAdmin(admin);
      load(admin);
    });
  },[]);

  async function load(admin:boolean){
    const url = admin ? '/api/dashboard/grievances?view=all' : '/api/dashboard/grievances';
    const d = await fetch(url).then(r=>r.json());
    setItems(d.grievances||[]);
    setLoading(false);
  }

  async function submit(){
    if(!category||description.trim().length<10){setMsg('err:Please select a category and write at least 10 characters.');return;}
    if(description.length>2000){setMsg('err:Description must be under 2,000 characters.');return;}
    setSubmitting(true); setMsg('');
    const res = await fetch('/api/dashboard/grievances',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category,related_page:relatedPage||null,description:description.trim()})}).then(r=>r.json());
    if(res.error){setMsg(`err:${res.error}`);setSubmitting(false);return;}
    setMsg('ok:Your report has been sent. The Crow\'s Nest has received your signal.');
    setDescription(''); setRelatedPage(''); setCategory('bug');
    setSubmitting(false);
    load(isAdmin);
    setTimeout(()=>setMsg(''),5000);
  }

  async function saveAdminUpdate(){
    if(!selId) return;
    setSaving(true);
    await fetch('/api/dashboard/grievances',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:selId,status:activeStatus||undefined,admin_notes:adminNotes})});
    setSaving(false);
    load(true);
  }

  function selectItem(item:any){
    setSelId(item.id);
    setActiveStatus(item.status);
    setAdminNotes(item.admin_notes||'');
  }

  const sel = items.find(i=>i.id===selId);
  const filtered = statusFilter==='all' ? items : items.filter(i=>i.status===statusFilter);

  if(!member||loading) return <div className="dash-loading">LOADING...</div>;

  /* ══ MEMBER VIEW ══ */
  if(!isAdmin){
    return (
      <div className="dash-app">
        <DashSidebar member={member} profile={profile}/>
        <main className="dash-main">
          <div className="dash-page-header">
            <div>
              <div style={{fontFamily:'var(--cinzel)',fontSize:'.54rem',letterSpacing:'4px',color:'rgba(198,147,10,.45)',textTransform:'uppercase',marginBottom:'.25rem'}}>
                KΘΦ II · Reports & Feedback
              </div>
              <div className="dash-page-title">The Crow's Nest</div>
            </div>
            <span style={{fontFamily:'var(--cinzel)',fontSize:'.58rem',letterSpacing:'2px',color:'var(--bone-faint)'}}>
              Signal spotted — report it here
            </span>
          </div>

          <div className="cn-member-layout">
            {/* Submission form */}
            <div className="cn-form-col">
              <div className="cn-form-hdr">Send a Signal</div>
              <div className="cn-form-body">
                {msg && <div className={`cn-msg ${msg.startsWith('ok:')?' ok':'err'}`}>{msg.replace(/^(ok|err):/,'')}</div>}

                <div>
                  <label className="cn-lbl">Nature of Report</label>
                  <div className="cn-cat-grid">
                    {CATEGORIES.map(c=>(
                      <div key={c.id} className={`cn-cat-opt ${c.id}${category===c.id?' sel':''}`} onClick={()=>setCategory(c.id)}>
                        <span className="cn-cat-icon">{c.icon}</span>
                        <div>
                          <div className="cn-cat-name">{c.name}</div>
                          <div className="cn-cat-desc">{c.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="cn-lbl">Related Page (optional)</label>
                  <select className="cn-fld" value={relatedPage} onChange={e=>setRelatedPage(e.target.value)}>
                    <option value="">— No specific page —</option>
                    {PAGES.map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="cn-lbl">Your Report</label>
                  <textarea className="cn-fld cn-textarea" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe the issue, idea, or concern in as much detail as you can..." rows={5}/>
                  <div className={`cn-char-count${description.length>1800?' near':''}${description.length>2000?' over':''}`}>
                    {description.length} / 2000
                  </div>
                </div>

                <button className="cn-submit-btn" onClick={submit} disabled={submitting}>
                  {submitting ? 'Sending Signal...' : 'Send Signal ⚓'}
                </button>
              </div>
            </div>

            {/* My submissions */}
            <div className="cn-my-col">
              <div className="cn-my-hdr">My Reports ({items.length})</div>
              {items.length===0
                ? <div className="cn-my-empty">You haven't sent any signals yet.</div>
                : (
                  <div className="cn-my-items">
                    {items.map(item=>{
                      const cat=CATEGORIES.find(c=>c.id===item.category);
                      const isOpen=openCard===item.id;
                      return (
                        <div key={item.id} className={`cn-card ${item.category}${isOpen?' open':''}`}>
                          <div className="cn-card-hdr" onClick={()=>setOpenCard(isOpen?null:item.id)}>
                            <span className="cn-card-cat-badge" style={{borderColor:`var(--cat-${item.category==='incorrect_info'?'info':item.category==='complaint'?'concern':item.category}-bd)`,color:`var(--cat-${item.category==='incorrect_info'?'info':item.category==='complaint'?'concern':item.category})`}}>
                              {cat?.icon} {cat?.name}
                            </span>
                            <span className="cn-card-preview">{item.description}</span>
                            <span className={`cn-status ${item.status}`}>{STATUS_LABELS[item.status]}</span>
                            <span className="cn-card-date">{timeAgo(item.created_at)}</span>
                            <span className="cn-card-chevron">▼</span>
                          </div>
                          {isOpen&&(
                            <div className="cn-card-body">
                              {item.related_page&&<div className="cn-card-page">📍 {item.related_page}</div>}
                              <div className="cn-card-description">{item.description}</div>
                              {item.admin_notes&&(
                                <div className="cn-admin-response">
                                  <div className="cn-admin-response-lbl">Response from Cool Breeze</div>
                                  <div className="cn-admin-response-text">{item.admin_notes}</div>
                                </div>
                              )}
                              <div style={{fontFamily:'var(--cinzel)',fontSize:'.54rem',letterSpacing:'1px',color:'var(--bone-faint)'}}>
                                Submitted {dateFmt(item.created_at)}{item.reviewed_by_name&&` · Reviewed by ${item.reviewed_by_name}`}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              }
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ══ ADMIN VIEW ══ */
  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile}/>
      <main className="dash-main">
        <div className="dash-page-header">
          <div>
            <div style={{fontFamily:'var(--cinzel)',fontSize:'.54rem',letterSpacing:'4px',color:'rgba(198,147,10,.45)',textTransform:'uppercase',marginBottom:'.25rem'}}>
              Admin View · Cool Breeze
            </div>
            <div className="dash-page-title">The Crow's Nest</div>
          </div>
          <span style={{fontFamily:'var(--cinzel)',fontSize:'.58rem',letterSpacing:'2px',color:'var(--bone-faint)'}}>
            {items.length} report{items.length!==1?'s':''} total
          </span>
        </div>

        <div className="cn-admin-layout">

          {/* LEFT: all submissions list */}
          <div className="cn-admin-list-col">
            <div className="cn-filter-bar">
              {['all','received','acknowledged','in_progress','resolved','dismissed'].map(s=>(
                <button key={s} className={`cn-filter-chip${statusFilter===s?' active':''}`} onClick={()=>setStatusFilter(s)}>
                  {s==='all'?`All (${items.length})`:STATUS_LABELS[s]||s}
                </button>
              ))}
            </div>
            <div className="cn-admin-list-hdr">Reports</div>
            <div className="cn-admin-list-items">
              {filtered.length===0&&<div style={{padding:'1.5rem',fontFamily:'var(--cinzel)',fontSize:'.58rem',letterSpacing:'2px',color:'var(--bone-faint)',textAlign:'center'}}>No reports.</div>}
              {filtered.map(item=>{
                const cat=CATEGORIES.find(c=>c.id===item.category);
                return (
                  <div key={item.id} className={`cn-admin-item ${item.category}${selId===item.id?' sel':''}`} onClick={()=>selectItem(item)}>
                    <div className="cn-admin-item-name">{item.member_name}</div>
                    <div className="cn-admin-item-preview">{cat?.icon} {item.description}</div>
                    <div className="cn-admin-item-meta">
                      <span className="cn-admin-item-date">{timeAgo(item.created_at)}</span>
                      <span className={`cn-status ${item.status}`} style={{fontSize:'.48rem',padding:'2px 6px'}}>{STATUS_LABELS[item.status]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CENTRE: detail */}
          <div className="cn-admin-detail-col">
            {!sel
              ? <div className="cn-admin-empty">Select a report to review</div>
              : (
                <>
                  <div className="cn-admin-detail-hdr">
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'1rem',flexWrap:'wrap'}}>
                      <div>
                        <div className="cn-admin-detail-from">{sel.member_name}</div>
                        <div className="cn-admin-detail-sub">
                          <span className={`cn-card-cat-badge`} style={{borderColor:`var(--cat-${sel.category==='incorrect_info'?'info':sel.category==='complaint'?'concern':sel.category}-bd)`,color:`var(--cat-${sel.category==='incorrect_info'?'info':sel.category==='complaint'?'concern':sel.category})`}}>
                            {CATEGORIES.find(c=>c.id===sel.category)?.icon} {CATEGORIES.find(c=>c.id===sel.category)?.name}
                          </span>
                          <span>{dateFmt(sel.created_at)}</span>
                          {sel.related_page&&<span>📍 {sel.related_page}</span>}
                          <span className={`cn-status ${sel.status}`}>{STATUS_LABELS[sel.status]}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="cn-admin-detail-body">
                    <div>
                      <div className="cn-admin-detail-lbl">Report</div>
                      <div className="cn-admin-detail-text">{sel.description}</div>
                    </div>
                    {sel.admin_notes&&(
                      <div>
                        <div className="cn-admin-detail-lbl">Your Notes</div>
                        <div className="cn-admin-detail-text">{sel.admin_notes}</div>
                      </div>
                    )}
                    <div style={{fontFamily:'var(--cinzel)',fontSize:'.54rem',letterSpacing:'1px',color:'rgba(255,255,255,.12)'}}>
                      ID: {sel.id.slice(0,8)}…
                    </div>
                  </div>
                </>
              )
            }
          </div>

          {/* RIGHT: actions */}
          <div className="cn-action-col">
            <div className="cn-action-hdr">Actions</div>
            {!sel
              ? <div className="cn-action-empty">Select a report first</div>
              : (
                <div className="cn-action-body">
                  <div>
                    <label className="cn-lbl">Update Status</label>
                    <div className="cn-status-grid">
                      {(['received','acknowledged','in_progress','resolved','dismissed'] as const).map(s=>(
                        <button key={s} className={`cn-status-btn ${s}${activeStatus===s?' active':''}`} onClick={()=>setActiveStatus(s)}>
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="cn-lbl">Response / Notes</label>
                    <textarea className="cn-notes-fld" value={adminNotes} onChange={e=>setAdminNotes(e.target.value)} placeholder="Leave a response the brother will see, or internal notes..."/>
                  </div>
                  <button className="cn-save-btn" onClick={saveAdminUpdate} disabled={saving}>
                    {saving?'Saving...':'Save Update'}
                  </button>
                </div>
              )
            }
          </div>
        </div>
      </main>
    </div>
  );
}
