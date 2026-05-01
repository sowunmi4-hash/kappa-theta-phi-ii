'use client';
import { useState, useEffect } from 'react';
import '../store.css';

export default function StoreAdmin() {
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const d = await fetch('/api/store/admin').then(r=>r.json());
    setData(d);
    setLoading(false);
  }

  async function updateStatus(order_id: string, status: string) {
    await fetch('/api/store/admin', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ order_id, status }) });
    load();
  }

  useEffect(() => { load(); }, []);

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#080a0f',color:'#c6930a',fontFamily:'Bebas Neue,cursive',fontSize:'1.5rem',letterSpacing:'4px'}}>LOADING...</div>;
  if (data?.error) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#080a0f',color:'#e05070',fontFamily:'Rajdhani,sans-serif'}}>Access denied.</div>;

  const statusColor: Record<string,string> = { pending:'#c6930a', paid:'#4a90e2', delivered:'#4ade80', failed:'#e05070' };

  return (
    <div className="store-root" style={{minHeight:'100vh'}}>
      <header className="store-header">
        <div className="store-logo">Store Admin</div>
        <div className="store-header-sub">Cool Breeze · Order Management</div>
      </header>

      <div style={{maxWidth:'1000px',margin:'0 auto',padding:'2rem 1.5rem'}}>
        {/* Summary */}
        {data?.summary && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginBottom:'2rem'}}>
            {[
              {label:'Total Orders',val:data.summary.total,color:'var(--bone)'},
              {label:'Pending',val:data.summary.pending,color:'#c6930a'},
              {label:'Delivered',val:data.summary.delivered,color:'#4ade80'},
              {label:'Revenue',val:`L$${data.summary.revenue.toLocaleString()}`,color:'var(--gold)'},
            ].map(s=>(
              <div key={s.label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'10px',padding:'1rem',textAlign:'center'}}>
                <div style={{fontSize:'1.6rem',fontWeight:800,color:s.color,fontFamily:'Bebas Neue,cursive',letterSpacing:'2px'}}>{s.val}</div>
                <div style={{fontSize:'0.6rem',letterSpacing:'2px',color:'var(--muted)',marginTop:'4px',textTransform:'uppercase'}}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Orders */}
        <div style={{fontSize:'0.6rem',letterSpacing:'4px',color:'var(--muted)',textTransform:'uppercase',marginBottom:'1rem'}}>Orders</div>
        {!data?.orders?.length && <div style={{textAlign:'center',padding:'3rem',color:'var(--muted)'}}>No orders yet.</div>}
        {data?.orders?.map((o:any) => (
          <div key={o.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'10px',padding:'1rem 1.2rem',marginBottom:'8px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'8px'}}>
            <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
              <span style={{fontFamily:'Space Mono,monospace',color:'var(--gold)',fontWeight:700,fontSize:'0.9rem'}}>{o.order_number}</span>
              <span style={{color:'var(--bone)',fontWeight:700}}>{o.item_name}</span>
              <span style={{color:'var(--muted)',fontSize:'0.8rem'}}>{o.sl_username}</span>
              <span style={{color:'var(--gold)',fontSize:'0.8rem',fontFamily:'Space Mono,monospace'}}>L${o.total_ls}</span>
            </div>
            <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
              <span style={{fontSize:'0.6rem',letterSpacing:'2px',padding:'2px 10px',borderRadius:'4px',fontWeight:700,textTransform:'uppercase',color:statusColor[o.status],background:'rgba(0,0,0,0.3)',border:`1px solid ${statusColor[o.status]}44`}}>{o.status}</span>
              <span style={{fontSize:'0.7rem',color:'rgba(240,232,208,0.2)'}}>{new Date(o.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
              {o.status !== 'delivered' && (
                <button onClick={()=>updateStatus(o.id,'delivered')} style={{background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.3)',color:'#4ade80',borderRadius:'5px',padding:'3px 10px',fontSize:'0.72rem',cursor:'pointer',fontFamily:'Rajdhani,sans-serif',fontWeight:700}}>Mark Delivered</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
