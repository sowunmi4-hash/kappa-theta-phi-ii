import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { S, h, ch, getMember, ensureBalance, notifyLeaders } from '../_shared';

export async function POST(req) {
  const token = (await cookies()).get(process.env.SESSION_COOKIE_NAME||'ktf_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { activity_id } = await req.json();
  if (!activity_id) return NextResponse.json({ error: 'Missing activity' }, { status: 400 });
  const activities = await fetch(`${S}/rest/v1/phire_activities?id=eq.${activity_id}&is_active=eq.true&select=*`, { headers: h() }).then(r => r.json());
  if (!activities.length) return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
  const activity = activities[0];
  const dupe = await fetch(`${S}/rest/v1/phire_submissions?member_id=eq.${member.id}&activity_id=eq.${activity_id}&status=eq.pending&select=id`, { headers: h() }).then(r => r.json());
  if (dupe.length) return NextResponse.json({ error: 'You already have a pending submission for this activity' }, { status: 400 });
  await ensureBalance(member.id, member.frat_name);
  await fetch(`${S}/rest/v1/phire_submissions`, { method: 'POST', headers: ch(), body: JSON.stringify({ member_id: member.id, member_name: member.frat_name, activity_id, activity_name: activity.name, point_value: activity.point_value }) });
  await notifyLeaders(`📋 New PHIRE Submission`, `${member.frat_name} submitted "${activity.name}" (${activity.point_value} pts) for approval.`, member.id);
  return NextResponse.json({ success: true });
}
