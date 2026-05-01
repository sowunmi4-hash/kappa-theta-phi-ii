import { cookies } from 'next/headers';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const C = process.env.SESSION_COOKIE_NAME || 'ktf_session';
export const h  = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });
export const ch = (x={}) => h({ 'Content-Type': 'application/json', 'Content-Profile': 'members', ...x });
export { S };

export async function getMember() {
  const token = (await cookies()).get(C)?.value;
  if (!token) return null;
  const s = await fetch(`${S}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id,expires_at`, { headers: h() }).then(r => r.json());
  if (!s.length || new Date(s[0].expires_at) < new Date()) return null;
  const m = await fetch(`${S}/rest/v1/roster?id=eq.${s[0].member_id}&select=*`, { headers: h() }).then(r => r.json());
  return m[0] || null;
}

export const CAN_MANAGE = (member) =>
  member && member.frat_name === 'Big Brother Cool Breeze';

// Recalculate and update a dues_record status after any payment/equity change
export async function recalcRecord(period_id, member_id) {
  const [record, payments, equity] = await Promise.all([
    fetch(`${S}/rest/v1/dues_records?period_id=eq.${period_id}&member_id=eq.${member_id}&select=*`, { headers: h() }).then(r => r.json()),
    fetch(`${S}/rest/v1/dues_payments?period_id=eq.${period_id}&member_id=eq.${member_id}&select=amount_ls`, { headers: h() }).then(r => r.json()),
    fetch(`${S}/rest/v1/dues_sweat_equity?period_id=eq.${period_id}&member_id=eq.${member_id}&status=eq.approved&select=value_approved`, { headers: h() }).then(r => r.json()),
  ]);
  if (!record.length) return;
  const rec = record[0];
  if (rec.status === 'waived') return;
  const linden_paid  = payments.reduce((s, p) => s + (p.amount_ls || 0), 0);
  const sweat_value  = equity.reduce((s, e) => s + (e.value_approved || 0), 0);
  const total_paid   = linden_paid + sweat_value;
  // Credit = overpayment beyond what's due (e.g. paid 8000 when 4000 due = 4000 credit)
  const credit = Math.max(0, total_paid - rec.amount_due);
  const status = total_paid >= rec.amount_due ? 'paid' : total_paid > 0 ? 'partial' : 'unpaid';
  await fetch(`${S}/rest/v1/dues_records?id=eq.${rec.id}`, {
    method: 'PATCH', headers: ch(),
    body: JSON.stringify({ linden_paid, sweat_equity_value: sweat_value, credit, status, updated_at: new Date().toISOString() })
  });
}

// Apply credits from a previous period into a new period for all members
export async function applyCreditsToNewPeriod(new_period_id) {
  // Get all records for new period
  const newRecords = await fetch(`${S}/rest/v1/dues_records?period_id=eq.${new_period_id}&select=*`, { headers: h() }).then(r => r.json());
  if (!newRecords?.length) return;

  // Get the period just before this one
  const newPeriod = await fetch(`${S}/rest/v1/dues_periods?id=eq.${new_period_id}&select=*`, { headers: h() }).then(r => r.json());
  if (!newPeriod?.length) return;
  const { month, year } = newPeriod[0];
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear  = month === 1 ? year - 1 : year;

  const prevPeriods = await fetch(`${S}/rest/v1/dues_periods?month=eq.${prevMonth}&year=eq.${prevYear}&select=id`, { headers: h() }).then(r => r.json());
  if (!prevPeriods?.length) return;
  const prev_period_id = prevPeriods[0].id;

  // For each member in new period, check if they have credit in previous period
  for (const rec of newRecords) {
    if (rec.status === 'waived') continue;
    const prevRecords = await fetch(`${S}/rest/v1/dues_records?period_id=eq.${prev_period_id}&member_id=eq.${rec.member_id}&select=credit`, { headers: h() }).then(r => r.json());
    const prevCredit = prevRecords?.[0]?.credit || 0;
    if (prevCredit <= 0) continue;

    // Insert a credit payment into the new period
    await fetch(`${S}/rest/v1/dues_payments`, {
      method: 'POST', headers: ch(),
      body: JSON.stringify({
        period_id: new_period_id,
        member_id: rec.member_id,
        member_name: rec.member_name,
        amount_ls: prevCredit,
        notes: `Credit carried forward from previous period`,
        logged_by_name: 'System'
      })
    });
    // Recalc the new record
    await recalcRecord(new_period_id, rec.member_id);
  }
}
