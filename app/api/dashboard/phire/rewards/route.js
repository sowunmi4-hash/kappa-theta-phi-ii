import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { S, h, getMember } from '../_shared';

export async function GET() {
  const token = (await cookies()).get(process.env.SESSION_COOKIE_NAME||'ktf_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [tiers, balance, redemptions] = await Promise.all([
    fetch(`${S}/rest/v1/phire_reward_tiers?order=sort_order.asc&select=*`, { headers: h() }).then(r => r.json()),
    fetch(`${S}/rest/v1/phire_balances?member_id=eq.${member.id}&select=*`, { headers: h() }).then(r => r.json()),
    fetch(`${S}/rest/v1/phire_redemptions?member_id=eq.${member.id}&order=created_at.desc&select=*`, { headers: h() }).then(r => r.json()),
  ]);
  const currentBalance = balance[0]?.balance || 0;
  const now = new Date();
  const tiersWithStatus = tiers.map(tier => {
    const unlocked = currentBalance >= tier.points_required;
    const lastApproved = redemptions.find(r => r.tier_id === tier.id && r.status === 'approved');
    let onCooldown = false, cooldownEnds = null;
    if (lastApproved) {
      cooldownEnds = new Date(new Date(lastApproved.reviewed_at).getTime() + tier.reset_days * 864e5);
      onCooldown = now < cooldownEnds;
    }
    const hasPending = !!redemptions.find(r => r.tier_id === tier.id && r.status === 'pending');
    return { ...tier, unlocked, onCooldown, cooldown_ends: cooldownEnds, has_pending: hasPending };
  });
  return NextResponse.json({ tiers: tiersWithStatus, balance: currentBalance, redemptions });
}
