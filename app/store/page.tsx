'use client';
import { useState, useEffect } from 'react';
import './store.css';

type Item = { id: string; name: string; price_ls: number; image_url: string; description: string; };
type CartItem = Item & { quantity: number };

export default function StorePage() {
  const [items, setItems]       = useState<Item[]>([]);
  const [cart, setCart]         = useState<CartItem[]>([]);
  const [slName, setSlName]     = useState('');
  const [ordering, setOrdering] = useState(false);
  const [order, setOrder]       = useState<any>(null);
  const [error, setError]       = useState('');

  useEffect(() => {
    fetch('/api/store/items').then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : []));
  }, []);

  function addToCart(item: Item) {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
    setError('');
  }

  function removeFromCart(id: string) {
    setCart(prev => {
      const existing = prev.find(c => c.id === id);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter(c => c.id !== id);
      return prev.map(c => c.id === id ? { ...c, quantity: c.quantity - 1 } : c);
    });
  }

  function clearCart() { setCart([]); }

  const total = cart.reduce((s, c) => s + c.price_ls * c.quantity, 0);
  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);

  async function placeOrder() {
    if (!slName.trim()) { setError('Enter your SL username'); return; }
    if (!cart.length)   { setError('Add at least one item to your cart'); return; }
    setOrdering(true); setError('');
    try {
      const res = await fetch('/api/store/order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sl_username: slName.trim(),
          cart: cart.map(c => ({ item_id: c.id, name: c.name, price_ls: c.price_ls, quantity: c.quantity }))
        })
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setOrdering(false); return; }
      setOrder({ ...data.order, cartSnapshot: cart });
    } catch { setError('Something went wrong. Try again.'); }
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
          <div style={{width:'100%'}}>
            {order.cartSnapshot?.map((c: CartItem) => (
              <div key={c.id} style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'10px'}}>
                <img src={c.image_url} alt={c.name} style={{width:'52px',height:'52px',objectFit:'cover',borderRadius:'6px'}}
                  onError={(e:any)=>e.target.src='/logo.png'}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:'var(--bone)',fontSize:'0.88rem'}}>{c.name}</div>
                  <div style={{color:'var(--muted)',fontSize:'0.75rem'}}>Qty: {c.quantity}</div>
                </div>
                <div style={{color:'var(--gold)',fontFamily:'Space Mono,monospace',fontSize:'0.82rem'}}>L${(c.price_ls * c.quantity).toLocaleString()}</div>
              </div>
            ))}
            <div style={{borderTop:'1px solid var(--border)',paddingTop:'10px',display:'flex',justifyContent:'space-between',marginTop:'4px'}}>
              <span style={{color:'var(--muted)',fontSize:'0.8rem'}}>Total</span>
              <span style={{color:'var(--gold)',fontFamily:'Space Mono,monospace',fontWeight:700}}>L${order.total_ls?.toLocaleString()}</span>
            </div>
            <div style={{marginTop:'6px',fontSize:'0.75rem',color:'var(--muted)'}}>For: {order.sl_username}</div>
          </div>
        </div>

        <div className="store-confirmed-steps">
          <div className="store-step"><span className="store-step-n">1</span>Find the KΘΦ II terminal in-world</div>
          <div className="store-step"><span className="store-step-n">2</span>Touch it and enter <strong>{order.order_number}</strong></div>
          <div className="store-step"><span className="store-step-n">3</span>Pay <strong style={{color:'var(--gold)'}}>L${order.total_ls?.toLocaleString()}</strong> — all items deliver instantly</div>
        </div>
        <button className="store-btn-ghost" onClick={()=>{ setOrder(null); setCart([]); setSlName(''); }}>Place Another Order</button>
      </div>
    </div>
  );

  return (
    <div className="store-root">
      <header className="store-header">
        <div className="store-logo">KΘΦ II STORE</div>
        <div className="store-header-sub">Star Wars Plushie Collection · L$200 each</div>
      </header>

      <div className="store-layout">
        {/* LEFT — ITEM GRID */}
        <section className="store-section">
          <div className="store-section-label">Select Your Plushies</div>
          <div className="store-grid">
            {items.map(item => {
              const inCart = cart.find(c => c.id === item.id);
              return (
                <div key={item.id} className={`store-card ${inCart ? 'selected' : ''}`}>
                  <div className="store-card-img-wrap">
                    <img src={item.image_url} alt={item.name} className="store-card-img"
                      onError={(e:any)=>e.target.src='/logo.png'}/>
                    {inCart && <div className="store-card-qty">{inCart.quantity}</div>}
                  </div>
                  <div className="store-card-name">{item.name.replace(' Plushie','')}</div>
                  <div className="store-card-price">L${item.price_ls}</div>
                  <div className="store-card-actions">
                    {inCart ? (
                      <div className="store-qty-row">
                        <button className="store-qty-btn" onClick={()=>removeFromCart(item.id)}>−</button>
                        <span className="store-qty-num">{inCart.quantity}</span>
                        <button className="store-qty-btn" onClick={()=>addToCart(item)}>+</button>
                      </div>
                    ) : (
                      <button className="store-add-btn" onClick={()=>addToCart(item)}>Add to Cart</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RIGHT — CART */}
        <aside className="store-cart">
          <div className="store-section-label">Your Cart {totalItems > 0 && `· ${totalItems} item${totalItems!==1?'s':''}`}</div>

          {!cart.length ? (
            <div className="store-cart-empty">No items added yet.<br/>Select a plushie to get started.</div>
          ) : (
            <>
              <div className="store-cart-items">
                {cart.map(c => (
                  <div key={c.id} className="store-cart-row">
                    <img src={c.image_url} alt={c.name} className="store-cart-img"
                      onError={(e:any)=>e.target.src='/logo.png'}/>
                    <div className="store-cart-info">
                      <div className="store-cart-name">{c.name.replace(' Plushie','')}</div>
                      <div className="store-cart-line">L${c.price_ls} × {c.quantity}</div>
                    </div>
                    <div className="store-cart-right">
                      <div className="store-cart-subtotal">L${(c.price_ls * c.quantity).toLocaleString()}</div>
                      <div className="store-qty-row" style={{justifyContent:'flex-end'}}>
                        <button className="store-qty-btn" onClick={()=>removeFromCart(c.id)}>−</button>
                        <span className="store-qty-num">{c.quantity}</span>
                        <button className="store-qty-btn" onClick={()=>addToCart(c)}>+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="store-cart-total">
                <span>Total</span>
                <span style={{color:'var(--gold)',fontFamily:'Space Mono,monospace',fontWeight:700}}>L${total.toLocaleString()}</span>
              </div>

              <button className="store-clear-btn" onClick={clearCart}>Clear Cart</button>
            </>
          )}

          <div style={{marginTop:'1.2rem'}}>
            <div className="store-section-label" style={{marginBottom:'0.5rem'}}>Your Second Life Username</div>
            <input
              className="store-input"
              style={{width:'100%',marginBottom:'0.6rem'}}
              placeholder="e.g. JohnResident"
              value={slName}
              onChange={e=>{ setSlName(e.target.value); setError(''); }}
              onKeyDown={e=>e.key==='Enter' && placeOrder()}
            />
            {error && <div className="store-error" style={{marginBottom:'0.6rem'}}>{error}</div>}
            <button
              className="store-btn"
              style={{width:'100%'}}
              onClick={placeOrder}
              disabled={ordering || !cart.length || !slName.trim()}>
              {ordering ? 'Placing Order...' : cart.length ? `Order Now · L$${total.toLocaleString()}` : 'Add Items to Order'}
            </button>
          </div>
        </aside>
      </div>

      <footer className="store-footer">
        <div>KΘΦ II Wokou-Corsairs · Death before Dishonor · Est. 3/14/21</div>
      </footer>
    </div>
  );
}
