'use client';
import { useState, useEffect, useRef } from 'react';
import '../dash.css';
import DashSidebar from '../DashSidebar';
import './events.css';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

type Event = {
  id: string; title: string; event_date: string; event_time?: string; end_time?: string; theme?: string;
  location?: string; sl_url?: string; dress_code?: string;
  description?: string; flyer_url?: string; created_by_name?: string;
  rsvp_count: number; attending: boolean; attendees: string[];
  status?: string; completed_at?: string; completed_by_name?: string;
};

const FACTION_COLORS: Record<string,string> = { default: '#c6930a' };

// ── Live countdown component ──
function Countdown({ event }: { event: Event }) {
  const [diff, setDiff] = useState<number>(0);

  useEffect(() => {
    function calc() {
      const dateStr = event.event_date.split('T')[0];
      const [y, mo, d] = dateStr.split('-').map(Number);
      let startMs: number;
      if (event.event_time) {
        const [h, m] = event.event_time.split(':').map(Number);
        startMs = new Date(y, mo - 1, d, h, m || 0, 0).getTime();
      } else {
        startMs = new Date(y, mo - 1, d, 0, 0, 0).getTime();
      }
      setDiff(startMs - Date.now());
    }
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [event.event_date, event.event_time]);

  if (!event.event_time && diff > 86400000) return null; // no time set, only show if ≤24h away

  const abs   = Math.abs(diff);
  const days  = Math.floor(abs / 86400000);
  const hrs   = Math.floor((abs % 86400000) / 3600000);
  const mins  = Math.floor((abs % 3600000) / 60000);
  const secs  = Math.floor((abs % 60000) / 1000);

  const withinHour = diff > 0 && diff <= 3600000;
  const started    = diff <= 0 && diff > -7200000; // started within last 2hrs
  const live       = diff <= 0 && diff > -300000;   // within last 5 mins = "live"

  if (live) return (
    <div className="ev-countdown live">
      <span className="ev-countdown-pulse" />
      <span className="ev-countdown-label">Event is Live Now</span>
    </div>
  );

  if (started) return (
    <div className="ev-countdown started">
      <span className="ev-countdown-label">Started {hrs > 0 ? `${hrs}h ` : ''}{mins}m ago</span>
    </div>
  );

  if (diff <= 0) return null; // event ended long ago

  if (withinHour) return (
    <div className="ev-countdown urgent">
      <span className="ev-countdown-pulse urgent" />
      <span className="ev-countdown-label">⚠ Starting in {mins}m {String(secs).padStart(2,'0')}s</span>
      <span className="ev-countdown-reminder">1hr reminder — get ready</span>
    </div>
  );

  return (
    <div className="ev-countdown normal">
      <span className="ev-countdown-label">Starts in</span>
      <div className="ev-countdown-units">
        {days > 0 && <><span className="ev-countdown-num">{days}</span><span className="ev-countdown-unit">d</span></>}
        <span className="ev-countdown-num">{String(hrs).padStart(2,'0')}</span><span className="ev-countdown-unit">h</span>
        <span className="ev-countdown-num">{String(mins).padStart(2,'0')}</span><span className="ev-countdown-unit">m</span>
        <span className="ev-countdown-num">{String(secs).padStart(2,'0')}</span><span className="ev-countdown-unit">s</span>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [member, setMember]       = useState<any>(null);
  const [profile, setProfile]     = useState<any>(null);
  const [events, setEvents]       = useState<Event[]>([]);
  const [calDate, setCalDate]     = useState(new Date());
  const [selected, setSelected]   = useState<Event | null>(null);
  const [rsvpLocal, setRsvpLocal] = useState<'yes'|'maybe'|'no'|null>(null);
  const [creating, setCreating]   = useState(false);
  const [editing, setEditing]     = useState<Event | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [form, setForm]     = useState({ title:'', event_date:'', event_time:'', end_time:'', location:'', sl_url:'', dress_code:'', theme:'', description:'', flyer_url:'' });
  const [editForm, setEditForm] = useState({ title:'', event_date:'', event_time:'', end_time:'', location:'', sl_url:'', dress_code:'', theme:'', description:'', flyer_url:'' });
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

  // Sync rsvpLocal when selection changes
  useEffect(() => {
    if (selected) setRsvpLocal(selected.attending ? 'yes' : null);
    else setRsvpLocal(null);
  }, [selected?.id]);

  async function loadEvents() {
    const d = await fetch('/api/dashboard/events').then(r => r.json());
    const evs = d.events || [];
    setEvents(evs);
    // Keep selected fresh
    if (selected) {
      const fresh = evs.find((e: Event) => e.id === selected.id);
      if (fresh) setSelected(fresh);
    }
  }

  async function uploadFlyer(e: any, isEdit = false) {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/dashboard/events', { method:'POST', body: fd }).then(r => r.json());
    if (res.file_url) {
      if (isEdit) setEditForm(f => ({ ...f, flyer_url: res.file_url }));
      else setForm(f => ({ ...f, flyer_url: res.file_url }));
    }
    setUploading(false);
  }

  async function createEvent() {
    if (!form.title || !form.event_date) return;
    setSaving(true);
    await fetch('/api/dashboard/events', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
    setCreating(false);
    setForm({ title:'', event_date:'', event_time:'', end_time:'', location:'', sl_url:'', dress_code:'', theme:'', description:'', flyer_url:'' });
    await loadEvents(); setSaving(false);
  }

  async function markDone(event_id: string) {
    await fetch('/api/dashboard/events', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event_id, mark_done: true }) });
    await loadEvents();
  }

  async function handleRsvp(status: 'yes'|'maybe'|'no') {
    if (!selected) return;
    setRsvpLocal(status);
    const attending = status === 'yes';
    await fetch('/api/dashboard/events', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event_id: selected.id, attending }) });
    await loadEvents();
  }

  async function deleteEvent(event_id: string) {
    if (!confirm('Delete this event?')) return;
    await fetch('/api/dashboard/events', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event_id }) });
    setSelected(null); await loadEvents();
  }

  function openEdit(ev: Event) {
    setEditForm({ title:ev.title, event_date:ev.event_date, event_time:ev.event_time||'', end_time:ev.end_time||'', location:ev.location||'', sl_url:ev.sl_url||'', dress_code:ev.dress_code||'', theme:ev.theme||'', description:ev.description||'', flyer_url:ev.flyer_url||'' });
    setEditing(ev); setSelected(null);
  }

  async function saveEdit() {
    if (!editing) return; setEditSaving(true);
    await fetch('/api/dashboard/events', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'edit', event_id: editing.id, ...editForm }) });
    setEditing(null); await loadEvents(); setEditSaving(false);
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

  function fmtTime(t?: string) {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr === 0 ? 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'} SLT`;
  }

  const upcomingEvents = events.filter(e => e.status !== 'completed' && new Date(e.event_date + 'T23:59:59') >= today);
  const completedEvents = events.filter(e => e.status === 'completed' || new Date(e.event_date + 'T23:59:59') < today);
  const nextEvent = upcomingEvents[0] || null;

  // Selected event date parts
  const selDate = selected ? new Date(selected.event_date + 'T12:00:00') : null;
  const selDay   = selDate?.getDate();
  const selMonth = selDate ? MONTHS[selDate.getMonth()].toUpperCase() : '';
  const selYear  = selDate?.getFullYear();
  const selDow   = selDate?.toLocaleDateString('en-GB', { weekday:'long' });

  if (!member) return <div className="dash-loading">LOADING...</div>;
  const canManage = member.role === 'Head Founder' || member.role === 'Co-Founder' || member.fraction === 'Ishi No Faction';

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />

      <main className="dash-main">
        {/* ── HEADER ── */}
        <div className="dash-page-header">
          <div className="dash-page-title">Events</div>
          <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
            <span style={{ fontFamily:'var(--cinzel)', fontSize:'.4rem', letterSpacing:'2px', color:'var(--bone-faint)' }}>{upcomingEvents.length} upcoming</span>
            <button className="dash-btn gold-ghost" onClick={() => setCreating(true)}>+ Add Event</button>
          </div>
        </div>

        {/* ── THREE COLUMNS ── */}
        <div className="ev-layout">

          {/* ── LEFT: Calendar + Roll Call ── */}
          <div className="ev-left">
            {/* Month nav */}
            <div className="ev-cal-nav">
              <button className="ev-cal-arrow" onClick={() => setCalDate(new Date(year, month - 1, 1))}>‹</button>
              <span className="ev-cal-month">{MONTHS[month].toUpperCase()} {year}</span>
              <button className="ev-cal-arrow" onClick={() => setCalDate(new Date(year, month + 1, 1))}>›</button>
            </div>

            {/* Day labels */}
            <div className="ev-cal-days">
              {DAYS.map(d => <div key={d} className="ev-cal-dayname">{d}</div>)}
            </div>

            {/* Grid */}
            <div className="ev-cal-grid">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className="ev-cal-cell empty" />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const dayEvs = eventsByDate[dateStr] || [];
                const isToday = today.getDate()===day && today.getMonth()===month && today.getFullYear()===year;
                const isSel = selected?.event_date?.split('T')[0] === dateStr;
                return (
                  <div
                    key={day}
                    className={`ev-cal-cell${isToday?' today':''}${dayEvs.length?' has-ev':''}${isSel?' sel':''}`}
                    onClick={() => dayEvs.length && setSelected(dayEvs[0])}
                  >
                    <span className="ev-cal-num">{day}</span>
                    {dayEvs.length > 0 && <span className="ev-cal-dot" />}
                  </div>
                );
              })}
            </div>

            {/* Roll Call */}
            <div className="ev-rollcall">
              <div className="ev-rollcall-hdr">
                <span className="ev-rollcall-lbl">Roll Call</span>
                {selected && <span className="ev-rollcall-count">{selected.rsvp_count}/{events.length > 0 ? Math.max(selected.rsvp_count, 8) : 8}</span>}
              </div>

              {/* RSVP buttons */}
              {selected && selected.status !== 'completed' && (
                <div className="ev-rsvp-btns">
                  <button
                    className={`ev-rsvp-btn yes${rsvpLocal==='yes'?' active':''}`}
                    onClick={() => handleRsvp('yes')}
                  >
                    <span className="ev-rsvp-icon">✓</span>
                    <span>Yes</span>
                  </button>
                  <button
                    className={`ev-rsvp-btn maybe${rsvpLocal==='maybe'?' active':''}`}
                    onClick={() => handleRsvp('maybe')}
                  >
                    <span className="ev-rsvp-icon">?</span>
                    <span>Maybe</span>
                  </button>
                  <button
                    className={`ev-rsvp-btn cant${rsvpLocal==='no'?' active':''}`}
                    onClick={() => handleRsvp('no')}
                  >
                    <span className="ev-rsvp-icon">✕</span>
                    <span>Can't</span>
                  </button>
                </div>
              )}

              {/* Attendee list */}
              {selected && (() => {
                // Build display list: API attendees (Yes) + current user if maybe/cant
                const memberName = member?.frat_name || '';
                const alreadyInList = selected.attendees.includes(memberName);
                const showMaybeEntry = !alreadyInList && (rsvpLocal === 'maybe' || rsvpLocal === 'no');
                const extraEntry = showMaybeEntry ? [{ name: memberName, status: rsvpLocal === 'maybe' ? 'Maybe' : "Can't" }] : [];
                const allEntries = [
                  ...extraEntry,
                  ...selected.attendees.map((name: string) => ({ name, status: 'Yes' })),
                ];
                return allEntries.length > 0 ? (
                  <div className="ev-attendee-list">
                    {allEntries.map(({ name, status }) => (
                      <div key={name} className="ev-attendee-row">
                        <span className="ev-attendee-dot" style={{
                          background: status === 'Yes' ? 'var(--green)' : status === 'Maybe' ? 'var(--gold)' : '#e05070'
                        }} />
                        <span className="ev-attendee-name">{name}</span>
                        <span className="ev-attendee-status" style={{
                          color: status === 'Yes' ? 'var(--green)' : status === 'Maybe' ? 'var(--gold-b)' : '#e05070'
                        }}>{status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ev-rollcall-empty">No RSVPs yet</div>
                );
              })()}
              {!selected && (
                <div className="ev-rollcall-empty">Select an event</div>
              )}
            </div>
          </div>

          {/* ── CENTRE: Event Detail or Create Form ── */}
          <div className="ev-centre">
            {creating ? (
              /* ── INLINE CREATE FORM ── */
              <div className="ev-create-form">
                <div className="ev-create-hdr">
                  <span className="ev-create-title">New Event</span>
                  <button className="ev-create-close" onClick={() => setCreating(false)}>✕</button>
                </div>
                <div className="ev-create-body">
                  <div className="ev-create-field">
                    <label className="ev-create-label">Event Title *</label>
                    <input className="ev-create-input" value={form.title} onChange={e => setForm(f => ({ ...f, title:e.target.value }))} placeholder="e.g. Brotherhood Night — June 2026" />
                  </div>
                  <div className="ev-create-row">
                    <div className="ev-create-field">
                      <label className="ev-create-label">Date *</label>
                      <input className="ev-create-input" type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date:e.target.value }))} />
                    </div>
                    <div className="ev-create-field">
                      <label className="ev-create-label">Start Time</label>
                      <input className="ev-create-input" type="time" value={form.event_time} onChange={e => setForm(f => ({ ...f, event_time:e.target.value }))} />
                    </div>
                    <div className="ev-create-field">
                      <label className="ev-create-label">End Time</label>
                      <input className="ev-create-input" type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time:e.target.value }))} />
                    </div>
                  </div>
                  <div className="ev-create-row">
                    <div className="ev-create-field">
                      <label className="ev-create-label">Location (SL)</label>
                      <input className="ev-create-input" value={form.location} onChange={e => setForm(f => ({ ...f, location:e.target.value }))} placeholder="e.g. Kuro Kanda sim" />
                    </div>
                    <div className="ev-create-field">
                      <label className="ev-create-label">Attendance</label>
                      <input className="ev-create-input" value={form.dress_code} onChange={e => setForm(f => ({ ...f, dress_code:e.target.value }))} placeholder="e.g. All Brothers Required" />
                    </div>
                  </div>
                  <div className="ev-create-field">
                    <label className="ev-create-label">SL Teleport URL</label>
                    <input className="ev-create-input" value={form.sl_url} onChange={e => setForm(f => ({ ...f, sl_url:e.target.value }))} placeholder="secondlife://..." />
                  </div>
                  <div className="ev-create-field">
                    <label className="ev-create-label">Description</label>
                    <textarea className="ev-create-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description:e.target.value }))} placeholder="Tell brothers about this event..." />
                  </div>
                  <div className="ev-create-field">
                    <label className="ev-create-label">Theme</label>
                    <input className="ev-create-input" value={editForm.theme} onChange={e => setEditForm(f => ({ ...f, theme:e.target.value }))} placeholder="e.g. Black & Gold, Tropical, Formal" />
                  </div>
                  <div className="ev-create-field">
                    <label className="ev-create-label">Event Flyer (Optional)</label>
                    <label className="ev-create-flyer">
                      <input ref={flyerRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => uploadFlyer(e, false)} />
                      {form.flyer_url
                        ? <img src={form.flyer_url} alt="flyer" style={{ maxHeight:'120px', objectFit:'contain', borderRadius:'2px' }} />
                        : <>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(198,147,10,.35)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                            <span className="ev-create-flyer-lbl">{uploading ? 'Uploading...' : 'Click to Upload Flyer'}</span>
                            <span className="ev-create-flyer-hint">JPG, PNG or WebP — max 5MB</span>
                          </>
                      }
                    </label>
                  </div>
                  <button className="ev-create-submit" onClick={createEvent} disabled={saving || !form.title || !form.event_date}>
                    {saving ? 'Creating...' : 'Create Event →'}
                  </button>
                </div>
              </div>
            ) : !selected ? (
              <div className="ev-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(198,147,10,.2)" strokeWidth="1.2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                <span>Select an event from the calendar<br/>or the sidebar</span>
              </div>
            ) : (
              <div className="ev-detail-wrap">
                {/* Flyer — full natural proportions */}
                {selected.flyer_url && (
                  <div className="ev-flyer-wrap">
                    <img src={selected.flyer_url} alt="flyer" className="ev-flyer-img" />
                  </div>
                )}

                {/* Info card below flyer */}
                <div className="ev-info-card">
                  {/* Date + badges row */}
                  <div className="ev-date-row">
                    <div className="ev-date-day">{selDay}</div>
                    <div className="ev-date-right">
                      <div className="ev-date-month">{selMonth}</div>
                      <div className="ev-date-year">{selYear}</div>
                    </div>
                    <div className="ev-date-badges">
                      {selected.status === 'completed'
                        ? <span className="ev-badge completed">Completed</span>
                        : <span className="ev-badge upcoming">Upcoming</span>
                      }
                      {selected.dress_code && (
                        <span className="ev-badge dress">{selected.dress_code}</span>
                      )}
                    </div>
                  </div>

                  {/* Countdown */}
                  {selected.status !== 'completed' && <Countdown event={selected} />}

                  {/* Title + location */}
                  <div className="ev-title">{selected.title}</div>
                  {selected.location && (
                    <div className="ev-location">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span>{selected.location}{selected.event_time ? ` · ${fmtTime(selected.event_time)}` : ''}</span>
                    </div>
                  )}

                  {/* Description */}
                  {selected.description && (
                    <div className="ev-description">{selected.description}</div>
                  )}

                  {/* Meta grid */}
                  <div className="ev-meta-grid">
                    {selected.event_time && (
                      <div className="ev-meta-cell">
                        <div className="ev-meta-key">Time</div>
                        <div className="ev-meta-val">{fmtTime(selected.event_time)}{selected.end_time ? ' — ' + fmtTime(selected.end_time) : ''} SLT</div>
                      </div>
                    )}
                    {selected.theme && (
                      <div className="ev-meta-cell">
                        <div className="ev-meta-key">Theme</div>
                        <div className="ev-meta-val">{selected.theme}</div>
                      </div>
                    )}
                    {selected.dress_code && (
                      <div className="ev-meta-cell">
                        <div className="ev-meta-key">Attendance</div>
                        <div className="ev-meta-val">{selected.dress_code}</div>
                      </div>
                    )}
                    {selected.created_by_name && (
                      <div className="ev-meta-cell">
                        <div className="ev-meta-key">Created By</div>
                        <div className="ev-meta-val">{selected.created_by_name}</div>
                      </div>
                    )}
                    <div className="ev-meta-cell">
                      <div className="ev-meta-key">Attending</div>
                      <div className="ev-meta-val" style={{ color:'var(--green)' }}>{selected.rsvp_count} confirmed</div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="ev-action-row">
                    {selected.status !== 'completed' && (
                      <button
                        className={`ev-action-btn rsvp${rsvpLocal === 'yes' ? ' active' : ''}`}
                        onClick={() => handleRsvp(rsvpLocal === 'yes' ? 'no' : 'yes')}
                      >
                        {rsvpLocal === 'yes' ? '✓ RSVPed' : 'RSVP →'}
                      </button>
                    )}
                    {selected.sl_url && (
                      <a href={selected.sl_url} target="_blank" rel="noopener noreferrer" className="ev-action-btn teleport">
                        Teleport →
                      </a>
                    )}
                  </div>

                  {/* Manage */}
                  {(selected.created_by_name === member.frat_name || canManage) && (
                    <div className="ev-manage-row">
                      <button className="dash-btn ghost" style={{ fontSize:'.65rem', padding:'.35rem .8rem' }} onClick={() => openEdit(selected)}>✏ Edit</button>
                      {canManage && selected.status !== 'completed' && (
                        <button className="dash-btn ghost" style={{ fontSize:'.65rem', padding:'.35rem .8rem', color:'var(--green)', borderColor:'rgba(74,222,128,.25)' }} onClick={() => markDone(selected.id)}>✓ Mark Done</button>
                      )}
                      <button className="dash-btn danger" style={{ fontSize:'.65rem', padding:'.35rem .8rem' }} onClick={() => deleteEvent(selected.id)}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ── EDIT MODAL ── */}
      {editing && (
        <div className="ev-modal-overlay" onClick={() => setEditing(null)}>
          <div className="ev-modal" onClick={e => e.stopPropagation()}>
            <div className="ev-modal-hdr">
              <span className="dash-page-title" style={{ fontSize:'.85rem', letterSpacing:'3px' }}>Edit Event</span>
              <button className="ev-modal-close" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="ev-modal-body">
              <label className="ev-flyer-zone">
                <input ref={editFlyerRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => uploadFlyer(e, true)} />
                {editForm.flyer_url
                  ? <img src={editForm.flyer_url} alt="flyer" style={{ maxHeight:'90px', objectFit:'contain' }} />
                  : <><div style={{ fontSize:'.8rem', color:'rgba(198,147,10,.4)' }}>🖼</div><span style={{ fontFamily:'var(--cinzel)', fontSize:'.36rem', letterSpacing:'2px', color:'rgba(198,147,10,.4)' }}>Upload Flyer</span></>
                }
              </label>
              <div><label className="dash-field-label">Title *</label><input className="dash-input" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title:e.target.value }))} /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.6rem' }}>
                <div><label className="dash-field-label">Date *</label><input className="dash-input" type="date" value={editForm.event_date} onChange={e => setEditForm(f => ({ ...f, event_date:e.target.value }))} /></div>
                <div><label className="dash-field-label">Start Time (SLT)</label><input className="dash-input" type="time" value={editForm.event_time} onChange={e => setEditForm(f => ({ ...f, event_time:e.target.value }))} /></div>
                <div><label className="dash-field-label">End Time (SLT)</label><input className="dash-input" type="time" value={editForm.end_time} onChange={e => setEditForm(f => ({ ...f, end_time:e.target.value }))} /></div>
              </div>
              <div><label className="dash-field-label">SL Location</label><input className="dash-input" value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location:e.target.value }))} /></div>
              <div><label className="dash-field-label">SL URL</label><input className="dash-input" value={editForm.sl_url} onChange={e => setEditForm(f => ({ ...f, sl_url:e.target.value }))} /></div>
              <div><label className="dash-field-label">Attendance</label><input className="dash-input" value={editForm.dress_code} onChange={e => setEditForm(f => ({ ...f, dress_code:e.target.value }))} /></div>
              <div><label className="dash-field-label">Description</label><textarea className="dash-textarea" style={{ minHeight:'70px' }} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description:e.target.value }))} /></div>
              <div style={{ display:'flex', gap:'.5rem', paddingTop:'.4rem' }}>
                <button className="dash-btn gold-solid" onClick={saveEdit} disabled={editSaving}>{editSaving ? 'Saving...' : 'Save Changes'}</button>
                <button className="dash-btn ghost" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
