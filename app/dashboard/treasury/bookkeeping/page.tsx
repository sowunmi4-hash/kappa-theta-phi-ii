'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import '../treasury.css';
import './bookkeeping.css';
import DashSidebar from '../../DashSidebar';

const CATEGORIES = ['General','Booth','Equipment','Event Cost','Venue','Marketing','Donation Out','Other'];
function fmtL(n:number){ return `L$${n.toLocaleString()}`; }
function fmt(d:string){ return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); }

export default function BookkeepingPage() {
  const [member,setMember]=useState<any>(null);
  const [profile,setProfile]=useState<any>(null);
  const getSLTMonth = () => new Date().toLocaleDateString('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit'}).slice(0,7);
  const [monthFilter,setMonthFilter]=useState(getSLTMonth);
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({amount_ls:'',description:'',recipient:'',category:'General'});
  const [error,setError]=useState('');

  useEffect(()=>{
    fetch('/api/dashboard/profile').then(r=>r.json()).then(d=>{
      if(d.error){window.location.href='/login';return;}
      if(d.member?.frat_name!=='Big Brother Cool Breeze'){window.location.href='/dashboard';return;}
      setMember(d.member);setProfile(d.profile);
      const m=new Date().toLocaleDateString('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit'}).slice(0,7);
      setMonthFilter(m);load(m);
    });
  },[]);

  async function load(month?:string){
    setLoading(true);
    const m=month||monthFilter;
    const d=await fetch('/api/treasury/bookkeeping'+(m?`?month=${m}`:'')).then(r=>r.json());
    setData(d);setLoading(false);
  }

  async function addDebit(){
    if(!form.amount_ls||!form.description){setError('Amount and description required.');return;}
    setSaving(true);setError('');
    const res=await fetch('/api/treasury/bookkeeping',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).then(r=>r.json());
    if(res.error){setError(res.error);setSaving(false);return;}
    setForm({amount_ls:'',description:'',recipient:'',category:'General'});
    setShowForm(false);setSaving(false);load();
  }

  async function deleteDebit(id:string){
    if(!confirm('Remove this debit entry?'))return;
    await fetch('/api/treasury/bookkeeping',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
    load();
  }

  if(!member||loading)return <div className="dash-loading">LOADING...</div>;
  const {debits=[],totalIncome=0,totalDebits=0,netBalance=0,incomeByType={}} = data||{};

  return (
    <div className="dash-app">
      <DashSidebar member={member} profile={profile}/>
      <main className="dash-main">
        <div className="dash-page-header">
          <div>
            <div style={{fontFamily:'var(--cinzel)',fontSize:'.52rem',letterSpacing:'4px',color:'rgba(244,195,0,.45)',textTransform:'uppercase',marginBottom:'.25rem'}}>Cool Breeze · Sentry Account</div>
            <div className="dash-page-title">Book Keeping</div>
          </div>
          <div style={{display:'flex',gap:'1rem',alignItems:'center'}}>
            <select style={{fontFamily:'var(--cinzel)',fontSize:'.54rem',letterSpacing:'2px',padding:'.3rem .7rem',border:'1px solid rgba(27,58,107,.3)',cursor:'pointer',color:'var(--bone-faint)',background:'rgba(6,11,26,.8)',borderRadius:'3px',outline:'none'}} value={monthFilter} onChange={e=>{setMonthFilter(e.target.value);load(e.target.value);}}>
              <option value="">All Time</option>
              {Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-i);return d.toLocaleDateString('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit'}).slice(0,7);}).map(m=><option key={m} value={m}>{new Date(m+'-15').toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</option>)}
            </select>
            <button className="dash-btn gold-ghost" onClick={()=>load()} style={{fontSize:'.56rem',letterSpacing:'2px'}}>↻ Refresh</button>
            <button className="dash-btn gold-solid" onClick={()=>setShowForm(s=>!s)} style={{fontSize:'.56rem',letterSpacing:'2px'}}>
              {showForm?'✕ Cancel':'+ Log Debit'}
            </button>
          </div>
        </div>

        {/* P&L Summary */}
        <div className="bk-summary">
          <div className="bk-sum-cell income">
            <div className="bk-sum-lbl">Total Income</div>
            <div className="bk-sum-val">{fmtL(totalIncome)}</div>
            <div className="bk-sum-breakdown">
              {Object.entries(incomeByType as Record<string,number>).filter(([,v])=>v>0).map(([k,v])=>(
                <span key={k} className="bk-type-chip">{k}: {fmtL(v)}</span>
              ))}
            </div>
          </div>
          <div className="bk-sum-cell debit">
            <div className="bk-sum-lbl">Total Expenditure</div>
            <div className="bk-sum-val">{fmtL(totalDebits)}</div>
            <div className="bk-sum-breakdown">
              <span className="bk-type-chip">{debits.length} entries</span>
            </div>
          </div>
          <div className={`bk-sum-cell net ${netBalance>=0?'profit':'loss'}`}>
            <div className="bk-sum-lbl">Net Balance</div>
            <div className="bk-sum-val">{netBalance>=0?'+':''}{fmtL(netBalance)}</div>
            <div className="bk-sum-breakdown">
              <span className="bk-type-chip">{netBalance>=0?'Profit':'Loss'}</span>
            </div>
          </div>
        </div>

        {/* Log Debit Form */}
        {showForm && (
          <div className="bk-form-wrap">
            <div className="bk-form-title">Log Outgoing Payment</div>
            {error&&<div className="bk-error">{error}</div>}
            <div className="bk-form-grid">
              <div>
                <div className="bk-field-lbl">Amount (L$) *</div>
                <input className="bk-input" type="number" placeholder="e.g. 2000" value={form.amount_ls} onChange={e=>setForm(f=>({...f,amount_ls:e.target.value}))}/>
              </div>
              <div>
                <div className="bk-field-lbl">Category</div>
                <select className="bk-input" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <div className="bk-field-lbl">Description *</div>
                <input className="bk-input" placeholder="e.g. Booth rental for Summer Event" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <div className="bk-field-lbl">Paid To</div>
                <input className="bk-input" placeholder="e.g. Brother's name or vendor" value={form.recipient} onChange={e=>setForm(f=>({...f,recipient:e.target.value}))}/>
              </div>
            </div>
            <button className="dash-btn gold-solid" onClick={addDebit} disabled={saving} style={{marginTop:'.75rem',fontSize:'.6rem',letterSpacing:'3px'}}>
              {saving?'Saving...':'Log Debit ↓'}
            </button>
          </div>
        )}

        {/* Debits Table */}
        <div className="bk-section-hdr">
          <span>Expenditure Log</span>
          <span style={{fontFamily:'var(--cinzel)',fontSize:'.52rem',color:'var(--bone-faint)'}}>{debits.length} entries · {fmtL(totalDebits)} total out</span>
        </div>
        <div className="bk-col-hdr">
          <span>Date</span><span>Description</span><span>Category</span><span>Paid To</span><span>Amount</span><span></span>
        </div>
        {debits.length===0&&<div style={{textAlign:'center',padding:'2.5rem',fontFamily:'var(--cinzel)',fontSize:'.65rem',letterSpacing:'3px',color:'var(--bone-faint)'}}>No debits logged yet.</div>}
        {debits.map((d:any)=>(
          <div key={d.id} className="bk-row">
            <span className="bk-date">{fmt(d.created_at)}</span>
            <span className="bk-desc">{d.description}</span>
            <span className="bk-cat">{d.category}</span>
            <span className="bk-recip">{d.recipient||'—'}</span>
            <span className="bk-amount">−{fmtL(d.amount_ls)}</span>
            <button className="bk-del" onClick={()=>deleteDebit(d.id)}>✕</button>
          </div>
        ))}

        {/* Income breakdown */}
        <div className="bk-section-hdr" style={{marginTop:'1.5rem'}}>
          <span>Income Breakdown</span>
          <span style={{fontFamily:'var(--cinzel)',fontSize:'.52rem',color:'var(--bone-faint)'}}>{fmtL(totalIncome)} total in</span>
        </div>
        <div className="bk-income-grid">
          {[
            {lbl:'Dues',    val:(incomeByType as any).dues||0,    color:'#c084fc'},
            {lbl:'Gear',    val:(incomeByType as any).gear||0,    color:'#f87171'},
            {lbl:'Events',  val:(incomeByType as any).event||0,   color:'#60a5fa'},
            {lbl:'Charity', val:(incomeByType as any).charity||0, color:'#4ade80'},
          ].map(s=>(
            <div key={s.lbl} className="bk-income-cell">
              <div style={{fontFamily:'var(--cinzel)',fontSize:'.52rem',letterSpacing:'3px',color:'var(--bone-faint)',textTransform:'uppercase',marginBottom:'.3rem'}}>{s.lbl}</div>
              <div style={{fontFamily:'var(--display)',fontSize:'1.35rem',letterSpacing:'1px',color:s.color}}>{fmtL(s.val)}</div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
