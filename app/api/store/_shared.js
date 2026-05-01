const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
export const h  = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });
export const ch = (x={}) => ({ ...h(x), 'Content-Type': 'application/json', 'Content-Profile': 'members', Prefer: 'return=representation' });
export { S, K };
