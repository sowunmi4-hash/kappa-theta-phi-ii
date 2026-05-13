import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const C = process.env.SESSION_COOKIE_NAME || 'ktf_session';
const h = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });
const ch = (x={}) => h({ 'Content-Type': 'application/json', 'Content-Profile': 'members', ...x });

async function getMember() {
  const token = (await cookies()).get(C)?.value;
  if (!token) return null;
  const s = await fetch(`${S}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id,expires_at`, { headers: h() }).then(r => r.json());
  if (!s.length || new Date(s[0].expires_at) < new Date()) return null;
  const m = await fetch(`${S}/rest/v1/roster?id=eq.${s[0].member_id}&select=*`, { headers: h() }).then(r => r.json());
  return m[0] || null;
}

const CAN_MANAGE = (m) => m?.faction === 'Ishi No Faction' || m?.role === 'Head Founder' || m?.role === 'Co-Founder';

export async function GET(req) {
  const member = await getMember();
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

export async function PATCH(req) {
  const member = await getMember();
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
    method: 'PATCH', headers: ch(),
    body: JSON.stringify(update)
  });

  return NextResponse.json({ success: true });
}
