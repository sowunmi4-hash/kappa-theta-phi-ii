import { NextResponse } from 'next/server';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const h = () => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members' });

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sl_name = searchParams.get('sl_name')?.trim();
  if (!sl_name) return NextResponse.json({ error: 'SL name required.' }, { status: 400 });

  const data = await fetch(
    `${S}/rest/v1/applications?sl_name=ilike.${encodeURIComponent(sl_name)}&select=sl_name,status,created_at,reviewed_at,interview_date,interview_notes&order=created_at.desc&limit=1`,
    { headers: h() }
  ).then(r => r.json());

  if (!data?.length) return NextResponse.json({ found: false });
  const app = data[0];
  return NextResponse.json({ found: true, ...app });
}
