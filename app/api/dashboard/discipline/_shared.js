import { cookies } from 'next/headers';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const C = process.env.SESSION_COOKIE_NAME || 'ktf_session';

export const h  = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });
export const ch = (x={}) => h({ 'Content-Type': 'application/json', 'Content-Profile': 'members', ...x });
export { S, C };

export async function getMember() {
  const token = (await cookies()).get(C)?.value;
  if (!token) return null;
  const s = await fetch(`${S}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id,expires_at`, { headers: h() }).then(r => r.json());
  if (!s.length || new Date(s[0].expires_at) < new Date()) return null;
  const m = await fetch(`${S}/rest/v1/roster?id=eq.${s[0].member_id}&select=*`, { headers: h() }).then(r => r.json());
  return m[0] || null;
}

// Can manage discipline = Ishi No Fraction OR Head Founder OR Senior Founder
export function canManage(member) {
  if (!member) return false;
  return (
    member.fraction === 'Ishi No Fraction' ||
    member.role === 'Head Founder' ||
    member.role === 'Senior Founder'
  );
}
