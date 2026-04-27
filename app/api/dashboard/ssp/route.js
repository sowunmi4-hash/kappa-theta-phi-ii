import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const C = process.env.SESSION_COOKIE_NAME || 'ktf_session';
const h = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });

async function getMember(token) {
  const s = await fetch(`${S}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id,expires_at`, { headers: h() }).then(r => r.json());
  if (!s.length || new Date(s[0].expires_at) < new Date()) return null;
  const m = await fetch(`${S}/rest/v1/roster?id=eq.${s[0].member_id}&select=*`, { headers: h() }).then(r => r.json());
  return m[0] || null;
}

// GET — fetch all SSP records for the current member
export async function GET() {
  const token = (await cookies()).get(C)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get all SSP records for this member with their linked violations
  const ssps = await fetch(
    `${S}/rest/v1/discipline_ssp?member_id=eq.${member.id}&order=created_at.desc&select=*`,
    { headers: h() }
  ).then(r => r.json());

  // Enrich with violation info
  const enriched = await Promise.all(ssps.map(async (ssp) => {
    const violations = await fetch(
      `${S}/rest/v1/discipline_violations?id=eq.${ssp.violation_id}&select=*`,
      { headers: h() }
    ).then(r => r.json());
    return { ...ssp, violation: violations[0] || null };
  }));

  return NextResponse.json({ ssps: enriched, member });
}
