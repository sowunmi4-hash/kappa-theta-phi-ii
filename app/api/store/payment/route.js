import { NextResponse } from 'next/server';
import { S, h, ch } from '../_shared.js';

// Webhook secret to verify the terminal is legit
const WEBHOOK_SECRET = process.env.STORE_WEBHOOK_SECRET || 'KTP-TERMINAL-2026';

export async function POST(req) {
  const body = await req.json();
  const { order_number, amount_ls, sl_username, secret } = body;

  // Verify secret
  if (secret !== WEBHOOK_SECRET) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Find order
  const orders = await fetch(`${S}/rest/v1/store_orders?order_number=eq.${order_number}&select=*`, { headers: h() }).then(r => r.json());
  if (!orders?.length) return NextResponse.json({ error: 'Order not found', deliver: false }, { status: 404 });

  const order = orders[0];

  // Validate amount
  if (amount_ls < order.total_ls) {
    return NextResponse.json({ error: `Underpaid. Expected L$${order.total_ls}, got L$${amount_ls}`, deliver: false }, { status: 400 });
  }

  // Check not already paid
  if (order.status === 'delivered') {
    return NextResponse.json({ error: 'Already delivered', deliver: false }, { status: 400 });
  }

  // Mark as paid + delivered
  await fetch(`${S}/rest/v1/store_orders?id=eq.${order.id}`, {
    method: 'PATCH', headers: ch(),
    body: JSON.stringify({ status: 'delivered', paid_at: new Date().toISOString(), delivered_at: new Date().toISOString(), payment_ref: `${sl_username}-${Date.now()}` })
  });

  // Tell the terminal to deliver
  return NextResponse.json({
    deliver: true,
    item_name: order.item_name,
    sl_username: order.sl_username,
    order_number: order.order_number,
    message: `Delivering ${order.item_name} to ${order.sl_username}`
  });
}
