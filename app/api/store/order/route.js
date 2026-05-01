import { NextResponse } from 'next/server';
import { S, h, ch } from '../_shared.js';

export async function POST(req) {
  const { sl_username, cart } = await req.json();
  // cart = [{ item_id, name, price_ls, quantity }, ...]
  if (!sl_username?.trim() || !cart?.length) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // Validate all items exist
  const ids = cart.map(c => c.item_id).join(',');
  const items = await fetch(`${S}/rest/v1/store_items?id=in.(${ids})&active=eq.true&select=*`, { headers: h() }).then(r => r.json());
  if (!items?.length) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

  // Calculate total
  const total_ls = cart.reduce((sum, c) => sum + (c.price_ls * c.quantity), 0);

  // Generate order number
  const order_number = await fetch(`${S}/rest/v1/rpc/generate_order_number`, { method: 'POST', headers: ch(), body: '{}' }).then(r => r.json());

  // Build summary for item_name field
  const item_name = cart.map(c => `${c.quantity}x ${c.name}`).join(', ');

  const order = await fetch(`${S}/rest/v1/store_orders`, {
    method: 'POST', headers: ch(),
    body: JSON.stringify({
      order_number,
      sl_username: sl_username.trim(),
      item_id: cart[0].item_id, // primary item for legacy
      item_name,
      quantity: cart.reduce((s, c) => s + c.quantity, 0),
      price_ls: cart[0].price_ls,
      total_ls,
      status: 'pending',
      cart: cart
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
