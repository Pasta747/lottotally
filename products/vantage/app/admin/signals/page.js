'use client';

import { useState, useEffect, useCallback } from 'react';

const PAGE_SIZE = 50;

export default function SignalsPage() {
  const [signals, setSignals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    sport: '',
    outcome: '',
    dateFrom: '',
    dateTo: '',
    evMin: '',
    evMax: '',
    didWeBet: '',
  });

  const [exportLoading, setExportLoading] = useState(false);

  const buildUrl = useCallback((page) => {
    const params = new URLSearchParams({ page, limit: PAGE_SIZE });
    if (filters.sport) params.set('sport', filters.sport);
    if (filters.outcome) params.set('outcome', filters.outcome);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.evMin) params.set('evMin', filters.evMin);
    if (filters.evMax) params.set('evMax', filters.evMax);
    if (filters.didWeBet) params.set('didWeBet', filters.didWeBet);
    return `/api/admin/signals?${params.toString()}`;
  }, [filters]);

  const fetchSignals = useCallback((page = 1) => {
    setLoading(true);
    fetch(buildUrl(page))
      .then(r => r.json())
      .then(d => {
        setSignals(d.signals || []);
        setPagination(d.pagination || { page: 1, totalPages: 1, total: 0 });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [buildUrl]);

  useEffect(() => {
    fetchSignals(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
  };

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      // Fetch ALL signals (up to 1000) for export
      const params = new URLSearchParams({ page: 1, limit: 1000 });
      if (filters.sport) params.set('sport', filters.sport);
      if (filters.outcome) params.set('outcome', filters.outcome);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (filters.evMin) params.set('evMin', filters.evMin);
      if (filters.evMax) params.set('evMax', filters.evMax);
      if (filters.didWeBet) params.set('didWeBet', filters.didWeBet);

      const res = await fetch(`/api/admin/signals?${params.toString()}`);
      const data = await res.json();
      const rows = data.signals || [];

      const headers = [
        'Date', 'Sport', 'League', 'Game', 'Market', 'Selection', 'Sportsbook',
        'Model Prob', 'Fair Prob', 'EV%', 'Kelly Frac', 'Stake USD',
        'Did We Bet', 'Bet Reason', 'Market Odds', 'American Odds',
        'Actual Result', 'Final Score', 'Outcome', 'P&L', 'Signal Age (hrs)'
      ];

      const csvRows = [headers.join(',')];
      rows.forEach(s => {
        csvRows.push([
          s.created_at ? new Date(s.created_at).toLocaleString() : '',
          s.sport || '',
          s.league || '',
          s.home_team && s.away_team ? `${s.home_team} vs ${s.away_team}` : (s.game_id || ''),
          s.market_type || '',
          s.selection || '',
          s.sportsbook || '',
          s.model_probability || '',
          s.fair_probability || '',
          s.ev_percent || '',
          s.kelly_fraction || '',
          s.stake_usd || '',
          s.did_we_bet ? 'Yes' : 'No',
          (s.bet_reason || '').replace(/,/g, ';'),
          s.market_odds || '',
          s.american_odds || '',
          s.actual_result || '',
          s.final_score || '',
          s.outcome || '',
          s.profit_loss_usd || '',
          s.signal_age_hours || '',
        ].join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vantage-signals-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    }
    setExportLoading(false);
  };

  return (
    <div>
      {/* Filters Bar */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <FilterGroup label="Sport">
            <select value={filters.sport} onChange={e => handleFilterChange('sport', e.target.value)} style={selectStyle}>
              <option value="">All</option>
              <option value="nhl">NHL</option>
              <option value="nba">NBA</option>
              <option value="soccer">Soccer</option>
              <option value="mlb">MLB</option>
            </select>
          </FilterGroup>

          <FilterGroup label="Outcome">
            <select value={filters.outcome} onChange={e => handleFilterChange('outcome', e.target.value)} style={selectStyle}>
              <option value="">All</option>
              <option value="win">Win</option>
              <option value="loss">Loss</option>
              <option value="push">Push</option>
              <option value="pending">Pending</option>
            </select>
          </FilterGroup>

          <FilterGroup label="Did We Bet">
            <select value={filters.didWeBet} onChange={e => handleFilterChange('didWeBet', e.target.value)} style={selectStyle}>
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </FilterGroup>

          <FilterGroup label="Date From">
            <input type="date" value={filters.dateFrom} onChange={e => handleFilterChange('dateFrom', e.target.value)} style={inputStyle} />
          </FilterGroup>

          <FilterGroup label="Date To">
            <input type="date" value={filters.dateTo} onChange={e => handleFilterChange('dateTo', e.target.value)} style={inputStyle} />
          </FilterGroup>

          <FilterGroup label="EV Min %">
            <input type="number" placeholder="e.g. 5" value={filters.evMin} onChange={e => handleFilterChange('evMin', e.target.value)} style={inputStyle} />
          </FilterGroup>

          <FilterGroup label="EV Max %">
            <input type="number" placeholder="e.g. 20" value={filters.evMax} onChange={e => handleFilterChange('evMax', e.target.value)} style={inputStyle} />
          </FilterGroup>

          <button onClick={() => setFilters({ sport: '', outcome: '', dateFrom: '', dateTo: '', evMin: '', evMax: '', didWeBet: '' })} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: 13, height: 38 }}>
            Clear
          </button>

          <button
            onClick={handleExportCSV}
            disabled={exportLoading}
            style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, height: 38, marginLeft: 'auto' }}
          >
            {exportLoading ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Sport</th>
                <th style={thStyle}>Game</th>
                <th style={thStyle}>Market</th>
                <th style={thStyle}>Selection</th>
                <th style={thStyle}>EV%</th>
                <th style={thStyle}>Model Prob</th>
                <th style={thStyle}>Did We Bet</th>
                <th style={thStyle}>Outcome</th>
                <th style={thStyle}>P&L</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</td>
                </tr>
              ) : signals.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                    No signals found.{Object.values(filters).some(v => v) ? ' Try clearing filters or adjusting your search criteria.' : ' There are no signals in the database matching your criteria.'}
                  </td>
                </tr>
              ) : (
                signals.map((signal) => (
                  <>
                    <SignalRow
                      key={signal.signal_id}
                      signal={signal}
                      isExpanded={expandedRow === signal.signal_id}
                      onToggle={() => setExpandedRow(expandedRow === signal.signal_id ? null : signal.signal_id)}
                    />
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && signals.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              Showing {signals.length} of {pagination.total} signals
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => fetchSignals(pagination.page - 1)}
                disabled={pagination.page <= 1}
                style={{ ...pageBtnStyle, opacity: pagination.page <= 1 ? 0.4 : 1 }}
              >
                ← Prev
              </button>
              <span style={{ fontSize: 13, color: '#6b7280', padding: '6px 12px' }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchSignals(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                style={{ ...pageBtnStyle, opacity: pagination.page >= pagination.totalPages ? 0.4 : 1 }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>{label}</label>
      {children}
    </div>
  );
}

function SignalRow({ signal, isExpanded, onToggle }) {
  const outcomeColor = signal.outcome === 'win' ? '#10b981' : signal.outcome === 'loss' ? '#ef4444' : signal.outcome === 'push' ? '#f59e0b' : '#9ca3af';
  const betColor = signal.did_we_bet ? '#10b981' : '#6b7280';

  return (
    <>
      <tr
        onClick={onToggle}
        style={{ cursor: 'pointer', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6', transition: 'background 0.1s' }}
        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
        onMouseLeave={e => e.currentTarget.style.background = 'white'}
      >
        <td style={tdStyle}>{signal.created_at ? new Date(signal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
        <td style={tdStyle}>
          <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
            {signal.sport?.toUpperCase() || '—'}
          </span>
        </td>
        <td style={tdStyle} title={`${signal.home_team} vs ${signal.away_team}`}>
          {signal.home_team && signal.away_team
            ? `${signal.home_team} vs ${signal.away_team}`
            : signal.game_id || '—'}
        </td>
        <td style={tdStyle}>{signal.market_type || '—'}</td>
        <td style={tdStyle}><span style={{ fontWeight: 500 }}>{signal.selection || '—'}</span></td>
        <td style={{ ...tdStyle, color: parseFloat(signal.ev_percent) >= 7 ? '#10b981' : '#6b7280', fontWeight: 600 }}>
          {signal.ev_percent != null ? `${parseFloat(signal.ev_percent).toFixed(2)}%` : '—'}
        </td>
        <td style={tdStyle}>{signal.model_probability != null ? `${(parseFloat(signal.model_probability) * 100).toFixed(1)}%` : '—'}</td>
        <td style={{ ...tdStyle, color: betColor, fontWeight: 600 }}>
          {signal.did_we_bet ? '✅ Yes' : '❌ No'}
        </td>
        <td style={{ ...tdStyle, color: outcomeColor, fontWeight: 600 }}>
          {signal.outcome ? signal.outcome.toUpperCase() : '⏳ PENDING'}
        </td>
        <td style={{ ...tdStyle, color: parseFloat(signal.profit_loss_usd) >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
          {signal.profit_loss_usd != null ? `$${parseFloat(signal.profit_loss_usd).toFixed(2)}` : '—'}
        </td>
        <td style={tdStyle}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{isExpanded ? '▲' : '▼'}</span>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={11} style={{ background: '#f9fafb', padding: 16, borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <DetailField label="Signal ID" value={signal.signal_id} />
              <DetailField label="League" value={signal.league} />
              <DetailField label="Game Date" value={signal.game_date} />
              <DetailField label="Sportsbook" value={signal.sportsbook} />
              <DetailField label="Fair Probability" value={signal.fair_probability != null ? `${(parseFloat(signal.fair_probability) * 100).toFixed(1)}%` : null} />
              <DetailField label="Kelly Fraction" value={signal.kelly_fraction} />
              <DetailField label="Stake USD" value={signal.stake_usd != null ? `$${signal.stake_usd}` : null} />
              <DetailField label="Min EV Threshold" value={signal.min_ev_threshold != null ? `${signal.min_ev_threshold}%` : null} />
              <DetailField label="Market Odds" value={signal.market_odds} />
              <DetailField label="American Odds" value={signal.american_odds} />
              <DetailField label="Actual Result" value={signal.actual_result} />
              <DetailField label="Final Score" value={signal.final_score} />
              <DetailField label="Signal Age (hrs)" value={signal.signal_age_hours != null ? signal.signal_age_hours.toFixed(1) : null} />
              <DetailField label="Bet Reason" value={signal.bet_reason} wide />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DetailField({ label, value, wide }) {
  return (
    <div style={{ ...(wide ? { gridColumn: '1 / -1' } : {}) }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#111827', wordBreak: 'break-all' }}>{value ?? '—'}</div>
    </div>
  );
}

const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' };
const tdStyle = { padding: '12px 16px', color: '#374151', whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' };
const selectStyle = { padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, height: 38, minWidth: 100, background: 'white' };
const inputStyle = { padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, height: 38, minWidth: 120 };
const pageBtnStyle = { padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: 13 };
