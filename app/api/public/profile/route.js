import { NextResponse } from 'next/server';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const h = () => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members' });

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const frat_name = searchParams.get('frat_name')?.trim();
  if (!frat_name) return NextResponse.json({ profile: null });

  // Get member ID by frat name
  const members = await fetch(
    `${S}/rest/v1/roster?frat_name=ilike.${encodeURIComponent(frat_name)}&select=id,frat_name,role,faction`,
    { headers: h() }
  ).then(r => r.json());

  if (!members?.length) return NextResponse.json({ profile: null });
  const member = members[0];

  // Get their profile
  const profiles = await fetch(
    `${S}/rest/v1/member_profiles?member_id=eq.${member.id}&select=bio,favourite_quote,hobbies,portrait_url,banner_url,social_links`,
    { headers: h() }
  ).then(r => r.json());

  const profile = profiles?.[0] || null;

  // Only return if they've actually filled something in
  const hasProfile = profile && (profile.bio || profile.favourite_quote || profile.hobbies || profile.social_links);
  return NextResponse.json({ profile: hasProfile ? profile : null });
}
