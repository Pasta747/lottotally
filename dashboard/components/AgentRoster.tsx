'use client';

import { useEffect, useState } from 'react';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'operational' | 'blocked' | 'idle' | 'p0';
  last_updated: string;
  current_task: string;
  blocker: string | null;
}

interface AgentsResponse {
  agents: Agent[];
  last_updated: string;
  health: string;
}

function getAgentBadge(agent: Agent): string {
  if (agent.status === 'p0') return '🔴';
  if (agent.status === 'blocked') return '🟡';
  if (agent.status === 'idle') return '🟡';
  return '🟢';
}

function timeAgo(iso: string): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AgentRoster({ refreshInterval = 60000 }: { refreshInterval?: number }) {
  const [data, setData] = useState<AgentsResponse | null>(null);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch('/api/data/agents');
        const json = await res.json();
        setData(json);
      } catch {
        // fallback — show stale
      }
    }
    fetchAgents();
    const interval = setInterval(fetchAgents, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (!data) return <div className="agent-roster-loading">Loading roster...</div>;

  return (
    <div className="agent-roster">
      <div className="agent-roster-header">
        <span className="roster-title">Agents</span>
        <span className={`roster-health ${data.health}`}>{data.health === 'green' ? '🟢' : data.health === 'yellow' ? '🟡' : '🔴'}</span>
      </div>
      <div className="agent-list">
        {data.agents.map(agent => (
          <div key={agent.id} className={`agent-row ${agent.status}`}>
            <div className="agent-top">
              <span className="agent-badge">{getAgentBadge(agent)}</span>
              <span className="agent-name">{agent.name}</span>
              <span className="agent-role">{agent.role}</span>
            </div>
            <div className="agent-task">{agent.current_task || '—'}</div>
            {agent.blocker && (
              <div className="agent-blocker">⚠️ {agent.blocker}</div>
            )}
            <div className="agent-time">{timeAgo(agent.last_updated)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
