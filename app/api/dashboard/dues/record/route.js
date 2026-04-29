import { NextResponse } from 'next/server';
import { S, h, ch, getMember, CAN_MANAGE } from '../_shared';

export async function GET(req) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const period_id = searchParams.get('period_id');
  const view = searchParams.get('view') || 'own';

  let records;
  if (CAN_MANAGE(member) && view === 'all') {
    const url = period_id
      ? `${S}/rest/v1/dues_records?period_id=eq.${period_id}&order=member_name.asc&select=*`
      : `${S}/rest/v1/dues_records?order=member_name.asc&select=*`;
    records = await fetch(url, { headers: h() }).then(r => r.json());
  } else {
    const url = period_id
      ? `${S}/rest/v1/dues_records?period_id=eq.${period_id}&member_id=eq.${member.id}&select=*`
      : `${S}/rest/v1/dues_records?member_id=eq.${member.id}&order=created_at.desc&select=*`;
    records = await fetch(url, { headers: h() }).then(r => r.json());
  }

  // Enrich each record with payments and sweat equity
  const enriched = await Promise.all(records.map(async rec => {
    const [payments, sweat] = await Promise.all([
      fetch(`${S}/rest/v1/dues_payments?period_id=eq.${rec.period_id}&member_id=eq.${rec.member_id}&order=created_at.desc&select=*`, { headers: h() }).then(r => r.json()),
      fetch(`${S}/rest/v1/dues_sweat_equity?period_id=eq.${rec.period_id}&member_id=eq.${rec.member_id}&order=created_at.desc&select=*`, { headers: h() }).then(r => r.json()),
    ]);
    return { ...rec, payments, sweat_equity: sweat };
  }));

  return NextResponse.json({ records: enriched, can_manage: CAN_MANAGE(member), member });
}

export async function PATCH(req) {
  const member = await getMember();
  if (!member || !CAN_MANAGE(member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { record_id, status, notes } = await req.json();
  await fetch(`${S}/rest/v1/dues_records?id=eq.${record_id}`, {
    method: 'PATCH', headers: ch(),
    body: JSON.stringify({ status, notes, updated_at: new Date().toISOString() })
  });
  return NextResponse.json({ success: true });
}