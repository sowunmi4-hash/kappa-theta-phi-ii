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

// Upload banner, background or portrait
export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const member = await getMember(token);
    if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file');
    const type = formData.get('type'); // 'banner' | 'background' | 'portrait'
    if (!file || !type) return NextResponse.json({ error: 'Missing file or type' }, { status: 400 });

    const ext = file.name.split('.').pop();
    const filename = `${type}/${member.id}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Delete old file first (upsert via overwrite)
    await fetch(`${SUPABASE_URL}/storage/v1/object/dashboard/${filename}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${SUPABASE_KEY}` }
    });

    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/dashboard/${filename}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': file.type },
      body: buffer
    });

    if (!uploadRes.ok) return NextResponse.json({ error: 'Upload failed' }, { status: 500 });

    const file_url = `${SUPABASE_URL}/storage/v1/object/public/dashboard/${filename}?t=${Date.now()}`;
    
    // Save URL to profile
    const fieldMap = { banner: 'banner_url', background: 'background_url', portrait: 'portrait_url' };
    const field = fieldMap[type];

    const pRes = await fetch(`${SUPABASE_URL}/rest/v1/member_profiles?member_id=eq.${member.id}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Accept-Profile': 'members' }
    });
    const existing = await pRes.json();

    if (existing.length) {
      await fetch(`${SUPABASE_URL}/rest/v1/member_profiles?member_id=eq.${member.id}`, {
        method: 'PATCH',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Content-Profile': 'members' },
        body: JSON.stringify({ [field]: file_url, updated_at: new Date().toISOString() })
      });
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/member_profiles`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Content-Profile': 'members' },
        body: JSON.stringify({ member_id: member.id, [field]: file_url })
      });
    }

    return NextResponse.json({ success: true, file_url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
