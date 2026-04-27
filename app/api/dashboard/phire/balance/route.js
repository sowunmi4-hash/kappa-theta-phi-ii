import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { S, h, getMember, ensureBalance } from '../_shared';

export async function GET() {
  const token = (await cookies()).get(process.env.SESSION_COOKIE_NAME||'ktf_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureBalance(member.id, member.frat_name);
  const [balance, recentTx, pendingCount, pendingRedemptions] = await Promise.all([
    fetch(`${S}/rest/v1/phire_balances?member_id=eq.${member.id}&select=*`, { headers: h() }).then(r => r.json()),
    fetch(`${S}/rest/v1/phire_transactions?member_id=eq.${member.id}&order=created_at.desc&limit=5&select=*`, { headers: h() }).then(r => r.json()),
    fetch(`${S}/rest/v1/phire_submissions?member_id=eq.${member.id}&status=eq.pending&select=id`, { headers: h() }).then(r => r.json()),
    fetch(`${S}/rest/v1/phire_redemptions?member_id=eq.${member.id}&status=eq.pending&select=id`, { headers: h() }).then(r => r.json()),
  ]);
  return NextResponse.json({ member, balance: balance[0]||{balance:0,lifetime_earned:0}, recent_transactions: recentTx, pending_count: pendingCount.length, pending_redemptions: pendingRedemptions.length });
}
