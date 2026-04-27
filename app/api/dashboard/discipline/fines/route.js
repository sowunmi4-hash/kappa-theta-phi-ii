import { NextResponse } from 'next/server';
import { S, h, ch, getMember, canManage } from '../_shared';

export async function POST(req) {
  const member = await getMember();
  if (!member || !canManage(member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { violation_id, member_id, amount_ls, notes } = await req.json();
  const due = new Date(); due.setDate(due.getDate() + 7);
  await fetch(`${S}/rest/v1/discipline_fines`, { method: 'POST', headers: ch(),
    body: JSON.stringify({ violation_id, member_id, amount_ls, status: 'pending', due_date: due.toISOString().split('T')[0], notes }) });
  return NextResponse.json({ success: true });
}

export async function PATCH(req) {
  const member = await getMember();
  if (!member || !canManage(member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { fine_id, status, payment_plan_amount, payment_plan_notes, notes } = await req.json();
  const update = { status, updated_at: new Date().toISOString() };
  if (status === 'paid') update.paid_at = new Date().toISOString();
  if (payment_plan_amount !== undefined) update.payment_plan_amount = payment_plan_amount;
  if (payment_plan_notes !== undefined) update.payment_plan_notes = payment_plan_notes;
  if (notes !== undefined) update.notes = notes;
  await fetch(`${S}/rest/v1/discipline_fines?id=eq.${fine_id}`, { method: 'PATCH', headers: ch(), body: JSON.stringify(update) });
  return NextResponse.json({ success: true });
}