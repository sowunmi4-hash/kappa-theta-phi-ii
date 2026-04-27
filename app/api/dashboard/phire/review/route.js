import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { S, h, ch, getMember, addNotification, LEADERS } from '../_shared';

export async function PATCH(req) {
  const token = (await cookies()).get(process.env.SESSION_COOKIE_NAME||'ktf_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member || !LEADERS.includes(member.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { submission_id, action, note } = await req.json();
  if (!submission_id || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const subs = await fetch(`${S}/rest/v1/phire_submissions?id=eq.${submission_id}&status=eq.pending&select=*`, { headers: h() }).then(r => r.json());
  if (!subs.length) return NextResponse.json({ error: 'Not found or already reviewed' }, { status: 404 });
  const sub = subs[0];

  const status = action === 'approve' ? 'approved' : 'denied';
  await fetch(`${S}/rest/v1/phire_submissions?id=eq.${submission_id}`, {
    method: 'PATCH', headers: ch(),
    body: JSON.stringify({ status, reviewed_by: member.id, reviewed_by_name: member.frat_name, reviewed_at: new Date().toISOString(), note: note||null })
  });

  if (action === 'approve') {
    // Use upsert to atomically handle balance — avoids race condition on concurrent approvals
    const balRes = await fetch(`${S}/rest/v1/phire_balances?member_id=eq.${sub.member_id}&select=*`, { headers: h() }).then(r => r.json());
    
    if (balRes.length) {
      // Update existing balance
      await fetch(`${S}/rest/v1/phire_balances?member_id=eq.${sub.member_id}`, {
        method: 'PATCH', headers: ch(),
        body: JSON.stringify({
          balance: balRes[0].balance + sub.point_value,
          lifetime_earned: balRes[0].lifetime_earned + sub.point_value,
          updated_at: new Date().toISOString()
        })
      });
    } else {
      // Insert new balance row — use upsert so concurrent inserts don't duplicate
      await fetch(`${S}/rest/v1/phire_balances`, {
        method: 'POST',
        headers: ch({ Prefer: 'resolution=merge-duplicates' }),
        body: JSON.stringify({ member_id: sub.member_id, balance: sub.point_value, lifetime_earned: sub.point_value })
      });
    }

    // Log transaction
    await fetch(`${S}/rest/v1/phire_transactions`, {
      method: 'POST', headers: ch(),
      body: JSON.stringify({ member_id: sub.member_id, member_name: sub.member_name, points: sub.point_value, type: 'earned', submission_id, note: sub.activity_name, created_by: member.id, created_by_name: member.frat_name })
    });

    await addNotification(sub.member_id, '✅ Activity Approved', `"${sub.activity_name}" was approved! +${sub.point_value} pts added to your balance.`, member.id);
  } else {
    await addNotification(sub.member_id, '❌ Activity Denied', `"${sub.activity_name}" was denied.${note ? ' Reason: '+note : ''}`, member.id);
  }

  return NextResponse.json({ success: true });
}
