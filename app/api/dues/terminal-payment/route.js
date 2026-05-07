import { NextResponse } from 'next/server';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const h  = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });
const ch = ()     => h({ 'Content-Type': 'application/json', 'Content-Profile': 'members' });

// Timer rate: full dues amount = 28 days (4 weeks).
// Proportion paid determines days earned: days = (amount / total_due) * 28
const PERIOD_DAYS = 28;

function genTxnId() {
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.random().toString(36).substring(2,8).toUpperCase();
  return `KTP-${date}-${rand}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmtExpiryText(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
    hour12: true, timeZone: 'UTC'
  }) + ' SLT';
}

export async function POST(req) {
  const body = await req.json();
  const { sl_username = '', sl_uuid = '', amount_ls, secret } = body;

  if (secret !== 'KTP-DUES-2026') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!amount_ls) return NextResponse.json({ error: 'Missing amount' }, { status: 400 });

  // 1. Find member by UUID or username
  let members = [];
  if (sl_uuid) {
    members = await fetch(`${S}/rest/v1/roster?sl_uuid=eq.${sl_uuid}&select=*`, { headers: h() }).then(r => r.json());
  }
  if (!members?.length && sl_username) {
    const match = sl_username.match(/\(([^)]+)\)\s*$/);
    const username = match ? match[1] : sl_username;
    members = await fetch(`${S}/rest/v1/roster?sl_name=ilike.%25${encodeURIComponent(username)}%25&select=*`, { headers: h() }).then(r => r.json());
  }
  if (!members?.length) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  const member = members[0];

  // Auto-save UUID
  if (sl_uuid && !member.sl_uuid) {
    await fetch(`${S}/rest/v1/roster?id=eq.${member.id}`, {
      method: 'PATCH', headers: ch(), body: JSON.stringify({ sl_uuid })
    });
  }

  // 2. Get active period
  const periods = await fetch(`${S}/rest/v1/dues_periods?is_active=eq.true&select=*`, { headers: h() }).then(r => r.json());
  if (!periods?.length) return NextResponse.json({ error: 'No active dues period' }, { status: 404 });
  const period = periods[0];

  // 3. Get dues record
  const records = await fetch(`${S}/rest/v1/dues_records?member_id=eq.${member.id}&period_id=eq.${period.id}&select=*`, { headers: h() }).then(r => r.json());
  if (!records?.length) return NextResponse.json({ error: 'No dues record found' }, { status: 404 });
  const record = records[0];

  // 4. Calculate timer extension — proportional to period dues
  //    e.g. L$4,000 due = 28 days. Pay L$1,000 = 7 days. Pay L$2,000 = 14 days.
  const daysToAdd = Math.round((amount_ls / period.amount_due) * PERIOD_DAYS);

  //    Extend from current expiry (or now if expired/not set)
  const now = new Date();
  const currentExpiry = record.expires_at ? new Date(record.expires_at) : now;
  const baseDate = currentExpiry > now ? currentExpiry : now; // don't go backwards
  const newExpiry = addDays(baseDate, daysToAdd);
  const newExpiryText = fmtExpiryText(newExpiry);

  // 5. Generate transaction ID + timestamp
  const txn_id  = genTxnId();
  const paid_at = now.toISOString();

  // 6. Log payment
  await fetch(`${S}/rest/v1/dues_payments`, {
    method: 'POST', headers: ch(),
    body: JSON.stringify({
      period_id:        period.id,
      member_id:        member.id,
      member_name:      member.frat_name,
      amount_ls:        amount_ls,
      transaction_id:   txn_id,
      expires_at:       newExpiry.toISOString(),
      casper_expiry_text: newExpiryText,
      notes:            `Terminal · +${daysToAdd}d timer · SL UUID: ${sl_uuid || 'unknown'}`,
      logged_by_name:   'SL Dues Terminal',
      created_at:       paid_at,
    })
  });

  // 7. Update dues record: new totals + extended timer
  const newLindenPaid = (record.linden_paid || 0) + amount_ls;
  const totalPaid     = newLindenPaid + (record.sweat_equity_value || 0);
  const remaining     = Math.max(0, period.amount_due - totalPaid);
  const newStatus     = remaining <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
  const credit        = totalPaid > period.amount_due ? totalPaid - period.amount_due : 0;

  await fetch(`${S}/rest/v1/dues_records?id=eq.${record.id}`, {
    method: 'PATCH', headers: ch(),
    body: JSON.stringify({
      linden_paid:        newLindenPaid,
      status:             newStatus,
      credit,
      expires_at:         newStatus === 'paid' ? null : newExpiry.toISOString(),
      casper_expiry_text: newStatus === 'paid' ? null : newExpiryText,
      updated_at:         paid_at,
    })
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
    days_added:     daysToAdd,
    new_expiry:     newExpiry.toISOString(),
    new_expiry_text: newExpiryText,
  });
}
