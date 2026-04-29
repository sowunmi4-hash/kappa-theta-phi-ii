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

const canSeeDisciplinary = (m) => m && (m.fraction === 'Ishi No Fraction' || m.frat_name === 'Big Brother Substance');
const canSeeFull = (m) => m && m.frat_name === 'Big Brother Substance';

export async function GET(req) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canSeeDisciplinary(member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const period_id = searchParams.get('period_id');

  const periods = await fetch(`${S}/rest/v1/dues_periods?order=year.desc,month.desc&select=*`, { headers: h() }).then(r => r.json());
  const targetPeriod = period_id ? periods.find(p => p.id === period_id) : periods[0];

  if (!targetPeriod) return NextResponse.json({ periods, disciplinary: [], full_records: null, can_see_full: canSeeFull(member), summary: null });

  const records = await fetch(
    `${S}/rest/v1/dues_records?period_id=eq.${targetPeriod.id}&order=member_name.asc&select=*`,
    { headers: h() }
  ).then(r => r.json());

  const disciplinary = records.filter(r => r.status === 'unpaid' || r.status === 'partial');

  let fullRecords = null;
  if (canSeeFull(member)) {
    fullRecords = await Promise.all(records.map(async rec => {
      const [payments, sweat] = await Promise.all([
        fetch(`${S}/rest/v1/dues_payments?period_id=eq.${rec.period_id}&member_id=eq.${rec.member_id}&order=created_at.desc&select=*`, { headers: h() }).then(r => r.json()),
        fetch(`${S}/rest/v1/dues_sweat_equity?period_id=eq.${rec.period_id}&member_id=eq.${rec.member_id}&order=created_at.desc&select=*`, { headers: h() }).then(r => r.json()),
      ]);
      return { ...rec, payments, sweat_equity: sweat };
    }));
  }

  return NextResponse.json({
    periods,
    period: targetPeriod,
    disciplinary,
    full_records: fullRecords,
    can_see_full: canSeeFull(member),
    summary: {
      total: records.length,
      paid: records.filter(r => r.status === 'paid').length,
      partial: records.filter(r => r.status === 'partial').length,
      unpaid: records.filter(r => r.status === 'unpaid').length,
      waived: records.filter(r => r.status === 'waived').length,
      total_collected: records.reduce((s, r) => s + r.linden_paid, 0),
      total_sweat: records.reduce((s, r) => s + r.sweat_equity_value, 0),
    }
  });
}
