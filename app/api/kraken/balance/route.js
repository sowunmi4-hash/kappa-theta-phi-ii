import { NextResponse } from 'next/server';
import { findOrCreateAccount } from '../_shared.js';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sl_name = searchParams.get('sl_name') || '';
  const sl_uuid = searchParams.get('sl_uuid') || '';
  if (!sl_name && !sl_uuid) return NextResponse.json({ error: 'Missing sl_name' }, { status: 400 });

  const account = await findOrCreateAccount(sl_uuid, sl_name);
  if (!account) return NextResponse.json({ found: 'no', balance: 0 });

  return NextResponse.json({ found: 'yes', sl_name: account.sl_name, balance: account.balance || 0 });
}
