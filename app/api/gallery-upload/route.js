export const dynamic = 'force-dynamic';
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || '';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const caption = formData.get('caption') || '';
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

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(fileName, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error('[gallery-upload] storage error:', uploadError);
      return Response.json({ success: false, message: 'Upload failed.' }, { status: 500 });
    }

    const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/gallery/${fileName}`;
    const fileType = file.type.startsWith('video') ? 'video' : 'image';

    const membersSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, { db: { schema: 'members' } });
    await membersSupabase.from('gallery_posts').insert({
      file_url: fileUrl, file_type: fileType, caption: String(caption), uploaded_by: String(uploadedBy)
    });

    return Response.json({ success: true, url: fileUrl, file_type: fileType });
  } catch (err) {
    console.error('[gallery-upload] error:', err);
    return Response.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
