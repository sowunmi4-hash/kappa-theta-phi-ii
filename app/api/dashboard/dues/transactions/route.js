import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const C = process.env.SESSION_COOKIE_NAME || 'ktf_session';
const h = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });

async function getMember() {
  const token = (await cookies()).get(C)?.value;
  if (!token) return null;
  const s = await fetch(`${S}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id,expires_at`, { headers: h() }).then(r => r.json());
  if (!s.length || new Date(s[0].expires_at) < new Date()) return null;
  const m = await fetch(`${S}/rest/v1/roster?id=eq.${s[0].member_id}&select=*`, { headers: h() }).then(r => r.json());
  return m[0] || null;
}

export async function GET(req) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Cool Breeze only
  if (member.frat_name !== 'Cool Breeze') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const period_id = searchParams.get('period_id');

  // Get all periods
  const periods = await fetch(`${S}/rest/v1/dues_periods?order=year.desc,month.desc&select=*`, { headers: h() }).then(r => r.json());

  // Get payments — filter by period if specified, otherwise get all terminal payments
  let url = `${S}/rest/v1/dues_payments?logged_by_name=eq.SL Dues Terminal&order=created_at.desc&select=*`;
  if (period_id) url += `&period_id=eq.${period_id}`;

  const payments = await fetch(url, { headers: h() }).then(r => r.json());

  // Attach period label
  const periodMap = {};
  (Array.isArray(periods) ? periods : []).forEach(p => { periodMap[p.id] = p.label; });

  const enriched = (Array.isArray(payments) ? payments : []).map(p => ({
    ...p,
    period_label: periodMap[p.period_id] || 'Unknown Period',
  }));

  // Summary
  const total_collected = enriched.reduce((s, p) => s + (p.amount_ls || 0), 0);

  return NextResponse.json({
    payments: enriched,
    periods: Array.isArray(periods) ? periods : [],
    summary: {
      total_transactions: enriched.length,
      total_collected,
    }
  });
}
