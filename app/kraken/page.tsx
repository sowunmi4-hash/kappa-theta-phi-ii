'use client';
import { useState, useEffect } from 'react';
import './kraken.css';

export default function KrakenStore() {
  const [items, setItems]         = useState<any[]>([]);
  const [slName, setSlName]       = useState('');
  const [balance, setBalance]     = useState<number | null>(null);
  const [looked, setLooked]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [msg, setMsg]             = useState<{text:string,type:'ok'|'err'} | null>(null);

  useEffect(() => {
    fetch('/api/kraken/items').then(r => r.json()).then(d => setItems(d.items || []));
  }, []);

  async function lookupBalance() {
    if (!slName.trim()) return;
    setLoading(true);
    const d = await fetch(`/api/kraken/balance?sl_name=${encodeURIComponent(slName.trim())}`).then(r => r.json());
    setBalance(d.balance || 0);
    setLooked(true);
    setLoading(false);
  }

  async function redeem(item: any) {
    if (balance === null || balance < item.token_price) {
      setMsg({ text: `Not enough tokens. You need ${item.token_price} but have ${balance}.`, type: 'err' });
      setTimeout(() => setMsg(null), 4000);
      return;
    }
    setRedeeming(item.id);
    const res = await fetch('/api/kraken/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sl_name: slName.trim(), item_id: item.id })
    }).then(r => r.json());
    setRedeeming(null);
    if (res.error === 'insufficient_tokens') {
      setMsg({ text: 'Not enough tokens.', type: 'err' });
    } else if (res.success) {
      setBalance(res.new_balance);
      setMsg({ text: `✓ ${item.name} redeemed! Touch the terminal in-world to collect your item.`, type: 'ok' });
    } else {
      setMsg({ text: res.error || 'Something went wrong.', type: 'err' });
    }
    setTimeout(() => setMsg(null), 6000);
  }

  return (
    <div className="kraken-root">
      {/* Header */}
      <div className="kraken-header">
        <a href="/" className="kraken-back">← Back to Site</a>
        <div className="kraken-logo">
          <div className="kraken-logo-icon">🦑</div>
          <div>
            <div className="kraken-title">Kraken Token Store</div>
            <div className="kraken-subtitle">KΘΦ II · Wokou-Corsairs</div>
          </div>
        </div>
        <div className="kraken-how">
          <div className="kraken-how-title">How it works</div>
          <div className="kraken-how-steps">
            <div className="kraken-step"><span>1</span>Buy tokens at the in-world terminal — L$1 = 1 token</div>
            <div className="kraken-step"><span>2</span>Enter your SL username below to check your balance</div>
            <div className="kraken-step"><span>3</span>Redeem tokens for items, then touch the terminal to collect</div>
          </div>
        </div>
      </div>

      {/* Balance lookup */}
      <div className="kraken-lookup">
        <div className="kraken-lookup-label">Check Your Balance</div>
        <div className="kraken-lookup-row">
          <input
            value={slName}
            onChange={e => { setSlName(e.target.value); setLooked(false); setBalance(null); }}
            onKeyDown={e => e.key === 'Enter' && lookupBalance()}
            placeholder="Enter your SL username e.g. safareehills"
            className="kraken-input"
          />
          <button onClick={lookupBalance} disabled={loading || !slName.trim()} className="kraken-btn-lookup">
            {loading ? '...' : 'Check'}
          </button>
        </div>
        {looked && balance !== null && (
          <div className="kraken-balance">
            <span className="kraken-balance-num">{balance}</span>
            <span className="kraken-balance-lbl">Kraken Tokens</span>
          </div>
        )}
      </div>

      {/* Message */}
      {msg && (
        <div className={`kraken-msg ${msg.type}`}>{msg.text}</div>
      )}

      {/* Items */}
      <div className="kraken-store">
        <div className="kraken-store-label">Available Items</div>
        {items.length === 0 ? (
          <div className="kraken-empty">
            <div className="kraken-empty-icon">🦑</div>
            <div className="kraken-empty-text">Items coming soon</div>
            <div className="kraken-empty-sub">Check back after buying your tokens at the in-world terminal</div>
          </div>
        ) : (
          <div className="kraken-grid">
            {items.map(item => (
              <div key={item.id} className="kraken-card">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="kraken-card-img" />
                ) : (
                  <div className="kraken-card-placeholder">🦑</div>
                )}
                <div className="kraken-card-body">
                  <div className="kraken-card-name">{item.name}</div>
                  {item.description && <div className="kraken-card-desc">{item.description}</div>}
                  <div className="kraken-card-price">
                    <span className="kraken-token-icon">⚡</span>
                    {item.token_price} tokens
                  </div>
                  <button
                    onClick={() => redeem(item)}
                    disabled={!looked || redeeming === item.id || balance === null}
                    className={`kraken-card-btn ${!looked ? 'disabled' : balance !== null && balance >= item.token_price ? 'can-buy' : 'no-tokens'}`}>
                    {redeeming === item.id ? 'Processing...' : !looked ? 'Check balance first' : balance !== null && balance >= item.token_price ? 'Redeem' : 'Not enough tokens'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Terminal reminder */}
      <div className="kraken-footer">
        <div className="kraken-footer-text">
          ⚓ Don't have tokens yet? Find the <strong>KΘΦ II Kraken Token Terminal</strong> in-world. Pay any amount in L$ — you get the same number of tokens. 1 L$ = 1 Token.
        </div>
      </div>
    </div>
  );
}
