import { NextResponse } from 'next/server';
import { S, h, ch, getMember, canManage } from '../_shared';

export async function POST(req) {
  const member = await getMember();
  if (!member || !canManage(member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { violation_id, member_id, held_at, verdict, consequences, notes } = await req.json();
  await fetch(`${S}/rest/v1/discipline_court_marshall`, { method: 'POST', headers: ch(),
    body: JSON.stringify({ violation_id, member_id, held_at, verdict, consequences, notes, logged_by_name: member.frat_name }) });

  // Notify the brother of the verdict
  await fetch(`${S}/rest/v1/notifications`, { method: 'POST', headers: ch(),
    body: JSON.stringify({ member_id, title: 'Court Marshall Verdict', message: `Your Court Marshall verdict has been logged. Check the Discipline tab for details.`, created_by: member.id }) });

  return NextResponse.json({ success: true });
}

export async function PATCH(req) {
  const member = await getMember();
  if (!member || !canManage(member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { court_id, verdict, consequences, notes } = await req.json();
  await fetch(`${S}/rest/v1/discipline_court_marshall?id=eq.${court_id}`, { method: 'PATCH', headers: ch(),
    body: JSON.stringify({ verdict, consequences, notes }) });
  return NextResponse.json({ success: true });
}