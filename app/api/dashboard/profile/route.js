import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'ktf_session';

async function getMember(token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id,expires_at`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Accept-Profile': 'members' }
  });
  const sessions = await res.json();
  if (!sessions.length) return null;
  const { member_id, expires_at } = sessions[0];
  if (new Date(expires_at) < new Date()) return null;
  const mRes = await fetch(`${SUPABASE_URL}/rest/v1/roster?id=eq.${member_id}&select=*`, {
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

    // Get profile
    const pRes = await fetch(`${SUPABASE_URL}/rest/v1/member_profiles?member_id=eq.${member.id}&select=*`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Accept-Profile': 'members' }
    });
    const profiles = await pRes.json();
    const profile = profiles[0] || null;

    // Get unread notification count
    const nRes = await fetch(`${SUPABASE_URL}/rest/v1/notifications?member_id=eq.${member.id}&is_read=eq.false&select=id`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Accept-Profile': 'members' }
    });
    const unread = await nRes.json();

    return NextResponse.json({ member, profile, unread_count: unread.length });
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

    const body = await req.json();
    const allowed = ['bio','favourite_quote','hobbies','social_links','layout_preference','accent_colour','banner_url','background_url','portrait_url'];
    const update = {};
    for (const key of allowed) { if (body[key] !== undefined) update[key] = body[key]; }
    update.updated_at = new Date().toISOString();

    // Upsert profile
    const res = await fetch(`${SUPABASE_URL}/rest/v1/member_profiles?member_id=eq.${member.id}`, {
      method: 'GET',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Accept-Profile': 'members' }
    });
    const existing = await res.json();

    if (existing.length) {
      await fetch(`${SUPABASE_URL}/rest/v1/member_profiles?member_id=eq.${member.id}`, {
        method: 'PATCH',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Content-Profile': 'members' },
        body: JSON.stringify(update)
      });
    } else {
      update.member_id = member.id;
      await fetch(`${SUPABASE_URL}/rest/v1/member_profiles`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Content-Profile': 'members' },
        body: JSON.stringify(update)
      });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
