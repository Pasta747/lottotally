import { openPositions, closedTrades, btcBot } from "@/lib/data";

export default function TradingTab() {
  const totalOpenNotional = openPositions.reduce((sum, p) => sum + p.notional, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">📈</span>
        <div>
          <h1 className="text-xl font-bold text-white">Trading</h1>
          <p className="text-sm text-slate-500">Equity portfolio · BTC bot · OddsTool</p>
        </div>
        <span className="ml-auto pill bg-green-500/10 text-green-400 border border-green-500/20 text-sm">
          ✅ Paper mode
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Open Positions</p>
          <p className="text-2xl font-bold text-white">{openPositions.length}</p>
          <p className="text-xs text-slate-500 mt-1">14 tickers</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Open Notional</p>
          <p className="text-2xl font-bold text-white">${(totalOpenNotional / 1000).toFixed(0)}K</p>
          <p className="text-xs text-slate-500 mt-1">$1M paper account</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Closed Trades</p>
          <p className="text-2xl font-bold text-white">~200</p>
          <p className="text-xs text-red-400 mt-1">⚠️ All P&L = $0 (bug)</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">BTC RSI Status</p>
          <p className="text-lg font-bold text-yellow-400">buy-watch</p>
          <p className="text-xs text-slate-500 mt-1">No trades placed</p>
        </div>
      </div>

      {/* Open positions */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Open Positions (Paper)</h2>
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="dash-table min-w-[700px]">
              <thead>
                <tr>
                  <th className="pl-5">Symbol</th>
                  <th>Strategy</th>
                  <th>Side</th>
                  <th>Qty</th>
                  <th>Entry Price</th>
                  <th>Notional</th>
                  <th>Opened</th>
                </tr>
              </thead>
              <tbody>
                {openPositions.map((p, i) => (
                  <tr key={`${p.symbol}-${i}`}>
                    <td className="pl-5 py-2.5">
                      <span className="font-bold text-white">{p.symbol}</span>
                    </td>
                    <td className="py-2.5 text-xs text-slate-400">{p.strategy}</td>
                    <td className="py-2.5">
                      <span className={`pill text-xs ${p.side === "BUY" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                        {p.side}
                      </span>
                    </td>
                    <td className="py-2.5 text-sm text-white">{p.qty}</td>
                    <td className="py-2.5 text-sm text-white">${p.price.toFixed(2)}</td>
                    <td className="py-2.5 text-sm text-white">${p.notional.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 text-xs text-slate-500">{new Date(p.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Closed trades */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Closed Trades</h2>
          <span className="pill bg-red-500/10 text-red-400 border border-red-500/20 text-xs">⚠️ Pre-fix data</span>
        </div>
        <div className="card border-red-900/20 bg-red-950/5 mb-4">
          <p className="text-sm text-slate-300">
            🔴 <strong>EQ-EXITBUG — all exit prices are corrupted.</strong> All closed trades show <code className="text-red-400">pnl = $0</code> because the exit price was captured as the entry price (bug in the pre-fix version). 
            This data reflects scanner activity only — it does <strong>NOT</strong> reflect actual P&L. 
            The bug was fixed post-March 18.
          </p>
        </div>
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="dash-table min-w-[700px]">
              <thead>
                <tr>
                  <th className="pl-5">Symbol</th>
                  <th>Strategy</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>P&L</th>
                  <th>Hold Time</th>
                  <th>Opened</th>
                </tr>
              </thead>
              <tbody>
                {closedTrades.map((t, i) => (
                  <tr key={`${t.symbol}-${i}`} className="opacity-60">
                    <td className="pl-5 py-2.5 font-bold text-slate-400">{t.symbol}</td>
                    <td className="py-2.5 text-xs text-slate-500">{t.strategy}</td>
                    <td className="py-2.5 text-sm text-slate-400">${t.entry_price.toFixed(2)}</td>
                    <td className="py-2.5 text-sm text-slate-400">${t.exit_price.toFixed(2)}</td>
                    <td className="py-2.5">
                      <span className="pill bg-red-500/10 text-red-400 border border-red-500/20 text-xs">$0 (bug)</span>
                    </td>
                    <td className="py-2.5 text-xs text-slate-500">{t.hold_time}</td>
                    <td className="py-2.5 text-xs text-slate-500">{new Date(t.opened_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* BTC bot */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">BTC Bot</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">₿</span>
              <h3 className="font-medium text-white text-sm">BTC RSI Scanner</h3>
              <span className="ml-auto pill bg-green-500/10 text-green-400 border border-green-500/20 text-xs">✅ Running</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Mode</span>
                <span className="text-white font-medium">Paper</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scan frequency</span>
                <span className="text-white">Every 15 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className="text-yellow-400 font-medium">buy-watch</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">RSI Levels</h3>
            <div className="space-y-2 text-xs">
              {[
                { coin: "BTC", rsi: 18 },
                { coin: "ETH", rsi: 19 },
                { coin: "SOL", rsi: 20 },
                { coin: "AVAX", rsi: 24 },
                { coin: "LINK", rsi: 18 },
              ].map((c) => (
                <div key={c.coin} className="flex justify-between items-center">
                  <span className="text-slate-400">{c.coin}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.rsi <= 30 ? "bg-green-500" : c.rsi <= 70 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${c.rsi * 100 / 100}%` }} />
                    </div>
                    <span className={`font-medium ${c.rsi <= 30 ? "text-green-400" : c.rsi <= 70 ? "text-yellow-400" : "text-red-400"}`}>{c.rsi}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card border-yellow-900/30 bg-yellow-950/5">
            <h3 className="text-xs text-yellow-500 uppercase tracking-wider mb-3">⚠️ Why No Trades?</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Stochastic confirmation missing. RSI in oversold territory but the multi-signal confirmation has not fired. Bot remains in <span className="text-yellow-400">buy-watch</span> mode.
            </p>
            <p className="text-xs text-slate-500 mt-2">Last scan: {btcBot.lastScan}</p>
          </div>
        </div>
      </section>

      {/* OddsTool summary */}
      <div className="card">
        <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-4">OddsTool EV+ Scanner</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Status", value: "✅ Running", note: "Paper mode" },
            { label: "Frequency", value: "Every 30 min", note: "During event windows" },
            { label: "Last signal", value: "PSG vs Nice", note: "EV 29.65%" },
            { label: "Filters active", value: "5 filters", note: "Spread EV, star-player UNDER, Kelly sizing" },
          ].map((m) => (
            <div key={m.label}>
              <p className="text-xs text-slate-500 mb-1">{m.label}</p>
              <p className="text-sm font-semibold text-white">{m.value}</p>
              <p className="text-xs text-slate-500">{m.note}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[#1e1e2e] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
          <p>✅ Spread bet EV filter: props accepted, moneyline 30% haircut, spreads rejected.</p>
          <p>✅ Star-player UNDER filter: 15 high-volume NBA players, 25% EV haircut on UNDER.</p>
        </div>
      </div>

      {/* Infrastructure notes */}
      <div className="card">
        <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-4">Equity Bot Infrastructure</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { item: "IBKR Paper", value: "✅ $1M", note: "DUP472682" },
            { item: "IB Gateway", value: "✅ Port 4002", note: "systemd running" },
            { item: "OpenAlice", value: "✅ Port 6901", note: "OpenBB" },
            { item: "Scanner cron", value: "✅ */5 6-13 * * 1-5", note: "5-min market hours" },
            { item: "Strategies", value: "✅ 20", note: "SP500 universe" },
            { item: "P&L tracking", value: "✅ --pnl CLI", note: "Strategy performance" },
            { item: "Dedup", value: "✅ 24hr", note: "Fixed" },
            { item: "Equity fix", value: "✅ Done Mar 21", note: "Kimi→Sonnet + exit(0)" },
          ].map((item) => (
            <div key={item.item} className="rounded-lg border border-[#1e1e2e] p-3 bg-[#0a0a0f]">
              <p className="text-slate-400">{item.item}</p>
              <p className="text-white font-medium mt-1">{item.value}</p>
              <p className="text-slate-600 mt-0.5">{item.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
