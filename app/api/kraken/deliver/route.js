import { NextResponse } from 'next/server';
import { h, ch, SECRET } from '../_shared.js';

const S = process.env.SUPABASE_URL;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  if (secret !== SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sl_uuid = searchParams.get('sl_uuid') || '';
  const sl_name = searchParams.get('sl_name') || '';

  // If specific avatar — deliver just theirs
  // If no avatar — return ALL pending (terminal polls this)
  let url;
  if (sl_uuid) {
    url = `${S}/rest/v1/kraken_redemptions?sl_uuid=eq.${sl_uuid}&status=eq.pending&select=*&order=created_at.asc`;
  } else if (sl_name) {
    const username = sl_name.toLowerCase().split(' ')[0];
    url = `${S}/rest/v1/kraken_redemptions?sl_name=ilike.%25${encodeURIComponent(username)}%25&status=eq.pending&select=*&order=created_at.asc`;
  } else {
    // Poll all pending — terminal uses this
    url = `${S}/rest/v1/kraken_redemptions?status=eq.pending&select=*&order=created_at.asc&limit=50`;
  }

  const pending = await fetch(url, { headers: h() }).then(r => r.json());
  if (!pending?.length) return NextResponse.json({ deliveries: [] });

  // Mark all as delivered immediately so no double delivery
  const ids = pending.map((d) => d.id);
  await fetch(`${S}/rest/v1/kraken_redemptions?id=in.(${ids.join(',')})`, {
    method: 'PATCH', headers: ch(),
    body: JSON.stringify({ status: 'delivered' })
  });

  // Return grouped by avatar so terminal can deliver to each person
  const grouped = {};
  for (const d of pending) {
    const key = d.sl_uuid || d.sl_name;
    if (!grouped[key]) grouped[key] = { sl_uuid: d.sl_uuid, sl_name: d.sl_name, items: [] };
    grouped[key].items.push(d.item_name);
  }

  return NextResponse.json({ deliveries: Object.values(grouped) });
}
