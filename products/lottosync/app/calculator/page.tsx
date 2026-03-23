"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

function currency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function CalculatorPage() {
  const [weeklySales, setWeeklySales] = useState(18000);
  const [lossPct, setLossPct] = useState(1.8);
  const [recoveryPct, setRecoveryPct] = useState(65);

  const result = useMemo(() => {
    const annualSales = weeklySales * 52;
    const estimatedLoss = annualSales * (lossPct / 100);
    const recoverable = estimatedLoss * (recoveryPct / 100);
    return {
      annualSales,
      estimatedLoss,
      recoverable,
      monthlyRecoverable: recoverable / 12,
    };
  }, [weeklySales, lossPct, recoveryPct]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Free Lottery Loss Calculator</h1>
          <Link href="/" className="text-sm text-indigo-300 hover:text-indigo-200">← Back to LottoTally</Link>
        </div>

        <p className="text-slate-300">
          Estimate how much lottery leakage (inventory variance, missed commission, shrink) could be costing your store yearly.
        </p>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
          <label className="block">
            <span className="text-sm text-slate-300">Weekly lottery sales ($)</span>
            <input
              type="number"
              value={weeklySales}
              min={0}
              onChange={(e) => setWeeklySales(Number(e.target.value || 0))}
              className="mt-2 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-300">Estimated leakage rate (%)</span>
            <input
              type="number"
              value={lossPct}
              min={0}
              step={0.1}
              onChange={(e) => setLossPct(Number(e.target.value || 0))}
              className="mt-2 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-300">Recoverable with better controls (%)</span>
            <input
              type="number"
              value={recoveryPct}
              min={0}
              max={100}
              onChange={(e) => setRecoveryPct(Number(e.target.value || 0))}
              className="mt-2 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2"
            />
          </label>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">Annual lottery sales</p>
            <p className="mt-1 text-2xl font-semibold">{currency(result.annualSales)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">Estimated annual leakage</p>
            <p className="mt-1 text-2xl font-semibold text-amber-300">{currency(result.estimatedLoss)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
            <p className="text-xs text-slate-400">Potential annual recovery with LottoTally</p>
            <p className="mt-1 text-3xl font-bold text-emerald-300">{currency(result.recoverable)}</p>
            <p className="mt-1 text-sm text-slate-300">≈ {currency(result.monthlyRecoverable)} / month</p>
          </div>
        </section>

        <section className="rounded-2xl border border-indigo-300/30 bg-indigo-500/10 p-6">
          <h2 className="text-xl font-semibold">Want the full breakdown per game + shift?</h2>
          <p className="mt-2 text-slate-300">Start a free trial and get daily exception tracking, commission checks, and shrinkage alerts.</p>
          <div className="mt-4 flex gap-3">
            <Link href="/signup" className="rounded-lg bg-indigo-500 px-4 py-2 font-medium text-white">Start Free Trial</Link>
            <Link href="/" className="rounded-lg border border-white/20 px-4 py-2">View Product</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
