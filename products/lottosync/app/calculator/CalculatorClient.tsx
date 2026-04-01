"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

function currency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function CalculatorClient() {
  const [terminals, setTerminals] = useState(2);
  const [monthlySales, setMonthlySales] = useState(25000);
  const [hoursPerWeek, setHoursPerWeek] = useState(4);
  const [hourlyRate, setHourlyRate] = useState(22);
  const [showResult, setShowResult] = useState(false);

  const result = useMemo(() => {
    // Labor cost: hours/week × hourly rate × 52 ÷ 12 = monthly labor cost
    const monthlyLabor = (hoursPerWeek * hourlyRate * 52) / 12;
    // Commission error: monthly sales × 2%
    const monthlyCommissionError = monthlySales * 0.02;
    // Total monthly loss
    const totalMonthlyLoss = monthlyLabor + monthlyCommissionError;
    // Annual loss
    const annualLoss = totalMonthlyLoss * 12;
    // Low-end (1% error rate)
    const lowMonthlyError = monthlySales * 0.01;
    const lowTotalMonthly = monthlyLabor + lowMonthlyError;
    // High-end (3% error rate)
    const highMonthlyError = monthlySales * 0.03;
    const highTotalMonthly = monthlyLabor + highMonthlyError;

    return {
      monthlyLabor,
      monthlyCommissionError,
      totalMonthlyLoss,
      annualLoss,
      lowTotalMonthly,
      highTotalMonthly,
    };
  }, [hoursPerWeek, hourlyRate, monthlySales]);

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1E40AF] to-[#0F172A] px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            See How Much You&apos;re Losing to Manual Lottery Reconciliation
          </h1>
          <p className="mt-6 text-lg text-blue-100">
            Most independent convenience store owners find out they&apos;re losing money on lottery — years too late.
          </p>
          <p className="mt-4 text-blue-200">
            Every week you spend hours manually reconciling lottery sales. Every month there&apos;s a commission discrepancy you can&apos;t explain. This calculator shows you, in 60 seconds, what you&apos;re actually losing.
          </p>
        </div>
      </section>

      {/* Calculator Form */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-xl">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
            <h2 className="mb-6 text-xl font-semibold text-white">Your Numbers</h2>

            <div className="space-y-5">
              <label className="block">
                <span className="text-sm text-slate-300">Number of lottery terminals you manage</span>
                <input
                  type="number"
                  min={1}
                  value={terminals}
                  onChange={(e) => setTerminals(Number(e.target.value || 1))}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-[#1E293B] px-4 py-3 text-white placeholder-slate-500"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Average monthly lottery sales (all terminals combined)</span>
                <input
                  type="number"
                  min={0}
                  value={monthlySales}
                  onChange={(e) => setMonthlySales(Number(e.target.value || 0))}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-[#1E293B] px-4 py-3 text-white placeholder-slate-500"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Hours your team spends on lottery reconciliation each week</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value || 0))}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-[#1E293B] px-4 py-3 text-white placeholder-slate-500"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Your average hourly labor cost ($/hour)</span>
                <input
                  type="number"
                  min={0}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value || 0))}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-[#1E293B] px-4 py-3 text-white placeholder-slate-500"
                />
              </label>

              <button
                onClick={() => setShowResult(true)}
                className="mt-4 w-full rounded-lg bg-[#F59E0B] py-4 text-lg font-semibold text-[#0F172A] hover:bg-[#D97706] transition-colors"
              >
                Calculate My Losses
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      {showResult && (
        <section className="px-6 pb-16">
          <div className="mx-auto max-w-3xl">

            {/* High-loss result */}
            {result.totalMonthlyLoss > 500 && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8">
                <p className="text-sm text-amber-300 uppercase tracking-wide font-medium">Your Estimated Monthly Loss</p>
                <p className="mt-2 text-5xl font-bold text-amber-300">{currency(result.totalMonthlyLoss)}</p>

                <div className="mt-6 space-y-3">
                  <div className="flex justify-between border-b border-amber-500/20 pb-2">
                    <span className="text-slate-300">Labor cost of manual reconciliation</span>
                    <span className="font-medium">{currency(result.monthlyLabor)}/mo</span>
                  </div>
                  <div className="flex justify-between border-b border-amber-500/20 pb-2">
                    <span className="text-slate-300">Estimated commission errors (2% of sales)</span>
                    <span className="font-medium">{currency(result.monthlyCommissionError)}/mo</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-white font-semibold">Total estimated monthly loss</span>
                    <span className="font-bold text-amber-300">{currency(result.totalMonthlyLoss)}/mo</span>
                  </div>
                </div>

                <p className="mt-6 text-2xl font-bold text-white">
                  That&apos;s {currency(result.annualLoss)}/year
                </p>

                <p className="mt-4 text-slate-300">
                  That&apos;s {currency(result.totalMonthlyLoss * 12)} in lottery profit going to shrinkage you&apos;re not measuring. The exact amount disappears before you ever see it.
                </p>

                <div className="mt-6 rounded-lg border border-amber-500/20 bg-[#0F172A]/50 p-4">
                  <p className="text-amber-200 font-medium">The real problem:</p>
                  <p className="mt-1 text-slate-300">You won&apos;t find out the exact amount until your quarterly reconciliation. By then, it&apos;s already gone.</p>
                </div>
              </div>
            )}

            {/* Low-loss result */}
            {result.totalMonthlyLoss <= 500 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
                <h3 className="text-xl font-semibold text-white">Your Losses Look Manageable — But That Doesn&apos;t Mean You&apos;re Winning.</h3>
                <p className="mt-3 text-slate-300">
                  The calculator only captures what you can measure. Hidden pack-tracking errors and manual mistakes add up faster than most owners realize.
                </p>
                <p className="mt-3 text-slate-300">
                  Even at {currency(result.totalMonthlyLoss)}/month, a free LottoTally trial could surface what&apos;s flying under the radar.
                </p>
              </div>
            )}

            {/* The Math */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-8">
              <h3 className="text-lg font-semibold text-white">How The Math Works</h3>

              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-slate-300 font-medium">Labor cost:</p>
                  <p className="text-slate-400 text-sm mt-1">Hours/week × Hourly rate × 52 ÷ 12 = Monthly labor cost</p>
                  <p className="text-blue-300 text-sm mt-1">
                    Example: 4 hours/week × $22/hour = {currency(4 * 22)}/week = {currency((4 * 22 * 52) / 12)}/month in labor just doing reconciliation
                  </p>
                </div>

                <div>
                  <p className="text-slate-300 font-medium">Commission error cost:</p>
                  <p className="text-slate-400 text-sm mt-1">Average monthly sales × Estimated error rate (1-3%) = Monthly commission errors</p>
                  <p className="text-blue-300 text-sm mt-1">
                    Example: {currency(25000)}/month in sales × 2% error rate = {currency(25000 * 0.02)}/month in potential errors
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                <p className="text-blue-200 font-medium">
                  Combined, most independent stores lose {currency(result.lowTotalMonthly)}-{currency(result.highTotalMonthly)}/month to labor waste and untracked commission errors.
                </p>
              </div>
            </div>

            {/* Solution */}
            <div className="mt-8 rounded-2xl bg-gradient-to-br from-[#1E40AF] to-[#0F172A] p-8">
              <h3 className="text-2xl font-bold text-white">See Your Real Numbers — For Free</h3>
              <p className="mt-3 text-blue-100">
                The calculator estimates. LottoTally tracks exactly what&apos;s happening — every pack, every commission payment, every exception — in real time.
              </p>
              <ul className="mt-4 space-y-2 text-blue-100">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  Tracks every lottery terminal automatically
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  Flags commission discrepancies before you lose money on them
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  Replaces hours of manual work per week with 5 minutes of review
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  Works with your existing terminals — no hardware changes
                </li>
              </ul>
            </div>

            {/* Social Proof */}
            <div className="mt-8 space-y-4">
              <blockquote className="rounded-xl border border-white/10 bg-white/5 p-6">
                <p className="text-slate-300 italic">
                  &quot;I thought my shrinkage was normal. LottoTally showed me I was losing $11,000 a year to a pack-tracking error that had been happening since I opened.&quot;
                </p>
                <footer className="mt-3 text-sm text-slate-400">— Independent C-Store Owner, Ohio</footer>
              </blockquote>

              <blockquote className="rounded-xl border border-white/10 bg-white/5 p-6">
                <p className="text-slate-300 italic">
                  &quot;Four hours a week I was spending on lottery reconciliation. I thought that was just part of the job. LottoTally showed me what that time was actually costing.&quot;
                </p>
                <footer className="mt-3 text-sm text-slate-400">— Owner, 3-Location Chain, Texas</footer>
              </blockquote>
            </div>

            {/* Trust Signals */}
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                "No credit card required to start",
                "Setup in under 5 minutes",
                "Works with your existing terminals — no hardware changes",
                "Trusted by independent stores running 1-20 locations",
                "Cancel anytime — no long-term contracts",
              ].map((trust) => (
                <div key={trust} className="flex items-center gap-2 text-slate-300">
                  <span className="text-emerald-400 text-sm">✓</span>
                  <span className="text-sm">{trust}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-10 text-center">
              <Link
                href="/signup"
                className="inline-block rounded-lg bg-[#F59E0B] px-8 py-4 text-xl font-semibold text-[#0F172A] hover:bg-[#D97706] transition-colors"
              >
                Start Your Free 30-Day Trial
              </Link>
              <p className="mt-3 text-slate-400 text-sm">No credit card. No hardware. Just answers.</p>
              <div className="mt-4">
                <Link href="/signup" className="text-blue-300 hover:text-blue-200 text-sm underline">
                  See Your Real Numbers — Sign Up Free
                </Link>
              </div>
            </div>

            {/* FAQ */}
            <div className="mt-12 space-y-4">
              <h3 className="text-xl font-semibold text-white">Frequently Asked Questions</h3>

              {[
                {
                  q: "Is this accurate?",
                  a: "The calculator uses your actual numbers. The estimate is based on industry averages for labor time and commission error rates. For precise tracking, start a free LottoTally trial.",
                },
                {
                  q: "Do I need special hardware?",
                  a: "No. LottoTally works with your existing lottery terminal data. No technician visit, no hardware changes.",
                },
                {
                  q: "How long does setup take?",
                  a: "Under 5 minutes. Connect your terminals, configure your settings, and you&apos;re done.",
                },
                {
                  q: "What&apos;s the cost?",
                  a: "$49/month per location after your free trial. Most stores recover their subscription cost in the first month from errors they catch.",
                },
                {
                  q: "Is my data secure?",
                  a: "Yes. LottoTally uses bank-level encryption. Your sales and commission data is private and never shared.",
                },
              ].map(({ q, a }) => (
                <details key={q} className="group rounded-lg border border-white/10 bg-white/5">
                  <summary className="cursor-pointer px-6 py-4 font-medium text-white">{q}</summary>
                  <p className="px-6 pb-4 text-slate-300">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer nav */}
      <div className="border-t border-white/10 px-6 py-6 text-center">
        <Link href="/" className="text-sm text-slate-400 hover:text-white">
          ← Back to LottoTally
        </Link>
      </div>
    </main>
  );
}
