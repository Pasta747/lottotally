export default function PingerTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">📡</span>
        <div>
          <h1 className="text-xl font-bold text-white">Pinger</h1>
          <p className="text-sm text-slate-500">pingerhq.com · Website uptime monitoring for agencies</p>
        </div>
        <span className="ml-auto pill bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-sm">
          🟡 Live but silent
        </span>
      </div>

      {/* Pricing + Pipeline row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">Pricing</h3>
          <div className="space-y-2">
            {[
              { tier: "Freelancer", price: "$29/mo" },
              { tier: "Agency", price: "$79/mo" },
              { tier: "Studio", price: "$179/mo" },
              { tier: "Enterprise", price: "$499+/mo" },
            ].map((t) => (
              <div key={t.tier} className="flex justify-between items-center text-sm">
                <span className="text-slate-300">{t.tier}</span>
                <span className="font-semibold text-white">{t.price}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">Cold Email Pipeline</h3>
          <div className="space-y-2">
            {[
              { stage: "New leads", n: 46, color: "blue" },
              { stage: "Contacted", n: 12, color: "blue" },
              { stage: "Replied", n: 0, color: "red" },
              { stage: "Interested", n: 0, color: "red" },
              { stage: "Demo booked", n: 0, color: "red" },
              { stage: "Paying", n: 0, color: "red" },
            ].map((s) => (
              <div key={s.stage} className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{s.stage}</span>
                <span className={`font-bold text-sm ${
                  s.color === "red" ? "text-red-400" : "text-blue-400"
                }`}>{s.n}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-red-400 mt-3">⚠️ 0% reply rate after 1 week</p>
        </div>

        <div className="card">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">Key Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Revenue</span>
              <span className="font-bold text-red-400">$0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Pipeline</span>
              <span className="font-bold text-yellow-400">Dead</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Sprint</span>
              <span className="font-bold text-green-400">~82%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Domain</span>
              <span className="font-bold text-green-400">pingerhq.com 200</span>
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
                { comp: "Domain", status: "✅ Live", note: "pingerhq.com returns 200" },
                { comp: "Signup page", status: "✅ Live", note: "/signup returns 200" },
                { comp: "Checkout routes", status: "✅ Live", note: "All 4 tiers → Stripe" },
                { comp: "Stripe webhook", status: "✅ Live", note: "route.ts deployed" },
                { comp: "Blog", status: "✅ Live", note: "3 posts, /blog 200" },
                { comp: "Status page", status: "✅ Live", note: "/status/smith-digital 200" },
                { comp: "PostHog", status: "✅ Live", note: "Key in Vercel production" },
                { comp: "/pricing page", status: "🔴 404", note: "BLOCKED — Einstein needs to fix" },
                { comp: "Demo video", status: "🟡 Script ready", note: "Recording pending Mario" },
                { comp: "4th blog post", status: "🟡 Unconfirmed", note: "Einstein → verify live" },
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

      {/* Sprint + blockers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">Completed (P1)</h3>
          <div className="space-y-1.5">
            {["E2: Signup grants product access ✅", "E3: Checkout e2e verified ✅", "E6: Website redesign ✅", "E-fix: Demo/status page fixed ✅", "G3: Launch assets (5/5) ✅", "G-social: @pingerhq posting schedule ✅", "G-video: Demo script v2 shipped ✅", "M-reply: Reply playbook ✅"].map((t) => (
              <p key={t} className="text-xs text-slate-400 pl-2">• {t}</p>
            ))}
          </div>
        </div>
        <div className="card border-red-900/30 bg-red-950/10">
          <h3 className="text-sm font-semibold text-red-400 mb-3">🔴 Blockers</h3>
          <div className="space-y-2">
            {[
              { task: "/pricing page is 404", impact: "Can't convert visitors" },
              { task: "4th blog post unconfirmed live", impact: "SEO gap, Google Ads can't launch" },
              { task: "Campaign 0% reply rate", impact: "Revenue funnel empty" },
            ].map((b) => (
              <div key={b.task} className="border-b border-red-900/20 pb-2">
                <p className="text-xs font-medium text-slate-200">{b.task}</p>
                <p className="text-xs text-slate-500">Impact: {b.impact}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
