import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'ktf_session';

async function getMember(token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Accept-Profile': 'members' }
  });
  const sessions = await res.json();
  if (!sessions.length) return null;
  const mRes = await fetch(`${SUPABASE_URL}/rest/v1/roster?id=eq.${sessions[0].member_id}&select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Accept-Profile': 'members' }
  });
  const members = await mRes.json();
  return members[0] || null;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const member = await getMember(token);
    if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const res = await fetch(`${SUPABASE_URL}/rest/v1/wokou_news?select=*&order=pinned.desc,created_at.desc&limit=50`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Accept-Profile': 'members' }
    });
    const news = await res.json();
    return NextResponse.json({ news, role: member.role });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const member = await getMember(token);
    if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const founderRoles = ['Head Founder', 'Co-Founder', 'Iron Fleet'];
    if (!founderRoles.includes(member.role)) {
      return NextResponse.json({ error: 'Only founders and Iron Fleet can post news' }, { status: 403 });
    }

    const { title, content, pinned } = await req.json();
    await fetch(`${SUPABASE_URL}/rest/v1/wokou_news`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Content-Profile': 'members' },
      body: JSON.stringify({ title, content, pinned: pinned || false, posted_by: member.id, posted_by_name: member.frat_name })
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
