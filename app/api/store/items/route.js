import { NextResponse } from 'next/server';
import { S, h } from '../_shared.js';

export async function GET() {
  const items = await fetch(`${S}/rest/v1/store_items?active=eq.true&order=sort_order.asc&select=*`, { headers: h() }).then(r => r.json());
  return NextResponse.json(Array.isArray(items) ? items : []);
}
