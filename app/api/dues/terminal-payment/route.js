import { NextResponse } from 'next/server';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const h  = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });
const ch = ()     => h({ 'Content-Type': 'application/json', 'Content-Profile': 'members' });

function genTxnId() {
  const now = new Date();
  const date = now.toISOString().slice(0,10).replace(/-/g,''); // YYYYMMDD
  const rand = Math.random().toString(36).substring(2,8).toUpperCase(); // 6 char random
  return `KTP-${date}-${rand}`;
}

export async function POST(req) {
  const body = await req.json();
  const { sl_username = '', sl_uuid = '', amount_ls, secret } = body;

  if (secret !== 'KTP-DUES-2026') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!amount_ls) return NextResponse.json({ error: 'Missing amount' }, { status: 400 });

  // 1. UUID lookup
  let members = [];
  if (sl_uuid) {
    members = await fetch(
      `${S}/rest/v1/roster?sl_uuid=eq.${sl_uuid}&select=*`,
      { headers: h() }
    ).then(r => r.json());
  }

  // 2. Username fallback
  if (!members?.length && sl_username) {
    const match = sl_username.match(/\(([^)]+)\)\s*$/);
    const username = match ? match[1] : sl_username;
    members = await fetch(
      `${S}/rest/v1/roster?sl_name=ilike.%25${encodeURIComponent(username)}%25&select=*`,
      { headers: h() }
    ).then(r => r.json());
  }

  if (!members?.length) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  const member = members[0];

  // Auto-save UUID
  if (sl_uuid && !member.sl_uuid) {
    await fetch(`${S}/rest/v1/roster?id=eq.${member.id}`, {
      method: 'PATCH', headers: ch(),
      body: JSON.stringify({ sl_uuid })
    });
  }

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

  // Generate transaction ID and timestamp
  const txn_id   = genTxnId();
  const paid_at  = new Date().toISOString();

  // Log payment with transaction ID, SL UUID, and precise timestamp
  await fetch(`${S}/rest/v1/dues_payments`, {
    method: 'POST', headers: ch(),
    body: JSON.stringify({
      period_id:      period.id,
      member_id:      member.id,
      member_name:    member.frat_name,
      amount_ls:      amount_ls,
      transaction_id: txn_id,
      notes:          `Terminal · SL UUID: ${sl_uuid || 'unknown'} · User: ${sl_username}`,
      logged_by_name: 'SL Dues Terminal',
      created_at:     paid_at,
    })
  });

  // Update dues record totals
  const newLindenPaid = (record.linden_paid || 0) + amount_ls;
  const totalPaid     = newLindenPaid + (record.sweat_equity_value || 0);
  const remaining     = Math.max(0, period.amount_due - totalPaid);
  const newStatus     = remaining <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
  const credit        = totalPaid > period.amount_due ? totalPaid - period.amount_due : 0;

  await fetch(`${S}/rest/v1/dues_records?id=eq.${record.id}`, {
    method: 'PATCH', headers: ch(),
    body: JSON.stringify({ linden_paid: newLindenPaid, status: newStatus, credit, updated_at: paid_at })
  });

  return NextResponse.json({
    frat_name:      member.frat_name,
    period:         period.label,
    amount_paid:    amount_ls,
    total_paid:     totalPaid,
    remaining,
    credit,
    new_status:     newStatus,
    transaction_id: txn_id,
    paid_at,
  });
}
