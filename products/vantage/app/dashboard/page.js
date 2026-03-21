'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ApiKeyInput from '../components/api-key-input';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stats, setStats] = useState({ pnl: 0, winRate: 0, roi: 0, totalWagered: 0, totalTrades: 0 });
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    (async () => {
      await fetch('/api/user/provision', { method: 'POST' });
      const [s, t] = await Promise.all([fetch('/api/user/stats'), fetch('/api/user/trades')]);
      if (s.ok) setStats(await s.json());
      if (t.ok) {
        const json = await t.json();
        setTrades(json.trades || []);
      }
    })();
  }, [status]);

  if (status === 'unauthenticated') {
    router.push('/signup');
    return null;
  }
  if (status === 'loading' || !session) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <a href="https://yourvantage.ai" style={{ fontWeight: 700 }}>🔭 Vantage</a>
          <a href="/dashboard">Dashboard</a>
          <a href="#trades">Trades</a>
          <button onClick={() => setSettingsOpen(true)} style={linkBtn}>Settings</button>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span>{session.user?.name || session.user?.email}</span>
          <button onClick={() => signOut({ callbackUrl: 'https://yourvantage.ai' })} style={linkBtn}>Sign out</button>
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 10 }}>
        <Metric label="P&L" value={`$${Number(stats.pnl).toFixed(2)}`} />
        <Metric label="WIN RATE" value={`${Number(stats.winRate).toFixed(1)}%`} />
        <Metric label="ROI" value={`${Number(stats.roi).toFixed(1)}%`} />
        <Metric label="WAGERED" value={`$${Number(stats.totalWagered).toFixed(2)}`} />
        <Metric label="TRADES" value={String(stats.totalTrades || 0)} />
      </section>

      <section id="trades" style={{ marginTop: 22 }}>
        <h2>Order History</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
          <thead><tr>{['Date','Market','Category','Layer','Side','EV%','Kelly','Outcome','P&L'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {trades.length === 0 ? <tr><td colSpan={9} style={td}>No trades yet.</td></tr> : null}
            {trades.map((r) => (
              <tr key={r.id}>
                <td style={td}>{String(r.date).slice(0,10)}</td>
                <td style={td}>{r.market}</td>
                <td style={td}>{r.category}</td>
                <td style={td}>{r.layer}</td>
                <td style={td}>{r.side}</td>
                <td style={td}>{r.ev_pct ?? '-'}</td>
                <td style={td}>{r.kelly_amount ?? '-'}</td>
                <td style={td}>{r.outcome || 'pending'}</td>
                <td style={td}>{r.pnl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: 22 }}>
        <h2>Strategy Breakdown</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
          <div style={card}>By category: data populates as trades accrue.</div>
          <div style={card}>By layer: data populates as L1/L2/L3 signals settle.</div>
        </div>
      </section>

      <ApiKeyInput />
      {settingsOpen && <SettingsPane onClose={() => setSettingsOpen(false)} />}
    </main>
  );
}

function Metric({ label, value }) { return <div style={card}><div style={{ fontSize: 12, color: '#666' }}>{label}</div><div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div></div>; }

function SettingsPane({ onClose }) {
  const [bankroll, setBankroll] = useState('1000');
  const [riskLevel, setRiskLevel] = useState('moderate');
  const [whatsapp, setWhatsapp] = useState('');

  const save = async () => {
    await fetch('/api/user/config', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ bankroll, riskLevel, whatsapp, autoExecute: false }),
    });
    onClose();
  };

  return (
    <div style={overlay}>
      <aside style={pane}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3>Settings</h3><button onClick={onClose} style={linkBtn}>Close</button></div>
        <label style={lbl}>Bankroll<input style={inp} type="number" value={bankroll} onChange={(e) => setBankroll(e.target.value)} /></label>
        <label style={lbl}>Risk Level<select style={inp} value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}><option>conservative</option><option>moderate</option><option>aggressive</option></select></label>
        <label style={lbl}>WhatsApp<input style={inp} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+1..." /></label>
        <label style={lbl}>Paper Trading Mode<input style={{ ...inp, background: '#f5f5f5' }} value="ON (beta enforced)" disabled /></label>
        <button onClick={save} style={{ ...linkBtn, background: '#111', color: '#fff', borderRadius: 6, padding: '10px 14px' }}>Save</button>
      </aside>
    </div>
  );
}

const card = { border: '1px solid #e5e5e5', borderRadius: 10, padding: 14, background: '#fff' };
const th = { textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8, fontSize: 12, color: '#666' };
const td = { borderBottom: '1px solid #f0f0f0', padding: 8, fontSize: 13 };
const linkBtn = { border: '1px solid #ddd', background: '#fff', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', justifyContent: 'flex-end' };
const pane = { width: 420, background: '#fff', height: '100%', padding: 16, display: 'grid', gap: 10, overflowY: 'auto' };
const lbl = { display: 'grid', gap: 6, fontSize: 13 };
const inp = { border: '1px solid #ddd', borderRadius: 6, padding: 10 };
