import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const C = process.env.SESSION_COOKIE_NAME || 'ktf_session';
const h = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });
const ch = (x={}) => h({ 'Content-Type': 'application/json', 'Content-Profile': 'members', ...x });
const FOUNDERS = ['Head Founder','Co-Founder','Iron Fleet'];

async function getMember(token) {
  const s = await fetch(`${S}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id,expires_at`, { headers: h() }).then(r => r.json());
  if (!s.length || new Date(s[0].expires_at) < new Date()) return null;
  const m = await fetch(`${S}/rest/v1/roster?id=eq.${s[0].member_id}&select=*`, { headers: h() }).then(r => r.json());
  return m[0] || null;
}

// GET — all events with RSVP data
export async function GET() {
  const token = (await cookies()).get(C)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [events, rsvps] = await Promise.all([
    fetch(`${S}/rest/v1/events?select=*&order=event_date.asc`, { headers: h() }).then(r => r.json()),
    fetch(`${S}/rest/v1/event_rsvps?select=event_id,member_id,member_name`, { headers: h() }).then(r => r.json()),
  ]);

  const enriched = events.map(ev => {
    const evRsvps = rsvps.filter(r => r.event_id === ev.id);
    return { ...ev, rsvp_count: evRsvps.length, attending: evRsvps.some(r => r.member_id === member.id), attendees: evRsvps.map(r => r.member_name).filter(Boolean) };
  });

  return NextResponse.json({ events: enriched, member_id: member.id });
}

// POST — create event or upload flyer
export async function POST(req) {
  const token = (await cookies()).get(C)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentType = req.headers.get('content-type') || '';

  // Flyer upload
  if (contentType.includes('multipart/form-data')) {
    const fd = await req.formData();
    const file = fd.get('file');
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
    const ext = file.name.split('.').pop();
    const filename = `events/${Date.now()}_${member.id}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const up = await fetch(`${S}/storage/v1/object/dashboard/${filename}`, { method: 'POST', headers: { Authorization: `Bearer ${K}`, 'Content-Type': file.type }, body: buf });
    if (!up.ok) return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    return NextResponse.json({ file_url: `${S}/storage/v1/object/public/dashboard/${filename}` });
  }

  // Create event
  const body = await req.json();
  const { title, event_date, event_time, end_time, location, sl_url, dress_code, theme, description, flyer_url } = body;
  if (!title || !event_date) return NextResponse.json({ error: 'Title and date required' }, { status: 400 });

  const res = await fetch(`${S}/rest/v1/events`, {
    method: 'POST',
    headers: ch({ Prefer: 'return=representation' }),
    body: JSON.stringify({ title, event_date, event_time: event_time || null, end_time: end_time || null, location, sl_url, dress_code, theme, description, flyer_url, created_by: member.id, created_by_name: member.frat_name }),
  });
  const data = await res.json();

  // Auto-post to Wokou News
  const dateStr = new Date(event_date + 'T12:00:00').toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const timeStr = event_time ? (() => { const [hr,m] = event_time.split(':'); const h12 = parseInt(hr); return ` at ${h12>12?h12-12:h12||12}:${m} ${h12>=12?'PM':'AM'} SLT`; })() : '';
  await fetch(`${S}/rest/v1/wokou_news`, {
    method: 'POST',
    headers: ch(),
    body: JSON.stringify({
      title: `📅 New Event: ${title}`,
      content: `${member.frat_name} has posted a new event — "${title}" on ${dateStr}${timeStr}.${location ? `\n\nLocation: ${location}` : ''}\n\nHead to the Events page to RSVP.`,
      pinned: false,
      posted_by: member.id,
      posted_by_name: member.frat_name,
    }),
  });

  return NextResponse.json({ success: true, event: data[0] });
}

// PATCH — toggle RSVP OR edit event
export async function PATCH(req) {
  const token = (await cookies()).get(C)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // Mark event as completed/done
  if (body.action === 'complete') {
    const { event_id } = body;
    if (!FOUNDERS.includes(member.role) && member.faction !== 'Ishi No Faction') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await fetch(`${S}/rest/v1/events?id=eq.${event_id}`, {
      method: 'PATCH', headers: ch(),
      body: JSON.stringify({ status: 'completed', completed_at: new Date().toISOString(), completed_by_name: member.frat_name }),
    });
    return NextResponse.json({ success: true });
  }

  // Edit event
  if (body.action === 'edit') {
    const { event_id, title, event_date, event_time, location, sl_url, dress_code, description, flyer_url } = body;
    // Only creator or founders can edit
    const filter = FOUNDERS.includes(member.role)
      ? `id=eq.${event_id}`
      : `id=eq.${event_id}&created_by=eq.${member.id}`;
    await fetch(`${S}/rest/v1/events?${filter}`, {
      method: 'PATCH',
      headers: ch(),
      body: JSON.stringify({ title, event_date, event_time: event_time || null, end_time: end_time || null, location, sl_url, dress_code, theme, description, flyer_url }),
    });
    return NextResponse.json({ success: true });
  }

  // Toggle RSVP
  const { event_id, attending } = body;
  if (attending) {
    await fetch(`${S}/rest/v1/event_rsvps`, {
      method: 'POST',
      headers: ch({ Prefer: 'resolution=ignore-duplicates' }),
      body: JSON.stringify({ event_id, member_id: member.id, member_name: member.frat_name }),
    });
  } else {
    await fetch(`${S}/rest/v1/event_rsvps?event_id=eq.${event_id}&member_id=eq.${member.id}`, {
      method: 'DELETE',
      headers: h({ 'Content-Profile': 'members' }),
    });
  }
  return NextResponse.json({ success: true });
}

// DELETE event
export async function DELETE(req) {
  const token = (await cookies()).get(C)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { event_id } = await req.json();
  const filter = FOUNDERS.includes(member.role) ? `id=eq.${event_id}` : `id=eq.${event_id}&created_by=eq.${member.id}`;
  await fetch(`${S}/rest/v1/events?${filter}`, { method: 'DELETE', headers: h({ 'Content-Profile': 'members' }) });
  return NextResponse.json({ success: true });
}
