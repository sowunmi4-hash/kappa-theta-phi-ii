import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { S, h, ch, getMember, addNotification, LEADERS } from '../_shared';

export async function POST(req) {
  const token = (await cookies()).get(process.env.SESSION_COOKIE_NAME||'ktf_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member || !LEADERS.includes(member.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { member_id, points, note } = await req.json();
  if (!member_id || points === undefined || !note) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const target = await fetch(`${S}/rest/v1/roster?id=eq.${member_id}&select=id,frat_name`, { headers: h() }).then(r => r.json());
  if (!target.length) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  const bal = await fetch(`${S}/rest/v1/phire_balances?member_id=eq.${member_id}&select=*`, { headers: h() }).then(r => r.json());
  const current = bal[0]?.balance || 0;
  const newBal = Math.max(0, current + points);
  const newLifetime = points > 0 ? (bal[0]?.lifetime_earned||0) + points : (bal[0]?.lifetime_earned||0);
  if (bal.length) {
    await fetch(`${S}/rest/v1/phire_balances?member_id=eq.${member_id}`, { method: 'PATCH', headers: ch(), body: JSON.stringify({ balance: newBal, lifetime_earned: newLifetime, updated_at: new Date().toISOString() }) });
  } else {
    await fetch(`${S}/rest/v1/phire_balances`, { method: 'POST', headers: ch(), body: JSON.stringify({ member_id, member_name: target[0].frat_name, balance: Math.max(0,points), lifetime_earned: Math.max(0,points) }) });
  }
  await fetch(`${S}/rest/v1/phire_transactions`, { method: 'POST', headers: ch(), body: JSON.stringify({ member_id, member_name: target[0].frat_name, points, type: 'manual', note, created_by: member.id, created_by_name: member.frat_name }) });
  await addNotification(member_id, points > 0 ? '⚡ Points Added' : '⚡ Points Adjusted', `${points > 0 ? '+'+points : points} pts by ${member.frat_name}. Reason: ${note}`, member.id);
  return NextResponse.json({ success: true, new_balance: newBal });
}
