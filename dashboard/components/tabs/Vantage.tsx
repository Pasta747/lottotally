export default function VantageTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">⚡</span>
        <div>
          <h1 className="text-xl font-bold text-white">Vantage</h1>
          <p className="text-sm text-slate-500">app.yourvantage.ai · AI prediction market agent</p>
        </div>
        <span className="ml-auto pill bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-sm">
          🟡 In progress
        </span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Signals Logged", value: "10,708+", sub: "V-ADM-SIGNALS done" },
          { label: "Admin Dashboard", value: "✅ LIVE", sub: "Phase 1" },
          { label: "Scanner Cron", value: "Every 15 min", sub: "Paper mode" },
          { label: "Phase 1 Sprint", value: "~82%", sub: "23/28 tasks" },
        ].map((m) => (
          <div key={m.label} className="card">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{m.label}</p>
            <p className="text-lg font-bold text-white">{m.value}</p>
            <p className="text-xs text-slate-500 mt-1">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Engine layers + scanner status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-4">Prediction Engine</h3>
          <div className="space-y-3">
            {[
              { layer: "L1: Sports EV+", status: "🔴 TODO", note: "Map odds → Kalshi tickers" },
              { layer: "L2: Kalshi Native", status: "🔴 TODO", note: "Category-specific models" },
              { layer: "L3: News-driven", status: "🟡 In progress", note: "FRED/NOAA/CoinGecko wired" },
              { layer: "ATLAS weights", status: "✅ Done", note: "Tennis 0→0.9, CBB 1→0.9" },
              { layer: "Signal attribution", status: "✅ Done", note: "Win/loss feedback loop" },
              { layer: "Settlement tracker", status: "✅ Done", note: "Plutus connected Mar 21" },
            ].map((l) => (
              <div key={l.layer} className="flex items-start justify-between border-b border-[#1e1e2e] pb-2">
                <div>
                  <p className="text-sm text-slate-300">{l.layer}</p>
                  <p className="text-xs text-slate-500">{l.note}</p>
                </div>
                <span className={`text-xs font-medium ml-3 whitespace-nowrap ${
                  l.status.startsWith("✅") ? "text-green-400" : l.status.startsWith("🔴") ? "text-red-400" : "text-yellow-400"
                }`}>{l.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-4">Active Scanners</h3>
          <div className="space-y-3">
            {[
              { scanner: "BTC RSI Scanner", freq: "Every 15 min", mode: "Paper", status: "✅ Running" },
              { scanner: "OddsTool EV+", freq: "Every 30 min", mode: "Paper", status: "✅ Running" },
              { scanner: "Equity Scanner", freq: "Every 5 min (mkt)", mode: "Paper $1M", status: "✅ Running" },
              { scanner: "Vantage Kalshi", freq: "Every 15 min", mode: "Paper", status: "✅ Running" },
            ].map((s) => (
              <div key={s.scanner} className="flex items-start justify-between border-b border-[#1e1e2e] pb-2">
                <div>
                  <p className="text-sm text-slate-300">{s.scanner}</p>
                  <p className="text-xs text-slate-500">{s.freq} · {s.mode}</p>
                </div>
                <span className="pill bg-green-500/10 text-green-400 border border-green-500/20 text-xs">{s.status}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[#1e1e2e]">
            <p className="text-xs text-slate-500">Founder mode: $1 max/order, 100 orders/day, $100/day cap. Mario's live Kalshi account.</p>
          </div>
        </div>
      </div>

      {/* Infrastructure */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Infrastructure</h2>
        <div className="card overflow-hidden p-0">
          <table className="dash-table">
            <thead>
              <tr>
                <th className="pl-5">Component</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {[
                { comp: "App", status: "✅ Live", note: "app.yourvantage.ai 200" },
                { comp: "Google OAuth", status: "✅ Live", note: "Sign-in working" },
                { comp: "Kalshi API key storage", status: "✅ Live", note: "Encrypted AES-256-GCM" },
                { comp: "Admin dashboard", status: "✅ LIVE", note: "10,708+ signals" },
                { comp: "Settlement tracker", status: "✅ Done", note: "POSTGRES_URL wired" },
                { comp: "Signal attribution", status: "✅ Done", note: "Win/loss → ATLAS weights" },
                { comp: "Enrichment backfill", status: "🟡 In progress", note: "Einstein working" },
                { comp: "Stripe billing", status: "🔴 TODO", note: "$29/mo paper / $99/mo live" },
                { comp: "Polymarket.us", status: "🔴 TODO", note: "Phase 3 (May)" },
              ].map((item) => (
                <tr key={item.comp}>
                  <td className="pl-5 py-2.5 text-sm text-white">{item.comp}</td>
                  <td className="py-2.5 text-sm">
                    <span className={item.status.startsWith("✅") ? "text-green-400" : item.status.startsWith("🔴") ? "text-red-400" : "text-yellow-400"}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-xs text-slate-500">{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Phase roadmap */}
      <div className="card">
        <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-4">Roadmap</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { phase: "Phase 1", period: "Now → Apr 7", goal: "Close the loop", items: ["Settlement tracker ✅", "Signal attribution ✅", "Admin dashboard ✅", "L1/L2 models 🔴", "Beta users 🔴", "Stripe billing 🔴"] },
            { phase: "Phase 2", period: "Apr 7 → May 1", goal: "Signal intelligence", items: ["Sports/Econ/Crypto/Weather models", "ATLAS v2", "Signal quality scoring"] },
            { phase: "Phase 3", period: "May 1 → Jun 1", goal: "Venue expansion", items: ["Polymarket.us API", "Cross-venue arbitrage"] },
            { phase: "Phase 4", period: "Jun 1+", goal: "Monetization + scale", items: ["Pricing tiers", "Leaderboard", "WhatsApp alerts", "Public API"] },
          ].map((p) => (
            <div key={p.phase} className="rounded-lg border border-[#1e1e2e] p-4 bg-[#0a0a0f]">
              <div className="mb-2">
                <p className="text-xs font-semibold text-indigo-400">{p.phase}</p>
                <p className="text-xs text-slate-500">{p.period}</p>
              </div>
              <p className="text-sm font-medium text-white mb-3">{p.goal}</p>
              <div className="space-y-1">
                {p.items.map((item) => (
                  <p key={item} className={`text-xs ${item.startsWith("✅") ? "text-green-400" : item.startsWith("🔴") ? "text-red-400" : "text-slate-400"}`}>
                    • {item}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blockers */}
      <div className="card border-red-900/30 bg-red-950/10">
        <h3 className="text-sm font-semibold text-red-400 mb-3">🔴 Blockers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { task: "Enrichment backfill incomplete", impact: "Signal history gap" },
            { task: "Vercel deploy token (VERCEL_TOKEN)", impact: "Can't deploy" },
            { task: "L1 sports → Kalshi mapping", impact: "No live sports EV+ execution" },
            { task: "L2 Kalshi Native models", impact: "No category probability estimates" },
          ].map((b) => (
            <div key={b.task} className="border-b border-red-900/20 pb-2">
              <p className="text-xs font-medium text-slate-200">{b.task}</p>
              <p className="text-xs text-slate-500">Impact: {b.impact}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
