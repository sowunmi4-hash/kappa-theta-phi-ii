export const dynamic = 'force-dynamic';
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || '';
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'ktf_session';
const COOKIE_DOMAIN = process.env.SESSION_COOKIE_DOMAIN || '';

function clearCookie() {
  const parts = [`${COOKIE_NAME}=`, 'Path=/', 'Max-Age=0', 'Expires=Thu, 01 Jan 1970 00:00:00 GMT', 'HttpOnly', 'Secure', 'SameSite=Lax'];
  if (COOKIE_DOMAIN) parts.push(`Domain=${COOKIE_DOMAIN}`);
  return parts.join('; ');
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach(part => {
    const eq = part.indexOf('=');
    if (eq === -1) return;
    cookies[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  });
  return cookies;
}

export async function POST(req) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = parseCookies(cookieHeader);
    const token = cookies[COOKIE_NAME] || '';

    if (token) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { db: { schema: 'members' } });
      await supabase.from('website_sessions').update({ is_active: false, updated_at: new Date().toISOString() }).eq('session_token', token);
    }

    return Response.json({ success: true, message: 'Logged out.' }, { status: 200, headers: { 'Set-Cookie': clearCookie() } });
  } catch (err) {
    console.error('[logout] error:', err);
    return Response.json({ success: true }, { status: 200, headers: { 'Set-Cookie': clearCookie() } });
  }
}
