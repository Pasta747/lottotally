import { agents, products, sprintTasks } from "@/lib/data";

export default function Overview() {
  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Revenue" value="$0" sub="Day 28 · Target $1M ARR" />
        <KpiCard label="Products" value="4" sub="Pinger · Canopy · LottoTally · Vantage" />
        <KpiCard label="Sprint" value="82%" sub="23/28 tasks complete" />
        <KpiCard label="Blockers" value="5" sub="3 critical (Mario unblocks)" />
      </div>

      {/* Product health */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Product Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p) => (
            <div key={p.name} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{p.health}</span>
                    <h3 className="font-semibold text-white">{p.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500">{p.domain}</p>
                </div>
                <span className={`pill ${p.status === "live" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"}`}>
                  {p.status === "live" ? "● Live" : "⚠ Warning"}
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-3">{p.notes}</p>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Sprint</span>
                  <span>{p.sprintStatus}</span>
                </div>
                <div className="sprint-bar">
                  <div className="sprint-fill" style={{ width: `${p.sprintPct}%` }} />
                </div>
              </div>
              {p.keyBlockers.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-red-400">Blockers:</p>
                  {p.keyBlockers.map((b) => (
                    <p key={b} className="text-xs text-slate-500 pl-2">• {b}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Two column: Agent roster + Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agent roster */}
        <section>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Agent Roster</h2>
          <div className="card p-0 overflow-hidden">
            <table className="dash-table">
              <thead>
                <tr>
                  <th className="pl-5">Agent</th>
                  <th>Role</th>
                  <th>Focus</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.name} className="border-t border-[#1e1e2e]">
                    <td className="pl-5 py-3">
                      <div className="flex items-center gap-2">
                        <span>{a.emoji}</span>
                        <span className="font-medium text-white text-sm">{a.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-slate-400">{a.role}</td>
                    <td className="py-3 text-xs text-slate-500 max-w-[160px] truncate">{a.currentFocus}</td>
                    <td className="py-3">
                      <span className={`pill ${
                        a.status === "operational" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                        a.status === "idle" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        a.status === "blocked" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                        "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {a.status === "operational" ? "🟢" : a.status === "idle" ? "🟡" : a.status === "blocked" ? "🟡" : "🔴"} {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pipeline snapshot + blockers */}
        <section>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Pipeline Snapshot</h2>
          <div className="space-y-4">
            {/* Pinger pipeline */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <span>📡</span>
                <h3 className="font-medium text-white text-sm">Pinger</h3>
                <span className="ml-auto text-xs text-slate-500">pingerhq.com</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <PillP n="46" label="Leads" color="blue" />
                <span className="text-slate-600">→</span>
                <PillP n="0" label="Replies" color="red" />
                <span className="text-slate-600">→</span>
                <PillP n="0" label="Demos" color="red" />
                <span className="text-slate-600">→</span>
                <PillP n="$0" label="Revenue" color="red" />
              </div>
              <p className="text-xs text-yellow-400 mt-2">⚠️ 0% reply rate after 1 week — campaign redesign needed</p>
            </div>

            {/* Canopy pipeline */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <span>🌿</span>
                <h3 className="font-medium text-white text-sm">Canopy</h3>
                <span className="ml-auto text-xs text-slate-500">canopyfilter.com</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <PillP n="17" label="Identified" color="blue" />
                <span className="text-slate-600">→</span>
                <PillP n="13" label="Reached" color="yellow" />
                <span className="text-slate-600">→</span>
                <PillP n="0" label="Beta" color="red" />
              </div>
              <p className="text-xs text-yellow-400 mt-2">⚠️ Wave 1 follow-ups 7-8 days overdue</p>
            </div>

            {/* LottoTally */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <span>🎰</span>
                <h3 className="font-medium text-white text-sm">LottoTally</h3>
                <span className="ml-auto text-xs text-slate-500">lottotally.com</span>
              </div>
              <p className="text-xs text-slate-400">Stripe LIVE ($49/79/99/mo). No leads yet. Blocked on Google Ads + FB page.</p>
            </div>

            {/* Vantage */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <span>⚡</span>
                <h3 className="font-medium text-white text-sm">Vantage</h3>
                <span className="ml-auto text-xs text-slate-500">app.yourvantage.ai</span>
              </div>
              <p className="text-xs text-slate-400">Founder beta (Mario). Admin dashboard LIVE. 991 signals logged. Phase 1 ~82% complete.</p>
            </div>

            {/* Critical blockers */}
            <div className="card border-red-900/30 bg-red-950/10">
              <h3 className="text-sm font-semibold text-red-400 mb-3">🔴 Mario Critical Unblocks</h3>
              <div className="space-y-2">
                {sprintTasks.blockers.map((b) => (
                  <div key={b.task} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-300">{b.task}</p>
                      <p className="text-xs text-slate-600">Owner: {b.owner}</p>
                    </div>
                    <span className={`pill text-xs ${
                      b.priority === "🔴" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                    }`}>{b.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  );
}

function PillP({ n, label, color }: { n: string; label: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
  };
  return (
    <div className={`pill border ${colors[color]}`}>
      <span className="font-bold">{n}</span>
      <span>{label}</span>
    </div>
  );
}
