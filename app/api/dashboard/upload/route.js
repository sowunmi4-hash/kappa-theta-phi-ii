import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const C = process.env.SESSION_COOKIE_NAME || 'ktf_session';
const h = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });

async function getMember(token) {
  const s = await fetch(`${S}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id`, { headers: h() }).then(r => r.json());
  if (!s.length) return null;
  const m = await fetch(`${S}/rest/v1/roster?id=eq.${s[0].member_id}&select=*`, { headers: h() }).then(r => r.json());
  return m[0] || null;
}

export async function POST(req) {
  const token = (await cookies()).get(C)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const fd = await req.formData();
  const file = fd.get('file');
  const type = fd.get('type');
  if (!file || !type) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const ext = file.name.split('.').pop();
  const filename = `${type}/${member.id}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await fetch(`${S}/storage/v1/object/dashboard/${filename}`, { method: 'DELETE', headers: { Authorization: `Bearer ${K}` } });
  const up = await fetch(`${S}/storage/v1/object/dashboard/${filename}`, { method: 'POST', headers: { Authorization: `Bearer ${K}`, 'Content-Type': file.type }, body: buf });
  if (!up.ok) return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  const file_url = `${S}/storage/v1/object/public/dashboard/${filename}?t=${Date.now()}`;
  const field = type === 'banner' ? 'banner_url' : type === 'portrait' ? 'portrait_url' : null;
  if (field) {
    const ex = await fetch(`${S}/rest/v1/member_profiles?member_id=eq.${member.id}`, { headers: h() }).then(r => r.json());
    const ch = h({ 'Content-Type': 'application/json', 'Content-Profile': 'members' });
    if (ex.length) await fetch(`${S}/rest/v1/member_profiles?member_id=eq.${member.id}`, { method: 'PATCH', headers: ch, body: JSON.stringify({ [field]: file_url, updated_at: new Date().toISOString() }) });
    else await fetch(`${S}/rest/v1/member_profiles`, { method: 'POST', headers: ch, body: JSON.stringify({ member_id: member.id, [field]: file_url }) });
  }
  return NextResponse.json({ success: true, file_url });
}
