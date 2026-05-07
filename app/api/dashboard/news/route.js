import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const C = process.env.SESSION_COOKIE_NAME || 'ktf_session';
const h = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });
const LEADERS = ['Head Founder','Co-Founder','Co-Founder','Iron Fleet'];

async function getMember(token) {
  const s = await fetch(`${S}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id`, { headers: h() }).then(r => r.json());
  if (!s.length) return null;
  const m = await fetch(`${S}/rest/v1/roster?id=eq.${s[0].member_id}&select=*`, { headers: h() }).then(r => r.json());
  return m[0] || null;
}

export async function GET() {
  const token = (await cookies()).get(C)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const news = await fetch(`${S}/rest/v1/wokou_news?select=*&order=pinned.desc,created_at.desc&limit=50`, { headers: h() }).then(r => r.json());
  return NextResponse.json({ news, role: member.role });
}

export async function POST(req) {
  const token = (await cookies()).get(C)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { title, content, pinned } = await req.json();
  if (!title || !content) return NextResponse.json({ error: 'Title and content required' }, { status: 400 });

  // Try with posted_by_role first, fall back without if column doesn't exist
  let res = await fetch(`${S}/rest/v1/wokou_news`, {
    method: 'POST',
    headers: h({ 'Content-Type': 'application/json', 'Content-Profile': 'members', 'Prefer': 'return=minimal' }),
    body: JSON.stringify({ title, content, pinned: !!pinned, posted_by: member.id, posted_by_name: member.frat_name, posted_by_role: member.role }),
  });

  // If failed (e.g. posted_by_role column missing), retry without it
  if (!res.ok) {
    res = await fetch(`${S}/rest/v1/wokou_news`, {
      method: 'POST',
      headers: h({ 'Content-Type': 'application/json', 'Content-Profile': 'members', 'Prefer': 'return=minimal' }),
      body: JSON.stringify({ title, content, pinned: !!pinned, posted_by: member.id, posted_by_name: member.frat_name }),
    });
  }

  if (!res.ok) {
    const err = await res.text();
    console.error('News POST error:', err);
    return NextResponse.json({ error: 'Failed to post dispatch' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req) {
  const token = (await cookies()).get(C)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const member = await getMember(token);
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'No id' }, { status: 400 });

  // Fetch the post
  const posts = await fetch(`${S}/rest/v1/wokou_news?id=eq.${id}&select=*`, { headers: h() }).then(r => r.json());
  const post = posts[0];
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Only the author can delete, and only within 24 hours
  const isAuthor = post.posted_by === member.id;
  const isLeader = LEADERS.includes(member.role);
  const ageMs = Date.now() - new Date(post.created_at).getTime();
  const within24h = ageMs < 86400000;

  if (!isAuthor && !isLeader) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (isAuthor && !isLeader && !within24h) return NextResponse.json({ error: 'Window expired' }, { status: 403 });

  await fetch(`${S}/rest/v1/wokou_news?id=eq.${id}`, { method: 'DELETE', headers: h({ 'Content-Profile': 'members' }) });
  return NextResponse.json({ success: true });
}
