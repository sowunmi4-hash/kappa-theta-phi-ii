import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const C = process.env.SESSION_COOKIE_NAME || 'ktf_session';
const h = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });

async function getMember(token) {
  const s = await fetch(`${S}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id,expires_at`, { headers: h() }).then(r => r.json());
  if (!s.length || new Date(s[0].expires_at) < new Date()) return null;
  const m = await fetch(`${S}/rest/v1/roster?id=eq.${s[0].member_id}&select=*`, { headers: h() }).then(r => r.json());
  return m[0] || null;
}

const LEADERS = ['Head Founder', 'Co-Founder', 'Iron Fleet', 'Co-Founder'];

export async function GET() {
  const token = (await cookies()).get(C)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only leaders/managers can fetch the full roster
  const canAccess =
    LEADERS.includes(member.role) ||
    member.fraction === 'Ishi No Fraction';

  if (!canAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Fetch all brothers + their current PHIRE balance
  const [roster, balances] = await Promise.all([
    fetch(`${S}/rest/v1/roster?select=id,frat_name,role,fraction&order=frat_name.asc`, { headers: h() }).then(r => r.json()),
    fetch(`${S}/rest/v1/phire_balances?select=member_id,balance`, { headers: h() }).then(r => r.json()),
  ]);

  const balMap = {};
  balances.forEach(b => { balMap[b.member_id] = b.balance; });

  const members = roster.map(r => ({
    member_id: r.id,
    frat_name: r.frat_name,
    role: r.role,
    fraction: r.fraction || '',
    balance: balMap[r.id] ?? 0,
  }));

  return NextResponse.json({ members });
}
