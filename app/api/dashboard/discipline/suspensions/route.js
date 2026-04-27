import { NextResponse } from 'next/server';
import { S, h, ch, getMember, canManage } from '../_shared';

export async function PATCH(req) {
  const member = await getMember();
  if (!member || !canManage(member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { suspension_id, action, notes } = await req.json(); // action: 'lift'
  if (action === 'lift') {
    await fetch(`${S}/rest/v1/discipline_suspensions?id=eq.${suspension_id}`, { method: 'PATCH', headers: ch(),
      body: JSON.stringify({ status: 'lifted', lifted_at: new Date().toISOString(), lifted_by_name: member.frat_name, notes }) });
  }
  return NextResponse.json({ success: true });
}