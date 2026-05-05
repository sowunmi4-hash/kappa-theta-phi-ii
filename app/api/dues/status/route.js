import { NextResponse } from 'next/server';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const h  = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });
const ch = ()     => h({ 'Content-Type': 'application/json', 'Content-Profile': 'members' });

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const secret      = searchParams.get('secret');
  const sl_username = searchParams.get('sl_username') || '';
  const sl_uuid     = searchParams.get('sl_uuid') || '';

  if (secret !== 'KTP-DUES-2026') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 1. Try UUID lookup first (fastest, most reliable)
  let members = [];
  if (sl_uuid) {
    members = await fetch(
      `${S}/rest/v1/roster?sl_uuid=eq.${sl_uuid}&select=*`,
      { headers: h() }
    ).then(r => r.json());
  }

  // 2. Extract username from parentheses e.g. "Fancy Name (username123)" → "username123"
  if (!members?.length && sl_username) {
    const match = sl_username.match(/\(([^)]+)\)\s*$/);
    const username = match ? match[1] : sl_username;
    members = await fetch(
      `${S}/rest/v1/roster?sl_name=ilike.%25${encodeURIComponent(username)}%25&select=*`,
      { headers: h() }
    ).then(r => r.json());
  }

  if (!members?.length) return NextResponse.json({ found: 'no' });
  const member = members[0];

  // Auto-save UUID so future lookups skip name matching
  if (sl_uuid && !member.sl_uuid) {
    await fetch(`${S}/rest/v1/roster?id=eq.${member.id}`, {
      method: 'PATCH', headers: ch(),
      body: JSON.stringify({ sl_uuid })
    });
  }

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

  if (!records?.length) {
    await fetch(`${S}/rest/v1/dues_records`, {
      method: 'POST', headers: ch(),
      body: JSON.stringify({ member_id: member.id, member_name: member.frat_name, period_id: period.id, amount_due: period.amount_due, linden_paid: 0, sweat_paid: 0, status: 'unpaid' })
    });
  }

  const record    = records?.[0] || { linden_paid: 0, sweat_paid: 0, status: 'unpaid' };
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
