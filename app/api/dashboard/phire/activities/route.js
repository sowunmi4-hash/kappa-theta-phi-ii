import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { S, h, ch, getMember, LEADERS } from '../_shared';

export async function GET() {
  const token = (await cookies()).get(process.env.SESSION_COOKIE_NAME||'ktf_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const activities = await fetch(`${S}/rest/v1/phire_activities?is_active=eq.true&order=category.asc,name.asc&select=*`, { headers: h() }).then(r => r.json());
  return NextResponse.json({ activities, role: member.role });
}

export async function POST(req) {
  const token = (await cookies()).get(process.env.SESSION_COOKIE_NAME||'ktf_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member || !LEADERS.includes(member.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { name, point_value, category } = await req.json();
  if (!name || !point_value) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  await fetch(`${S}/rest/v1/phire_activities`, { method: 'POST', headers: ch(), body: JSON.stringify({ name, point_value: parseInt(point_value), category: category||'General', created_by: member.id, created_by_name: member.frat_name }) });
  return NextResponse.json({ success: true });
}

export async function PATCH(req) {
  const token = (await cookies()).get(process.env.SESSION_COOKIE_NAME||'ktf_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member || !LEADERS.includes(member.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id, name, point_value, category, is_active } = await req.json();
  const update = {};
  if (name !== undefined) update.name = name;
  if (point_value !== undefined) update.point_value = parseInt(point_value);
  if (category !== undefined) update.category = category;
  if (is_active !== undefined) update.is_active = is_active;
  await fetch(`${S}/rest/v1/phire_activities?id=eq.${id}`, { method: 'PATCH', headers: ch(), body: JSON.stringify(update) });
  return NextResponse.json({ success: true });
}
