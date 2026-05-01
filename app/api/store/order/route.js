import { NextResponse } from 'next/server';
import { S, h, ch } from '../_shared.js';

export async function POST(req) {
  const { sl_username, item_id } = await req.json();
  if (!sl_username?.trim() || !item_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // Get item
  const items = await fetch(`${S}/rest/v1/store_items?id=eq.${item_id}&active=eq.true&select=*`, { headers: h() }).then(r => r.json());
  if (!items?.length) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  const item = items[0];

  // Generate order number via SQL function
  const seqRes = await fetch(`${S}/rest/v1/rpc/generate_order_number`, { method: 'POST', headers: ch(), body: '{}' }).then(r => r.json());
  const order_number = seqRes;

  // Create order
  const order = await fetch(`${S}/rest/v1/store_orders`, {
    method: 'POST', headers: ch(),
    body: JSON.stringify({
      order_number,
      sl_username: sl_username.trim(),
      item_id: item.id,
      item_name: item.name,
      quantity: 1,
      price_ls: item.price_ls,
      total_ls: item.price_ls,
      status: 'pending'
    })
  }).then(r => r.json());

  return NextResponse.json({ success: true, order: Array.isArray(order) ? order[0] : order });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const order_number = searchParams.get('order_number');
  if (!order_number) return NextResponse.json({ error: 'Missing order_number' }, { status: 400 });

  const orders = await fetch(`${S}/rest/v1/store_orders?order_number=eq.${order_number}&select=*`, { headers: h() }).then(r => r.json());
  if (!orders?.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  return NextResponse.json({ order: orders[0] });
}
