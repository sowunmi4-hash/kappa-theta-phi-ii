import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const C = process.env.SESSION_COOKIE_NAME || 'ktf_session';
const h = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });
const LEADERS = ['Head Founder','Co-Founder','Co-Founder','Iron Fleet'];

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
  const news = await fetch(`${S}/rest/v1/wokou_news?select=*&order=pinned.desc,created_at.desc&limit=50`, { headers: h() }).then(r => r.json());
  return NextResponse.json({ news, role: member.role });
}

export async function POST(req) {
  const token = (await cookies()).get(C)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member || !LEADERS.includes(member.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { title, content, pinned } = await req.json();
  await fetch(`${S}/rest/v1/wokou_news`, { method: 'POST', headers: h({ 'Content-Type': 'application/json', 'Content-Profile': 'members' }), body: JSON.stringify({ title, content, pinned: !!pinned, posted_by: member.id, posted_by_name: member.frat_name }) });
  return NextResponse.json({ success: true });
}
