import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { S, h, getMember, LEADERS } from '../_shared';

export async function GET(req) {
  const token = (await cookies()).get(process.env.SESSION_COOKIE_NAME||'ktf_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view') || 'own';
  let url;
  if (LEADERS.includes(member.role) && view !== 'own') {
    url = view === 'pending'
      ? `${S}/rest/v1/phire_submissions?status=eq.pending&order=created_at.asc&select=*`
      : `${S}/rest/v1/phire_submissions?order=created_at.desc&limit=100&select=*`;
  } else {
    url = `${S}/rest/v1/phire_submissions?member_id=eq.${member.id}&order=created_at.desc&limit=50&select=*`;
  }
  const submissions = await fetch(url, { headers: h() }).then(r => r.json());
  return NextResponse.json({ submissions, role: member.role });
}
