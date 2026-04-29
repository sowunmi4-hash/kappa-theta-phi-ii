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
  member && (member.role === 'Head Founder' || member.role === 'Co-Founder');

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
  const status = total_paid >= rec.amount_due ? 'paid' : total_paid > 0 ? 'partial' : 'unpaid';
  await fetch(`${S}/rest/v1/dues_records?id=eq.${rec.id}`, {
    method: 'PATCH', headers: ch(),
    body: JSON.stringify({ linden_paid, sweat_equity_value: sweat_value, status, updated_at: new Date().toISOString() })
  });
}
