import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const C = process.env.SESSION_COOKIE_NAME || 'ktf_session';
const h = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });

async function getMember() {
  const token = (await cookies()).get(C)?.value;
  if (!token) return null;
  const s = await fetch(`${S}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id,expires_at`, { headers: h() }).then(r => r.json());
  if (!s.length || new Date(s[0].expires_at) < new Date()) return null;
  const m = await fetch(`${S}/rest/v1/roster?id=eq.${s[0].member_id}&select=*`, { headers: h() }).then(r => r.json());
  return m[0] || null;
}

const CAN_MANAGE = (m) => m?.fraction === 'Ishi No Fraction' || m?.role === 'Head Founder' || m?.role === 'Co-Founder';

export async function GET() {
  const member = await getMember();
  if (!member || !CAN_MANAGE(member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [ssps, logs, roster] = await Promise.all([
    fetch(`${S}/rest/v1/discipline_ssp?order=created_at.desc&select=*`, { headers: h() }).then(r => r.json()),
    fetch(`${S}/rest/v1/ssp_session_logs?order=session_at.asc&select=*`, { headers: h() }).then(r => r.json()),
    fetch(`${S}/rest/v1/roster?select=id,frat_name&order=frat_name.asc`, { headers: h() }).then(r => r.json()),
  ]);

  const violationIds = [...new Set((ssps||[]).map(s => s.violation_id).filter(Boolean))];
  let violations = [];
  if (violationIds.length) {
    violations = await fetch(`${S}/rest/v1/discipline_violations?id=in.(${violationIds.join(',')})&select=*`, { headers: h() }).then(r => r.json());
  }

  const enriched = (ssps||[]).map(ssp => {
    const rosterEntry = (roster||[]).find(r => r.id === ssp.member_id);
    return {
      ...ssp,
      member_name: rosterEntry?.frat_name || 'Unknown Brother',
      violation: violations.find(v => v.id === ssp.violation_id) || null,
      sessions: (logs||[]).filter(l => l.ssp_id === ssp.id),
    };
  });

  const total = enriched.length;
  const completed = enriched.filter(s => s.cleared).length;
  const in_progress = enriched.filter(s => !s.cleared && s.status !== 'opted_out').length;
  const opted_out = enriched.filter(s => s.status === 'opted_out').length;
  const total_sessions_conducted = (logs||[]).length;
  const failed_sessions = (logs||[]).filter(l => l.passed === false).length;

  return NextResponse.json({
    ssps: enriched,
    summary: { total, completed, in_progress, opted_out, total_sessions_conducted, failed_sessions }
  });
}
