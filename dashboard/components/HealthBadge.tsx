'use client';

import { useEffect, useState } from 'react';

interface HealthResponse {
  overall: 'green' | 'yellow' | 'red';
  badge: '🟢' | '🟡' | '🔴';
  has_p0: boolean;
  sections: {
    name: string;
    last_updated: string;
    status: 'green' | 'yellow' | 'red';
  }[];
  timestamp: string;
}

export default function HealthBadge({ refreshInterval = 60000 }: { refreshInterval?: number }) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string>('');

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch('/api/data/health');
        const data = await res.json();
        setHealth(data);
        setLastRefresh(new Date().toLocaleTimeString());
      } catch {
        setHealth({
          overall: 'red',
          badge: '🔴',
          has_p0: true,
          sections: [],
          timestamp: new Date().toISOString(),
        });
      }
    }
    fetchHealth();
    const interval = setInterval(fetchHealth, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (!health) return <span className="health-badge health-loading">Loading...</span>;

  return (
    <div className="health-badge-container">
      <div className={`health-badge ${health.overall}`}>
        <span className="health-badge-icon">{health.badge}</span>
        <span className="health-badge-label">
          {health.overall === 'green' ? 'All Systems Operational' :
           health.overall === 'yellow' ? 'Degraded' : 'Critical'}
        </span>
        {health.has_p0 && <span className="health-p0-tag">P0 ACTIVE</span>}
      </div>
      <div className="health-sections">
        {health.sections.map(s => (
          <div key={s.name} className={`health-section-item ${s.status}`}>
            <span className="health-section-dot">
              {s.status === 'green' ? '🟢' : s.status === 'yellow' ? '🟡' : '🔴'}
            </span>
            <span className="health-section-name">{s.name}</span>
            <span className="health-section-time">
              {s.last_updated ? new Date(s.last_updated).toLocaleTimeString() : 'never'}
            </span>
          </div>
        ))}
      </div>
      <div className="health-refresh">Last refresh: {lastRefresh}</div>
    </div>
  );
}
