'use client';
import { useState, useEffect } from 'react';
import './store.css';

export default function StorePage() {
  const [items, setItems]         = useState<any[]>([]);
  const [selected, setSelected]   = useState<any>(null);
  const [slName, setSlName]       = useState('');
  const [ordering, setOrdering]   = useState(false);
  const [order, setOrder]         = useState<any>(null);
  const [error, setError]         = useState('');

  useEffect(() => {
    fetch('/api/store/items').then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : []));
  }, []);

  async function placeOrder() {
    if (!slName.trim()) { setError('Enter your SL username'); return; }
    if (!selected)      { setError('Select a plushie');        return; }
    setOrdering(true); setError('');
    try {
      const res  = await fetch('/api/store/order', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sl_username: slName.trim(), item_id: selected.id }) });
      const data = await res.json();
      if (data.error) { setError(data.error); setOrdering(false); return; }
      setOrder(data.order);
    } catch(e) { setError('Something went wrong. Try again.'); }
    setOrdering(false);
  }

  // ORDER CONFIRMED SCREEN
  if (order) return (
    <div className="store-root">
      <header className="store-header">
        <div className="store-logo">KΘΦ II STORE</div>
      </header>
      <div className="store-confirmed">
        <div className="store-confirmed-badge">✓</div>
        <div className="store-confirmed-title">Order Placed</div>
        <div className="store-confirmed-num">{order.order_number}</div>
        <div className="store-confirmed-sub">Take this order number to the in-world terminal to complete your purchase</div>
        <div className="store-confirmed-card">
          <img src={selected?.image_url} alt={order.item_name} className="store-confirmed-img" onError={(e:any)=>e.target.style.display='none'}/>
          <div className="store-confirmed-details">
            <div className="store-confirmed-item">{order.item_name}</div>
            <div className="store-confirmed-price">L${order.total_ls}</div>
            <div className="store-confirmed-buyer">{order.sl_username}</div>
          </div>
        </div>
        <div className="store-confirmed-steps">
          <div className="store-step"><span className="store-step-n">1</span>Find the KΘΦ II terminal in-world</div>
          <div className="store-step"><span className="store-step-n">2</span>Touch it and enter <strong>{order.order_number}</strong></div>
          <div className="store-step"><span className="store-step-n">3</span>Pay L${order.total_ls} — your plushie delivers instantly</div>
        </div>
        <button className="store-btn-ghost" onClick={()=>{ setOrder(null); setSelected(null); setSlName(''); }}>Place Another Order</button>
      </div>
    </div>
  );

  return (
    <div className="store-root">
      <header className="store-header">
        <div className="store-logo">KΘΦ II STORE</div>
        <div className="store-header-sub">Star Wars Plushie Collection · L$200 each</div>
      </header>

      {/* PLUSHIE GRID */}
      <section className="store-section">
        <div className="store-section-label">Select Your Plushie</div>
        <div className="store-grid">
          {items.map(item => (
            <div key={item.id} className={`store-card ${selected?.id===item.id ? 'selected' : ''}`} onClick={()=>{ setSelected(item); setError(''); }}>
              <div className="store-card-img-wrap">
                <img src={item.image_url} alt={item.name} className="store-card-img" onError={(e:any)=>e.target.src='/logo.png'}/>
                {selected?.id===item.id && <div className="store-card-check">✓</div>}
              </div>
              <div className="store-card-name">{item.name.replace(' Plushie','')}</div>
              <div className="store-card-price">L${item.price_ls}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ORDER FORM */}
      <section className="store-checkout">
        <div className="store-section-label">Your Second Life Username</div>
        <div className="store-input-row">
          <input
            className="store-input"
            placeholder="e.g. JohnResident"
            value={slName}
            onChange={e=>{ setSlName(e.target.value); setError(''); }}
            onKeyDown={e=>e.key==='Enter' && placeOrder()}
          />
          <button className="store-btn" onClick={placeOrder} disabled={ordering || !selected || !slName.trim()}>
            {ordering ? 'Placing...' : selected ? `Order ${selected.name.replace(' Plushie','')}` : 'Select a Plushie'}
          </button>
        </div>
        {error && <div className="store-error">{error}</div>}
        {selected && slName && (
          <div className="store-summary">
            <span>{selected.name}</span>
            <span>·</span>
            <span>{slName}</span>
            <span>·</span>
            <strong>L${selected.price_ls}</strong>
          </div>
        )}
      </section>

      <footer className="store-footer">
        <div>KΘΦ II Wokou-Corsairs · Death before Dishonor · Est. 3/14/21</div>
      </footer>
    </div>
  );
}
