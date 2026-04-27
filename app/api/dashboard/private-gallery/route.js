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

export async function GET() {
  const token = (await cookies()).get(C)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const items = await fetch(`${S}/rest/v1/private_gallery?member_id=eq.${member.id}&order=created_at.desc`, { headers: h() }).then(r => r.json());
  return NextResponse.json({ items });
}

export async function POST(req) {
  const token = (await cookies()).get(C)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const fd = await req.formData();
  const file = fd.get('file');
  const caption = fd.get('caption') || '';
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  const ext = file.name.split('.').pop();
  const filename = `private/${member.id}/${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const up = await fetch(`${S}/storage/v1/object/dashboard/${filename}`, { method: 'POST', headers: { Authorization: `Bearer ${K}`, 'Content-Type': file.type }, body: buf });
  if (!up.ok) return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  const file_url = `${S}/storage/v1/object/public/dashboard/${filename}`;
  await fetch(`${S}/rest/v1/private_gallery`, { method: 'POST', headers: h({ 'Content-Type': 'application/json', 'Content-Profile': 'members' }), body: JSON.stringify({ member_id: member.id, file_url, file_type: file.type.startsWith('video') ? 'video' : 'image', caption }) });
  return NextResponse.json({ success: true, file_url });
}
