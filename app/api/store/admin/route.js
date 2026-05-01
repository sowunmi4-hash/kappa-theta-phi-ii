import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { S, h, ch } from '../_shared.js';

async function isAdmin() {
  const token = (await cookies()).get(process.env.SESSION_COOKIE_NAME || 'ktf_session')?.value;
  if (!token) return false;
  const s = await fetch(`${S}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id,expires_at`, { headers: h() }).then(r => r.json());
  if (!s?.length || new Date(s[0].expires_at) < new Date()) return false;
  const m = await fetch(`${S}/rest/v1/roster?id=eq.${s[0].member_id}&select=frat_name`, { headers: h() }).then(r => r.json());
  return m?.[0]?.frat_name === 'Big Brother Cool Breeze';
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const orders = await fetch(`${S}/rest/v1/store_orders?order=created_at.desc&select=*`, { headers: h() }).then(r => r.json());
  const summary = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total_ls, 0),
  };
  return NextResponse.json({ orders: Array.isArray(orders) ? orders : [], summary });
}

export async function PATCH(req) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { order_id, status } = await req.json();
  await fetch(`${S}/rest/v1/store_orders?id=eq.${order_id}`, {
    method: 'PATCH', headers: ch(),
    body: JSON.stringify({ status, ...(status === 'delivered' ? { delivered_at: new Date().toISOString() } : {}) })
  });
  return NextResponse.json({ success: true });
}
