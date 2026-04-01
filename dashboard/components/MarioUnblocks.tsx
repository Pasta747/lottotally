'use client';

import { useEffect, useState, useCallback } from 'react';

interface SprintItem {
  id: string;
  task: string;
  owner: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  age_hours: number;
  escalation: string;
  last_updated: string;
  priority?: string;
  product?: string;
}

interface SprintResponse {
  items: SprintItem[];
  last_updated: string;
}

function SortIcon() {
  return <span className="sort-icon">⇅</span>;
}

export default function MarioUnblocks({ refreshInterval = 30000 }: { refreshInterval?: number }) {
  const [items, setItems] = useState<SprintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchSprint = useCallback(async () => {
    try {
      const res = await fetch('/api/data/sprint');
      const json: SprintResponse = await res.json();
      setItems(json.items || []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSprint();
    const iv = setInterval(fetchSprint, refreshInterval);
    return () => clearInterval(iv);
  }, [fetchSprint, refreshInterval]);

  const handleResolve = async (itemId: string) => {
    setResolving(itemId);
    try {
      await fetch('/api/data/sprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, status: 'done', escalation: '' }),
      });
      await fetchSprint();
    } finally {
      setResolving(null);
    }
  };

  if (loading) return <div className="unblocks-loading">Loading sprint...</div>;

  // Sort: P0/escalated first, then by age descending, then by status
  const sorted = [...items]
    .filter(i => i.status !== 'done')
    .sort((a, b) => {
      // P0/🔴 first
      if (a.escalation === '🔴' && b.escalation !== '🔴') return -1;
      if (b.escalation === '🔴' && a.escalation !== '🔴') return 1;
      // ⚠️ next
      if (a.escalation === '⚠️' && b.escalation !== '⚠️') return -1;
      if (b.escalation === '⚠️' && a.escalation !== '⚠️') return 1;
      // Then by age descending
      return b.age_hours - a.age_hours;
    });

  const canResolve = (item: SprintItem) =>
    item.status === 'done' ? false : true;

  return (
    <div className="mario-unblocks">
      <div className="unblocks-header">
        <span className="unblocks-title">Needs Mario</span>
        <span className="unblocks-count">{sorted.length} item{sorted.length !== 1 ? 's' : ''}</span>
      </div>

      {sorted.length === 0 && (
        <div className="unblocks-empty">No items need Mario. 🎉</div>
      )}

      <div className="unblocks-list">
        {sorted.map(item => (
          <div key={item.id} className={`unblock-card ${item.escalation || 'none'}`}>
            <div className="unblock-card-header">
              <span className="unblock-id">{item.id}</span>
              {item.escalation && (
                <span className="unblock-escalation">{item.escalation}</span>
              )}
              {item.product && (
                <span className="unblock-product">{item.product}</span>
              )}
              <span className={`unblock-status unblock-status-${item.status}`}>
                {item.status}
              </span>
            </div>
            <div className="unblock-task">{item.task}</div>
            <div className="unblock-meta">
              <span className="unblock-owner">{item.owner}</span>
              <span className="unblock-age">
                {item.age_hours < 1 ? `${Math.round(item.age_hours * 60)}m old` :
                 `${item.age_hours.toFixed(1)}h old`}
              </span>
            </div>
            {canResolve(item) && (
              <button
                className="unblock-resolve-btn"
                onClick={() => handleResolve(item.id)}
                disabled={resolving === item.id}
              >
                {resolving === item.id ? 'Resolving...' : '✓ Resolve'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
