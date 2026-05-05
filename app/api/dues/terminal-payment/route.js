import { NextResponse } from 'next/server';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const h = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });
const ch = () => h({ 'Content-Type': 'application/json', 'Content-Profile': 'members' });

export async function POST(req) {
  const body = await req.json();
  const { sl_username, amount_ls, secret } = body;

  if (secret !== 'KTP-DUES-2026') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!sl_username || !amount_ls) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // Find member
  const members = await fetch(
    `${S}/rest/v1/roster?sl_name=ilike.${encodeURIComponent(sl_username)}&select=*`,
    { headers: h() }
  ).then(r => r.json());

  if (!members?.length) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  const member = members[0];

  // Get active period
  const periods = await fetch(
    `${S}/rest/v1/dues_periods?is_active=eq.true&select=*`,
    { headers: h() }
  ).then(r => r.json());

  if (!periods?.length) return NextResponse.json({ error: 'No active dues period' }, { status: 404 });
  const period = periods[0];

  // Get dues record
  const records = await fetch(
    `${S}/rest/v1/dues_records?member_id=eq.${member.id}&period_id=eq.${period.id}&select=*`,
    { headers: h() }
  ).then(r => r.json());

  if (!records?.length) return NextResponse.json({ error: 'No dues record found' }, { status: 404 });
  const record = records[0];

  // Log payment
  await fetch(`${S}/rest/v1/dues_payments`, {
    method: 'POST', headers: ch(),
    body: JSON.stringify({
      period_id:       period.id,
      member_id:       member.id,
      member_name:     member.frat_name,
      amount_ls:       amount_ls,
      notes:           `Terminal payment — L$${amount_ls} via SL dues terminal`,
      logged_by_name:  'SL Dues Terminal',
    })
  });

  // Update record totals
  const newLindenPaid = (record.linden_paid || 0) + amount_ls;
  const totalPaid     = newLindenPaid + (record.sweat_paid || 0);
  const remaining     = Math.max(0, period.amount_due - totalPaid);
  const newStatus     = remaining <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';

  const credit = totalPaid > period.amount_due ? totalPaid - period.amount_due : 0;

  await fetch(`${S}/rest/v1/dues_records?id=eq.${record.id}`, {
    method: 'PATCH', headers: ch(),
    body: JSON.stringify({ linden_paid: newLindenPaid, status: newStatus, credit, updated_at: new Date().toISOString() })
  });

  return NextResponse.json({
    frat_name:   member.frat_name,
    period:      period.label,
    amount_paid: amount_ls,
    total_paid:  totalPaid,
    remaining,
    credit,
    new_status:  newStatus,
  });
}
