'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import './transactions.css';
import DashSidebar from '../../DashSidebar';

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
function fmt(n: number) { return `L$${(n||0).toLocaleString()}`; }

export default function TransactionsPage() {
  const [member, setMember]     = useState<any>(null);
  const [profile, setProfile]   = useState<any>(null);
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [periodId, setPeriodId] = useState('');
  const [copied, setCopied]     = useState<string|null>(null);

  useEffect(() => {
    fetch('/api/dashboard/profile').then(r => r.json()).then(d => {
      if (d.error) { window.location.href = '/login'; return; }
      if (d.member?.frat_name !== 'Cool Breeze') { window.location.href = '/dashboard'; return; }
      setMember(d.member); setProfile(d.profile);
      load('');
    });
  }, []);

  async function load(pid: string) {
    setLoading(true);
    const url = pid ? `/api/dashboard/dues/transactions?period_id=${pid}` : '/api/dashboard/dues/transactions';
    const d = await fetch(url).then(r => r.json());
    setData(d); setLoading(false);
  }

  function copyTxn(id: string) {
    navigator.clipboard.writeText(id).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  if (!member) return <div className="dash-loading">LOADING...</div>;

  const { payments = [], periods = [], summary = {} } = data || {};
  const activePeriod = periods.find((p: any) => p.is_active);
  const currentPeriod = periods.find((p: any) => p.id === periodId) || activePeriod || periods[0];

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />
      <main className="dash-main">

        {/* Header */}
        <div className="dash-page-header">
          <div>
            <div style={{ fontFamily: 'var(--cinzel)', fontSize: '.54rem', letterSpacing: '4px', color: 'rgba(198,147,10,.45)', textTransform: 'uppercase', marginBottom: '.25rem' }}>
              Cool Breeze · Confidential
            </div>
            <div className="dash-page-title">Terminal Transaction Log</div>
          </div>
          <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.58rem', letterSpacing: '2px', color: 'var(--bone-faint)' }}>
            SL Dues Terminal · All payments
          </span>
        </div>

        {/* Summary strip */}
        <div className="tx-summary">
          <div className="tx-summary-cell">
            <div className="tx-summary-val" style={{ color: 'var(--bone)' }}>{summary.total_transactions || 0}</div>
            <div className="tx-summary-lbl">Total Transactions</div>
          </div>
          <div className="tx-summary-cell">
            <div className="tx-summary-val" style={{ color: 'var(--green)' }}>{fmt(summary.total_collected || 0)}</div>
            <div className="tx-summary-lbl">Total Collected</div>
          </div>
          <div className="tx-summary-cell">
            <div className="tx-summary-val" style={{ color: 'var(--gold-b)' }}>{currentPeriod?.label || '—'}</div>
            <div className="tx-summary-lbl">Current Period</div>
          </div>
        </div>

        {/* Period filter */}
        <div className="tx-period-bar">
          <span className="tx-period-label">Period</span>
          <select className="tx-period-select" value={periodId || currentPeriod?.id || ''} onChange={e => { setPeriodId(e.target.value); load(e.target.value); }}>
            <option value="">All Periods</option>
            {periods.map((p: any) => (
              <option key={p.id} value={p.id}>{p.label}{p.is_active ? ' (Active)' : ''}</option>
            ))}
          </select>
        </div>

        {/* Column headers */}
        <div className="tx-col-hdr">
          <span className="tx-col-lbl">Brother</span>
          <span className="tx-col-lbl">Transaction ID</span>
          <span className="tx-col-lbl">Amount</span>
          <span className="tx-col-lbl">Date & Time</span>
          <span className="tx-col-lbl">Notes</span>
        </div>

        {/* Rows */}
        <div className="tx-rows">
          {loading && <div className="tx-loading">Loading transactions...</div>}
          {!loading && payments.length === 0 && (
            <div className="tx-empty">No terminal transactions yet{periodId ? ' for this period' : ''}.</div>
          )}
          {!loading && payments.map((p: any) => (
            <div key={p.id} className="tx-row">
              {/* Brother */}
              <div>
                <div className="tx-brother">{p.member_name}</div>
                <div className="tx-period-tag">{p.period_label}</div>
              </div>

              {/* Transaction ID — click to copy */}
              <div>
                {p.transaction_id ? (
                  <span
                    className={`tx-id${copied === p.transaction_id ? ' copied' : ''}`}
                    onClick={() => copyTxn(p.transaction_id)}
                    title="Click to copy"
                  >
                    {copied === p.transaction_id ? '✓ Copied' : p.transaction_id}
                  </span>
                ) : (
                  <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.58rem', color: 'var(--bone-faint)' }}>No ID (manual)</span>
                )}
              </div>

              {/* Amount */}
              <div className="tx-amount">{fmt(p.amount_ls)}</div>

              {/* Date & Time */}
              <div className="tx-datetime">
                <div className="tx-date">{fmtDate(p.created_at)}</div>
                <div className="tx-time">{fmtTime(p.created_at)}</div>
              </div>

              {/* Notes */}
              <div className="tx-notes">{p.notes || '—'}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {!loading && payments.length > 0 && (
          <div className="tx-footer">
            <span className="tx-footer-item">
              {payments.length} transaction{payments.length !== 1 ? 's' : ''}
            </span>
            <span className="tx-footer-item">
              Total collected: <strong style={{ color: 'var(--green)' }}>{fmt(summary.total_collected)}</strong>
            </span>
            <span className="tx-footer-item">
              Click any Transaction ID to copy it
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
