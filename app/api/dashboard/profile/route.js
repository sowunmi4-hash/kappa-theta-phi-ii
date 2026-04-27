import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const C = process.env.SESSION_COOKIE_NAME || 'ktf_session';
const h = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });

async function getMember(token) {
  const s = await fetch(`${S}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id,expires_at`, { headers: h() }).then(r => r.json());
  if (!s.length || new Date(s[0].expires_at) < new Date()) return null;
  const m = await fetch(`${S}/rest/v1/roster?id=eq.${s[0].member_id}&select=*`, { headers: h() }).then(r => r.json());
  return m[0] || null;
}

export async function GET() {
  const token = (await cookies()).get(C)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [profiles, notifs] = await Promise.all([
    fetch(`${S}/rest/v1/member_profiles?member_id=eq.${member.id}&select=*`, { headers: h() }).then(r => r.json()),
    fetch(`${S}/rest/v1/notifications?member_id=eq.${member.id}&is_read=eq.false&select=id`, { headers: h() }).then(r => r.json()),
  ]);
  return NextResponse.json({ member, profile: profiles[0] || null, unread: notifs.length });
}

export async function POST(req) {
  const token = (await cookies()).get(C)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const allowed = ['bio','favourite_quote','hobbies','social_links','banner_url','portrait_url'];
  const data = { updated_at: new Date().toISOString() };
  for (const k of allowed) if (body[k] !== undefined) data[k] = body[k];
  const existing = await fetch(`${S}/rest/v1/member_profiles?member_id=eq.${member.id}`, { headers: h() }).then(r => r.json());
  const ch = h({ 'Content-Type': 'application/json', 'Content-Profile': 'members' });
  if (existing.length) {
    await fetch(`${S}/rest/v1/member_profiles?member_id=eq.${member.id}`, { method: 'PATCH', headers: ch, body: JSON.stringify(data) });
  } else {
    await fetch(`${S}/rest/v1/member_profiles`, { method: 'POST', headers: ch, body: JSON.stringify({ ...data, member_id: member.id }) });
  }
  return NextResponse.json({ success: true });
}
