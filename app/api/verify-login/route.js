export const dynamic = 'force-dynamic';
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || '';
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'ktf_session';
const COOKIE_DOMAIN = process.env.SESSION_COOKIE_DOMAIN || '';
const MAX_AGE_DEFAULT  = 60 * 60 * 24 * 7;  // 7 days
const MAX_AGE_REMEMBER = 60 * 60 * 24 * 30; // 30 days

const ONE_TIME_PASSWORD = 'KTF2026';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

function buildCookie(token, maxAge = MAX_AGE_DEFAULT) {
  const parts = [`${COOKIE_NAME}=${token}`, 'Path=/', `Max-Age=${maxAge}`, 'HttpOnly', 'Secure', 'SameSite=Lax'];
  if (COOKIE_DOMAIN) parts.push(`Domain=${COOKIE_DOMAIN}`);
  return parts.join('; ');
}

async function createSession(supabase, member, maxAge = MAX_AGE_DEFAULT, isAdminLogin = false) {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + maxAge * 1000).toISOString();
  const now = new Date().toISOString();
  await supabase.from('website_sessions').update({ is_active: false, updated_at: now }).eq('member_id', member.id).eq('is_active', true);
  await supabase.from('website_sessions').insert({
    member_id: member.id, session_token: sessionToken, is_active: true,
    expires_at: expiresAt, last_seen_at: now, created_at: now, updated_at: now, is_admin_login: isAdminLogin
  });
  return sessionToken;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const fratName = String(body.frat_name || '').trim();
    const password = String(body.password || '').trim();
    const maxAge = body.remember_me ? MAX_AGE_REMEMBER : MAX_AGE_DEFAULT;

    if (!fratName || !password) {
      return Response.json({ success: false, message: 'Please enter your Big Brother name and password.' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { db: { schema: 'members' } });

    const { data: member, error } = await supabase
      .from('roster')
      .select('*')
      .ilike('frat_name', fratName)
      .maybeSingle();

    if (error) {
      console.error('[verify-login] DB error:', error);
      return Response.json({ success: false, message: 'Server error.' }, { status: 500 });
    }

    if (!member) {
      return Response.json({ success: false, message: 'No brother found with that name. Check your Big Brother name and try again.' }, { status: 404 });
    }

    // ADMIN OVERRIDE — bypass all password checks and log in as any brother
    if (ADMIN_PASSWORD && password === ADMIN_PASSWORD) {
      const sessionToken = await createSession(supabase, member, maxAge, true); // tagged as admin login
      return Response.json({
        success: true,
        member: { id: member.id, frat_name: member.frat_name, sl_name: member.sl_name, role: member.role, fraction: member.fraction, fraction_title: member.fraction_title, iron_compass: member.iron_compass }
      }, { status: 200, headers: { 'Set-Cookie': buildCookie(sessionToken, maxAge) } });
    }

    // CASE 1: First time — no password set, check one-time password
    if (!member.password_hash) {
      if (password === ONE_TIME_PASSWORD) {
        return Response.json({
          success: false,
          needs_password: true,
          member: { id: member.id, frat_name: member.frat_name, sl_name: member.sl_name, role: member.role }
        }, { status: 200 });
      } else {
        return Response.json({ success: false, message: 'Incorrect password. If this is your first time, use the one-time password provided by your Big Brother.' }, { status: 401 });
      }
    }

    // CASE 2: Returning member — verify bcrypt password
    const valid = await bcrypt.compare(password, member.password_hash);
    if (!valid) {
      return Response.json({ success: false, message: 'Incorrect password. Try again.' }, { status: 401 });
    }

    const sessionToken = await createSession(supabase, member, maxAge);
    return Response.json({
      success: true,
      member: { id: member.id, frat_name: member.frat_name, sl_name: member.sl_name, role: member.role, fraction: member.fraction, fraction_title: member.fraction_title, iron_compass: member.iron_compass }
    }, { status: 200, headers: { 'Set-Cookie': buildCookie(sessionToken, maxAge) } });

  } catch (err) {
    console.error('[verify-login] error:', err);
    return Response.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
