'use client';

import { useState } from 'react';

export default function ApiKeyInput({ onSaved }) {
  const [kalshiKeyId, setKalshiKeyId] = useState('');
  const [kalshiSecret, setKalshiSecret] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/user/keys', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kalshiKeyId, kalshiSecret, kalshiMode: 'demo' }),
      });
      if (!res.ok) throw new Error('Failed to save keys');
      setMessage('Kalshi keys saved securely.');
      setKalshiSecret('');
      onSaved?.();
    } catch (err) {
      setMessage(err.message || 'Error saving keys');
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Connect Kalshi (Paper Mode)</h3>
      <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
        <label style={lbl}>Kalshi API Key ID
          <input value={kalshiKeyId} onChange={(e) => setKalshiKeyId(e.target.value)} required style={input} />
        </label>
        <label style={lbl}>Kalshi API Secret
          <input type="password" value={kalshiSecret} onChange={(e) => setKalshiSecret(e.target.value)} required style={input} />
        </label>
        <button disabled={isSubmitting} style={btn}>{isSubmitting ? 'Saving...' : 'Save Keys'}</button>
      </form>
      {message ? <p style={{ marginTop: 8 }}>{message}</p> : null}
    </div>
  );
}

const lbl = { display: 'grid', gap: 6, marginBottom: 10 };
const input = { border: '1px solid #ccc', borderRadius: 6, padding: 10 };
const btn = { border: 'none', background: '#111', color: '#fff', padding: '10px 14px', borderRadius: 6, cursor: 'pointer' };
