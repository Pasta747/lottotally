'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const TABS = ['Positions', 'Pending', 'History'];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [trades, setTrades] = useState([]);
  const [kalshi, setKalshi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Positions');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/signup');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchData();
  }, [status]);

  const fetchData = async () => {
    try {
      const [statsRes, tradesRes, kalshiRes] = await Promise.all([
        fetch('/api/user/stats'),
        fetch('/api/user/trades'),
        fetch('/api/kalshi/positions'),
      ]);
      if (statsRes.ok) setStats((await statsRes.json()).stats);
      if (tradesRes.ok) setTrades((await tradesRes.json()).trades);
      if (kalshiRes.ok) setKalshi(await kalshiRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return <Loader />;
  if (!session) return null;

  const pnl = stats ? parseFloat(stats.pnl) : 0;
  const pnlPositive = pnl >= 0;
  const hasTrades = trades.length > 0;

  // Live Kalshi data
  const kalshiBalance = kalshi?.balance != null ? (kalshi.balance / 100).toFixed(2) : null;
  const kalshiPortfolio = kalshi?.portfolio_value != null ? (kalshi.portfolio_value / 100).toFixed(2) : null;
  const livePositions = kalshi?.positions || [];
  const noKeys = kalshi?.noKeys;

  // Filter trades by tab — Positions tab uses live Kalshi data
  const tabTrades = {
    Positions: livePositions,
    Pending: trades.filter(t => t.outcome === 'pending'),
    History: trades.filter(t => !['open', 'pending'].includes(t.outcome)),
  };
  const visibleTrades = tabTrades[activeTab] || [];

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navLeft}>
          <span style={s.logo}>
            <img src="/logo.png" alt="Vantage" style={{ height: 28, width: 28, objectFit: 'contain', marginRight: 6, verticalAlign: 'middle' }} />
            Vantage
          </span>
        </div>
        <div style={s.navRight}>
          {kalshi && !kalshi.noKeys && (
            <span style={{ fontSize: 12, fontWeight: 600, color: '#15803d', background: '#dcfce7', padding: '3px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
              Kalshi Live
            </span>
          )}
          <span style={s.userName}>{session.user?.name || session.user?.email}</span>
          <button onClick={() => setSettingsOpen(true)} style={s.btnOutline}>Settings</button>
          <button onClick={() => signOut({ callbackUrl: 'https://yourvantage.ai' })} style={s.btnGhost}>Sign out</button>
        </div>
      </nav>

      {loading ? <Loader /> : (
        <>
          {/* Portfolio Hero */}
          <div style={s.hero}>
            <div style={s.heroInner}>
              <div style={s.heroLeft}>
                <div style={s.heroLabel}>Portfolio</div>
                <div style={s.heroValue}>${Math.abs(pnl).toFixed(2)}</div>
                <div style={{ ...s.heroDelta, color: pnlPositive ? '#4ade80' : '#f87171' }}>
                  {pnlPositive ? '▲' : '▼'} ${Math.abs(pnl).toFixed(2)} ({stats?.roi || '0.00'}%) all time
                </div>
              </div>
              <div style={s.heroStats}>
                <HeroStat label="Kalshi Balance" value={kalshiBalance ? `$${kalshiBalance}` : '—'} />
                <HeroStat label="Open Positions" value={livePositions.length > 0 ? livePositions.length : (noKeys ? '—' : '0')} />
                <HeroStat label="Win Rate" value={stats ? `${stats.winRate}%` : '—'} />
                <HeroStat label="Total Trades" value={hasTrades ? trades.length : '—'} />
              </div>
            </div>
          </div>

          {/* Tabs + Table */}
          <div style={s.content}>
            <div style={s.tabBar}>
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{ ...s.tab, ...(activeTab === tab ? s.tabActive : {}) }}
                >
                  {tab}
                  {tabTrades[tab]?.length > 0 && (
                    <span style={{ ...s.tabCount, background: activeTab === tab ? '#111' : '#e5e7eb', color: activeTab === tab ? '#fff' : '#6b7280' }}>
                      {tabTrades[tab].length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'Positions' ? (
              livePositions.length > 0 ? (
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        {['Market', 'Side', 'Contracts', 'Unrealized P&L', 'Settles'].map(h => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {livePositions.map((pos, i) => {
                        const contracts = Math.abs(pos.yes_contracts || pos.no_contracts || 0);
                        const unrealPnl = pos.unrealized_pnl != null ? (pos.unrealized_pnl / 100) : null;
                        const settles = pos.close_time ? new Date(pos.close_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Los_Angeles' }) : '—';
                        return (
                          <tr key={pos.ticker + i}>
                            <td style={{ ...s.td, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#111', fontWeight: 500 }}>{pos.market_title || pos.ticker}</td>
                            <td style={s.td}><Pill text={pos.side.toUpperCase()} color={pos.side === 'yes' ? 'green' : 'red'} /></td>
                            <td style={s.td}>{contracts}</td>
                            <td style={{ ...s.td, fontWeight: 700, color: unrealPnl > 0 ? '#16a34a' : unrealPnl < 0 ? '#dc2626' : '#6b7280' }}>
                              {unrealPnl != null ? `${unrealPnl >= 0 ? '+' : ''}$${unrealPnl.toFixed(2)}` : '—'}
                            </td>
                            <td style={s.td}>{settles}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState tab="Positions" noKeys={noKeys} onSettings={() => setSettingsOpen(true)} />
              )
            ) : visibleTrades.length > 0 ? (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {['Date', 'Market', 'Category', 'Side', 'EV%', 'Kelly', 'Outcome', 'P&L'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTrades.map((trade) => {
                      const tradePnl = parseFloat(trade.pnl);
                      return (
                        <tr key={trade.id}>
                          <td style={s.td}>{new Date(trade.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                          <td style={{ ...s.td, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#111', fontWeight: 500 }}>{trade.market}</td>
                          <td style={s.td}>{trade.category}</td>
                          <td style={s.td}><Pill text={trade.side.toUpperCase()} color={trade.side === 'yes' ? 'green' : 'red'} /></td>
                          <td style={s.td}>{(parseFloat(trade.ev_pct) * 100).toFixed(2)}%</td>
                          <td style={s.td}>${parseFloat(trade.kelly_amount).toFixed(2)}</td>
                          <td style={s.td}><Pill text={trade.outcome.charAt(0).toUpperCase() + trade.outcome.slice(1)} color={trade.outcome === 'win' ? 'green' : trade.outcome === 'loss' ? 'red' : 'gray'} /></td>
                          <td style={{ ...s.td, fontWeight: 700, color: tradePnl > 0 ? '#16a34a' : tradePnl < 0 ? '#dc2626' : '#6b7280' }}>
                            {tradePnl > 0 ? '+' : ''}${tradePnl.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState tab={activeTab} onSettings={() => setSettingsOpen(true)} />
            )}
          </div>
        </>
      )}

      {settingsOpen && <SettingsPane onClose={() => setSettingsOpen(false)} onSave={fetchData} />}
    </div>
  );
}

function HeroStat({ label, value, accent }) {
  return (
    <div style={s.heroStat}>
      <div style={s.heroStatLabel}>{label}</div>
      <div style={{ ...s.heroStatValue, color: accent ? '#4ade80' : '#fff' }}>{value}</div>
    </div>
  );
}

function Pill({ text, color }) {
  const colors = {
    green: { background: '#dcfce7', color: '#15803d' },
    red: { background: '#fee2e2', color: '#b91c1c' },
    gray: { background: '#f3f4f6', color: '#6b7280' },
  };
  return <span style={{ ...s.pill, ...colors[color] }}>{text}</span>;
}

function EmptyState({ tab, noKeys, onSettings }) {
  const messages = {
    Positions: noKeys
      ? { icon: '🔑', title: 'Connect your Kalshi account', text: 'Add your Kalshi API keys in Settings to see live positions.' }
      : { icon: '📭', title: 'No open positions', text: 'Live positions from your Kalshi account will appear here.' },
    Pending: { icon: '⏳', title: 'No pending orders', text: 'Orders waiting to fill will appear here.' },
    History: { icon: '📋', title: 'No trade history yet', text: 'Connect your Kalshi API keys to start scanning and trading.' },
  };
  const { icon, title, text } = messages[tab] || messages.History;
  return (
    <div style={s.empty}>
      <div style={s.emptyIcon}>{icon}</div>
      <div style={s.emptyTitle}>{title}</div>
      <div style={s.emptyText}>{text}</div>
      {(tab === 'History' || noKeys) && (
        <button onClick={onSettings} style={s.btnPrimary}>Open Settings →</button>
      )}
    </div>
  );
}

function Loader() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9ca3af', fontFamily: 'system-ui', fontSize: 14 }}>Loading…</div>;
}

function SettingsPane({ onClose, onSave }) {
  const [apiKeyId, setApiKeyId] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [bankroll, setBankroll] = useState(1000);
  const [riskLevel, setRiskLevel] = useState('moderate');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      if (apiKeyId && apiSecret) {
        const keyRes = await fetch('/api/user/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kalshi_key_id: apiKeyId, kalshi_secret: apiSecret }),
        });
        if (!keyRes.ok) throw new Error((await keyRes.json()).error || 'Failed to save API key');
      }
      const configRes = await fetch('/api/user/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankroll: parseFloat(bankroll) || undefined, risk_level: riskLevel || undefined }),
      });
      if (!configRes.ok) throw new Error((await configRes.json()).error || 'Failed to save config');
      setMessage('✅ Settings saved!');
      setTimeout(() => { onClose(); onSave(); }, 1000);
    } catch (e) {
      setMessage(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.overlay}>
      <aside style={s.settingsPane}>
        <div style={s.settingsHeader}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111' }}>Settings</h3>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 13, color: '#374151', cursor: 'pointer', fontWeight: 500 }}>✕ Close</button>
        </div>

        <div style={s.settingsSection}>
          <div style={s.settingsSectionTitle}>Kalshi API Keys</div>
          <label style={s.lbl}>Kalshi API Key ID<input style={s.inp} type="text" value={apiKeyId} onChange={e => setApiKeyId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></label>
          <label style={s.lbl}>Kalshi Private Key<input style={s.inp} type="password" value={apiSecret} onChange={e => setApiSecret(e.target.value)} placeholder="••••••••" /></label>
        </div>

        <div style={s.settingsSection}>
          <div style={s.settingsSectionTitle}>Risk Configuration</div>
          <label style={s.lbl}>Bankroll ($)<input style={s.inp} type="number" value={bankroll} onChange={e => setBankroll(e.target.value)} /></label>
          <label style={s.lbl}>Risk Level
            <select style={s.inp} value={riskLevel} onChange={e => setRiskLevel(e.target.value)}>
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </label>
        </div>

        {message && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: message.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: message.startsWith('✅') ? '#15803d' : '#b91c1c', fontSize: 14, marginBottom: 12 }}>
            {message}
          </div>
        )}

        <button onClick={handleSave} disabled={saving} style={{ ...s.btnPrimary, width: '100%', marginTop: 'auto', padding: 12, borderRadius: 10, fontSize: 15, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </aside>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },

  // Nav
  nav: { background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 32px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 },
  navLeft: { display: 'flex', alignItems: 'center', gap: 24 },
  navRight: { display: 'flex', alignItems: 'center', gap: 12 },
  logo: { fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px', color: '#111' },
  userName: { fontSize: 13, color: '#9ca3af' },

  // Hero
  hero: { background: '#0a0a0a', color: '#fff', padding: '40px 32px 32px' },
  heroInner: { maxWidth: 1060, margin: '0 auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 },
  heroLeft: {},
  heroLabel: { fontSize: 13, color: '#9ca3af', marginBottom: 6, fontWeight: 500 },
  heroValue: { fontSize: 42, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1, marginBottom: 8 },
  heroDelta: { fontSize: 13, fontWeight: 600 },
  heroStats: { display: 'flex', gap: 40, flexWrap: 'wrap' },
  heroStat: { textAlign: 'right' },
  heroStatLabel: { fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' },
  heroStatValue: { fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px' },

  // Content
  content: { maxWidth: 1060, margin: '0 auto', padding: '0 32px 48px' },

  // Tabs
  tabBar: { display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: 0, marginTop: 32 },
  tab: { background: 'none', border: 'none', borderBottom: '2px solid transparent', padding: '10px 18px', fontSize: 14, fontWeight: 600, color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: -1 },
  tabActive: { color: '#111', borderBottomColor: '#111' },
  tabCount: { fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20 },

  // Table
  tableWrap: { background: '#fff', border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', background: '#fafafa' },
  td: { padding: '13px 16px', fontSize: 13, color: '#6b7280', borderBottom: '1px solid #f3f4f6' },
  pill: { display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700 },

  // Empty
  empty: { background: '#fff', border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '64px 32px', textAlign: 'center' },
  emptyIcon: { fontSize: 36, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6b7280', maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.6 },

  // Buttons
  btnPrimary: { background: '#111', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnOutline: { background: '#fff', color: '#374151', border: '1px solid #d1d5db', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  btnGhost: { background: 'transparent', color: '#6b7280', border: 'none', padding: '6px 10px', borderRadius: 6, fontSize: 13, cursor: 'pointer' },

  // Settings
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 100 },
  settingsPane: { width: 380, background: '#fff', height: '100%', padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
  settingsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, paddingBottom: 16, borderBottom: '1px solid #f3f4f6' },
  settingsSection: { marginBottom: 24 },
  settingsSectionTitle: { fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 },
  lbl: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 12 },
  inp: { border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', background: '#f9fafb', color: '#111' },
};
