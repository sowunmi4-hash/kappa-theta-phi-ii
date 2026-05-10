import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const C = process.env.SESSION_COOKIE_NAME || 'ktf_session';
const h = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });
const LEADERS = ['Head Founder','Co-Founder','Iron Fleet'];

async function getMember(token) {
  const s = await fetch(`${S}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id`, { headers: h() }).then(r => r.json());
  if (!s.length) return null;
  const m = await fetch(`${S}/rest/v1/roster?id=eq.${s[0].member_id}&select=*`, { headers: h() }).then(r => r.json());
  return m[0] || null;
}

export async function GET() {
  const token = (await cookies()).get(C)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Auto-delete notifications older than 24 hours
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  fetch(`${S}/rest/v1/notifications?member_id=eq.${member.id}&created_at=lt.${cutoff}`, {
    method: 'DELETE',
    headers: h({ 'Content-Profile': 'members' })
  }).catch(() => {});

  const notifs = await fetch(`${S}/rest/v1/notifications?member_id=eq.${member.id}&order=created_at.desc&limit=30`, { headers: h() }).then(r => r.json());
  return NextResponse.json({ notifications: notifs });
}

export async function PATCH(req) {
  const token = (await cookies()).get(C)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  await fetch(`${S}/rest/v1/notifications?id=eq.${id}&member_id=eq.${member.id}`, { method: 'PATCH', headers: h({ 'Content-Type': 'application/json', 'Content-Profile': 'members' }), body: JSON.stringify({ is_read: true }) });
  return NextResponse.json({ success: true });
}

export async function POST(req) {
  const token = (await cookies()).get(C)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member || !LEADERS.includes(member.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { title, message, member_id, broadcast } = await req.json();
  if (broadcast) {
    const all = await fetch(`${S}/rest/v1/roster?select=id`, { headers: h() }).then(r => r.json());
    for (const m of all) await fetch(`${S}/rest/v1/notifications`, { method: 'POST', headers: h({ 'Content-Type': 'application/json', 'Content-Profile': 'members' }), body: JSON.stringify({ title, message, member_id: m.id, created_by: member.id }) });
  } else {
    await fetch(`${S}/rest/v1/notifications`, { method: 'POST', headers: h({ 'Content-Type': 'application/json', 'Content-Profile': 'members' }), body: JSON.stringify({ title, message, member_id, created_by: member.id }) });
  }
  return NextResponse.json({ success: true });
}
