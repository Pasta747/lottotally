export function ProductPreview() {
  const monitors = [
    { site: "acme-law.com", uptime: "99.98%", status: "Operational" },
    { site: "northstarclinic.com", uptime: "99.93%", status: "Investigating" },
    { site: "fablecoffee.co", uptime: "100%", status: "Operational" },
  ];

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-xl shadow-zinc-200/70">
      <div className="rounded-xl border bg-zinc-50 p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Pinger Dashboard</p>
            <p className="text-sm font-semibold">Studio North — 18 Monitors</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
            17 Operational
          </span>
        </div>

        <div className="space-y-2">
          {monitors.map((m) => (
            <div key={m.site} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border">
              <div>
                <p className="text-sm font-medium">{m.site}</p>
                <p className="text-xs text-zinc-500">Uptime: {m.uptime}</p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  m.status === "Operational"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {m.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border p-3">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Client Status Page Preview</p>
        <div className="mt-2 rounded-lg bg-zinc-900 p-3 text-zinc-100">
          <div className="flex items-center justify-between text-sm">
            <span>northstarclinic.status</span>
            <span className="rounded-full bg-amber-500/20 px-2 py-1 text-amber-300">Investigating</span>
          </div>
          <p className="mt-2 text-xs text-zinc-300">
            Elevated 5xx errors started 4:12 PM PT — updates every 5 minutes.
          </p>
          <div className="mt-3 grid grid-cols-6 gap-1">
            {["bg-emerald-400", "bg-emerald-400", "bg-emerald-400", "bg-amber-300", "bg-amber-300", "bg-emerald-400"].map(
              (c, i) => (
                <div key={i} className={`h-2 rounded ${c}`} />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
