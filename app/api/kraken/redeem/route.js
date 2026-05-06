import { NextResponse } from 'next/server';
import { h, ch, findOrCreateAccount } from '../_shared.js';

const S = process.env.SUPABASE_URL;

export async function POST(req) {
  const body = await req.json();
  const { sl_name, sl_uuid, item_id } = body;
  if (!sl_name || !item_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // Get item
  const items = await fetch(`${S}/rest/v1/kraken_items?id=eq.${item_id}&active=eq.true&select=*`, { headers: h() }).then(r => r.json());
  if (!items?.length) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  const item = items[0];

  // Get account
  const account = await findOrCreateAccount(sl_uuid, sl_name);
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  if ((account.balance || 0) < item.token_price) {
    return NextResponse.json({ error: 'insufficient_tokens', balance: account.balance, needed: item.token_price }, { status: 400 });
  }

  // Deduct tokens
  const newBalance = account.balance - item.token_price;
  await fetch(`${S}/rest/v1/kraken_accounts?id=eq.${account.id}`, {
    method: 'PATCH', headers: ch(),
    body: JSON.stringify({ balance: newBalance, updated_at: new Date().toISOString() })
  });

  // Use UUID from account (saved when they bought tokens at terminal)
  const resolvedUuid = account.sl_uuid || sl_uuid || null;

  // Log transaction
  await fetch(`${S}/rest/v1/kraken_transactions`, {
    method: 'POST', headers: ch(),
    body: JSON.stringify({ sl_name: account.sl_name, sl_uuid: resolvedUuid, type: 'redemption', amount: -item.token_price, notes: `Redeemed: ${item.name}` })
  });

  // Queue delivery — resolvedUuid ensures terminal can find the avatar
  await fetch(`${S}/rest/v1/kraken_redemptions`, {
    method: 'POST', headers: ch(),
    body: JSON.stringify({ sl_name: account.sl_name, sl_uuid: resolvedUuid, item_id, item_name: item.name, tokens_spent: item.token_price, status: 'pending' })
  });

  return NextResponse.json({ success: true, item_name: item.name, tokens_spent: item.token_price, new_balance: newBalance });
}
