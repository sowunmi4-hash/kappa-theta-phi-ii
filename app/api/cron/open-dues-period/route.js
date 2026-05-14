import { NextResponse } from 'next/server';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const h  = (x={}) => ({ apikey:K, Authorization:`Bearer ${K}`, 'Accept-Profile':'members', ...x });
const ch = () => h({ 'Content-Type':'application/json','Content-Profile':'members',Prefer:'return=representation' });

export async function GET(req) {
  // Verify Vercel cron secret
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get current month/year in SLT (America/Los_Angeles)
  const now    = new Date();
  const sltStr = now.toLocaleDateString('en-CA', { timeZone:'America/Los_Angeles', year:'numeric', month:'2-digit' });
  const [year, month] = sltStr.split('-').map(Number);

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const label = `${monthNames[month-1]} ${year}`;

  // Check if this period already exists
  const existing = await fetch(`${S}/rest/v1/dues_periods?month=eq.${month}&year=eq.${year}&select=id`, { headers:h() }).then(r=>r.json());
  if (existing?.length) {
    return NextResponse.json({ ok:true, message:`Period ${label} already exists` });
  }

  // Close any currently active periods
  await fetch(`${S}/rest/v1/dues_periods?is_active=eq.true`, {
    method:'PATCH', headers:ch(),
    body: JSON.stringify({ is_active:false })
  });

  // Create the new period
  const period = await fetch(`${S}/rest/v1/dues_periods`, {
    method:'POST', headers:ch(),
    body: JSON.stringify({
      label,
      month,
      year,
      amount_due: 4000,
      is_active: true
    })
  }).then(r=>r.json());

  const periodId = Array.isArray(period) ? period[0]?.id : period?.id;

  // Create dues records for all active brothers
  const roster = await fetch(`${S}/rest/v1/roster?select=id,frat_name&order=frat_name.asc`, { headers:h() }).then(r=>r.json());
  const brothers = Array.isArray(roster) ? roster : [];

  const records = brothers.map(b => ({
    period_id:    periodId,
    member_id:    b.id,
    member_name:  b.frat_name,
    amount_due:   4000,
    linden_paid:  0,
    sweat_equity_value: 0,
    status:       'unpaid',
    credit:       0
  }));

  if (records.length) {
    await fetch(`${S}/rest/v1/dues_records`, {
      method:'POST', headers:ch(),
      body: JSON.stringify(records)
    });
  }

  return NextResponse.json({ ok:true, message:`Opened ${label} for ${brothers.length} brothers` });
}
