import { NextResponse } from 'next/server';
import { h, ch, SECRET, findOrCreateAccount } from '../_shared.js';

const S = process.env.SUPABASE_URL;

export async function POST(req) {
  const body = await req.json();
  const { sl_uuid, sl_name, amount_ls, secret } = body;
  if (secret !== SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!sl_name || !amount_ls) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const account = await findOrCreateAccount(sl_uuid, sl_name);
  if (!account) return NextResponse.json({ error: 'Could not create account' }, { status: 500 });

  const tokens = amount_ls; // 1:1
  const newBalance = (account.balance || 0) + tokens;

  // Update balance
  await fetch(`${S}/rest/v1/kraken_accounts?id=eq.${account.id}`, {
    method: 'PATCH', headers: ch(),
    body: JSON.stringify({ balance: newBalance, updated_at: new Date().toISOString() })
  });

  // Log transaction
  await fetch(`${S}/rest/v1/kraken_transactions`, {
    method: 'POST', headers: ch(),
    body: JSON.stringify({ sl_name: account.sl_name, sl_uuid: sl_uuid || null, type: 'purchase', amount: tokens, amount_ls, notes: `Purchased ${tokens} Kraken Tokens for L$${amount_ls}` })
  });

  return NextResponse.json({ success: true, tokens_added: tokens, new_balance: newBalance, sl_name: account.sl_name });
}
