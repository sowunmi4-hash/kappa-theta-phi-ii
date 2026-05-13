export const dynamic = 'force-dynamic';
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || '';
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'ktf_session';
const COOKIE_DOMAIN = process.env.SESSION_COOKIE_DOMAIN || '';
const MAX_AGE = 60 * 60 * 24 * 7;

function buildCookie(token) {
  const parts = [`${COOKIE_NAME}=${token}`, 'Path=/', `Max-Age=${MAX_AGE}`, 'HttpOnly', 'Secure', 'SameSite=Lax'];
  if (COOKIE_DOMAIN) parts.push(`Domain=${COOKIE_DOMAIN}`);
  return parts.join('; ');
}

export async function POST(req) {
  try {
    const body = await req.json();
    const memberId = String(body.member_id || '').trim();
    const password = String(body.password || '').trim();

    if (!memberId || !password) {
      return Response.json({ success: false, message: 'Missing member ID or password.' }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ success: false, message: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { db: { schema: 'members' } });

    // Verify member exists and has no password yet
    const { data: member, error } = await supabase.from('roster').select('*').eq('id', memberId).maybeSingle();
    if (error || !member) {
      return Response.json({ success: false, message: 'Member not found.' }, { status: 404 });
    }
    if (member.password_hash) {
      return Response.json({ success: false, message: 'Password already set. Use login instead.' }, { status: 400 });
    }

    // Hash and save password
    const hash = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();
    await supabase.from('roster').update({ password_hash: hash, updated_at: now }).eq('id', memberId);

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + MAX_AGE * 1000).toISOString();

    await supabase.from('website_sessions').insert({
      member_id: member.id, session_token: sessionToken, is_active: true,
      expires_at: expiresAt, last_seen_at: now, created_at: now, updated_at: now
    });

    return Response.json({
      success: true,
      member: { id: member.id, frat_name: member.frat_name, sl_name: member.sl_name, role: member.role, faction: member.faction, faction_title: member.faction_title, iron_compass: member.iron_compass }
    }, { status: 200, headers: { 'Set-Cookie': buildCookie(sessionToken) } });

  } catch (err) {
    console.error('[create-password] error:', err);
    return Response.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
