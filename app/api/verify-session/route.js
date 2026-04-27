export const dynamic = 'force-dynamic';
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || '';
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'ktf_session';

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

export async function GET(req) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = parseCookies(cookieHeader);
    const token = cookies[COOKIE_NAME] || '';

    if (!token) {
      return Response.json({ success: false, authenticated: false, message: 'No active session.' }, { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { db: { schema: 'members' } });

    const { data: session, error } = await supabase
      .from('website_sessions')
      .select('*, roster(*)')
      .eq('session_token', token)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !session) {
      return Response.json({ success: false, authenticated: false, message: 'Session not found.' }, { status: 401 });
    }

    // Check expiry
    if (new Date(session.expires_at) < new Date()) {
      await supabase.from('website_sessions').update({ is_active: false }).eq('id', session.id);
      return Response.json({ success: false, authenticated: false, message: 'Session expired.' }, { status: 401 });
    }

    // Touch last_seen
    await supabase.from('website_sessions').update({ last_seen_at: new Date().toISOString() }).eq('id', session.id);

    const m = session.roster;
    return Response.json({
      success: true, authenticated: true,
      member: { id: m.id, frat_name: m.frat_name, sl_name: m.sl_name, role: m.role, fraction: m.fraction, fraction_title: m.fraction_title, iron_compass: m.iron_compass }
    });

  } catch (err) {
    console.error('[verify-session] error:', err);
    return Response.json({ success: false, authenticated: false, message: 'Server error.' }, { status: 500 });
  }
}
