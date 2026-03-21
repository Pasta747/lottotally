'use client';

import { useSession, signOut } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const rows = [
  { date: '2026-03-20', market: 'BTC > 90k', category: 'Crypto', layer: 'L3', side: 'YES', ev: '4.1%', kelly: '$18', outcome: 'Pending', pnl: '$0' },
  { date: '2026-03-20', market: 'CPI > 3.2%', category: 'Economics', layer: 'L3', side: 'NO', ev: '3.3%', kelly: '$14', outcome: 'Win', pnl: '+$11' },
  { date: '2026-03-19', market: 'NBA spread market', category: 'Sports', layer: 'L1', side: 'YES', ev: '2.8%', kelly: '$9', outcome: 'Loss', pnl: '-$9' },
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (status === 'unauthenticated') {
    router.push('/signup');
    return null;
  }
  if (status === 'loading' || !session) return <div style={{ padding: 24 }}>Loading...</div>;

  const score = useMemo(() => ({ pnl: '+$42', winRate: '66%', roi: '8.4%', wagered: '$500', rank: '#2' }), []);

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
        {Object.entries(score).map(([k, v]) => (
          <div key={k} style={card}><div style={{ fontSize: 12, color: '#666' }}>{k.toUpperCase()}</div><div style={{ fontSize: 22, fontWeight: 700 }}>{v}</div></div>
        ))}
      </section>

      <section id="trades" style={{ marginTop: 22 }}>
        <h2>Order History</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
          <thead><tr>{['Date','Market','Category','Layer','Side','EV%','Kelly','Outcome','P&L'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}>{Object.values(r).map((v, j) => <td key={j} style={td}>{v}</td>)}</tr>)}</tbody>
        </table>
      </section>

      <section style={{ marginTop: 22 }}>
        <h2>Strategy Breakdown</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
          <div style={card}>By category: Sports +2.1%, Economics +5.8%, Crypto -0.7%</div>
          <div style={card}>By layer: L1 +1.2%, L2 +2.9%, L3 +4.4%</div>
        </div>
      </section>

      {settingsOpen && <SettingsPane onClose={() => setSettingsOpen(false)} />}
    </main>
  );
}

function SettingsPane({ onClose }) {
  return (
    <div style={overlay}>
      <aside style={pane}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3>Settings</h3><button onClick={onClose} style={linkBtn}>Close</button></div>
        <label style={lbl}>Kalshi API Key ID<input style={inp} type="password" placeholder="••••••••" /></label>
        <label style={lbl}>Kalshi API Secret<input style={inp} type="password" placeholder="••••••••" /></label>
        <label style={lbl}>Bankroll<input style={inp} type="number" defaultValue={1000} /></label>
        <label style={lbl}>Risk Level<select style={inp}><option>Conservative</option><option>Moderate</option><option>Aggressive</option></select></label>
        <label style={lbl}>WhatsApp<input style={inp} placeholder="+1..." /></label>
        <label style={lbl}>Email<input style={inp} placeholder="you@example.com" /></label>
        <label style={lbl}>Paper Trading Mode<input style={{ ...inp, background: '#f5f5f5' }} value="ON (beta enforced)" disabled /></label>
        <button style={{ ...linkBtn, background: '#111', color: '#fff', borderRadius: 6, padding: '10px 14px' }}>Save</button>
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
