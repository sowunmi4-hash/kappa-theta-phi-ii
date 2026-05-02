import { NextResponse } from 'next/server';
import { S, h, ch, getMember, canManage } from '../_shared';

export async function GET(req) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view') || 'own'; // 'own' | 'all' | 'member'
  const memberId = searchParams.get('member_id');

  let url;
  if (canManage(member) && view === 'all') {
    url = `${S}/rest/v1/discipline_violations?order=created_at.desc&select=*`;
  } else if (canManage(member) && view === 'member' && memberId) {
    url = `${S}/rest/v1/discipline_violations?member_id=eq.${memberId}&order=created_at.desc&select=*`;
  } else {
    url = `${S}/rest/v1/discipline_violations?member_id=eq.${member.id}&order=created_at.desc&select=*`;
  }

  const violations = await fetch(url, { headers: h() }).then(r => r.json());

  // Enrich each violation with related records
  const enriched = await Promise.all(violations.map(async (v) => {
    const [ssp, fines, warrants, suspensions, court] = await Promise.all([
      fetch(`${S}/rest/v1/discipline_ssp?violation_id=eq.${v.id}&select=*`, { headers: h() }).then(r => r.json()),
      fetch(`${S}/rest/v1/discipline_fines?violation_id=eq.${v.id}&select=*`, { headers: h() }).then(r => r.json()),
      fetch(`${S}/rest/v1/discipline_warrants?violation_id=eq.${v.id}&select=*`, { headers: h() }).then(r => r.json()),
      fetch(`${S}/rest/v1/discipline_suspensions?violation_id=eq.${v.id}&select=*`, { headers: h() }).then(r => r.json()),
      fetch(`${S}/rest/v1/discipline_court_marshall?violation_id=eq.${v.id}&select=*`, { headers: h() }).then(r => r.json()),
    ]);
    return { ...v, ssp: ssp[0]||null, fines, warrants, suspensions, court_marshall: court[0]||null };
  }));

  return NextResponse.json({ violations: enriched, can_manage: canManage(member), member });
}

export async function POST(req) {
  const member = await getMember();
  if (!member || !canManage(member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { member_id, member_name, offense_color, violations, is_repeat, notes } = body;
  if (!member_id || !offense_color || !violations?.length) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // Create violation record
  const vRes = await fetch(`${S}/rest/v1/discipline_violations`, {
    method: 'POST', headers: ch({ Prefer: 'return=representation' }),
    body: JSON.stringify({ member_id, member_name, offense_color, violations, is_repeat: !!is_repeat, notes: notes||null, issued_by: member.id, issued_by_name: member.frat_name })
  }).then(r => r.json());
  const v = vRes[0];
  if (!v) return NextResponse.json({ error: 'Failed to create violation' }, { status: 500 });

  // Auto-create Sage record (offered) for non-repeat violations on grey/navy_blue/gold
  if (!is_repeat && ['grey','navy_blue','gold'].includes(offense_color)) {
    // Count how many times this member has been offered SSP (lifetime)
    const prevSSPs = await fetch(`${S}/rest/v1/discipline_ssp?member_id=eq.${member_id}&select=id`, { headers: h() }).then(r => r.json());
    const offerNumber = prevSSPs.length + 1;

    if (offerNumber > 3) {
      // SSP limit reached — no more offers, fine + penalty apply directly
    } else {
      await fetch(`${S}/rest/v1/discipline_ssp`, { method: 'POST', headers: ch(),
        body: JSON.stringify({ violation_id: v.id, member_id, status: 'offered', offer_number: offerNumber }) });
    }
  }

  // Auto-create fine for navy_blue (1500L) and gold (3000L) if repeat
  const fineAmounts = { navy_blue: 1500, gold: 3000 };
  if (is_repeat && fineAmounts[offense_color]) {
    const due = new Date(); due.setDate(due.getDate() + 7);
    await fetch(`${S}/rest/v1/discipline_fines`, { method: 'POST', headers: ch(),
      body: JSON.stringify({ violation_id: v.id, member_id, amount_ls: fineAmounts[offense_color], status: 'pending', due_date: due.toISOString().split('T')[0] }) });
  }

  // Auto-create warrant for navy_blue (1st) and gold (2nd)
  if (['navy_blue','gold'].includes(offense_color)) {
    const warrantNum = offense_color === 'navy_blue' ? 1 : 2;
    await fetch(`${S}/rest/v1/discipline_warrants`, { method: 'POST', headers: ch(),
      body: JSON.stringify({ violation_id: v.id, member_id, warrant_number: warrantNum }) });
  }

  // Auto-create suspension for gold (1 month)
  if (offense_color === 'gold') {
    const start = new Date(); const end = new Date(); end.setMonth(end.getMonth() + 1);
    await fetch(`${S}/rest/v1/discipline_suspensions`, { method: 'POST', headers: ch(),
      body: JSON.stringify({ violation_id: v.id, member_id, start_date: start.toISOString().split('T')[0], end_date: end.toISOString().split('T')[0], status: 'active' }) });
  }

  // Notify the brother
  await fetch(`${S}/rest/v1/notifications`, { method: 'POST', headers: ch(),
    body: JSON.stringify({ member_id, title: 'Discipline Notice', message: `A ${offense_color.replace('_',' ').toUpperCase()} offense has been issued against you. Check the Discipline tab for details.`, created_by: member.id }) });

  return NextResponse.json({ success: true, violation_id: v.id });
}