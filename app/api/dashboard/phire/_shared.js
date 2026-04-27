// Shared helpers for PHIRE API routes
const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const C = process.env.SESSION_COOKIE_NAME || 'ktf_session';

export const h = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });
export const ch = (x={}) => h({ 'Content-Type': 'application/json', 'Content-Profile': 'members', ...x });
export { S, C };

export const LEADERS = ['Head Founder', 'Co-Founder', 'Iron Fleet'];
export const FOUNDERS = ['Head Founder', 'Co-Founder'];

export async function getMember(token) {
  const s = await fetch(`${S}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id,expires_at`, { headers: h() }).then(r => r.json());
  if (!s.length || new Date(s[0].expires_at) < new Date()) return null;
  const m = await fetch(`${S}/rest/v1/roster?id=eq.${s[0].member_id}&select=*`, { headers: h() }).then(r => r.json());
  return m[0] || null;
}

export async function ensureBalance(member_id, member_name) {
  const existing = await fetch(`${S}/rest/v1/phire_balances?member_id=eq.${member_id}`, { headers: h() }).then(r => r.json());
  if (!existing.length) {
    await fetch(`${S}/rest/v1/phire_balances`, { method: 'POST', headers: ch(), body: JSON.stringify({ member_id, member_name, balance: 0, lifetime_earned: 0 }) });
  }
}

export async function addNotification(member_id, title, message, created_by) {
  await fetch(`${S}/rest/v1/notifications`, { method: 'POST', headers: ch(), body: JSON.stringify({ member_id, title, message, created_by }) });
}

export async function notifyLeaders(title, message, created_by) {
  const leaders = await fetch(`${S}/rest/v1/roster?role=in.(Head Founder,Co-Founder,Iron Fleet)&select=id`, { headers: h() }).then(r => r.json());
  for (const l of leaders) {
    if (l.id !== created_by) await addNotification(l.id, title, message, created_by);
  }
}
