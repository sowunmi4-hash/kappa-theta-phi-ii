import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { S, h, ch, getMember, addNotification, notifyLeaders } from '../_shared';

export async function POST(req) {
  const token = (await cookies()).get(process.env.SESSION_COOKIE_NAME||'ktf_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { tier_id } = await req.json();
  const [tier, balance, existing] = await Promise.all([
    fetch(`${S}/rest/v1/phire_reward_tiers?id=eq.${tier_id}&select=*`, { headers: h() }).then(r => r.json()),
    fetch(`${S}/rest/v1/phire_balances?member_id=eq.${member.id}&select=*`, { headers: h() }).then(r => r.json()),
    fetch(`${S}/rest/v1/phire_redemptions?member_id=eq.${member.id}&tier_id=eq.${tier_id}&status=eq.pending&select=id`, { headers: h() }).then(r => r.json()),
  ]);
  if (!tier.length) return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
  if (existing.length) return NextResponse.json({ error: 'Already pending' }, { status: 400 });
  if ((balance[0]?.balance||0) < tier[0].points_required) return NextResponse.json({ error: 'Insufficient points' }, { status: 400 });
  await fetch(`${S}/rest/v1/phire_redemptions`, { method: 'POST', headers: ch(), body: JSON.stringify({ member_id: member.id, member_name: member.frat_name, tier_id, tier_name: tier[0].name }) });
  await notifyLeaders(`🎁 Reward Redemption Request`, `${member.frat_name} requested a ${tier[0].name} reward (${tier[0].points_required} pts).`, member.id);
  return NextResponse.json({ success: true });
}

export async function PATCH(req) {
  const token = (await cookies()).get(process.env.SESSION_COOKIE_NAME||'ktf_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member || !['Head Founder','Co-Founder','Iron Fleet'].includes(member.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { redemption_id, action } = await req.json();
  const reds = await fetch(`${S}/rest/v1/phire_redemptions?id=eq.${redemption_id}&status=eq.pending&select=*`, { headers: h() }).then(r => r.json());
  if (!reds.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const red = reds[0];
  const status = action === 'approve' ? 'approved' : 'denied';
  await fetch(`${S}/rest/v1/phire_redemptions?id=eq.${redemption_id}`, { method: 'PATCH', headers: ch(), body: JSON.stringify({ status, reviewed_by: member.id, reviewed_by_name: member.frat_name, reviewed_at: new Date().toISOString() }) });
  if (action === 'approve') {
    const tier = await fetch(`${S}/rest/v1/phire_reward_tiers?id=eq.${red.tier_id}&select=*`, { headers: h() }).then(r => r.json());
    const cost = tier[0]?.points_required || 0;
    const bal = await fetch(`${S}/rest/v1/phire_balances?member_id=eq.${red.member_id}&select=*`, { headers: h() }).then(r => r.json());
    if (bal.length) await fetch(`${S}/rest/v1/phire_balances?member_id=eq.${red.member_id}`, { method: 'PATCH', headers: ch(), body: JSON.stringify({ balance: Math.max(0, bal[0].balance - cost), updated_at: new Date().toISOString() }) });
    await fetch(`${S}/rest/v1/phire_transactions`, { method: 'POST', headers: ch(), body: JSON.stringify({ member_id: red.member_id, member_name: red.member_name, points: -cost, type: 'deducted', note: `${red.tier_name} reward redeemed`, created_by: member.id, created_by_name: member.frat_name }) });
    await addNotification(red.member_id, '🎁 Reward Approved!', `Your ${red.tier_name} reward has been approved! Leadership will contact you shortly.`, member.id);
  } else {
    await addNotification(red.member_id, '❌ Reward Denied', `Your ${red.tier_name} redemption was denied. Contact leadership for details.`, member.id);
  }
  return NextResponse.json({ success: true });
}
