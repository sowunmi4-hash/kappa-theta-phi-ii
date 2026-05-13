import { NextResponse } from 'next/server';
import { S, h, ch, getMember, canManage } from '../_shared';

export async function PATCH(req) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ssp_id, status, class_time, notes } = await req.json();
  const update = { status, updated_at: new Date().toISOString() };
  if (class_time !== undefined) update.class_time = class_time;
  if (notes !== undefined) update.notes = notes;

  await fetch(`${S}/rest/v1/discipline_ssp?id=eq.${ssp_id}`, {
    method: 'PATCH', headers: ch(), body: JSON.stringify(update)
  });

  // If a brother self-enrolled (not a leader), notify leadership
  if (status === 'enrolled' && !canManage(member)) {
    const leaders = await fetch(`${S}/rest/v1/roster?faction=eq.Ishi No Faction&select=id`, { headers: h() }).then(r => r.json());
    const founders = await fetch(`${S}/rest/v1/roster?role=in.(Head Founder,Co-Founder)&select=id`, { headers: h() }).then(r => r.json());
    const all = [...leaders, ...founders];
    for (const l of all) {
      if (l.id !== member.id) {
        await fetch(`${S}/rest/v1/notifications`, {
          method: 'POST', headers: ch(),
          body: JSON.stringify({ member_id: l.id, title: 'SSP Enrollment', message: `${member.frat_name} has accepted and enrolled in the Sage Solution Program.`, created_by: member.id })
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}
