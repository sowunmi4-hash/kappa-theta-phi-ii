import { NextResponse } from 'next/server';
import { S, h, ch, getMember, canManage } from '../_shared';

export async function PATCH(req) {
  const member = await getMember();
  if (!member || !canManage(member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { ssp_id, status, class_time, notes } = await req.json();
  const update = { status, updated_at: new Date().toISOString() };
  if (class_time !== undefined) update.class_time = class_time;
  if (notes !== undefined) update.notes = notes;
  await fetch(`${S}/rest/v1/discipline_ssp?id=eq.${ssp_id}`, { method: 'PATCH', headers: ch(), body: JSON.stringify(update) });
  return NextResponse.json({ success: true });
}