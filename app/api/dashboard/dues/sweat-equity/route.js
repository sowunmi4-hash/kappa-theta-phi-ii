import { NextResponse } from 'next/server';
import { S, h, ch, getMember, CAN_MANAGE, recalcRecord } from '../_shared';

export async function POST(req) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { period_id, contribution, category, value_requested, notes } = await req.json();
  if (!period_id || !contribution) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  await fetch(`${S}/rest/v1/dues_sweat_equity`, {
    method: 'POST', headers: ch(),
    body: JSON.stringify({ period_id, member_id: member.id, member_name: member.frat_name, contribution, category: category||'general', value_requested: value_requested||null, notes: notes||null, status: 'pending' })
  });
  return NextResponse.json({ success: true });
}

export async function PATCH(req) {
  const member = await getMember();
  if (!member || !CAN_MANAGE(member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { sweat_id, action, value_approved, notes } = await req.json();
  const status = action === 'approve' ? 'approved' : 'denied';
  await fetch(`${S}/rest/v1/dues_sweat_equity?id=eq.${sweat_id}`, {
    method: 'PATCH', headers: ch(),
    body: JSON.stringify({ status, value_approved: value_approved||0, notes: notes||null, reviewed_by: member.id, reviewed_by_name: member.frat_name, reviewed_at: new Date().toISOString() })
  });
  // Get the sweat record to recalc
  const sweat = await fetch(`${S}/rest/v1/dues_sweat_equity?id=eq.${sweat_id}&select=period_id,member_id`, { headers: h() }).then(r => r.json());
  if (sweat[0]) await recalcRecord(sweat[0].period_id, sweat[0].member_id);
  // Notify the brother
  if (status === 'approved') {
    await fetch(`${S}/rest/v1/notifications`, { method: 'POST', headers: ch(),
      body: JSON.stringify({ member_id: sweat[0].member_id, title: 'Sweat Equity Approved', message: `Your sweat equity contribution was approved — L$${(value_approved||0).toLocaleString()} credited toward your dues.`, created_by: member.id }) });
  }
  return NextResponse.json({ success: true });
}