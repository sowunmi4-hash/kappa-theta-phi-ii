import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const h = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });

async function getMember() {
  const token = (await cookies()).get(process.env.SESSION_COOKIE_NAME || 'ktf_session')?.value;
  if (!token) return null;
  const s = await fetch(`${S}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id,expires_at`, { headers: h() }).then(r => r.json());
  if (!s.length || new Date(s[0].expires_at) < new Date()) return null;
  const m = await fetch(`${S}/rest/v1/roster?id=eq.${s[0].member_id}&select=*`, { headers: h() }).then(r => r.json());
  return m[0] || null;
}

export async function GET() {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (member.frat_name !== 'Big Brother Wildwon') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Get all brothers from roster (excluding hidden members)
  const roster = await fetch(
    `${S}/rest/v1/roster?select=id,frat_name,role,faction&order=frat_name.asc`,
    { headers: h() }
  ).then(r => r.json());

  // Get the most recent session per member
  const sessions = await fetch(
    `${S}/rest/v1/website_sessions?is_admin_login=eq.false&select=member_id,is_active,last_seen_at,created_at,expires_at&order=last_seen_at.desc`,
    { headers: h() }
  ).then(r => r.json());

  // Map: most recent session per member
  const sessionMap = {};
  for (const s of (Array.isArray(sessions) ? sessions : [])) {
    if (!sessionMap[s.member_id]) sessionMap[s.member_id] = s;
  }

  const now = new Date();
  const members = (Array.isArray(roster) ? roster : []).map(m => {
    const sess = sessionMap[m.id];
    if (!sess) return { ...m, status: 'never', last_seen: null, session_active: false };

    const lastSeen = new Date(sess.last_seen_at || sess.created_at);
    const msSince = now - lastSeen;
    const sessionActive = sess.is_active && new Date(sess.expires_at) > now;

    let status;
    if (sessionActive && msSince < 15 * 60 * 1000) status = 'online';       // active session < 15min
    else if (msSince < 24 * 60 * 60 * 1000)        status = 'today';         // seen today
    else if (msSince < 7 * 24 * 60 * 60 * 1000)    status = 'this_week';     // seen this week
    else if (msSince < 30 * 24 * 60 * 60 * 1000)   status = 'this_month';    // seen this month
    else                                             status = 'inactive';      // 30+ days ago

    return { ...m, status, last_seen: sess.last_seen_at || sess.created_at, session_active: sessionActive };
  });

  // Summary
  const summary = {
    total:      members.length,
    online:     members.filter(m => m.status === 'online').length,
    today:      members.filter(m => m.status === 'today').length,
    this_week:  members.filter(m => m.status === 'this_week').length,
    this_month: members.filter(m => m.status === 'this_month').length,
    inactive:   members.filter(m => m.status === 'inactive').length,
    never:      members.filter(m => m.status === 'never').length,
  };

  return NextResponse.json({ members, summary });
}
