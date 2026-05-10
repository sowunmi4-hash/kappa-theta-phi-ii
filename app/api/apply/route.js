import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const h  = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });
const ch = ()     => h({ 'Content-Type': 'application/json', 'Content-Profile': 'members', Prefer: 'return=representation' });

const canReview = (m) => m?.fraction === 'Kuro Kanda Fraction';

async function getMember() {
  const token = (await cookies()).get(process.env.SESSION_COOKIE_NAME || 'ktf_session')?.value;
  if (!token) return null;
  const s = await fetch(`${S}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id,expires_at`, { headers: h() }).then(r => r.json());
  if (!s.length || new Date(s[0].expires_at) < new Date()) return null;
  const m = await fetch(`${S}/rest/v1/roster?id=eq.${s[0].member_id}&select=*`, { headers: h() }).then(r => r.json());
  return m[0] || null;
}

// POST — submit application (public)
export async function POST(req) {
  const body = await req.json();
  const { email, sl_name } = body;
  if (!email || !sl_name) return NextResponse.json({ error: 'Email and SL name are required.' }, { status: 400 });

  const existing = await fetch(`${S}/rest/v1/applications?sl_name=ilike.${encodeURIComponent(sl_name)}&status=in.(pending,approved)&select=id`, { headers: h() }).then(r => r.json());
  if (existing?.length) return NextResponse.json({ error: 'An application for this SL name is already on file.' }, { status: 409 });

  const res = await fetch(`${S}/rest/v1/applications`, {
    method: 'POST', headers: ch(),
    body: JSON.stringify({ ...body, contact_method: Array.isArray(body.contact_method) ? body.contact_method.join(', ') : body.contact_method })
  }).then(r => r.json());

  return NextResponse.json({ ok: true, id: Array.isArray(res) ? res[0]?.id : res?.id });
}

// GET — all applications (Kuro Kanda Fraction only)
export async function GET() {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canReview(member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const apps = await fetch(`${S}/rest/v1/applications?order=created_at.desc&select=*`, { headers: h() }).then(r => r.json());
  const list = Array.isArray(apps) ? apps : [];
  return NextResponse.json({
    applications: list,
    summary: {
      total: list.length,
      pending:    list.filter(a => a.status === 'pending').length,
      approved:   list.filter(a => a.status === 'approved').length,
      denied:     list.filter(a => a.status === 'denied').length,
      waitlisted: list.filter(a => a.status === 'waitlisted').length,
    }
  });
}

// PATCH — update status (Kuro Kanda Fraction only)
export async function PATCH(req) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canReview(member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, status, review_notes } = await req.json();
  await fetch(`${S}/rest/v1/applications?id=eq.${id}`, {
    method: 'PATCH', headers: ch(),
    body: JSON.stringify({ status, review_notes, reviewed_by_name: member.frat_name, reviewed_at: new Date().toISOString() })
  });
  return NextResponse.json({ ok: true });
}
