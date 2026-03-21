'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect to signup if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signup');
    }
  }, [status, router]);

  // Fetch real data
  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch('/api/user/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      // Fetch trades
      const tradesRes = await fetch('/api/user/trades');
      if (tradesRes.ok) {
        const tradesData = await tradesRes.json();
        setTrades(tradesData.trades);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!session) {
    return null;
  }

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

      {loading ? (
        <div>Loading dashboard data...</div>
      ) : (
        <>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 10 }}>
            {stats && Object.entries({
              'P&L': `$${stats.totalTrades > 0 ? (stats.winRate * stats.totalTrades / 100 * 10).toFixed(2) : '0.00'}`,
              'Win Rate': `${stats.winRate}%`,
              'ROI': `${(stats.winRate * 0.1).toFixed(2)}%`,
              'Wagered': `$${stats.totalTrades * 10}`,
              'Rank': '#2'
            }).map(([k, v]) => (
              <div key={k} style={card}>
                <div style={{ fontSize: 12, color: '#666' }}>{k.toUpperCase()}</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </section>

          <section id="trades" style={{ marginTop: 22 }}>
            <h2>Order History</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
              <thead>
                <tr>
                  {['Date', 'Market', 'Category', 'Layer', 'Side', 'EV%', 'Kelly', 'Outcome', 'P&L'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((trade, i) => (
                  <tr key={trade.id}>
                    <td style={td}>{new Date(trade.created_at).toLocaleDateString()}</td>
                    <td style={td}>{trade.ticker}</td>
                    <td style={td}>{trade.category}</td>
                    <td style={td}>L{trade.layer}</td>
                    <td style={td}>{trade.side.toUpperCase()}</td>
                    <td style={td}>{(parseFloat(trade.estimated_prob) * 100).toFixed(1)}%</td>
                    <td style={td}>${(parseFloat(trade.signal_strength) * 100).toFixed(0)}</td>
                    <td style={td}>{trade.status === 'pending' ? 'Pending' : trade.status === 'win' ? 'Win' : 'Loss'}</td>
                    <td style={td}>{trade.status === 'win' ? '+$10' : trade.status === 'loss' ? '-$10' : '$0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section style={{ marginTop: 22 }}>
            <h2>Strategy Breakdown</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
              <div style={card}>By category: Sports +2.1%, Economics +5.8%, Crypto -0.7%</div>
              <div style={card}>By layer: L1 +1.2%, L2 +2.9%, L3 +4.4%</div>
            </div>
          </section>
        </>
      )}

      {settingsOpen && <SettingsPane onClose={() => setSettingsOpen(false)} onSave={fetchData} />}
    </main>
  );
}

function SettingsPane({ onClose, onSave }) {
  const [apiKey, setApiKey] = useState('');
  const [bankroll, setBankroll] = useState(1000);
  const [riskLevel, setRiskLevel] = useState('moderate');
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    slack: false,
    discord: false
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      // Save API key if provided
      if (apiKey) {
        const keyRes = await fetch('/api/user/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey })
        });
        
        if (!keyRes.ok) {
          const error = await keyRes.json();
          throw new Error(error.error || 'Failed to save API key');
        }
      }
      
      // Save config
      const configRes = await fetch('/api/user/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankroll, riskLevel, notifications })
      });
      
      if (!configRes.ok) {
        const error = await configRes.json();
        throw new Error(error.error || 'Failed to save config');
      }
      
      setMessage('Settings saved successfully!');
      setTimeout(() => {
        onClose();
        onSave();
      }, 1000);
    } catch (error) {
      console.error('Save error:', error);
      setMessage(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlay}>
      <aside style={pane}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>Settings</h3>
          <button onClick={onClose} style={linkBtn}>Close</button>
        </div>
        
        <label style={lbl}>Kalshi API Key<input style={inp} type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="KALSHI_..." /></label>
        <label style={lbl}>Bankroll<input style={inp} type="number" value={bankroll} onChange={(e) => setBankroll(e.target.value)} /></label>
        <label style={lbl}>Risk Level
          <select style={inp} value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </label>
        
        <h4 style={{ marginTop: 16 }}>Notifications</h4>
        {Object.entries(notifications).map(([key, value]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', margin: '8px 0' }}>
            <input 
              type="checkbox" 
              checked={value} 
              onChange={(e) => setNotifications({...notifications, [key]: e.target.checked})} 
              style={{ marginRight: 8 }}
            />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
        ))}
        
        {message && (
          <div style={{ 
            padding: 10, 
            borderRadius: 6, 
            backgroundColor: message.includes('success') ? '#d4edda' : '#f8d7da',
            color: message.includes('success') ? '#155724' : '#721c24',
            marginTop: 10
          }}>
            {message}
          </div>
        )}
        
        <button 
          onClick={handleSave} 
          disabled={saving}
          style={{ 
            ...linkBtn, 
            background: '#111', 
            color: '#fff', 
            borderRadius: 6, 
            padding: '10px 14px',
            marginTop: 10,
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
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