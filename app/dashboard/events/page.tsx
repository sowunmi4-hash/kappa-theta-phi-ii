'use client';
import { useState, useEffect, useRef } from 'react';
import '../dash.css';
import './events.css';

const NAV = [
  { href: '/dashboard', label: 'Home' },
  { href: '/dashboard/news', label: 'Wokou News' },
  { href: '/dashboard/events', label: 'Events' },
  { href: '/dashboard/phire', label: 'PHIRE' },
  { href: '/dashboard/discipline', label: 'Discipline' },
  { href: '/dashboard/gallery', label: 'My Gallery' },
  { href: '/dashboard/edit', label: 'Edit Profile' },
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

type Event = {
  id: string; title: string; event_date: string; event_time?: string;
  location?: string; sl_url?: string; dress_code?: string;
  description?: string; flyer_url?: string; created_by_name?: string;
  rsvp_count: number; attending: boolean; attendees: string[];
};

export default function EventsPage() {
  const [member, setMember] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [view, setView] = useState<'calendar'|'list'>('calendar');
  const [calDate, setCalDate] = useState(new Date());
  const [selected, setSelected] = useState<Event|null>(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [flyerPreview, setFlyerPreview] = useState('');
  const [form, setForm] = useState({ title:'', event_date:'', event_time:'', location:'', sl_url:'', dress_code:'', description:'', flyer_url:'' });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Event|null>(null);
  const [editForm, setEditForm] = useState({ title:'', event_date:'', event_time:'', location:'', sl_url:'', dress_code:'', description:'', flyer_url:'' });
  const [editSaving, setEditSaving] = useState(false);
  const flyerRef = useRef<HTMLInputElement>(null);
  const editFlyerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/dashboard/profile').then(r=>r.json()).then(d => {
      if (d.error) { window.location.href='/login'; return; }
      setMember(d.member);
    });
    loadEvents();
  }, []);
  // POLLING: silent background refresh every 30s
  useEffect(() => {
    const poll = setInterval(() => { loadEvents(); }, 30000);
    return () => clearInterval(poll);
  }, []);


  async function loadEvents() {
    const d = await fetch('/api/dashboard/events').then(r=>r.json());
    setEvents(d.events || []);
  }

  async function uploadFlyer(e: any) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setFlyerPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/dashboard/events', { method:'POST', body: fd }).then(r=>r.json());
    if (res.file_url) setForm(f => ({ ...f, flyer_url: res.file_url }));
    setUploading(false);
  }

  async function createEvent() {
    if (!form.title || !form.event_date) return;
    setSaving(true);
    await fetch('/api/dashboard/events', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
    setCreating(false);
    setForm({ title:'', event_date:'', event_time:'', location:'', sl_url:'', dress_code:'', description:'', flyer_url:'' });
    setFlyerPreview('');
    await loadEvents();
    setSaving(false);
  }

  async function rsvp(event_id: string, attending: boolean) {
    await fetch('/api/dashboard/events', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event_id, attending }) });
    const d = await fetch('/api/dashboard/events').then(r=>r.json());
    const updated = (d.events || []);
    setEvents(updated);
    if (selected?.id === event_id) {
      const fresh = updated.find((e: Event) => e.id === event_id);
      if (fresh) setSelected(fresh);
    }
  }

  async function deleteEvent(event_id: string) {
    if (!confirm('Delete this event?')) return;
    await fetch('/api/dashboard/events', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event_id }) });
    setSelected(null);
    await loadEvents();
  }

  function openEdit(ev: Event) {
    setEditForm({ title: ev.title, event_date: ev.event_date, event_time: ev.event_time||'', location: ev.location||'', sl_url: ev.sl_url||'', dress_code: ev.dress_code||'', description: ev.description||'', flyer_url: ev.flyer_url||'' });
    setEditing(ev);
    setSelected(null);
  }

  async function saveEdit() {
    if (!editing) return;
    setEditSaving(true);
    await fetch('/api/dashboard/events', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'edit', event_id: editing.id, ...editForm }) });
    setEditing(null);
    await loadEvents();
    setEditSaving(false);
  }

  async function uploadEditFlyer(e: any) {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/dashboard/events', { method:'POST', body: fd }).then(r=>r.json());
    if (res.file_url) setEditForm(f => ({ ...f, flyer_url: res.file_url }));
  }

  // Calendar helpers
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const today = new Date();

  const eventsByDate: Record<string, Event[]> = {};
  events.forEach(ev => {
    const d = ev.event_date.split('T')[0];
    if (!eventsByDate[d]) eventsByDate[d] = [];
    eventsByDate[d].push(ev);
  });

  function fmtDate(d: string) {
    const dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  }
  function fmtTime(t?: string) {
    if (!t) return '';
    const [h,m] = t.split(':');
    const hr = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const hr12 = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
    return `${hr12}:${m} ${ampm} SLT`;
  }

  const upcomingEvents = events.filter(e => new Date(e.event_date + 'T23:59:59') >= today).slice(0,3);

  if (!member) return <div className="dash-loading">LOADING...</div>;
  const slug = member.frat_name?.toLowerCase().replace(/\s+/g,'-').replace('big-brother-','') || '';

  return (
    <div className="dash-app">
      {/* ── SIDEBAR ── */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-logo">
          <img src="/logo.png" alt="KΘΦ II" />
          <span className="dash-sidebar-logo-text">KΘΦ II</span>
        </div>
        <div className="dash-sidebar-member">
          <div className="dash-sidebar-portrait">
            <img src={`/brothers/${slug}.png`} alt="" onError={(e:any)=>e.target.src='/logo.png'} />
          </div>
          <div className="dash-sidebar-name">{member.frat_name}</div>
          <div className="dash-sidebar-role">{member.role}</div>
          {member.fraction && <div className="dash-sidebar-fraction">{member.fraction}</div>}
        </div>
        <nav className="dash-nav">
          {NAV.map(n => (
            <a key={n.href} href={n.href} className={`dash-nav-item ${n.href==='/dashboard/events'?'active':''}`}>
              <span>{n.label}</span>
            </a>
          ))}
          <div className="dash-nav-divider"/>
          <a href="/" className="dash-nav-item"><span>Back to Site</span></a>
        </nav>
      </aside>

      {/* ── MAIN ── */}
      <main className="dash-main">
        <div className="events-wrap">

          {/* Header */}
          <div className="events-header">
            <div>
              <div className="events-title">Events</div>
              <div className="events-subtitle">{upcomingEvents.length} upcoming</div>
            </div>
            <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
              <div className="view-toggle">
                <button className={`view-btn ${view==='calendar'?'active':''}`} onClick={()=>setView('calendar')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  Calendar
                </button>
                <button className={`view-btn ${view==='list'?'active':''}`} onClick={()=>setView('list')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
                  List
                </button>
              </div>
              <button className="btn btn-gold" onClick={()=>setCreating(true)}>+ Add Event</button>
            </div>
          </div>

          {/* ── CALENDAR VIEW ── */}
          {view === 'calendar' && (
            <div className="cal-wrap">
              {/* Month nav */}
              <div className="cal-nav">
                <button className="cal-nav-btn" onClick={()=>setCalDate(new Date(year,month-1,1))}>‹</button>
                <div className="cal-month">{MONTHS[month]} {year}</div>
                <button className="cal-nav-btn" onClick={()=>setCalDate(new Date(year,month+1,1))}>›</button>
              </div>

              {/* Day labels */}
              <div className="cal-grid-header">
                {DAYS.map(d => <div key={d} className="cal-day-label">{d}</div>)}
              </div>

              {/* Calendar grid */}
              <div className="cal-grid">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDay }).map((_,i) => <div key={`e${i}`} className="cal-cell empty" />)}
                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_,i) => {
                  const day = i+1;
                  const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                  const dayEvents = eventsByDate[dateStr] || [];
                  const isToday = today.getDate()===day && today.getMonth()===month && today.getFullYear()===year;
                  return (
                    <div key={day} className={`cal-cell ${isToday?'today':''} ${dayEvents.length?'has-events':''}`}>
                      <div className="cal-cell-day">{day}</div>
                      {dayEvents.slice(0,2).map(ev => (
                        <div key={ev.id} className={`cal-event-dot ${ev.attending?'attending':''}`} onClick={()=>setSelected(ev)} title={ev.title}>
                          {ev.title.slice(0,18)}{ev.title.length>18?'…':''}
                        </div>
                      ))}
                      {dayEvents.length > 2 && <div className="cal-more">+{dayEvents.length-2} more</div>}
                    </div>
                  );
                })}
              </div>

              {/* Upcoming sidebar */}
              {upcomingEvents.length > 0 && (
                <div className="cal-upcoming">
                  <div className="cal-upcoming-title">Upcoming</div>
                  {upcomingEvents.map(ev => (
                    <div key={ev.id} className="cal-upcoming-item" onClick={()=>setSelected(ev)}>
                      <div className="cal-upcoming-date">
                        <div className="cal-upcoming-day">{new Date(ev.event_date+'T12:00:00').getDate()}</div>
                        <div className="cal-upcoming-mon">{MONTHS[new Date(ev.event_date+'T12:00:00').getMonth()].slice(0,3)}</div>
                      </div>
                      <div className="cal-upcoming-info">
                        <div className="cal-upcoming-name">{ev.title}</div>
                        {ev.event_time && <div className="cal-upcoming-time">{fmtTime(ev.event_time)}</div>}
                        {ev.location && <div className="cal-upcoming-loc">{ev.location}</div>}
                        <div className="cal-upcoming-rsvp">{ev.rsvp_count} attending</div>
                      </div>
                      {ev.attending && <div className="cal-attending-badge">✓</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── LIST VIEW ── */}
          {view === 'list' && (
            <div className="events-list">
              {events.length === 0 && <div className="events-empty">No events yet. Be the first to add one.</div>}
              {events.map(ev => (
                <div key={ev.id} className={`event-card ${ev.attending?'event-card-attending':''}`} onClick={()=>setSelected(ev)}>
                  {ev.flyer_url && <img src={ev.flyer_url} alt="flyer" className="event-card-flyer" />}
                  <div className="event-card-body">
                    <div className="event-card-date">
                      <div className="event-card-day">{new Date(ev.event_date+'T12:00:00').getDate()}</div>
                      <div className="event-card-mon">{MONTHS[new Date(ev.event_date+'T12:00:00').getMonth()].slice(0,3).toUpperCase()}</div>
                    </div>
                    <div className="event-card-info">
                      <div className="event-card-title">{ev.title}</div>
                      <div className="event-card-meta">
                        {ev.event_time && <span>{fmtTime(ev.event_time)}</span>}
                        {ev.location && <span>· {ev.location}</span>}
                        {ev.dress_code && <span>· {ev.dress_code}</span>}
                      </div>
                      <div className="event-card-footer">
                        <span className="event-rsvp-count">{ev.rsvp_count} attending</span>
                        {ev.attending && <span className="event-attending-tag">✓ You're in</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── EVENT DETAIL MODAL ── */}
      {selected && (
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setSelected(null)}>✕</button>
            {selected.flyer_url && <img src={selected.flyer_url} alt="flyer" className="modal-flyer" />}
            <div className="modal-body">
              <div className="modal-title">{selected.title}</div>
              <div className="modal-date">{fmtDate(selected.event_date)}{selected.event_time ? ` · ${fmtTime(selected.event_time)}` : ''}</div>
              {selected.location && (
                <div className="modal-detail">
                  <span className="modal-detail-label">Location</span>
                  {selected.sl_url
                    ? <a href={selected.sl_url} target="_blank" rel="noopener noreferrer" className="modal-link">{selected.location}</a>
                    : <span>{selected.location}</span>}
                </div>
              )}
              {selected.dress_code && (
                <div className="modal-detail">
                  <span className="modal-detail-label">Dress Code</span>
                  <span>{selected.dress_code}</span>
                </div>
              )}
              {selected.description && <div className="modal-description">{selected.description}</div>}
              <div className="modal-detail">
                <span className="modal-detail-label">Posted by</span>
                <span>{selected.created_by_name}</span>
              </div>

              {/* Attendees */}
              <div className="modal-attendees">
                <div className="modal-attendees-label">{selected.rsvp_count} attending</div>
                {selected.attendees.length > 0 && (
                  <div className="modal-attendees-list">{selected.attendees.join(', ')}</div>
                )}
              </div>

              {/* RSVP button */}
              <button
                className={`rsvp-btn ${selected.attending ? 'rsvp-btn-out' : 'rsvp-btn-in'}`}
                onClick={() => {
                  const newAttending = !selected.attending;
                  rsvp(selected.id, newAttending);
                }}
              >
                {selected.attending ? "✕ Can't Make It" : "✓ I'm Attending"}
              </button>

              {/* Edit / Delete (own events or founders) */}
              {(selected.created_by_name === member.frat_name || ['Head Founder','Co-Founder','Iron Fleet'].includes(member.role)) && (
                <div style={{ display:'flex', gap:'8px', marginTop:'0.5rem' }}>
                  <button className="btn btn-ghost" style={{ flex:1, justifyContent:'center' }} onClick={()=>openEdit(selected)}>✏️ Edit Event</button>
                  <button className="delete-btn" style={{ flex:'none', width:'auto', padding:'0.5rem 1rem', marginTop:0 }} onClick={()=>deleteEvent(selected.id)}>Delete</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE EVENT MODAL ── */}
      {creating && (
        <div className="modal-overlay" onClick={()=>setCreating(false)}>
          <div className="modal modal-create" onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setCreating(false)}>✕</button>
            <div className="modal-body">
              <div className="modal-title" style={{ fontSize:'1.1rem', marginBottom:'1.5rem' }}>New Event</div>

              {/* Flyer upload */}
              <div className="field-group">
                <label className="field-label">Event Flyer</label>
                <label className={`flyer-upload-zone ${flyerPreview ? 'has-image' : ''}`}>
                  <input ref={flyerRef} type="file" accept="image/*" style={{ display:'none' }} onChange={uploadFlyer} />
                  {flyerPreview ? (
                    <>
                      <img src={flyerPreview} alt="flyer" />
                      <div className="flyer-overlay">
                        <div className="flyer-upload-icon">🖼</div>
                        <div className="flyer-upload-text">{uploading ? 'Uploading...' : 'Click to replace'}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flyer-upload-icon">{uploading ? '⏳' : '🖼'}</div>
                      <div className="flyer-upload-text">{uploading ? 'Uploading...' : 'Upload Event Flyer'}</div>
                      <div className="flyer-upload-hint">JPG, PNG, WebP</div>
                    </>
                  )}
                </label>
              </div>

              <div className="field-group">
                <label className="field-label">Event Title *</label>
                <input className="field-input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Event name..." />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <div className="field-group">
                  <label className="field-label">Date *</label>
                  <input className="field-input" type="date" value={form.event_date} onChange={e=>setForm(f=>({...f,event_date:e.target.value}))} />
                </div>
                <div className="field-group">
                  <label className="field-label">Time <span style={{ color:'var(--gold-dim)', fontWeight:'normal', letterSpacing:'1px' }}>(SLT — Pacific Time)</span></label>
                  <input className="field-input" type="time" value={form.event_time} onChange={e=>setForm(f=>({...f,event_time:e.target.value}))} />
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">SL Location / Sim Name</label>
                <input className="field-input" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="e.g. Kuro Kanda sim" />
              </div>
              <div className="field-group">
                <label className="field-label">SL URL</label>
                <input className="field-input" value={form.sl_url} onChange={e=>setForm(f=>({...f,sl_url:e.target.value}))} placeholder="secondlife:// or maps.secondlife.com link" />
              </div>
              <div className="field-group">
                <label className="field-label">Dress Code</label>
                <input className="field-input" value={form.dress_code} onChange={e=>setForm(f=>({...f,dress_code:e.target.value}))} placeholder="e.g. Formal / Samurai Attire / Casual" />
              </div>
              <div className="field-group">
                <label className="field-label">Description</label>
                <textarea className="field-textarea" style={{ minHeight:'80px' }} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Tell brothers what to expect..." />
              </div>
              <div className="save-bar">
                <button className="btn btn-gold" onClick={createEvent} disabled={saving || !form.title || !form.event_date}>
                  {saving ? 'Saving...' : 'Create Event'}
                </button>
                <button className="btn btn-ghost" onClick={()=>setCreating(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT EVENT MODAL ── */}
      {editing && (
        <div className="modal-overlay" onClick={()=>setEditing(null)}>
          <div className="modal modal-create" onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setEditing(null)}>✕</button>
            <div className="modal-body">
              <div className="modal-title" style={{ fontSize:'1.1rem', marginBottom:'1.5rem' }}>Edit Event</div>
              <div className="field-group">
                <label className="field-label">Event Flyer</label>
                <label className={`flyer-upload-zone ${editForm.flyer_url ? 'has-image' : ''}`}>
                  <input ref={editFlyerRef} type="file" accept="image/*" style={{ display:'none' }} onChange={uploadEditFlyer} />
                  {editForm.flyer_url ? (
                    <>
                      <img src={editForm.flyer_url} alt="flyer" />
                      <div className="flyer-overlay">
                        <div className="flyer-upload-icon">🖼</div>
                        <div className="flyer-upload-text">Click to replace</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flyer-upload-icon">🖼</div>
                      <div className="flyer-upload-text">Upload Event Flyer</div>
                      <div className="flyer-upload-hint">JPG, PNG, WebP</div>
                    </>
                  )}
                </label>
              </div>
              <div className="field-group">
                <label className="field-label">Event Title *</label>
                <input className="field-input" value={editForm.title} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <div className="field-group">
                  <label className="field-label">Date *</label>
                  <input className="field-input" type="date" value={editForm.event_date} onChange={e=>setEditForm(f=>({...f,event_date:e.target.value}))} />
                </div>
                <div className="field-group">
                  <label className="field-label">Time <span style={{ color:'var(--gold-dim)', fontWeight:'normal' }}>(SLT)</span></label>
                  <input className="field-input" type="time" value={editForm.event_time} onChange={e=>setEditForm(f=>({...f,event_time:e.target.value}))} />
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">SL Location / Sim Name</label>
                <input className="field-input" value={editForm.location} onChange={e=>setEditForm(f=>({...f,location:e.target.value}))} />
              </div>
              <div className="field-group">
                <label className="field-label">SL URL</label>
                <input className="field-input" value={editForm.sl_url} onChange={e=>setEditForm(f=>({...f,sl_url:e.target.value}))} />
              </div>
              <div className="field-group">
                <label className="field-label">Dress Code</label>
                <input className="field-input" value={editForm.dress_code} onChange={e=>setEditForm(f=>({...f,dress_code:e.target.value}))} />
              </div>
              <div className="field-group">
                <label className="field-label">Description</label>
                <textarea className="field-textarea" style={{ minHeight:'80px' }} value={editForm.description} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))} />
              </div>
              <div className="save-bar">
                <button className="btn btn-gold" onClick={saveEdit} disabled={editSaving || !editForm.title || !editForm.event_date}>
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn btn-ghost" onClick={()=>setEditing(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
