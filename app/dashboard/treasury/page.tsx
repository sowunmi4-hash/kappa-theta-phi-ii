'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../dash.css';
import './treasury.css';
import DashSidebar from '../DashSidebar';

const TYPE_LABELS: Record<string,string> = { gear:'Gear', event:'Event', charity:'Charity', dues:'Dues', other:'Other' };
const MONTHS = Array.from({length:6},(_,i)=>{ const d=new Date(); d.setMonth(d.getMonth()-i); return d.toISOString().slice(0,7); });

function fmt(iso:string){ return new Date(iso).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
function fmtL(n:number){ return `L$${n.toLocaleString()}`; }

export default function TreasuryPage() {
  const [member, setMember] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [txns, setTxns]       = useState<any[]>([]);
  const [totals, setTotals]   = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/profile').then(r=>r.json()).then(d => {
      if (d.error) { window.location.href='/login'; return; }
      if (d.member?.frat_name !== 'Big Brother Cool Breeze') { window.location.href='/dashboard'; return; }
      setMember(d.member); setProfile(d.profile);
      load('', '');
    });
  }, []);

  async function load(type: string, month: string) {
    setLoading(true);
    let url = '/api/treasury?';
    if (type)  url += `type=${type}&`;
    if (month) url += `month=${month}&`;
    const d = await fetch(url).then(r => r.json());
    setTxns(d.transactions || []);
    setTotals(d.totals || {});
    setLoading(false);
  }

  function filter(type: string, month: string) {
    setTypeFilter(type); setMonthFilter(month); load(type, month);
  }

  if (!member) return <div className="dash-loading">LOADING...</div>;

  const stats = [
    { key:'all',     lbl:'Total Collected', val:totals.all||0,     sub:`${txns.length} transactions`, color:'var(--yellow-b)' },
    { key:'gear',    lbl:'Gear Sales',       val:totals.gear||0,    sub:`${txns.filter(t=>t.type==='gear').length} sales`,     color:'#f87171' },
    { key:'event',   lbl:'Event Revenue',    val:totals.event||0,   sub:`${txns.filter(t=>t.type==='event').length} payments`,  color:'#60a5fa' },
    { key:'charity', lbl:'Charity',          val:totals.charity||0, sub:`${txns.filter(t=>t.type==='charity').length} donations`,color:'#4ade80' },
    { key:'dues',    lbl:'Dues',             val:totals.dues||0,    sub:`${txns.filter(t=>t.type==='dues').length} payments`,   color:'#c084fc' },
  ];

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile}/>
      <main className="dash-main">
        <div className="dash-page-header">
          <div>
            <div style={{fontFamily:'var(--cinzel)',fontSize:'.52rem',letterSpacing:'4px',color:'rgba(244,195,0,.45)',textTransform:'uppercase',marginBottom:'.25rem'}}>Cool Breeze · Confidential</div>
            <div className="dash-page-title">The War Chest</div>
          </div>
          <span style={{fontFamily:'var(--cinzel)',fontSize:'.58rem',letterSpacing:'2px',color:'var(--bone-faint)'}}>{fmtL(totals.all||0)} total</span>
        </div>

        {/* Stats */}
        <div className="tr-stats">
          {stats.map(s => (
            <div key={s.key} className={`tr-stat ${s.key}`} style={{cursor:s.key!=='all'?'pointer':'default'}}
              onClick={() => s.key !== 'all' && filter(typeFilter===s.key?'':s.key, monthFilter)}>
              <div className="tr-stat-lbl">{s.lbl}</div>
              <div className="tr-stat-val" style={{color:s.color}}>{fmtL(s.val)}</div>
              <div className="tr-stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="tr-filters">
          <span className="tr-filter-label">Filter:</span>
          {['gear','event','charity','dues','other'].map(t => (
            <button key={t} className={`tr-filter-btn${typeFilter===t?' active':''}`} onClick={() => filter(typeFilter===t?'':t, monthFilter)}>
              {TYPE_LABELS[t]}
            </button>
          ))}
          <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'.5rem'}}>
            <span className="tr-filter-label">Month:</span>
            <select className="tr-month-select" value={monthFilter} onChange={e => filter(typeFilter, e.target.value)}>
              <option value="">All Time</option>
              {MONTHS.map(m => <option key={m} value={m}>{new Date(m+'-15').toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</option>)}
            </select>
          </div>
          {(typeFilter||monthFilter) && (
            <button className="tr-filter-btn" onClick={() => filter('','')} style={{marginLeft:'.5rem',borderColor:'rgba(196,30,58,.3)',color:'#f87171'}}>✕ Clear</button>
          )}
        </div>

        {/* Table */}
        <div className="tr-table-wrap">
          {loading ? (
            <div className="tr-empty">Loading...</div>
          ) : txns.length === 0 ? (
            <div className="tr-empty">No transactions found.</div>
          ) : (
            <table className="tr-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>From</th>
                  <th>Description</th>
                  <th>Event</th>
                </tr>
              </thead>
              <tbody>
                {txns.map(t => (
                  <tr key={t.id}>
                    <td style={{whiteSpace:'nowrap',color:'var(--bone-faint)',fontSize:'.82rem'}}>{fmt(t.created_at)}</td>
                    <td><span className={`tr-type-pill ${t.type}`}>{TYPE_LABELS[t.type]}</span></td>
                    <td><span className="tr-amount">{fmtL(t.amount_ls)}</span></td>
                    <td>{t.payer_name || '—'}</td>
                    <td style={{color:'var(--bone-faint)'}}>{t.description || '—'}</td>
                    <td style={{color:'var(--bone-faint)'}}>{t.event_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
