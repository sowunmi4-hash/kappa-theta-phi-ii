export const dynamic = 'force-dynamic';
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || '';
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'ktf_session';

// Admin SL names that can delete any photo (case-insensitive match against roster.sl_name)
const ADMIN_SL_NAMES = ['safareehills'];

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

// Resolve authenticated member from session cookie. Returns roster row or null.
// Used only for admin override on delete; uploads do not require auth.
async function getAuthMember(req) {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const token = cookies[COOKIE_NAME] || '';
  if (!token) return null;

  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { db: { schema: 'members' } });
  const { data: session } = await sb
    .from('website_sessions')
    .select('id, expires_at, is_active, roster(*)')
    .eq('session_token', token)
    .eq('is_active', true)
    .maybeSingle();

  if (!session || !session.roster) return null;
  if (new Date(session.expires_at) < new Date()) return null;
  return session.roster;
}

function isAdmin(member) {
  if (!member?.sl_name) return false;
  const sl = String(member.sl_name).trim().toLowerCase();
  return ADMIN_SL_NAMES.includes(sl);
}

// Constant-time string comparison to prevent timing attacks on delete tokens.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export async function POST(req) {
  try {
    // Public uploads — anyone can post a photo
    const formData = await req.formData();
    const file = formData.get('file');
    const caption = formData.get('caption') || '';
    const eventTag = formData.get('event_tag') || 'General';
    const uploadedBy = formData.get('uploaded_by') || 'Anonymous';

    if (!file) {
      return Response.json({ success: false, message: 'No file provided.' }, { status: 400 });
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
    if (!allowed.includes(file.type)) {
      return Response.json({ success: false, message: 'Only JPG, PNG, WebP images and MP4 videos are allowed.' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ success: false, message: 'File must be under 10MB.' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(fileName, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error('[gallery-upload] storage error:', uploadError);
      return Response.json({ success: false, message: 'Upload failed.' }, { status: 500 });
    }

    const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/gallery/${fileName}`;
    const fileType = file.type.startsWith('video') ? 'video' : 'image';

    // Generate a per-photo delete token. Returned ONCE in this response so the
    // client can store it locally. The token never appears in any read endpoint.
    const deleteToken = crypto.randomBytes(32).toString('hex');

    const membersSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, { db: { schema: 'members' } });
    const { data: inserted, error: insertError } = await membersSupabase
      .from('gallery_posts')
      .insert({
        file_url: fileUrl,
        file_type: fileType,
        caption: String(caption),
        uploaded_by: String(uploadedBy),
        event_tag: String(eventTag),
        delete_token: deleteToken,
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      console.error('[gallery-upload] insert error:', insertError);
      // Try to clean up the orphaned storage object
      await supabase.storage.from('gallery').remove([fileName]).catch(() => {});
      return Response.json({ success: false, message: 'Database write failed.' }, { status: 500 });
    }

    return Response.json({
      success: true,
      url: fileUrl,
      file_type: fileType,
      post_id: inserted.id,
      delete_token: deleteToken,
    });
  } catch (err) {
    console.error('[gallery-upload] error:', err);
    return Response.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const { id, file_url, delete_token } = body;
    if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

    const membersSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, { db: { schema: 'members' } });

    // Fetch the photo with its stored token
    const { data: photo } = await membersSupabase
      .from('gallery_posts')
      .select('id, uploaded_by, file_url, delete_token')
      .eq('id', id)
      .maybeSingle();

    if (!photo) {
      return Response.json({ error: 'Photo not found.' }, { status: 404 });
    }

    // Permission gate: matching delete_token (uploader) OR admin session
    const tokenMatches = !!photo.delete_token && safeEqual(String(delete_token || ''), String(photo.delete_token));

    if (!tokenMatches) {
      // Fall through to admin check
      const member = await getAuthMember(req);
      if (!isAdmin(member)) {
        return Response.json({ error: 'Not authorized to delete this photo.' }, { status: 403 });
      }
    }

    // Delete from storage
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const url = file_url || photo.file_url;
    if (url && !url.includes('youtube')) {
      const path = url.split('/storage/v1/object/public/gallery/')[1];
      if (path) await supabase.storage.from('gallery').remove([path]);
    }

    // Delete from DB
    await membersSupabase.from('gallery_posts').delete().eq('id', id);

    return Response.json({ success: true });
  } catch (err) {
    console.error('[gallery DELETE] error:', err);
    return Response.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
