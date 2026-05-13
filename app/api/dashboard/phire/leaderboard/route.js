import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { S, h, getMember } from '../_shared';

export async function GET() {
  const token = (await cookies()).get(process.env.SESSION_COOKIE_NAME||'ktf_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member || !['Head Founder','Co-Founder','Iron Fleet'].includes(member.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const [balances, roster] = await Promise.all([
    fetch(`${S}/rest/v1/phire_balances?order=lifetime_earned.desc&select=*`, { headers: h() }).then(r => r.json()),
    fetch(`${S}/rest/v1/roster?select=id,frat_name,role,faction`, { headers: h() }).then(r => r.json()),
  ]);
  const map = {};
  roster.forEach(r => { map[r.id] = r; });
  const leaderboard = balances.map((b, i) => ({ rank: i+1, member_id: b.member_id, frat_name: map[b.member_id]?.frat_name || b.member_name || 'Unknown', role: map[b.member_id]?.role || '', faction: map[b.member_id]?.faction || '', balance: b.balance, lifetime_earned: b.lifetime_earned }));
  return NextResponse.json({ leaderboard, viewer_role: member.role });
}
