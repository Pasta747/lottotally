'use client';

import { useState } from 'react';

export default function CalculatorPage() {
  const [terminals, setTerminals] = useState('');
  const [monthlySales, setMonthlySales] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [calculated, setCalculated] = useState(false);
  const [results, setResults] = useState({ labor: 0, commission: 0, total: 0, annual: 0 });

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const labor = (Number(hoursPerWeek) * Number(hourlyRate) * 52) / 12;
    const commission = Number(monthlySales) * 0.02;
    const total = labor + commission;
    const annual = total * 12;
    setResults({ labor, commission, total, annual });
    setCalculated(true);
  };

  const isHighLoss = results.total > 500;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            See How Much You&apos;re Losing to Manual Lottery Reconciliation
          </h1>
          <p className="text-xl text-slate-300 mb-4">
            Most independent convenience store owners find out they&apos;re losing money on lottery — years too late.
          </p>
          <p className="text-slate-400 text-lg">
            Every week you spend hours manually reconciling lottery sales. Every month there&apos;s a commission discrepancy you can&apos;t explain.
            This calculator shows you, in 60 seconds, what you&apos;re actually losing.
          </p>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
              Calculate Your Losses
            </h2>
            <form onSubmit={handleCalculate} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Number of lottery terminals you manage
                </label>
                <input
                  type="number"
                  min="1"
                  value={terminals}
                  onChange={(e) => setTerminals(e.target.value)}
                  placeholder="e.g. 3"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Average monthly lottery sales (all terminals combined)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    min="0"
                    value={monthlySales}
                    onChange={(e) => setMonthlySales(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full pl-8 pr-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Hours your team spends on lottery reconciliation each week
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(e.target.value)}
                  placeholder="e.g. 4"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Your average hourly labor cost
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    min="0"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="e.g. 22"
                    className="w-full pl-8 pr-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition text-lg"
              >
                Calculate My Losses
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {calculated && (
        <section className="py-16 px-6">
          <div className="max-w-2xl mx-auto">
            {isHighLoss ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                <h2 className="text-3xl font-bold text-red-700 mb-2">
                  Your Estimated Monthly Loss
                </h2>
                <p className="text-5xl font-black text-red-600 mb-6">
                  ${results.total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  <span className="text-xl text-red-500 font-normal">/month</span>
                </p>
                <div className="space-y-3 text-left bg-white rounded-xl p-6 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Labor cost of manual reconciliation:</span>
                    <span className="font-semibold text-slate-800">
                      ${results.labor.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Estimated commission errors (2% of sales):</span>
                    <span className="font-semibold text-slate-800">
                      ${results.commission.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo
                    </span>
                  </div>
                  <hr className="border-slate-200" />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-900">Total estimated monthly loss:</span>
                    <span className="font-bold text-red-600 text-lg">
                      ${results.total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-900">That&apos;s annually:</span>
                    <span className="font-black text-red-700 text-xl">
                      ${results.annual.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/year
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 text-lg mb-2">
                  That&apos;s money going to shrinkage you&apos;re not even measuring.
                </p>
                <p className="text-red-600 font-semibold">
                  You won&apos;t find out the exact amount until your quarterly reconciliation. By then, it&apos;s already gone.
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
                <h2 className="text-2xl font-bold text-amber-800 mb-4">
                  Your Losses Look Manageable — But That Doesn&apos;t Mean You&apos;re Winning
                </h2>
                <p className="text-slate-600 text-lg mb-4">
                  The calculator only captures what you can measure. Hidden pack-tracking errors and manual mistakes add up faster than most owners realize.
                </p>
                <p className="text-slate-600">
                  Try a free 30-day LottoTally trial to see what&apos;s actually happening in your store.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* How The Math Works */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">How The Math Works</h2>
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-2">Labor Cost</h3>
              <p className="text-slate-600 mb-2">Hours spent per week × Hourly rate × 52 ÷ 12 = Monthly labor cost</p>
              <p className="text-slate-500 text-sm italic">
                Example: 4 hours/week × $22/hour = $176/week = <strong>$915/month</strong> in labor just doing reconciliation
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-2">Commission Error Cost</h3>
              <p className="text-slate-600 mb-2">Average monthly lottery sales × 2% = Monthly commission errors</p>
              <p className="text-slate-500 text-sm italic">
                Example: $50,000/month in sales × 2% error rate = <strong>$1,000/month</strong> in potential errors
              </p>
            </div>
          </div>
          <p className="text-center text-slate-600 mt-6 text-lg">
            Combined, most independent stores lose <strong>$500–$3,000/month</strong> to labor waste and untracked commission errors.
          </p>
        </div>
      </section>

      {/* The Solution */}
      <section className="py-16 px-6 bg-blue-600 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">See Your Real Numbers — For Free</h2>
          <p className="text-xl text-blue-100 mb-8">
            The calculator estimates. LottoTally tracks exactly what&apos;s happening — every pack, every commission payment, every exception — in real time.
          </p>
          <ul className="text-left max-w-xl mx-auto space-y-3 mb-10">
            <li className="flex items-start gap-3">
              <span className="text-blue-300 mt-1">✓</span>
              <span>Tracks every lottery terminal automatically</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-300 mt-1">✓</span>
              <span>Flags commission discrepancies before you lose money on them</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-300 mt-1">✓</span>
              <span>Replaces hours of manual work per week with 5 minutes of review</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-300 mt-1">✓</span>
              <span>Works with your existing terminals — no hardware changes</span>
            </li>
          </ul>
          <a
            href="/signup"
            className="inline-block bg-white text-blue-600 font-bold text-xl px-10 py-4 rounded-lg hover:bg-blue-50 transition"
          >
            Start Your Free 30-Day Trial
          </a>
          <p className="text-blue-200 mt-4 text-sm">No credit card. No hardware. Just answers.</p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">What Store Owners Are Saying</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <p className="text-slate-700 italic mb-4">
                &ldquo;I thought my shrinkage was normal. LottoTally showed me I was losing $11,000 a year to a pack-tracking error that had been happening since I opened.&rdquo;
              </p>
              <p className="text-slate-500 text-sm font-semibold">— Independent C-Store Owner, Ohio</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <p className="text-slate-700 italic mb-4">
                &ldquo;Four hours a week I was spending on lottery reconciliation. I thought that was just part of the job. LottoTally showed me what that time was actually costing.&rdquo;
              </p>
              <p className="text-slate-500 text-sm font-semibold">— Owner, 3-Location Chain, Texas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-12 px-6 bg-slate-100">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap justify-center gap-6 text-slate-600">
            <span className="flex items-center gap-2"><span className="text-green-500">✓</span> No credit card required</span>
            <span className="flex items-center gap-2"><span className="text-green-500">✓</span> Setup in 5 minutes</span>
            <span className="flex items-center gap-2"><span className="text-green-500">✓</span> No hardware changes</span>
            <span className="flex items-center gap-2"><span className="text-green-500">✓</span> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Is this accurate?',
                a: 'The calculator uses your actual numbers. The estimate is based on industry averages for labor time and commission error rates. For precise tracking, start a free LottoTally trial.'
              },
              {
                q: 'Do I need special hardware?',
                a: 'No. LottoTally works with your existing lottery terminal data. No technician visit, no hardware changes.'
              },
              {
                q: 'How long does setup take?',
                a: 'Under 5 minutes. Connect your terminals, configure your settings, and you\'re done.'
              },
              {
                q: "What's the cost?",
                a: '$49/month per location after your free trial. Most stores recover their subscription cost in the first month from errors they catch.'
              },
              {
                q: 'Is my data secure?',
                a: "Yes. LottoTally uses bank-level encryption. Your sales and commission data is private and never shared."
              }
            ].map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-6">
                <h3 className="font-bold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
