import { NextResponse } from 'next/server';
import { S, h, ch, getMember, CAN_MANAGE, recalcRecord } from '../_shared';

export async function POST(req) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { period_id, amount_ls, transaction_id, expires_at, casper_expiry_text, notes, target_member_id } = body;
  if (!period_id || !amount_ls) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const memberId = (CAN_MANAGE(member) && target_member_id) ? target_member_id : member.id;
  const memberName = (CAN_MANAGE(member) && target_member_id)
    ? (await fetch(`${S}/rest/v1/roster?id=eq.${target_member_id}&select=frat_name`, { headers: h() }).then(r => r.json()))[0]?.frat_name
    : member.frat_name;

  await fetch(`${S}/rest/v1/dues_payments`, {
    method: 'POST', headers: ch(),
    body: JSON.stringify({ period_id, member_id: memberId, member_name: memberName, amount_ls, transaction_id: transaction_id||null, notes: notes||null, logged_by: member.id, logged_by_name: member.frat_name })
  });

  // Update the dues record with expiry date if provided
  if (expires_at) {
    await fetch(`${S}/rest/v1/dues_records?period_id=eq.${period_id}&member_id=eq.${memberId}`, {
      method: 'PATCH', headers: ch(),
      body: JSON.stringify({ expires_at, casper_expiry_text: casper_expiry_text||null, updated_at: new Date().toISOString() })
    });
  }

  await recalcRecord(period_id, memberId);
  return NextResponse.json({ success: true });
}
