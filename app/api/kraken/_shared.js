const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
export const h  = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });
export const ch = ()     => h({ 'Content-Type': 'application/json', 'Content-Profile': 'members' });
export const SECRET = 'KTP-KRAKEN-2026';

export async function findOrCreateAccount(sl_uuid, sl_name) {
  // Try UUID first
  let accounts = sl_uuid
    ? await fetch(`${S}/rest/v1/kraken_accounts?sl_uuid=eq.${sl_uuid}&select=*`, { headers: h() }).then(r => r.json())
    : [];

  // Fallback to name
  if (!accounts?.length && sl_name) {
    const username = sl_name.toLowerCase().split(' ')[0];
    accounts = await fetch(`${S}/rest/v1/kraken_accounts?sl_name=ilike.${encodeURIComponent(username)}&select=*`, { headers: h() }).then(r => r.json());
  }

  if (accounts?.length) {
    const acc = accounts[0];
    // Save UUID if missing
    if (sl_uuid && !acc.sl_uuid) {
      await fetch(`${S}/rest/v1/kraken_accounts?id=eq.${acc.id}`, {
        method: 'PATCH', headers: ch(),
        body: JSON.stringify({ sl_uuid, updated_at: new Date().toISOString() })
      });
    }
    return { ...acc, sl_uuid: sl_uuid || acc.sl_uuid };
  }

  // Create new account
  const username = sl_name.toLowerCase().split(' ')[0];
  const res = await fetch(`${S}/rest/v1/kraken_accounts`, {
    method: 'POST', headers: { ...ch(), Prefer: 'return=representation' },
    body: JSON.stringify({ sl_name: username, sl_uuid: sl_uuid || null, balance: 0 })
  }).then(r => r.json());
  return res[0];
}
