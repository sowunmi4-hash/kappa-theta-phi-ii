export const dynamic = 'force-dynamic';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const h  = (x={}) => ({ apikey: K, Authorization: `Bearer ${K}`, 'Accept-Profile': 'members', ...x });
const ch = (x={}) => h({ 'Content-Type': 'application/json', 'Content-Profile': 'members', ...x });

export async function GET(req) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || '';
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();

  // Find all dues records where:
  // - expires_at has passed
  // - status is not 'paid' or 'waived'
  // - overdue report hasn't been sent yet
  const overdueRecords = await fetch(
    `${S}/rest/v1/dues_records?expires_at=lte.${now}&status=in.(unpaid,partial)&overdue_reported=eq.false&select=*`,
    { headers: h() }
  ).then(r => r.json());

  if (!overdueRecords.length) {
    return Response.json({ message: 'No overdue records found.', checked_at: now });
  }

  // Get Ishi No Fraction + Founders to notify
  const [ishi, founders] = await Promise.all([
    fetch(`${S}/rest/v1/roster?fraction=eq.Ishi No Fraction&select=id,frat_name`, { headers: h() }).then(r => r.json()),
    fetch(`${S}/rest/v1/roster?role=in.(Head Founder,Co-Founder)&select=id,frat_name`, { headers: h() }).then(r => r.json()),
  ]);
  const notifyIds = [...new Set([...ishi, ...founders].map(m => m.id))];

  // Group overdue records by period
  const byPeriod = {};
  for (const rec of overdueRecords) {
    if (!byPeriod[rec.period_id]) byPeriod[rec.period_id] = [];
    byPeriod[rec.period_id].push(rec);
  }

  for (const [period_id, records] of Object.entries(byPeriod)) {
    // Get period info
    const periods = await fetch(`${S}/rest/v1/dues_periods?id=eq.${period_id}&select=*`, { headers: h() }).then(r => r.json());
    const period = periods[0];
    if (!period) continue;

    const unpaid  = records.filter(r => r.status === 'unpaid');
    const partial = records.filter(r => r.status === 'partial');

    // Build message
    const lines = [];
    if (unpaid.length) {
      lines.push(`UNPAID (${unpaid.length}):`);
      unpaid.forEach(r => lines.push(`  - ${r.member_name} — owes L$${r.amount_due.toLocaleString()}`));
    }
    if (partial.length) {
      lines.push(`PARTIAL (${partial.length}):`);
      partial.forEach(r => {
        const owed = r.amount_due - r.linden_paid - r.sweat_equity_value;
        lines.push(`  - ${r.member_name} — L$${owed.toLocaleString()} still outstanding`);
      });
    }

    const message = `Dues overdue report for ${period.label}.\n\n${lines.join('\n')}\n\nTotal brothers overdue: ${records.length}. Please review and take appropriate action.`;

    // Notify all discipline/leadership members
    for (const uid of notifyIds) {
      await fetch(`${S}/rest/v1/notifications`, {
        method: 'POST', headers: ch(),
        body: JSON.stringify({
          member_id: uid,
          title: `Dues Overdue — ${period.label}`,
          message,
          created_by: null
        })
      });
    }

    // Also notify each overdue brother directly
    for (const rec of records) {
      const owed = rec.amount_due - rec.linden_paid - rec.sweat_equity_value;
      await fetch(`${S}/rest/v1/notifications`, {
        method: 'POST', headers: ch(),
        body: JSON.stringify({
          member_id: rec.member_id,
          title: 'Dues Overdue',
          message: `Your dues for ${period.label} have expired with L$${owed.toLocaleString()} outstanding. Please contact leadership immediately.`,
          created_by: null
        })
      });

      // Mark as reported
      await fetch(`${S}/rest/v1/dues_records?id=eq.${rec.id}`, {
        method: 'PATCH', headers: ch(),
        body: JSON.stringify({ overdue_reported: true, overdue_reported_at: now, updated_at: now })
      });
    }

    // Save report record
    await fetch(`${S}/rest/v1/dues_reports`, {
      method: 'POST', headers: ch(),
      body: JSON.stringify({
        period_id, period_label: period.label,
        unpaid_members: unpaid.map(r => ({ id: r.member_id, name: r.member_name, owed: r.amount_due })),
        partial_members: partial.map(r => ({ id: r.member_id, name: r.member_name, owed: r.amount_due - r.linden_paid - r.sweat_equity_value })),
        generated_at: now, generated_by: 'cron'
      })
    });
  }

  return Response.json({
    success: true,
    processed: overdueRecords.length,
    notified: notifyIds.length,
    checked_at: now
  });
}
