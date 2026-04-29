import { NextResponse } from 'next/server';
import { S, h, ch, getMember, CAN_MANAGE } from '../_shared';

export async function GET() {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const periods = await fetch(`${S}/rest/v1/dues_periods?order=year.desc,month.desc&select=*`, { headers: h() }).then(r => r.json());
  return NextResponse.json({ periods, can_manage: CAN_MANAGE(member), member });
}

export async function POST(req) {
  const member = await getMember();
  if (!member || !CAN_MANAGE(member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { month, year, amount_due, label } = await req.json();
  if (!month || !year) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const periodLabel = label || new Date(year, month - 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  const res = await fetch(`${S}/rest/v1/dues_periods`, {
    method: 'POST', headers: ch({ Prefer: 'return=representation' }),
    body: JSON.stringify({ month, year, label: periodLabel, amount_due: amount_due || 4000, created_by: member.id, created_by_name: member.frat_name })
  }).then(r => r.json());
  const period = res[0];
  if (!period) return NextResponse.json({ error: 'Failed to create period' }, { status: 500 });
  // Auto-create dues_records for all brothers
  const roster = await fetch(`${S}/rest/v1/roster?select=id,frat_name`, { headers: h() }).then(r => r.json());
  for (const br of roster) {
    await fetch(`${S}/rest/v1/dues_records`, {
      method: 'POST', headers: ch(),
      body: JSON.stringify({ period_id: period.id, member_id: br.id, member_name: br.frat_name, amount_due: period.amount_due, status: 'unpaid' })
    });
  }
  return NextResponse.json({ success: true, period });
}

export async function PATCH(req) {
  const member = await getMember();
  if (!member || !CAN_MANAGE(member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { period_id, is_active } = await req.json();
  await fetch(`${S}/rest/v1/dues_periods?id=eq.${period_id}`, {
    method: 'PATCH', headers: ch(), body: JSON.stringify({ is_active })
  });
  return NextResponse.json({ success: true });
}