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
  const [chartData, setChartData] = useState(null);
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
      const [statsRes, tradesRes, kalshiRes, chartRes] = await Promise.all([
        fetch('/api/user/stats'),
        fetch('/api/user/trades'),
        fetch('/api/kalshi/positions'),
        fetch('/api/user/chart'),
      ]);
      if (statsRes.ok) setStats((await statsRes.json()).stats);
      if (tradesRes.ok) setTrades((await tradesRes.json()).trades);
      if (kalshiRes.ok) setKalshi(await kalshiRes.json());
      if (chartRes.ok) setChartData(await chartRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return <Loader />;
  if (!session) return null;

  const hasTrades = trades.length > 0;

  // Live Kalshi data — single source of truth for the hero
  const kalshiBalanceCents = kalshi?.balance ?? null;
  const kalshiPortfolioCents = kalshi?.portfolio_value ?? 0;
  const livePositions = kalshi?.positions || [];
  const noKeys = kalshi?.noKeys;

  // Hero numbers: use Kalshi balance as the primary value
  const totalValue = kalshiBalanceCents != null
    ? ((kalshiBalanceCents + kalshiPortfolioCents) / 100)
    : null;
  const kalshiBalance = kalshiBalanceCents != null ? (kalshiBalanceCents / 100).toFixed(2) : null;

  // P&L from trade history (DB) for win rate etc
  const pnl = stats ? parseFloat(stats.pnl) : 0;
  const pnlPositive = pnl >= 0;

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
                <div style={s.heroLabel}>Kalshi Balance</div>
                <div style={s.heroValue}>
                  {totalValue != null ? `$${totalValue.toFixed(2)}` : (noKeys ? '—' : '…')}
                </div>
                <div style={{ ...s.heroDelta, color: pnl >= 0 ? '#4ade80' : '#f87171' }}>
                  {hasTrades
                    ? `${pnl >= 0 ? '▲' : '▼'} $${Math.abs(pnl).toFixed(2)} (${stats?.roi || '0.00'}%) all time`
                    : 'No trade history yet'}
                </div>
              </div>
              <div style={s.heroStats}>
                <HeroStat label="Cash Available" value={kalshiBalance ? `$${kalshiBalance}` : '—'} />
                <HeroStat label="Open Positions" value={livePositions.length > 0 ? livePositions.length : (noKeys ? '—' : '0')} />
                <HeroStat label="Win Rate" value={hasTrades ? `${stats.winRate}%` : '—'} />
                <HeroStat label="Total Trades" value={hasTrades ? trades.length : '—'} />
              </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div style={s.chartSection}>
            <div style={s.chartInner}>
              <div style={s.chartHeader}>
                <span style={s.chartTitle}>Portfolio Performance</span>
                <span style={s.chartSub}>Balance over time</span>
              </div>
              <PerformanceChart data={chartData} bankroll={totalValue || chartData?.bankroll} />
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
                        {['Market', 'Side', 'Qty', 'Cost', 'Settles'].map(h => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {livePositions.map((pos, i) => {
                        const contracts = pos.contracts || Math.abs(pos.yes_contracts || pos.no_contracts || 0);
                        const unrealPnl = pos.unrealized_pnl != null ? (pos.unrealized_pnl / 100) : null;
                        const settles = pos.close_time ? new Date(pos.close_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Los_Angeles' }) : '—';
                        return (
                          <tr key={pos.ticker + i}>
                            <td style={{ ...s.td, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#111', fontWeight: 500 }}>{pos.market_title || pos.ticker}</td>
                            <td style={s.td}><Pill text={pos.side.toUpperCase()} color={pos.side === 'yes' ? 'green' : 'red'} /></td>
                            <td style={s.td}>{contracts || 1}</td>
                            <td style={{ ...s.td, color: '#6b7280' }}>
                              {pos.cost ? `$${pos.cost.toFixed(2)}` : '—'}
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

// ─── Performance Chart (pure SVG, no deps) ──────────────────────────────────
function PerformanceChart({ data, bankroll }) {
  if (!data?.points?.length) {
    return (
      <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 13 }}>
        No performance data yet — data will appear as you trade.
      </div>
    );
  }

  const points = data.points;
  const W = 900, H = 120, PAD = { t: 12, r: 16, b: 28, l: 52 };
  const vals = points.map(p => p.balance);
  const minV = Math.min(...vals) * 0.998;
  const maxV = Math.max(...vals) * 1.002;
  const baseline = bankroll || vals[0];
  const range = maxV - minV || 1;
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  const px = i => PAD.l + (i / Math.max(points.length - 1, 1)) * innerW;
  const py = v => PAD.t + innerH - ((v - minV) / range) * innerH;

  // Build SVG path
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(p.balance).toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${px(points.length - 1).toFixed(1)},${(PAD.t + innerH).toFixed(1)} L${PAD.l},${(PAD.t + innerH).toFixed(1)} Z`;

  // Last point value
  const lastVal = vals[vals.length - 1];
  const gain = lastVal - baseline;
  const gainPct = ((gain / baseline) * 100).toFixed(2);
  const isUp = gain >= 0;
  const lineColor = isUp ? '#4ade80' : '#f87171';

  // Y axis labels
  const yLabels = [minV, (minV + maxV) / 2, maxV].map(v => ({
    y: py(v),
    label: `$${v.toFixed(0)}`,
  }));

  // X axis labels (show up to 6 dates)
  const step = Math.max(1, Math.floor(points.length / 5));
  const xLabels = points.filter((_, i) => i % step === 0 || i === points.length - 1).map((p, _, arr) => {
    const i = points.indexOf(p);
    const d = new Date(p.date);
    return { x: px(i), label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
  });

  // Baseline (starting bankroll) line
  const baselineY = py(baseline);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>${lastVal.toFixed(2)}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: isUp ? '#4ade80' : '#f87171' }}>
          {isUp ? '▲' : '▼'} ${Math.abs(gain).toFixed(2)} ({gainPct}%)
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Baseline reference line */}
        {baselineY > PAD.t && baselineY < PAD.t + innerH && (
          <line x1={PAD.l} y1={baselineY} x2={PAD.l + innerW} y2={baselineY}
            stroke="#ffffff18" strokeWidth="1" strokeDasharray="4,4" />
        )}

        {/* Y grid lines */}
        {yLabels.map((yl, i) => (
          <g key={i}>
            <line x1={PAD.l} y1={yl.y} x2={PAD.l + innerW} y2={yl.y} stroke="#ffffff0a" strokeWidth="1" />
            <text x={PAD.l - 6} y={yl.y + 4} fill="#6b7280" fontSize="10" textAnchor="end">{yl.label}</text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaD} fill="url(#areaGrad)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Last point dot */}
        <circle cx={px(points.length - 1)} cy={py(lastVal)} r="4" fill={lineColor} />

        {/* X axis labels */}
        {xLabels.map((xl, i) => (
          <text key={i} x={xl.x} y={H - 4} fill="#6b7280" fontSize="10" textAnchor="middle">{xl.label}</text>
        ))}
      </svg>
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
  const [kalshiMode, setKalshiMode] = useState('demo');
  const [bankroll, setBankroll] = useState('');
  const [riskLevel, setRiskLevel] = useState('moderate');
  const [maxWager, setMaxWager] = useState('1.00');
  const [maxOrdersPerDay, setMaxOrdersPerDay] = useState('10');
  const [maxDailySpend, setMaxDailySpend] = useState('10.00');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Load existing config on mount
  useEffect(() => {
    fetch('/api/user/config').then(r => r.json()).then(d => {
      if (d.config) {
        setBankroll(d.config.bankroll || '');
        setRiskLevel(d.config.risk_level || 'moderate');
        setMaxWager(d.config.max_wager_dollars || '1.00');
        setMaxOrdersPerDay(d.config.max_orders_per_day || '10');
        setMaxDailySpend(d.config.max_daily_spend || '10.00');
        setKalshiMode(d.config.kalshi_mode || 'demo');
      }
    }).catch(() => {});
  }, []);

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
        body: JSON.stringify({
          bankroll: parseFloat(bankroll) || undefined,
          risk_level: riskLevel || undefined,
          max_wager_dollars: parseFloat(maxWager) || undefined,
          max_orders_per_day: parseInt(maxOrdersPerDay) || undefined,
          max_daily_spend: parseFloat(maxDailySpend) || undefined,
          kalshi_mode: kalshiMode,
        }),
      });
      if (!configRes.ok) throw new Error((await configRes.json()).error || 'Failed to save config');
      setMessage('✅ Settings saved!');
      setTimeout(() => { onClose(); onSave(); }, 1200);
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
          <div style={s.settingsSectionTitle}>Kalshi API Connection</div>
          <label style={s.lbl}>Mode
            <select style={s.inp} value={kalshiMode} onChange={e => setKalshiMode(e.target.value)}>
              <option value="demo">Demo (Paper trades, fake funds)</option>
              <option value="live">Live (Real money)</option>
            </select>
          </label>
          <label style={s.lbl}>
            API Key ID
            <input style={s.inp} type="text" value={apiKeyId} onChange={e => setApiKeyId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            <span style={s.hint}>The UUID shown under your API key name (e.g. a916...412a)</span>
          </label>
          <label style={s.lbl}>
            Private Key (PEM)
            <textarea style={{ ...s.inp, height: 100, resize: 'vertical', fontSize: 11, fontFamily: 'monospace' }}
              value={apiSecret} onChange={e => setApiSecret(e.target.value)}
              placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;MIIEpAIBAAK...&#10;-----END RSA PRIVATE KEY-----" />
            <span style={s.hint}>The full RSA private key — only shown once when you create the API key on Kalshi</span>
          </label>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: -4, marginBottom: 4, lineHeight: 1.5 }}>
            Kalshi → Settings → API Access → Create Key → copy <strong>Key ID</strong> and <strong>Private Key</strong> separately
          </div>
        </div>

        <div style={s.settingsSection}>
          <div style={s.settingsSectionTitle}>Trading Budget</div>
          <label style={s.lbl}>
            Total Bankroll ($)
            <input style={s.inp} type="number" min="0" step="10" value={bankroll} onChange={e => setBankroll(e.target.value)} placeholder="e.g. 500" />
            <span style={s.hint}>Total amount available for Vantage to trade with</span>
          </label>
          <label style={s.lbl}>
            Max Wager per Trade ($)
            <input style={s.inp} type="number" min="0.01" max="100" step="0.01" value={maxWager} onChange={e => setMaxWager(e.target.value)} />
            <span style={s.hint}>Hard cap per individual order (recommended: $1–$5 for beta)</span>
          </label>
          <label style={s.lbl}>
            Max Orders per Day
            <input style={s.inp} type="number" min="1" max="100" step="1" value={maxOrdersPerDay} onChange={e => setMaxOrdersPerDay(e.target.value)} />
            <span style={s.hint}>Maximum number of trades Vantage can place in a single day</span>
          </label>
          <label style={s.lbl}>
            Daily Spend Limit ($)
            <input style={s.inp} type="number" min="1" step="1" value={maxDailySpend} onChange={e => setMaxDailySpend(e.target.value)} />
            <span style={s.hint}>Vantage will stop trading once this amount is spent today</span>
          </label>
        </div>

        <div style={s.settingsSection}>
          <div style={s.settingsSectionTitle}>Risk Strategy</div>
          <label style={s.lbl}>Risk Level
            <select style={s.inp} value={riskLevel} onChange={e => setRiskLevel(e.target.value)}>
              <option value="conservative">Conservative — smaller Kelly fraction, higher edge threshold</option>
              <option value="moderate">Moderate — balanced risk/reward</option>
              <option value="aggressive">Aggressive — larger position sizes, lower edge threshold</option>
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

  // Chart
  chartSection: { background: '#0a0a0a', borderTop: '1px solid #1f1f1f', padding: '0 32px 28px' },
  chartInner: { maxWidth: 1060, margin: '0 auto' },
  chartHeader: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: 20, marginBottom: 4 },
  chartTitle: { fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' },
  chartSub: { fontSize: 12, color: '#4b5563' },

  // Settings hint
  hint: { fontSize: 11, color: '#9ca3af', marginTop: 2, lineHeight: 1.4 },

  // Settings
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 100 },
  settingsPane: { width: 380, background: '#fff', height: '100%', padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
  settingsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, paddingBottom: 16, borderBottom: '1px solid #f3f4f6' },
  settingsSection: { marginBottom: 24 },
  settingsSectionTitle: { fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 },
  lbl: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 12 },
  inp: { border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', background: '#f9fafb', color: '#111' },
};
