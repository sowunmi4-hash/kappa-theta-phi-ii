import { NextResponse } from 'next/server';
import { S, h, ch } from '../_shared.js';

const WEBHOOK_SECRET = process.env.STORE_WEBHOOK_SECRET || 'KTP-TERMINAL-2026';

export async function POST(req) {
  const { order_number, amount_ls, sl_username, secret } = await req.json();

  if (secret !== WEBHOOK_SECRET) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const orders = await fetch(`${S}/rest/v1/store_orders?order_number=eq.${order_number}&select=*`, { headers: h() }).then(r => r.json());
  if (!orders?.length) return NextResponse.json({ error: 'Order not found', deliver: 'no' }, { status: 404 });

  const order = orders[0];

  if (amount_ls < order.total_ls) {
    return NextResponse.json({ error: `Underpaid. Expected L$${order.total_ls} got L$${amount_ls}`, deliver: 'no' }, { status: 400 });
  }

  if (order.status === 'delivered') {
    return NextResponse.json({ error: 'Already delivered', deliver: 'no' }, { status: 400 });
  }

  await fetch(`${S}/rest/v1/store_orders?id=eq.${order.id}`, {
    method: 'PATCH', headers: ch(),
    body: JSON.stringify({ status: 'delivered', paid_at: new Date().toISOString(), delivered_at: new Date().toISOString(), payment_ref: `${sl_username}-${Date.now()}` })
  });

  // Build list of items to deliver (handles cart with quantities)
  const cart = order.cart || [{ name: order.item_name, quantity: 1 }];
  const deliverItems = [];
  cart.forEach(c => {
    for (let i = 0; i < (c.quantity || 1); i++) {
      deliverItems.push(c.name);
    }
  });

  return NextResponse.json({
    deliver: 'yes',
    items: deliverItems,         // array of item names to give (one per quantity)
    item_name: order.item_name,  // summary string
    sl_username: order.sl_username,
    order_number: order.order_number,
    total_ls: order.total_ls,
  });
}
