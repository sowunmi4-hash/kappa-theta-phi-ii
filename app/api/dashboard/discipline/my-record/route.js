import { NextResponse } from 'next/server';
import { S, h, getMember } from '../_shared';

export async function GET() {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const violations = await fetch(`${S}/rest/v1/discipline_violations?member_id=eq.${member.id}&order=created_at.desc&select=*`, { headers: h() }).then(r => r.json());
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
  return NextResponse.json({ violations: enriched, member });
}