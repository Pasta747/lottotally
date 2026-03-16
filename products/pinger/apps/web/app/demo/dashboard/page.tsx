import { prisma } from "@/lib/prisma";

type HistoryPoint = { t: string; ms?: number | null; up: boolean };

function MiniChart({ points }: { points: HistoryPoint[] }) {
  if (!points.length) return <p className="text-xs text-zinc-400">No data yet</p>;

  const recent = points.slice(-40);
  const max = Math.max(...recent.map((p) => p.ms || 0), 100);

  return (
    <div className="mt-2 flex h-14 items-end gap-[2px]">
      {recent.map((p, i) => {
        const h = p.ms ? Math.max(3, Math.round((p.ms / max) * 56)) : 3;
        return (
          <div
            key={`${p.t}-${i}`}
            className={p.up ? "bg-emerald-400/80" : "bg-red-400/90"}
            style={{ height: `${h}px`, width: "5px" }}
            title={`${new Date(p.t).toLocaleString()} • ${p.ms ?? "—"}ms • ${p.up ? "up" : "down"}`}
          />
        );
      })}
    </div>
  );
}

export default async function DemoDashboardPage() {
  const agency = await prisma.agency.findUnique({
    where: { slug: "smith-digital" },
    include: {
      projects: {
        include: {
          monitors: {
            include: {
              checkResults: {
                where: { checkedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
                orderBy: { checkedAt: "desc" },
                take: 9000,
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      statusPages: { take: 1 },
    },
  });

  const monitors = agency?.projects[0]?.monitors ?? [];
  const statusPageUrl = agency?.statusPages[0] ? `/status/${agency.statusPages[0].slug}` : null;

  const monitorDtos = monitors.map((monitor) => {
    const rows = monitor.checkResults;
    const up = rows.filter((r) => r.ok).length;
    const uptime24h = rows.length ? Math.round((up / rows.length) * 10000) / 100 : 100;

    return {
      id: monitor.id,
      name: monitor.name,
      url: monitor.url,
      status: monitor.status,
      lastLatencyMs: monitor.lastLatencyMs,
      lastCheckedAt: monitor.lastCheckedAt,
      uptime24h,
      history24h: rows
        .slice()
        .reverse()
        .map((r) => ({ t: r.checkedAt.toISOString(), ms: r.latencyMs, up: r.ok })),
    };
  });

  const upCount = monitorDtos.filter((m) => m.status === "UP").length;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-7xl p-6">
        <div className="space-y-6">
          <header className="rounded-xl border bg-white p-6">
            <h1 className="text-2xl font-semibold">Pinger Dashboard</h1>
            <p className="mt-1 text-zinc-600">Smith Digital demo workspace (screenshot mode)</p>
            {statusPageUrl && (
              <a className="mt-3 inline-block text-sm font-medium underline" href={statusPageUrl}>
                Open public status page
              </a>
            )}
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-zinc-500">Total Monitors</p>
              <p className="mt-2 text-3xl font-semibold">{monitorDtos.length}</p>
            </div>
            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-zinc-500">Operational</p>
              <p className="mt-2 text-3xl font-semibold">{upCount}</p>
            </div>
            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-zinc-500">Down / Degraded</p>
              <p className="mt-2 text-3xl font-semibold">{monitorDtos.length - upCount}</p>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-6">
            <h2 className="text-lg font-semibold">Monitors</h2>
            <div className="mt-4 space-y-3">
              {monitorDtos.map((m) => (
                <div key={m.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="w-full">
                      <p className="font-medium">{m.name}</p>
                      <p className="text-sm text-zinc-500">{m.url}</p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {m.lastLatencyMs ? `${m.lastLatencyMs}ms` : "—"} · Last checked {m.lastCheckedAt ? new Date(m.lastCheckedAt).toLocaleString() : "Not checked yet"}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        <span>
                          24h uptime: <strong>{m.uptime24h}%</strong>
                        </span>
                      </div>

                      <MiniChart points={m.history24h} />
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          m.status === "UP"
                            ? "bg-emerald-100 text-emerald-700"
                            : m.status === "DEGRADED"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {m.status === "UP" ? "🟢 Up" : m.status === "DOWN" ? "🔴 Down" : "🟠 Degraded"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
