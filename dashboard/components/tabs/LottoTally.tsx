export default function LottoTallyTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🎰</span>
        <div>
          <h1 className="text-xl font-bold text-white">LottoTally</h1>
          <p className="text-sm text-slate-500">lottotally.com · Lottery reconciliation for convenience stores</p>
        </div>
        <span className="ml-auto pill bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-sm">
          🟡 Ready to launch
        </span>
      </div>

      {/* Pricing + Metrics + TAM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">Pricing (LIVE)</h3>
          <div className="space-y-2">
            {[
              { tier: "Starter", price: "$49/mo" },
              { tier: "Pro", price: "$79/mo" },
              { tier: "Multi", price: "$99/mo + $29/store" },
            ].map((t) => (
              <div key={t.tier} className="flex justify-between items-center text-sm">
                <span className="text-slate-300">{t.tier}</span>
                <span className="font-semibold text-green-400">{t.price}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[#1e1e2e]">
            <p className="text-xs text-green-400">✅ Stripe LIVE — webhook + billing API deployed</p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">Market</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">SAM</span>
              <span className="font-bold text-white">$88M–$178M/yr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Target</span>
              <span className="font-bold text-white">150K US stores</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Competitor</span>
              <span className="text-xs text-slate-400">LottoShield (chains only)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Revenue</span>
              <span className="font-bold text-red-400">$0</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">Launch Readiness</h3>
          <div className="space-y-2">
            {[
              { item: "Stripe checkout", ready: true },
              { item: "CSV import", ready: true },
              { item: "Photo OCR", ready: true },
              { item: "Reports fix", ready: true },
              { item: "Commission calc", ready: true },
              { item: "SEO blog posts", ready: true },
              { item: "Google Ads account", ready: false },
              { item: "Facebook page", ready: false },
            ].map((item) => (
              <div key={item.item} className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{item.item}</span>
                <span className={item.ready ? "text-green-400 text-xs" : "text-red-400 text-xs"}>
                  {item.ready ? "✅" : "❌"}
                </span>
              </div>
            ))}
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
                { comp: "Domain", status: "✅ Live", note: "lottotally.com 200" },
                { comp: "Signup page", status: "✅ Live", note: "/signup 200" },
                { comp: "Stripe checkout", status: "✅ LIVE", note: "3 tiers, webhook, billing API" },
                { comp: "CSV import", status: "✅ Live", note: "Auto-detects column names" },
                { comp: "Photo OCR", status: "✅ Live", note: "Tesseract.js (no API key)" },
                { comp: "Reports page", status: "✅ Fixed", note: "SQL fix + migration deployed" },
                { comp: "Commission calc", status: "✅ Live", note: "CTA → /signup" },
                { comp: "Privacy Policy", status: "🟡 Needs redesign", note: "Poor styling, needs brand consistency" },
                { comp: "Terms of Service", status: "🟡 Needs redesign", note: "Poor styling, needs brand consistency" },
              ].map((item) => (
                <tr key={item.comp}>
                  <td className="pl-5 py-2.5 text-sm text-white">{item.comp}</td>
                  <td className="py-2.5 text-sm">
                    <span className={item.status.startsWith("✅") ? "text-green-400" : "text-yellow-400"}>
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

      {/* GTM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">GTM Channels</h3>
          <div className="space-y-3">
            {[
              { channel: "SEO blog", status: "✅ Done", note: "5 posts: reconciliation costs, scratch-off theft, commission verification, time savings, software comparison" },
              { channel: "Google Ads", status: "🔴 Blocked", note: "Marcus ready, account missing — Mario must create" },
              { channel: "Facebook groups", status: "🔴 Blocked", note: "Requires FB Business Page — Mario must create" },
              { channel: "Trade pubs outreach", status: "❌ Not started", note: "Convenience Store News, CStore Decisions" },
            ].map((c) => (
              <div key={c.channel} className="flex items-start justify-between border-b border-[#1e1e2e] pb-2">
                <div>
                  <p className="text-sm text-slate-300">{c.channel}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.note}</p>
                </div>
                <span className={`text-xs font-medium ml-3 whitespace-nowrap ${
                  c.status.startsWith("✅") ? "text-green-400" : c.status.startsWith("🔴") ? "text-red-400" : "text-slate-500"
                }`}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card border-red-900/30 bg-red-950/10">
          <h3 className="text-sm font-semibold text-red-400 mb-3">🔴 Launch Blockers</h3>
          <div className="space-y-3">
            {[
              { task: "Google Ads account", owner: "Mario", due: "7+ days overdue", priority: "🔴" },
              { task: "Facebook Business Page", owner: "Mario", due: "Mar 25 overdue", priority: "🔴" },
              { task: "NoVig API key", owner: "Mario", due: "Mar 26", priority: "🟡" },
            ].map((b) => (
              <div key={b.task} className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-200">{b.task}</p>
                  <p className="text-xs text-slate-600">Owner: {b.owner}</p>
                </div>
                <span className={`pill text-xs ${b.priority === "🔴" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"}`}>
                  {b.due}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">All 3 blockers are Mario's to unblock. Product is ready.</p>
        </div>
      </div>
    </div>
  );
}
