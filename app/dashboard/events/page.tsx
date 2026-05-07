'use client';
import { useState, useEffect, useRef } from 'react';
import '../dash.css';
import DashSidebar from '../DashSidebar';
import './events.css';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

type Event = {
  id: string; title: string; event_date: string; event_time?: string;
  location?: string; sl_url?: string; dress_code?: string;
  description?: string; flyer_url?: string; created_by_name?: string;
  rsvp_count: number; attending: boolean; attendees: string[];
  status?: string; completed_at?: string; completed_by_name?: string;
};

export default function EventsPage() {
  const [member, setMember]       = useState<any>(null);
  const [profile, setProfile]     = useState<any>(null);
  const [events, setEvents]       = useState<Event[]>([]);
  const [calDate, setCalDate]     = useState(new Date());
  const [selected, setSelected]   = useState<Event | null>(null);
  const [creating, setCreating]   = useState(false);
  const [editing, setEditing]     = useState<Event | null>(null);
  const [uploading, setUploading] = useState(false);
  const [flyerPreview, setFlyerPreview] = useState('');
  const [showPast, setShowPast]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [form, setForm]           = useState({ title:'', event_date:'', event_time:'', location:'', sl_url:'', dress_code:'', description:'', flyer_url:'' });
  const [editForm, setEditForm]   = useState({ title:'', event_date:'', event_time:'', location:'', sl_url:'', dress_code:'', description:'', flyer_url:'' });
  const flyerRef     = useRef<HTMLInputElement>(null);
  const editFlyerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/dashboard/profile').then(r => r.json()).then(d => {
      if (d.error) { window.location.href = '/login'; return; }
      setMember(d.member); setProfile(d.profile || {});
    });
    loadEvents();
  }, []);

  useEffect(() => {
    const poll = setInterval(() => {
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;
      loadEvents();
    }, 30000);
    return () => clearInterval(poll);
  }, []);

  async function loadEvents() {
    const d = await fetch('/api/dashboard/events').then(r => r.json());
    setEvents(d.events || []);
  }

  async function uploadFlyer(e: any) {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true); setFlyerPreview(URL.createObjectURL(file));
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/dashboard/events', { method:'POST', body: fd }).then(r => r.json());
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
    await loadEvents(); setSaving(false);
  }

  async function markDone(event_id: string) {
    await fetch('/api/dashboard/events', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event_id, mark_done: true }) });
    await loadEvents();
  }

  async function rsvp(event_id: string, attending: boolean) {
    await fetch('/api/dashboard/events', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event_id, attending }) });
    const d = await fetch('/api/dashboard/events').then(r => r.json());
    const updated = d.events || [];
    setEvents(updated);
    if (selected?.id === event_id) setSelected(updated.find((e: Event) => e.id === event_id) || null);
  }

  async function deleteEvent(event_id: string) {
    if (!confirm('Delete this event?')) return;
    await fetch('/api/dashboard/events', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event_id }) });
    setSelected(null); await loadEvents();
  }

  function openEdit(ev: Event) {
    setEditForm({ title:ev.title, event_date:ev.event_date, event_time:ev.event_time||'', location:ev.location||'', sl_url:ev.sl_url||'', dress_code:ev.dress_code||'', description:ev.description||'', flyer_url:ev.flyer_url||'' });
    setEditing(ev); setSelected(null);
  }

  async function saveEdit() {
    if (!editing) return; setEditSaving(true);
    await fetch('/api/dashboard/events', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'edit', event_id: editing.id, ...editForm }) });
    setEditing(null); await loadEvents(); setEditSaving(false);
  }

  async function uploadEditFlyer(e: any) {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/dashboard/events', { method:'POST', body: fd }).then(r => r.json());
    if (res.file_url) setEditForm(f => ({ ...f, flyer_url: res.file_url }));
  }

  // Calendar
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const eventsByDate: Record<string, Event[]> = {};
  events.forEach(ev => {
    const d = ev.event_date.split('T')[0];
    if (!eventsByDate[d]) eventsByDate[d] = [];
    eventsByDate[d].push(ev);
  });

  function fmtDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  }
  function fmtTime(t?: string) {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr === 0 ? 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'} SLT`;
  }
  function shortDate(d: string) {
    const dt = new Date(d + 'T12:00:00');
    return { day: dt.getDate(), mon: MONTHS[dt.getMonth()].slice(0, 3).toUpperCase() };
  }

  const upcomingEvents = events.filter(e => e.status !== 'completed' && new Date(e.event_date + 'T23:59:59') >= today);
  const pastEvents     = events.filter(e => e.status === 'completed'  || new Date(e.event_date + 'T23:59:59') < today);

  // Attending members for roll call on selected event
  const rollCall = selected?.attendees || [];

  if (!member) return <div className="dash-loading">LOADING...</div>;
  const canManage = member.role === 'Head Founder' || member.role === 'Co-Founder' || member.fraction === 'Ishi No Fraction';

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />

      <main className="dash-main">
        {/* ── PAGE HEADER ── */}
        <div className="dash-page-header">
          <div className="dash-page-title">Events</div>
          <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
            <span style={{ fontFamily:'var(--cinzel)', fontSize:'.4rem', letterSpacing:'2px', color:'var(--bone-faint)' }}>
              {upcomingEvents.length} upcoming
            </span>
            {canManage && (
              <button className="dash-btn gold-ghost" onClick={() => setCreating(true)}>+ Add Event</button>
            )}
          </div>
        </div>

        {/* ── THREE-COLUMN LAYOUT ── */}
        <div className="ev-layout">

          {/* ── LEFT: Calendar + Roll Call ── */}
          <div className="ev-left">
            {/* Month nav */}
            <div className="ev-cal-nav">
              <button className="ev-cal-nav-btn" onClick={() => setCalDate(new Date(year, month - 1, 1))}>‹</button>
              <span className="ev-cal-month">{MONTHS[month]} {year}</span>
              <button className="ev-cal-nav-btn" onClick={() => setCalDate(new Date(year, month + 1, 1))}>›</button>
            </div>

            {/* Weekday labels */}
            <div className="ev-cal-weekdays">
              {DAYS.map(d => <div key={d} className="ev-cal-weekday">{d.slice(0,1)}</div>)}
            </div>

            {/* Grid */}
            <div className="ev-cal-grid">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className="ev-cal-cell empty" />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const dayEvs  = eventsByDate[dateStr] || [];
                const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                const isSelected = selected?.event_date?.split('T')[0] === dateStr;
                return (
                  <div
                    key={day}
                    className={`ev-cal-cell${isToday ? ' today' : ''}${dayEvs.length ? ' has-events' : ''}${isSelected ? ' selected' : ''}`}
                    onClick={() => dayEvs.length && setSelected(dayEvs[0])}
                  >
                    <span className="ev-cal-day">{day}</span>
                    {dayEvs.length > 0 && <span className="ev-cal-pip" />}
                    {dayEvs.length > 1 && <span className="ev-cal-pip" />}
                  </div>
                );
              })}
            </div>

            {/* RSVP Roll Call */}
            {selected && rollCall.length > 0 && (
              <div className="ev-rollcall">
                <div className="ev-rollcall-label">{selected.rsvp_count} Attending</div>
                <div className="ev-rollcall-names">
                  {rollCall.map((name: string) => (
                    <div key={name} className="ev-rollcall-name">{name}</div>
                  ))}
                </div>
              </div>
            )}
            {selected && rollCall.length === 0 && (
              <div className="ev-rollcall">
                <div className="ev-rollcall-label">No RSVPs yet</div>
              </div>
            )}
          </div>

          {/* ── CENTRE: Event Detail ── */}
          <div className="ev-centre">
            {!selected ? (
              <div className="ev-empty">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(198,147,10,.25)" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                <span>Select an event</span>
              </div>
            ) : (
              <>
                {/* Flyer */}
                {selected.flyer_url && (
                  <div className="ev-detail-flyer">
                    <img src={selected.flyer_url} alt="flyer" />
                  </div>
                )}

                {/* Hero */}
                <div className="ev-detail-hero">
                  <span className="dash-corner tl" /><span className="dash-corner tr" />
                  <span className="dash-corner bl" /><span className="dash-corner br" />
                  <div className="ev-detail-title">{selected.title}</div>
                  <div className="ev-detail-date">{fmtDate(selected.event_date)}{selected.event_time ? ` · ${fmtTime(selected.event_time)}` : ''}</div>
                  {selected.status === 'completed' && (
                    <span className="ev-done-badge">✓ Completed</span>
                  )}
                </div>

                {/* Meta */}
                <div className="ev-detail-body">
                  {(selected.location || selected.dress_code) && (
                    <div className="ev-meta-grid">
                      {selected.location && (
                        <div className="ev-meta-row">
                          <span className="ev-meta-key">Location</span>
                          {selected.sl_url
                            ? <a href={selected.sl_url} target="_blank" rel="noopener noreferrer" className="ev-meta-link">{selected.location}</a>
                            : <span className="ev-meta-val">{selected.location}</span>
                          }
                        </div>
                      )}
                      {selected.dress_code && (
                        <div className="ev-meta-row">
                          <span className="ev-meta-key">Dress Code</span>
                          <span className="ev-meta-val">{selected.dress_code}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {selected.description && (
                    <div className="ev-detail-desc">{selected.description}</div>
                  )}

                  {/* RSVP buttons */}
                  {selected.status !== 'completed' && (
                    <div className="ev-rsvp-row">
                      <button
                        className={`ev-rsvp-btn yes${selected.attending ? ' active' : ''}`}
                        onClick={() => rsvp(selected.id, true)}
                      >✓ Yes</button>
                      <button
                        className={`ev-rsvp-btn no${!selected.attending ? ' active' : ''}`}
                        onClick={() => rsvp(selected.id, false)}
                      >✕ Can't Make It</button>
                    </div>
                  )}

                  {/* Manage buttons */}
                  {(selected.created_by_name === member.frat_name || canManage) && (
                    <div className="ev-manage-row">
                      <button className="dash-btn ghost" style={{ fontSize:'.36rem', padding:'.28rem .65rem' }} onClick={() => openEdit(selected)}>✏ Edit</button>
                      {canManage && selected.status !== 'completed' && (
                        <button className="dash-btn ghost" style={{ fontSize:'.36rem', padding:'.28rem .65rem', color:'var(--green)', borderColor:'rgba(74,222,128,.25)' }} onClick={() => markDone(selected.id)}>✓ Mark Done</button>
                      )}
                      <button className="dash-btn danger" style={{ fontSize:'.36rem', padding:'.28rem .65rem' }} onClick={() => deleteEvent(selected.id)}>Delete</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── RIGHT: All Events sidebar ── */}
          <div className="ev-right">
            <div className="ev-right-hdr">
              <span className="dash-clbl" style={{ margin:0 }}>Upcoming</span>
              <span style={{ fontFamily:'var(--display)', fontSize:'.78rem', color:'var(--bone-faint)' }}>{upcomingEvents.length}</span>
            </div>

            <div className="ev-right-list">
              {upcomingEvents.length === 0 && (
                <div className="ev-right-empty">No upcoming events</div>
              )}
              {upcomingEvents.map(ev => {
                const { day, mon } = shortDate(ev.event_date);
                return (
                  <div
                    key={ev.id}
                    className={`ev-right-item${selected?.id === ev.id ? ' selected' : ''}`}
                    onClick={() => setSelected(ev)}
                  >
                    <div className="ev-right-date">
                      <div className="ev-right-day">{day}</div>
                      <div className="ev-right-mon">{mon}</div>
                    </div>
                    <div className="ev-right-info">
                      <div className="ev-right-title">{ev.title}</div>
                      {ev.event_time && <div className="ev-right-time">{fmtTime(ev.event_time)}</div>}
                      <div className="ev-right-rsvp">{ev.rsvp_count} attending{ev.attending ? ' · ✓ You' : ''}</div>
                    </div>
                  </div>
                );
              })}

              {/* Past events toggle */}
              {pastEvents.length > 0 && (
                <>
                  <button
                    className="ev-past-toggle"
                    onClick={() => setShowPast(p => !p)}
                  >
                    {showPast ? '▼' : '▶'} {pastEvents.length} Past
                  </button>
                  {showPast && pastEvents.map(ev => {
                    const { day, mon } = shortDate(ev.event_date);
                    return (
                      <div
                        key={ev.id}
                        className={`ev-right-item past${selected?.id === ev.id ? ' selected' : ''}`}
                        onClick={() => setSelected(ev)}
                      >
                        <div className="ev-right-date">
                          <div className="ev-right-day">{day}</div>
                          <div className="ev-right-mon">{mon}</div>
                        </div>
                        <div className="ev-right-info">
                          <div className="ev-right-title">{ev.title}</div>
                          <div className="ev-right-rsvp" style={{ color: ev.status === 'completed' ? 'var(--green)' : 'var(--bone-faint)' }}>
                            {ev.status === 'completed' ? '✓ Done' : 'Past'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── CREATE EVENT MODAL ── */}
      {creating && (
        <div className="ev-modal-overlay" onClick={() => setCreating(false)}>
          <div className="ev-modal" onClick={e => e.stopPropagation()}>
            <div className="ev-modal-hdr">
              <span className="dash-page-title" style={{ fontSize:'.9rem', letterSpacing:'3px' }}>New Event</span>
              <button className="ev-modal-close" onClick={() => setCreating(false)}>✕</button>
            </div>
            <div className="ev-modal-body">
              <label className="ev-flyer-zone">
                <input ref={flyerRef} type="file" accept="image/*" style={{ display:'none' }} onChange={uploadFlyer} />
                {flyerPreview
                  ? <img src={flyerPreview} alt="flyer" style={{ maxHeight:'100px', objectFit:'contain', borderRadius:'2px' }} />
                  : <><div style={{ fontSize:'.85rem', color:'rgba(198,147,10,.4)' }}>🖼</div>
                     <span style={{ fontFamily:'var(--cinzel)', fontSize:'.38rem', letterSpacing:'2px', color:'rgba(198,147,10,.4)' }}>{uploading ? 'Uploading...' : 'Upload Flyer'}</span></>
                }
              </label>
              <div><label className="dash-field-label">Title *</label><input className="dash-input" value={form.title} onChange={e => setForm(f => ({ ...f, title:e.target.value }))} placeholder="Event name..." /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.6rem' }}>
                <div><label className="dash-field-label">Date *</label><input className="dash-input" type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date:e.target.value }))} /></div>
                <div><label className="dash-field-label">Time (SLT)</label><input className="dash-input" type="time" value={form.event_time} onChange={e => setForm(f => ({ ...f, event_time:e.target.value }))} /></div>
              </div>
              <div><label className="dash-field-label">SL Location / Sim</label><input className="dash-input" value={form.location} onChange={e => setForm(f => ({ ...f, location:e.target.value }))} placeholder="e.g. Kuro Kanda sim" /></div>
              <div><label className="dash-field-label">SL URL</label><input className="dash-input" value={form.sl_url} onChange={e => setForm(f => ({ ...f, sl_url:e.target.value }))} placeholder="secondlife:// link" /></div>
              <div><label className="dash-field-label">Dress Code</label><input className="dash-input" value={form.dress_code} onChange={e => setForm(f => ({ ...f, dress_code:e.target.value }))} placeholder="e.g. Formal / Samurai Attire" /></div>
              <div><label className="dash-field-label">Description</label><textarea className="dash-textarea" style={{ minHeight:'70px' }} value={form.description} onChange={e => setForm(f => ({ ...f, description:e.target.value }))} placeholder="What to expect..." /></div>
              <div style={{ display:'flex', gap:'.5rem', paddingTop:'.5rem' }}>
                <button className="dash-btn gold-solid" onClick={createEvent} disabled={saving || !form.title || !form.event_date}>{saving ? 'Saving...' : 'Create Event'}</button>
                <button className="dash-btn ghost" onClick={() => setCreating(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT EVENT MODAL ── */}
      {editing && (
        <div className="ev-modal-overlay" onClick={() => setEditing(null)}>
          <div className="ev-modal" onClick={e => e.stopPropagation()}>
            <div className="ev-modal-hdr">
              <span className="dash-page-title" style={{ fontSize:'.9rem', letterSpacing:'3px' }}>Edit Event</span>
              <button className="ev-modal-close" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="ev-modal-body">
              <label className="ev-flyer-zone">
                <input ref={editFlyerRef} type="file" accept="image/*" style={{ display:'none' }} onChange={uploadEditFlyer} />
                {editForm.flyer_url
                  ? <img src={editForm.flyer_url} alt="flyer" style={{ maxHeight:'100px', objectFit:'contain', borderRadius:'2px' }} />
                  : <><div style={{ fontSize:'.85rem', color:'rgba(198,147,10,.4)' }}>🖼</div>
                     <span style={{ fontFamily:'var(--cinzel)', fontSize:'.38rem', letterSpacing:'2px', color:'rgba(198,147,10,.4)' }}>Upload Flyer</span></>
                }
              </label>
              <div><label className="dash-field-label">Title *</label><input className="dash-input" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title:e.target.value }))} /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.6rem' }}>
                <div><label className="dash-field-label">Date *</label><input className="dash-input" type="date" value={editForm.event_date} onChange={e => setEditForm(f => ({ ...f, event_date:e.target.value }))} /></div>
                <div><label className="dash-field-label">Time (SLT)</label><input className="dash-input" type="time" value={editForm.event_time} onChange={e => setEditForm(f => ({ ...f, event_time:e.target.value }))} /></div>
              </div>
              <div><label className="dash-field-label">SL Location</label><input className="dash-input" value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location:e.target.value }))} /></div>
              <div><label className="dash-field-label">SL URL</label><input className="dash-input" value={editForm.sl_url} onChange={e => setEditForm(f => ({ ...f, sl_url:e.target.value }))} /></div>
              <div><label className="dash-field-label">Dress Code</label><input className="dash-input" value={editForm.dress_code} onChange={e => setEditForm(f => ({ ...f, dress_code:e.target.value }))} /></div>
              <div><label className="dash-field-label">Description</label><textarea className="dash-textarea" style={{ minHeight:'70px' }} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description:e.target.value }))} /></div>
              <div style={{ display:'flex', gap:'.5rem', paddingTop:'.5rem' }}>
                <button className="dash-btn gold-solid" onClick={saveEdit} disabled={editSaving || !editForm.title || !editForm.event_date}>{editSaving ? 'Saving...' : 'Save Changes'}</button>
                <button className="dash-btn ghost" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
