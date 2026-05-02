import { NextResponse } from 'next/server';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const h = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });
const ch = () => h({ 'Content-Type': 'application/json', 'Content-Profile': 'members' });

export async function GET(req) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const in45 = new Date(now.getTime() + 45 * 60 * 1000);
  const in75 = new Date(now.getTime() + 75 * 60 * 1000);

  const events = await fetch(
    `${S}/rest/v1/events?status=eq.upcoming&reminder_sent=eq.false&select=*`,
    { headers: h() }
  ).then(r => r.json());

  const due = (events || []).filter(ev => {
    if (!ev.event_date || !ev.event_time) return false;
    const evDt = new Date(`${ev.event_date}T${ev.event_time}`);
    return evDt >= in45 && evDt <= in75;
  });

  if (!due.length) return NextResponse.json({ sent: 0 });

  const members = await fetch(`${S}/rest/v1/roster?select=id`, { headers: h() }).then(r => r.json());

  let sent = 0;
  for (const ev of due) {
    const timeStr = ev.event_time ? ev.event_time.slice(0, 5) : '';
    const title = `⏰ Starting in 1 Hour: ${ev.title}`;
    const message = `${timeStr ? `At ${timeStr}` : ''}${ev.location ? ` · ${ev.location}` : ''} — Check the Events page.`;

    await Promise.all((members || []).map(m =>
      fetch(`${S}/rest/v1/notifications`, {
        method: 'POST', headers: ch(),
        body: JSON.stringify({ member_id: m.id, title, message })
      })
    ));

    await fetch(`${S}/rest/v1/events?id=eq.${ev.id}`, {
      method: 'PATCH', headers: ch(),
      body: JSON.stringify({ reminder_sent: true })
    });

    sent++;
  }

  return NextResponse.json({ sent, events: due.map(e => e.title) });
}
