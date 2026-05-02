import { NextResponse } from 'next/server';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const h  = () => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members' });
const ch = () => ({ ...h(), 'Content-Type': 'application/json', 'Content-Profile': 'members' });

async function getMember() {
  const { cookies } = await import('next/headers');
  const token = (await cookies()).get(process.env.SESSION_COOKIE_NAME || 'ktf_session')?.value;
  if (!token) return null;
  const s = await fetch(`${S}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id,expires_at`, { headers: h() }).then(r => r.json());
  if (!s.length || new Date(s[0].expires_at) < new Date()) return null;
  const m = await fetch(`${S}/rest/v1/roster?id=eq.${s[0].member_id}&select=*`, { headers: h() }).then(r => r.json());
  return m[0] || null;
}

const CAN_MANAGE = (m) => m?.fraction === 'Ishi No Fraction' || m?.role === 'Head Founder' || m?.role === 'Co-Founder';

export async function GET(req) {
  const member = await getMember();
  if (!member || !CAN_MANAGE(member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const ssp_id = searchParams.get('ssp_id');
  if (!ssp_id) return NextResponse.json({ error: 'Missing ssp_id' }, { status: 400 });
  const logs = await fetch(`${S}/rest/v1/ssp_session_logs?ssp_id=eq.${ssp_id}&order=session_at.asc&select=*`, { headers: h() }).then(r => r.json());
  return NextResponse.json({ logs: logs || [] });
}

export async function POST(req) {
  const member = await getMember();
  if (!member || !CAN_MANAGE(member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { ssp_id, lesson_key, passed, private_notes } = await req.json();
  if (!ssp_id || !lesson_key) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // Get the SSP record to find member info
  const ssps = await fetch(`${S}/rest/v1/discipline_ssp?id=eq.${ssp_id}&select=member_id,member_name`, { headers: h() }).then(r => r.json());
  const ssp = ssps?.[0];
  if (!ssp) return NextResponse.json({ error: 'SSP not found' }, { status: 404 });

  await fetch(`${S}/rest/v1/ssp_session_logs`, {
    method: 'POST', headers: ch(),
    body: JSON.stringify({
      ssp_id, member_id: ssp.member_id, member_name: ssp.member_name,
      facilitator_id: member.id, facilitator_name: member.frat_name,
      lesson_key, passed: passed !== false, private_notes: private_notes || null,
    })
  });
  return NextResponse.json({ success: true });
}
