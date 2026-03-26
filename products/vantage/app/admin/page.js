'use client';

import { useState, useEffect } from 'react';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetch(`/api/admin/overview-stats?days=${days}`)
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [days]);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <ErrorState />;

  const { stats: s, daily, bySport, betBreakdown } = stats;

  return (
    <div>
      {/* Filters */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
        <label style={{ fontSize: 14, color: '#6b7280' }}>Period:</label>
        <select
          value={days}
          onChange={e => { setDays(parseInt(e.target.value)); setLoading(true); }}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 8 }}>
          {s.totalSignals} signals in period
        </span>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <KpiCard
          label="Total Signals"
          value={s.totalSignals.toLocaleString()}
          sub={`${s.settled} settled`}
          color="#3b82f6"
        />
        <KpiCard
          label="Win Rate"
          value={`${s.winRate}%`}
          sub={`${s.wins} wins / ${s.settled} settled`}
          color={parseFloat(s.winRate) >= 55 ? '#10b981' : '#ef4444'}
        />
        <KpiCard
          label="Avg EV"
          value={`${s.avgEv}%`}
          sub="Expected value per signal"
          color="#8b5cf6"
        />
        <KpiCard
          label="P&L"
          value={`$${parseFloat(s.totalPnl) >= 0 ? '+' : ''}${s.totalPnl}`}
          sub="Profit / Loss"
          color={parseFloat(s.totalPnl) >= 0 ? '#10b981' : '#ef4444'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Signal Volume Chart */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#111827' }}>Signal Volume (Daily)</h3>
          <SignalVolumeChart data={daily} />
        </div>

        {/* Sport Breakdown */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#111827' }}>By Sport</h3>
          {bySport && bySport.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bySport.map(row => (
                <div key={row.sport} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{row.sport?.toUpperCase() || 'N/A'}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{row.count} signals · EV {row.avg_ev}%</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: parseFloat(row.win_rate) >= 55 ? '#10b981' : '#6b7280' }}>
                    {row.win_rate ? `${parseFloat(row.win_rate).toFixed(1)}%` : '—'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No data yet" />
          )}
        </div>
      </div>

      {/* Bet Decision Breakdown */}
      {betBreakdown && betBreakdown.length > 0 && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginTop: 24 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#111827' }}>Bet Decision Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {betBreakdown.map(row => (
              <div key={String(row.did_we_bet)} style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>
                  {row.did_we_bet ? '✅ We Bet' : '❌ We Passed'}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{row.count}</div>
                <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
                  Win rate: {row.win_rate ? `${parseFloat(row.win_rate).toFixed(1)}%` : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: color || '#111827', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>{sub}</div>
    </div>
  );
}

function SignalVolumeChart({ data }) {
  if (!data || data.length === 0) return <EmptyState message="No daily data yet" />;

  const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-30);
  const maxCount = Math.max(...sorted.map(d => parseInt(d.count) || 1), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
      {sorted.map((day, i) => {
        const height = ((parseInt(day.count) || 0) / maxCount) * 100;
        const dateLabel = new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div
              title={`${day.count} signals`}
              style={{
                width: '100%',
                height: `${Math.max(height, 4)}%`,
                background: parseFloat(day.wins || 0) / parseInt(day.count || 1) >= 0.5 ? '#10b981' : '#3b82f6',
                borderRadius: '3px 3px 0 0',
                minHeight: 4,
                transition: 'height 0.2s',
              }}
            />
            {i % Math.ceil(sorted.length / 7) === 0 && (
              <span style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>{dateLabel}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return <p style={{ color: '#9ca3af', fontSize: 14, padding: '16px 0' }}>{message || 'No data yet'}</p>;
}

function ErrorState() {
  return (
    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 16, color: '#dc2626', fontSize: 14 }}>
      Failed to load stats. Make sure the signals table exists.
    </div>
  );
}
