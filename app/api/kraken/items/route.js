import { NextResponse } from 'next/server';
import { h, ch, SECRET } from '../_shared.js';

const S = process.env.SUPABASE_URL;

export async function GET() {
  const items = await fetch(`${S}/rest/v1/kraken_items?active=eq.true&order=token_price.asc&select=*`, { headers: h() }).then(r => r.json());
  return NextResponse.json({ items: items || [] });
}

// Admin: add item
export async function POST(req) {
  const body = await req.json();
  if (body.secret !== SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name, description, image_url, token_price, sl_item_name } = body;
  const res = await fetch(`${S}/rest/v1/kraken_items`, {
    method: 'POST', headers: { ...ch(), Prefer: 'return=representation' },
    body: JSON.stringify({ name, description, image_url, token_price, sl_item_name, active: true })
  }).then(r => r.json());
  return NextResponse.json({ item: res[0] });
}

// Admin: toggle active
export async function PATCH(req) {
  const body = await req.json();
  if (body.secret !== SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await fetch(`${S}/rest/v1/kraken_items?id=eq.${body.id}`, {
    method: 'PATCH', headers: ch(),
    body: JSON.stringify({ active: body.active })
  });
  return NextResponse.json({ success: true });
}
