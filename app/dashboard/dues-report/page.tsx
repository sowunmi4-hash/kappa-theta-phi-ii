'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../dash.css';
import DashSidebar from '../DashSidebar';

export default function DuesReportPage() {
  const [member, setMember]   = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [report, setReport]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [periodId, setPeriodId]   = useState('');
  const [filter, setFilter]   = useState<'all'|'outstanding'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [periodOpen, setPeriodOpen] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard/profile').then(r => r.json()).then(d => {
      if (d.error) { window.location.href = '/login'; return; }
      const m = d.member;
      const canSee = m?.fraction === 'Ishi No Fraction' || m?.frat_name === 'Big Brother Substance';
      if (!canSee) { window.location.href = '/dashboard'; return; }
      setMember(m); setProfile(d.profile);
      loadReport('');
    });
  }, []);

  async function loadReport(pid: string) {
    setLoading(true);
    const url = pid ? `/api/dashboard/dues/report?period_id=${pid}` : '/api/dashboard/dues/report';
    const d = await fetch(url).then(r => r.json());
    setReport(d); setLoading(false);
  }

  function switchPeriod(pid: string) {
    setPeriodId(pid); setPeriodOpen(false); loadReport(pid);
  }

  if (!member) return <div className="dash-loading">LOADING...</div>;

  const fmt = (n: number) => `L$${(n || 0).toLocaleString()}`;
  const canSeeFull = member.frat_name === 'Big Brother Substance';
  const { summary = {}, full_records = [], disciplinary = [], periods = [] } = report || {};

  const activePeriod = periods.find((p: any) => p.is_active);
  const currentPeriod = periods.find((p: any) => p.id === periodId) || activePeriod || periods[0];

  const records = canSeeFull ? full_records : disciplinary;
  const displayed = filter === 'outstanding'
    ? records.filter((r: any) => r.status !== 'paid')
    : records;

  function statusCls(status: string) {
    if (status === 'paid') return 'paid';
    if (status === 'partial') return 'partial';
    return 'unpaid';
  }

  function timerCls(r: any) {
    if (!r.casperlet_expiry) return 'urgent';
    const ms = new Date(r.casperlet_expiry).getTime() - Date.now();
    if (ms <= 0) return 'urgent';
    if (ms < 3 * 86400000) return 'warn';
    return 'ok';
  }

  function timerStr(r: any) {
    if (!r.casperlet_expiry) return 'EXPIRED';
    const ms = new Date(r.casperlet_expiry).getTime() - Date.now();
    if (ms <= 0) return 'EXPIRED';
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    return `${d}d ${String(h).padStart(2,'0')}h`;
  }

  const borderColor = (status: string) => {
    if (status === 'paid') return 'rgba(74,222,128,.45)';
    if (status === 'partial') return 'rgba(198,147,10,.45)';
    return 'rgba(224,80,112,.38)';
  };

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile} />
      <main className="dash-main">

        {/* Header */}
        <div className="dash-page-header">
          <div className="dash-page-title">Dues Report</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.38rem', letterSpacing: '2px', padding: '.28rem .7rem', border: `1px solid ${canSeeFull ? 'rgba(198,147,10,.25)' : 'rgba(224,80,112,.2)'}`, color: canSeeFull ? 'var(--gold)' : 'rgba(224,80,112,.7)', background: canSeeFull ? 'rgba(198,147,10,.06)' : 'rgba(224,80,112,.06)', borderRadius: '2px' }}>
              {canSeeFull ? 'Full Access' : 'Ishi No Faction'}
            </span>
            {/* Period dropdown */}
            {periods.length > 0 && (
              <div style={{ position: 'relative' }}>
                <div className="dash-period-trigger" onClick={() => setPeriodOpen(v => !v)}>
                  <span className="dash-period-label">{currentPeriod?.name || 'Select Period'}</span>
                  {currentPeriod?.is_active && <span className="dash-period-badge">Active</span>}
                  {!currentPeriod?.is_active && currentPeriod && <span className="dash-period-badge closed">Closed</span>}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" style={{ transition: 'transform .2s', transform: periodOpen ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                {periodOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: '220px', background: 'rgba(8,13,24,.97)', border: '1px solid rgba(198,147,10,.3)', borderRadius: '4px', boxShadow: '0 8px 32px rgba(0,0,0,.6)', zIndex: 50, overflow: 'hidden' }}>
                    <div style={{ padding: '.5rem .75rem', borderBottom: '1px solid var(--border)', fontFamily: 'var(--cinzel)', fontSize: '.38rem', letterSpacing: '4px', color: 'rgba(198,147,10,.5)' }}>All Periods</div>
                    {periods.map((p: any) => (
                      <div key={p.id} onClick={() => switchPeriod(p.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.48rem .65rem', cursor: 'pointer', background: p.id === currentPeriod?.id ? 'rgba(198,147,10,.1)' : 'none', transition: 'background .15s' }}
                      >
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: p.is_active ? 'var(--green)' : 'rgba(198,147,10,.4)', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.42rem', letterSpacing: '2px', color: p.id === currentPeriod?.id ? 'var(--gold)' : 'var(--bone-dim)', flex: 1 }}>{p.name}</span>
                        <span style={{ fontFamily: 'var(--cinzel)', fontSize: '.36rem', color: p.is_active ? 'var(--green)' : 'var(--bone-faint)' }}>{p.is_active ? 'Active' : 'Closed'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stat strip */}
        {summary && (
          <div className="dash-stat-strip">
            {[
              { val: summary.paid || 0, lbl: 'Paid', color: 'var(--green)', iconColor: '#4ade80', borderColor: 'var(--green)', iconPath: <polyline points="20 6 9 17 4 12"/> },
              { val: summary.partial || 0, lbl: 'Partial', color: 'var(--gold-b)', iconColor: '#e8b84b', borderColor: 'var(--gold-b)', iconPath: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
              { val: summary.unpaid || 0, lbl: 'Unpaid', color: '#e05070', iconColor: '#e05070', borderColor: '#e05070', iconPath: <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></> },
              { val: fmt(summary.total_collected || 0), lbl: 'Collected', color: 'var(--gold)', iconColor: '#c6930a', borderColor: 'var(--gold)', iconPath: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></> },
            ].map((s, i) => (
              <div key={i} className="dash-stat-cell" style={{ borderLeft: `2px solid ${s.borderColor}` }}>
                <div className="dash-stat-icon" style={{ background: `${s.iconColor}18`, border: `1px solid ${s.iconColor}40` }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={s.iconColor} strokeWidth="2.2">{s.iconPath}</svg>
                </div>
                <div><div className="dash-stat-val" style={{ color: s.color }}>{s.val}</div><div className="dash-stat-lbl">{s.lbl}</div></div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="dash-inner-tabs">
          <button className={`dash-itab${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
            {canSeeFull ? `All Brothers (${records.length})` : `All Outstanding (${records.length})`}
          </button>
          {canSeeFull && (
            <button className={`dash-itab${filter === 'outstanding' ? ' active' : ''}`} onClick={() => setFilter('outstanding')}>
              Outstanding Only ({records.filter((r: any) => r.status !== 'paid').length})
            </button>
          )}
        </div>

        {/* Dossier rows */}
        <div style={{ padding: '.9rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {loading && <div style={{ fontFamily: 'var(--cinzel)', fontSize: '.48rem', letterSpacing: '3px', color: 'var(--bone-faint)', padding: '2rem', textAlign: 'center' }}>Loading...</div>}
          {!loading && displayed.length === 0 && (
            <div style={{ fontFamily: 'var(--cinzel)', fontSize: '.48rem', letterSpacing: '3px', color: 'var(--bone-faint)', padding: '2rem', textAlign: 'center' }}>No records found.</div>
          )}
          {!loading && displayed.map((rec: any) => {
            const remaining = Math.max(0, rec.amount_due - rec.linden_paid - rec.sweat_equity_value);
            const pct = Math.min(100, Math.round(((rec.linden_paid + rec.sweat_equity_value) / rec.amount_due) * 100)) || 0;
            const isExp = expanded === rec.member_id;
            return (
              <div key={rec.member_id} style={{ border: '1px solid var(--border)', background: 'rgba(8,13,24,.88)', borderLeft: `2px solid ${borderColor(rec.status)}`, position: 'relative', transition: 'border-color .18s' }}>
                <span className="dash-corner tl" /><span className="dash-corner br" />
                {/* Main row */}
                <div
                  onClick={() => setExpanded(isExp ? null : rec.member_id)}
                  style={{ display: 'grid', gridTemplateColumns: '110px 1fr 88px 88px 88px auto', alignItems: 'center', gap: '.7rem', padding: '.65rem .9rem', cursor: 'pointer' }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--display)', fontSize: '.9rem', letterSpacing: '1px', color: 'var(--bone)' }}>{rec.frat_name}</div>
                    <div style={{ fontFamily: 'var(--cinzel)', fontSize: '.34rem', letterSpacing: '1px', color: 'var(--bone-faint)', marginTop: '.1rem' }}>
                      <span className={`dash-countdown ${timerCls(rec)}`} style={{ fontSize: '.34rem' }}>{timerStr(rec)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="dash-prog-track" style={{ marginBottom: '.2rem' }}>
                      <div className={`dash-prog-fill ${rec.status === 'paid' ? 'green' : pct > 40 ? 'gold' : 'red'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div style={{ fontFamily: 'var(--cinzel)', fontSize: '.34rem', letterSpacing: '1px', color: 'var(--bone-faint)' }}>{pct}% · {fmt(rec.amount_due)} due</div>
                  </div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: '.82rem', color: 'var(--green)', textAlign: 'right' }}>{rec.linden_paid ? fmt(rec.linden_paid) : '—'}</div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: '.82rem', color: 'var(--gold-b)', textAlign: 'right' }}>{rec.sweat_equity_value ? fmt(rec.sweat_equity_value) : '—'}</div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: '.82rem', color: remaining > 0 ? '#e05070' : 'var(--green)', textAlign: 'right' }}>{remaining > 0 ? fmt(remaining) : '—'}</div>
                  <span className={`dash-badge ${statusCls(rec.status)}`}>{rec.status === 'paid' ? 'Paid' : rec.status === 'partial' ? `${pct}%` : 'Unpaid'}</span>
                </div>
                {/* Expanded payment log */}
                {isExp && rec.payments?.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '.55rem .9rem', background: 'rgba(4,6,15,.6)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {rec.payments.map((p: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', fontFamily: 'var(--cinzel)', fontSize: '.34rem', letterSpacing: '1px', color: 'var(--bone-faint)' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                        <span style={{ color: 'var(--green)' }}>{fmt(p.amount_ls)}</span>
                        <span>·</span>
                        <span>{new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {p.transaction_id && <span style={{ opacity: .5 }}>#{p.transaction_id}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {isExp && (!rec.payments || rec.payments.length === 0) && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '.5rem .9rem', background: 'rgba(4,6,15,.6)', fontFamily: 'var(--cinzel)', fontSize: '.36rem', letterSpacing: '2px', color: 'var(--bone-faint)' }}>No payments logged.</div>
                )}
              </div>
            );
          })}

          {/* Summary footer */}
          {!loading && summary.total_collected !== undefined && (
            <div style={{ background: 'rgba(8,13,24,.88)', border: '1px solid var(--border)', padding: '.65rem .9rem', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.8rem', position: 'relative' }}>
              <span className="dash-corner tl" /><span className="dash-corner br" />
              {[
                { lbl: 'Period Total', val: fmt(summary.total_collected), color: 'var(--green)' },
                { lbl: 'Sweat Credited', val: fmt(summary.total_sweat || 0), color: 'var(--gold)' },
                { lbl: 'Outstanding', val: fmt(summary.total_outstanding || 0), color: '#e05070' },
                { lbl: 'Paid in Full', val: `${summary.paid || 0} of ${summary.total || 0}`, color: 'var(--bone-dim)' },
              ].map(s => (
                <span key={s.lbl} style={{ fontFamily: 'var(--cinzel)', fontSize: '.38rem', letterSpacing: '2px', color: 'var(--bone-faint)' }}>
                  {s.lbl}: <strong style={{ color: s.color }}>{s.val}</strong>
                </span>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
