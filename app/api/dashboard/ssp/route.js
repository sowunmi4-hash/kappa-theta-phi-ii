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

const CAN_MANAGE = (m) => m?.fraction === 'Ishi No Fraction' || m?.role === 'Head Founder' || m?.role === 'Co-Founder';

// GET with ?view=all for facilitators
export { GET };

// Override GET to support view=all
const _GET = GET;
export async function GET(req) {
  const token = (await cookies()).get(C)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const viewAll = searchParams.get('view') === 'all' && CAN_MANAGE(member);

  const query = viewAll
    ? `${S}/rest/v1/discipline_ssp?order=created_at.desc&select=*`
    : `${S}/rest/v1/discipline_ssp?member_id=eq.${member.id}&order=created_at.desc&select=*`;

  const ssps = await fetch(query, { headers: h() }).then(r => r.json());

  const enriched = await Promise.all((ssps || []).map(async (ssp) => {
    const violations = await fetch(`${S}/rest/v1/discipline_violations?id=eq.${ssp.violation_id}&select=*`, { headers: h() }).then(r => r.json());
    return { ...ssp, violation: violations[0] || null };
  }));

  return NextResponse.json({ ssps: enriched, member });
}

// PATCH — facilitator marks lesson done or clears
export async function PATCH(req) {
  const token = (await cookies()).get(C)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member || !CAN_MANAGE(member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { ssp_id, cleared, ...fields } = body;
  if (!ssp_id) return NextResponse.json({ error: 'Missing ssp_id' }, { status: 400 });

  const update = { ...fields, updated_at: new Date().toISOString() };
  if (cleared) {
    update.cleared = true;
    update.cleared_at = new Date().toISOString();
    update.cleared_by_name = member.frat_name;
    update.status = 'completed';
  }

  await fetch(`${S}/rest/v1/discipline_ssp?id=eq.${ssp_id}`, {
    method: 'PATCH',
    headers: h({ 'Content-Type': 'application/json', 'Content-Profile': 'members' }),
    body: JSON.stringify(update)
  });

  return NextResponse.json({ success: true });
}
