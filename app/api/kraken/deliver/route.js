import { NextResponse } from 'next/server';
import { h, ch, SECRET } from '../_shared.js';

const S = process.env.SUPABASE_URL;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const sl_uuid = searchParams.get('sl_uuid') || '';
  const sl_name = searchParams.get('sl_name') || '';
  if (secret !== SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Find pending deliveries for this avatar
  let filter = sl_uuid ? `sl_uuid=eq.${sl_uuid}` : `sl_name=ilike.${sl_name.toLowerCase().split(' ')[0]}`;
  const pending = await fetch(
    `${S}/rest/v1/kraken_redemptions?${filter}&status=eq.pending&select=*&order=created_at.asc`,
    { headers: h() }
  ).then(r => r.json());

  if (!pending?.length) return NextResponse.json({ deliveries: [] });

  // Mark as delivered
  for (const d of pending) {
    await fetch(`${S}/rest/v1/kraken_redemptions?id=eq.${d.id}`, {
      method: 'PATCH', headers: ch(),
      body: JSON.stringify({ status: 'delivered' })
    });
  }

  return NextResponse.json({ deliveries: pending.map(d => d.item_name) });
}
