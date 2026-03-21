'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Disclaimer from '../components/disclaimer';

export default function ConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [config, setConfig] = useState({ bankroll: '1000', riskLevel: 'moderate', whatsapp: '' });
  const [keys, setKeys] = useState({ kalshiKeyId: '', kalshiSecret: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/signup');
    if (status === 'authenticated') {
      fetch('/api/user/config').then((r) => r.json()).then((d) => {
        setConfig({
          bankroll: String(d.bankroll ?? 1000),
          riskLevel: d.risk_level || 'moderate',
          whatsapp: d.whatsapp || '',
        });
      }).catch(() => undefined);
    }
  }, [status, router]);

  async function saveAll(e) {
    e.preventDefault();
    setMsg('Saving...');
    const c = await fetch('/api/user/config', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...config, autoExecute: false }),
    });

    if (!c.ok) {
      setMsg('Failed to save config');
      return;
    }

    if (keys.kalshiKeyId && keys.kalshiSecret) {
      const k = await fetch('/api/user/keys', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kalshiKeyId: keys.kalshiKeyId, kalshiSecret: keys.kalshiSecret, kalshiMode: 'demo' }),
      });
      if (!k.ok) {
        setMsg('Config saved, key save failed');
        return;
      }
    }

    setMsg('Saved successfully');
  }

  if (status === 'loading') return <div style={{ padding: 24 }}>Loading...</div>;
  if (!session) return null;

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
      <h1>Vantage Configuration</h1>
      <form onSubmit={saveAll} style={{ marginTop: 16, display: 'grid', gap: 10 }}>
        <label>Bankroll<input value={config.bankroll} onChange={(e) => setConfig({ ...config, bankroll: e.target.value })} style={input} /></label>
        <label>Risk Level<select value={config.riskLevel} onChange={(e) => setConfig({ ...config, riskLevel: e.target.value })} style={input}><option>conservative</option><option>moderate</option><option>aggressive</option></select></label>
        <label>WhatsApp<input value={config.whatsapp} onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })} style={input} placeholder="+1..." /></label>

        <hr />
        <label>Kalshi API Key ID<input value={keys.kalshiKeyId} onChange={(e) => setKeys({ ...keys, kalshiKeyId: e.target.value })} style={input} /></label>
        <label>Kalshi API Secret<input type="password" value={keys.kalshiSecret} onChange={(e) => setKeys({ ...keys, kalshiSecret: e.target.value })} style={input} /></label>

        <button type="submit" style={btn}>Save Configuration</button>
      </form>
      {msg ? <p style={{ marginTop: 10 }}>{msg}</p> : null}
      <Disclaimer />
      <p><strong>Paper trading only. Not financial advice. For testing and research purposes.</strong></p>
    </main>
  );
}

const input = { width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 };
const btn = { border: 'none', background: '#111', color: '#fff', padding: '10px 14px', borderRadius: 6, cursor: 'pointer' };
