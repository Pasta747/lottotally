export default function CanopyTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🌿</span>
        <div>
          <h1 className="text-xl font-bold text-white">CanopyFilter</h1>
          <p className="text-sm text-slate-500">canopyfilter.com · AI YouTube comment moderation</p>
        </div>
        <span className="ml-auto pill bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-sm">
          🟡 Operational
        </span>
      </div>

      {/* Pricing + Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">Pricing</h3>
          <div className="space-y-2">
            {[
              { tier: "Creator", price: "Free" },
              { tier: "Pro", price: "TBD" },
              { tier: "Studio", price: "TBD" },
            ].map((t) => (
              <div key={t.tier} className="flex justify-between items-center text-sm">
                <span className="text-slate-300">{t.tier}</span>
                <span className="font-semibold text-white">{t.price}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">Beta Pipeline</h3>
          <div className="space-y-2">
            {[
              { stage: "Identified", n: 17 },
              { stage: "Reached out", n: 13 },
              { stage: "Interested", n: 0 },
              { stage: "Active beta", n: 0 },
              { stage: "Paying", n: 0 },
            ].map((s) => (
              <div key={s.stage} className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{s.stage}</span>
                <span className={`font-bold text-sm ${s.n === 0 ? "text-red-400" : "text-blue-400"}`}>{s.n}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-yellow-400 mt-3">⚠️ Wave 1 follow-ups 7-8 days overdue</p>
        </div>

        <div className="card">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">Key Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Revenue</span>
              <span className="font-bold text-red-400">$0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Wave 1 DMs</span>
              <span className="font-bold text-yellow-400">2/5 sent</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Digest delivery</span>
              <span className="font-bold text-green-400">✅ Live</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">X account</span>
              <span className="font-bold text-yellow-400">⚠️ Unclear</span>
            </div>
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
                { comp: "Domain", status: "✅ Live", note: "canopyfilter.com 200" },
                { comp: "YouTube OAuth", status: "✅ Live", note: "/api/youtube/connect" },
                { comp: "Comment classifier", status: "✅ Live", note: "Free NVIDIA API" },
                { comp: "Stripe checkout", status: "✅ Live", note: "3 tiers deployed" },
                { comp: "Digest delivery", status: "✅ Live", note: "/api/digest/run returns 200" },
                { comp: "Ops preflight", status: "✅ Live", note: "/api/ops/preflight OK" },
                { comp: "Instagram token", status: "⚠️ Partial", note: "Short-lived token only" },
                { comp: "FB App Secret", status: "🔴 Missing", note: "Mario needs to provide" },
                { comp: "X account @canopyfiltr", status: "⚠️ Unclear", note: "Who owns this?" },
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

      {/* DM Waves */}
      <div className="card">
        <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-4">@mention Campaign Waves</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            { wave: "Wave 1", creator: "Morbid Podcast", status: "✅ Sent", note: "Tweet 2034742549827789303" },
            { wave: "Wave 2", creator: "Violet (YouTube)", status: "✅ Sent", note: "Tweet sent" },
            { wave: "Wave 3", creator: "ATWWD", status: "📅 Scheduled", note: "Thu 11:15 AM" },
            { wave: "Wave 4", creator: "Pop (YouTube)", status: "📅 Scheduled", note: "Thu 4:15 PM" },
            { wave: "Wave 5", creator: "The Deck", status: "📅 Scheduled", note: "Fri 11:15 AM" },
          ].map((w) => (
            <div key={w.wave} className="rounded-lg border border-[#1e1e2e] p-3 bg-[#0a0a0f]">
              <p className="text-xs font-medium text-white">{w.wave}</p>
              <p className="text-xs text-slate-400 mt-1">{w.creator}</p>
              <p className={`text-xs font-medium mt-2 ${w.status.startsWith("✅") ? "text-green-400" : "text-yellow-400"}`}>{w.status}</p>
              <p className="text-xs text-slate-600 mt-0.5">{w.note}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">💡 403 workaround confirmed: unique copy per creator works.</p>
      </div>

      {/* Blockers */}
      <div className="card border-red-900/30 bg-red-950/10">
        <h3 className="text-sm font-semibold text-red-400 mb-3">🔴 Blockers</h3>
        <div className="space-y-2">
          {[
            { task: "@canopyfilter X account ownership", impact: "Wave 1 follow-ups can't be sent" },
            { task: "Wave 1 follow-ups overdue 7-8 days", impact: "Momentum lost with 4 creators" },
            { task: "FB App Secret missing", impact: "IG long-lived token blocked" },
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
