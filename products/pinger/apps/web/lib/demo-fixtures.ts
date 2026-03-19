export type DemoMonitor = {
  id: string;
  name: string;
  url: string;
  status: "UP" | "DOWN" | "DEGRADED";
  uptime24h: number;
  lastLatencyMs: number | null;
  lastCheckedAt: Date;
  history24h: { t: string; ms?: number | null; up: boolean }[];
  incidents: { id: string; title: string; startedAt: Date; resolvedAt: Date | null }[];
};

function buildHistory({
  points = 40,
  avg = 180,
  jitter = 40,
  failures = 0,
}: {
  points?: number;
  avg?: number;
  jitter?: number;
  failures?: number;
}) {
  const now = Date.now();
  const out: { t: string; ms?: number | null; up: boolean }[] = [];
  const failIndexes = new Set<number>();
  for (let i = 0; i < failures; i++) failIndexes.add(points - 1 - i * 3);

  for (let i = 0; i < points; i++) {
    const t = new Date(now - (points - i) * 6 * 60 * 1000).toISOString();
    const down = failIndexes.has(i);
    out.push({
      t,
      up: !down,
      ms: down ? null : Math.max(55, Math.round(avg + Math.sin(i / 3) * 12 + (Math.random() * jitter - jitter / 2))),
    });
  }
  return out;
}

export function getDemoFallbackMonitors(): DemoMonitor[] {
  const now = new Date();

  return [
    {
      id: "demo-main-site",
      name: "Smith Digital Main Site",
      url: "https://smithdigital.com",
      status: "UP",
      uptime24h: 99.98,
      lastLatencyMs: 171,
      lastCheckedAt: now,
      history24h: buildHistory({ avg: 170, jitter: 36, failures: 1 }),
      incidents: [],
    },
    {
      id: "demo-app",
      name: "Smith Digital App",
      url: "https://app.smithdigital.com",
      status: "UP",
      uptime24h: 99.95,
      lastLatencyMs: 223,
      lastCheckedAt: now,
      history24h: buildHistory({ avg: 220, jitter: 45, failures: 2 }),
      incidents: [],
    },
    {
      id: "demo-blog",
      name: "Smith Digital Blog",
      url: "https://blog.smithdigital.com",
      status: "UP",
      uptime24h: 100,
      lastLatencyMs: 95,
      lastCheckedAt: now,
      history24h: buildHistory({ avg: 95, jitter: 18, failures: 0 }),
      incidents: [],
    },
    {
      id: "demo-storefront",
      name: "Client Storefront",
      url: "https://store.clientsite.com",
      status: "DOWN",
      uptime24h: 98.7,
      lastLatencyMs: null,
      lastCheckedAt: now,
      history24h: buildHistory({ avg: 250, jitter: 55, failures: 10 }),
      incidents: [
        {
          id: "demo-incident-storefront",
          title: "Storefront is unreachable — 2 alerts sent (Email + Slack)",
          startedAt: new Date(Date.now() - 12 * 60 * 1000),
          resolvedAt: null,
        },
      ],
    },
  ];
}
