import { NextResponse } from 'next/server';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const h = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });
const ch = () => h({ 'Content-Type': 'application/json', 'Content-Profile': 'members' });

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const secret      = searchParams.get('secret');
  const sl_username = searchParams.get('sl_username');

  if (secret !== 'KTP-DUES-2026') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!sl_username) return NextResponse.json({ error: 'Missing sl_username' }, { status: 400 });

  // Find member by SL name (case-insensitive)
  const members = await fetch(
    `${S}/rest/v1/roster?sl_name=ilike.${encodeURIComponent(sl_username)}&select=*`,
    { headers: h() }
  ).then(r => r.json());

  if (!members?.length) return NextResponse.json({ found: 'no' });
  const member = members[0];

  // Get active dues period
  const periods = await fetch(
    `${S}/rest/v1/dues_periods?is_active=eq.true&select=*`,
    { headers: h() }
  ).then(r => r.json());

  if (!periods?.length) return NextResponse.json({ found: 'yes', frat_name: member.frat_name, status: 'no_period' });
  const period = periods[0];

  // Get dues record
  const records = await fetch(
    `${S}/rest/v1/dues_records?member_id=eq.${member.id}&period_id=eq.${period.id}&select=*`,
    { headers: h() }
  ).then(r => r.json());

  // Auto-create if missing
  if (!records?.length) {
    await fetch(`${S}/rest/v1/dues_records`, {
      method: 'POST', headers: ch(),
      body: JSON.stringify({ member_id: member.id, member_name: member.frat_name, period_id: period.id, amount_due: period.amount_due, linden_paid: 0, sweat_paid: 0, status: 'unpaid' })
    });
  }

  const record   = records?.[0] || { linden_paid: 0, sweat_paid: 0, status: 'unpaid' };
  const totalPaid = (record.linden_paid || 0) + (record.sweat_paid || 0);
  const remaining = Math.max(0, period.amount_due - totalPaid);

  return NextResponse.json({
    found:      'yes',
    frat_name:  member.frat_name,
    period:     period.label,
    status:     record.status || 'unpaid',
    amount_due: period.amount_due,
    total_paid: totalPaid,
    remaining,
  });
}
