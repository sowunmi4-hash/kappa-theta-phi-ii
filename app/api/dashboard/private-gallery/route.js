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

    const res = await fetch(`${SUPABASE_URL}/rest/v1/private_gallery?member_id=eq.${member.id}&order=created_at.desc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Accept-Profile': 'members' }
    });
    const items = await res.json();
    return NextResponse.json({ items });
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

    const formData = await req.formData();
    const file = formData.get('file');
    const caption = formData.get('caption') || '';
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const ext = file.name.split('.').pop();
    const filename = `private/${member.id}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/dashboard/${filename}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': file.type },
      body: buffer
    });
    if (!uploadRes.ok) return NextResponse.json({ error: 'Upload failed' }, { status: 500 });

    const file_url = `${SUPABASE_URL}/storage/v1/object/public/dashboard/${filename}`;
    const file_type = file.type.startsWith('video') ? 'video' : 'image';

    await fetch(`${SUPABASE_URL}/rest/v1/private_gallery`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Content-Profile': 'members' },
      body: JSON.stringify({ member_id: member.id, file_url, file_type, caption })
    });

    return NextResponse.json({ success: true, file_url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
