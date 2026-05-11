import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const SECRET = process.env.TREASURY_SECRET || 'ktpii-treasury-2026';
const h  = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });
const ch = () => h({ 'Content-Type': 'application/json', 'Content-Profile': 'members', Prefer: 'return=representation' });

async function getMember() {
  const token = (await cookies()).get(process.env.SESSION_COOKIE_NAME || 'ktf_session')?.value;
  if (!token) return null;
  const s = await fetch(`${S}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id,expires_at`, { headers: h() }).then(r => r.json());
  if (!s.length || new Date(s[0].expires_at) < new Date()) return null;
  const m = await fetch(`${S}/rest/v1/roster?id=eq.${s[0].member_id}&select=*`, { headers: h() }).then(r => r.json());
  return m[0] || null;
}

// POST — receive payment from LSL vendor (no auth cookie, uses secret key)
export async function POST(req) {
  const body = await req.json();
  const { secret, type, amount_ls, payer_name, payer_uuid, description, event_name, transaction_id } = body;

  if (secret !== SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!type || !amount_ls) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  if (!['gear','event','charity','dues','other'].includes(type)) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

  // Deduplicate by transaction_id
  if (transaction_id) {
    const existing = await fetch(`${S}/rest/v1/treasury_transactions?transaction_id=eq.${encodeURIComponent(transaction_id)}&select=id`, { headers: h() }).then(r => r.json());
    if (existing?.length) return NextResponse.json({ ok: true, duplicate: true });
  }

  await fetch(`${S}/rest/v1/treasury_transactions`, {
    method: 'POST', headers: ch(),
    body: JSON.stringify({ type, amount_ls: parseInt(amount_ls), payer_name, payer_uuid, description, event_name, transaction_id })
  });

  return NextResponse.json({ ok: true });
}

// GET — fetch all transactions (Cool Breeze only)
export async function GET(req) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (member.frat_name !== 'Big Brother Cool Breeze') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type   = searchParams.get('type');
  const month  = searchParams.get('month'); // YYYY-MM
  const event  = searchParams.get('event');

  let url = `${S}/rest/v1/treasury_transactions?order=created_at.desc&limit=200`;
  if (type)  url += `&type=eq.${type}`;
  if (event) url += `&event_name=ilike.*${encodeURIComponent(event)}*`;
  if (month) {
    const start = `${month}-01T00:00:00Z`;
    const end   = new Date(new Date(start).setMonth(new Date(start).getMonth() + 1)).toISOString();
    url += `&created_at=gte.${start}&created_at=lt.${end}`;
  }

  const txns = await fetch(url, { headers: h() }).then(r => r.json());
  const list = Array.isArray(txns) ? txns : [];

  const totals = {
    all:     list.reduce((a,t) => a + t.amount_ls, 0),
    gear:    list.filter(t=>t.type==='gear').reduce((a,t) => a + t.amount_ls, 0),
    event:   list.filter(t=>t.type==='event').reduce((a,t) => a + t.amount_ls, 0),
    charity: list.filter(t=>t.type==='charity').reduce((a,t) => a + t.amount_ls, 0),
    dues:    list.filter(t=>t.type==='dues').reduce((a,t) => a + t.amount_ls, 0),
  };

  return NextResponse.json({ transactions: list, totals });
}
