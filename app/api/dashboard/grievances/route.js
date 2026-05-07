import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const C = process.env.SESSION_COOKIE_NAME || 'ktf_session';
const h  = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });
const ch = (x={}) => h({ 'Content-Type': 'application/json', 'Content-Profile': 'members', ...x });

const IS_ADMIN = (m) => m?.frat_name === 'Big Brother Cool Breeze';

async function getMember() {
  const token = (await cookies()).get(C)?.value;
  if (!token) return null;
  const s = await fetch(`${S}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id,expires_at`, { headers: h() }).then(r => r.json());
  if (!s.length || new Date(s[0].expires_at) < new Date()) return null;
  const m = await fetch(`${S}/rest/v1/roster?id=eq.${s[0].member_id}&select=*`, { headers: h() }).then(r => r.json());
  return m[0] || null;
}

// GET — fetch my submissions (or all if admin)
export async function GET(req) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');

  let url;
  if (view === 'all' && IS_ADMIN(member)) {
    url = `${S}/rest/v1/grievances?order=created_at.desc&select=*`;
  } else {
    url = `${S}/rest/v1/grievances?member_id=eq.${member.id}&order=created_at.desc&select=*`;
  }

  const data = await fetch(url, { headers: h() }).then(r => r.json());
  return NextResponse.json({ grievances: Array.isArray(data) ? data : [], is_admin: IS_ADMIN(member) });
}

// POST — submit a new grievance
export async function POST(req) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { category, related_page, description } = body;

  if (!category || !description || description.trim().length < 10)
    return NextResponse.json({ error: 'Category and description (min 10 chars) required.' }, { status: 400 });

  const res = await fetch(`${S}/rest/v1/grievances`, {
    method: 'POST', headers: ch({ 'Prefer': 'return=representation' }),
    body: JSON.stringify({
      member_id:   member.id,
      member_name: member.frat_name,
      category,
      related_page: related_page || null,
      description:  description.trim(),
    })
  }).then(r => r.json());

  return NextResponse.json({ grievance: Array.isArray(res) ? res[0] : res });
}

// PATCH — update status / admin notes (admin only)
export async function PATCH(req) {
  const member = await getMember();
  if (!member || !IS_ADMIN(member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, status, admin_notes } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await fetch(`${S}/rest/v1/grievances?id=eq.${id}`, {
    method: 'PATCH', headers: ch(),
    body: JSON.stringify({
      ...(status      && { status }),
      ...(admin_notes !== undefined && { admin_notes }),
      reviewed_by_name: member.frat_name,
      updated_at: new Date().toISOString(),
    })
  });

  return NextResponse.json({ ok: true });
}
