import Image from "next/image";
import { getDemoFallbackMonitors } from "@/lib/demo-fixtures";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

function fmt(date?: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString();
}

export default async function PublicStatusPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const page = await prisma.statusPage.findUnique({
    where: { slug },
    include: {
      agency: {
        include: {
          projects: {
            include: {
              monitors: {
                include: {
                  checkResults: { orderBy: { checkedAt: "desc" }, take: 120 },
                  incidents: { orderBy: { startedAt: "desc" }, take: 5 },
                },
              },
            },
          },
        },
      },
    },
  });

  const isDemoFallback = slug === "smith-digital" && (!page || !page.isPublic);
  if (!page?.isPublic && !isDemoFallback) return notFound();

  const monitors = isDemoFallback
    ? getDemoFallbackMonitors().map((m) => ({
        ...m,
        checkResults: m.history24h
          .slice()
          .reverse()
          .map((p) => ({ ok: p.up, latencyMs: p.ms ?? null, checkedAt: new Date(p.t) })),
      }))
    : page!.agency.projects.flatMap((p) => p.monitors);

  const color = isDemoFallback ? "#0f766e" : page!.brandColor ?? "#16a34a";
  const overallDown = monitors.some((m) => m.status === "DOWN" || m.status === "DEGRADED");

  const pageName = isDemoFallback ? "Smith Digital — System Status" : page!.name;
  const agencyName = isDemoFallback ? "Smith Digital" : page!.agency.name;
  const logoUrl = isDemoFallback ? null : page!.logoUrl;

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white px-4 py-6 text-zinc-900 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 bg-zinc-950/95 px-6 py-6 text-white sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/65">Live Status</p>
                <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{pageName}</h1>
                <p className="mt-1 text-sm text-white/70">Real-time service health and incident updates</p>
              </div>

              <div className="flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-3 py-2 backdrop-blur">
                {logoUrl ? <Image src={logoUrl} alt="Agency logo" width={30} height={30} className="h-8 w-8 rounded" /> : null}
                <span className="text-sm font-medium">{agencyName}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-5 sm:grid-cols-3 sm:px-8">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Overall</p>
              <p className="mt-1 text-base font-semibold" style={{ color: overallDown ? "#dc2626" : color }}>
                {overallDown ? "Partial Service Disruption" : "All Systems Operational"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Monitors</p>
              <p className="mt-1 text-base font-semibold">{monitors.length} Active</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Updated</p>
              <p className="mt-1 text-base font-semibold">{fmt(new Date())}</p>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold">Current system status</h2>
          <div className="mt-4 space-y-3">
            {monitors.length === 0 && <p className="text-sm text-zinc-500">No monitors published yet.</p>}
            {monitors.map((m) => {
              const total = m.checkResults.length;
              const up = m.checkResults.filter((r) => r.ok).length;
              const uptime = total > 0 ? Math.round((up / total) * 10000) / 100 : 100;
              const last = m.checkResults[0];
              const statusColor = m.status === "UP" ? color : m.status === "DEGRADED" ? "#d97706" : "#dc2626";

              return (
                <article key={m.id} className="rounded-xl border border-zinc-200 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-xs text-zinc-500">{m.url}</p>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: statusColor }}>
                      {m.status === "UP" ? "Operational" : m.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <p>
                      Uptime: <strong>{uptime}%</strong>
                    </p>
                    <p>
                      Response: <strong>{last?.latencyMs ? `${last.latencyMs}ms` : "—"}</strong>
                    </p>
                    <p className="sm:col-span-2 text-zinc-500">Last checked: {fmt(m.lastCheckedAt)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold">Recent incidents</h2>
          <div className="mt-3 space-y-2 text-sm">
            {monitors
              .flatMap((m) => m.incidents.map((i) => ({ ...i, monitorName: m.name })))
              .slice(0, 5)
              .map((i) => {
                const dur = i.resolvedAt
                  ? `${Math.max(1, Math.round((new Date(i.resolvedAt).getTime() - new Date(i.startedAt).getTime()) / 60000))} min`
                  : "ongoing";

                return (
                  <p key={i.id} className="rounded-md border border-zinc-200 p-3">
                    {new Date(i.startedAt).toLocaleDateString()} — <strong>{i.monitorName}</strong>: {i.title} ({dur})
                  </p>
                );
              })}
            {monitors.every((m) => m.incidents.length === 0) && <p className="text-zinc-500">No incidents in history yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
