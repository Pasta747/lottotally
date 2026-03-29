"use client";

import { useState } from "react";
import Link from "next/link";

const plans = [
  { name: "Starter", price: "$49", desc: "Single store. Core reconciliation + alerts." },
  { name: "Pro", price: "$79", desc: "Up to 5 stores. Team workflow + advanced reporting.", featured: true },
  { name: "Multi", price: "$99", desc: "Up to 20 stores. Multi-location controls + priority support." },
];

const features = [
  {
    title: "Inventory tracking",
    body: "Auto-reconcile packs sold vs. expected inventory so errors surface before they become losses.",
    icon: "📦",
  },
  {
    title: "Theft detection",
    body: "Flag suspicious discrepancies by shift, employee, and terminal with instant anomaly alerts.",
    icon: "🛡️",
  },
  {
    title: "Commission verification",
    body: "Catch incorrect commission rates before they cost you money — every payout, every cycle.",
    icon: "💰",
  },
  {
    title: "Daily snapshots",
    body: "See your short, pack, and variance numbers at a glance without logging into state portals.",
    icon: "📊",
  },
  {
    title: "Smart alerts",
    body: "Get notified the moment a pack goes missing, a rate changes, or a threshold is breached.",
    icon: "🚨",
  },
  {
    title: "CSV import",
    body: "Drop your daily reports and reconcile in seconds. No manual entry. No spreadsheets.",
    icon: "📥",
  },
];

const faqs = [
  {
    q: "How does the free trial work?",
    a: "Start with a 14-day free trial on the Pro plan. No credit card required. After the trial, choose the plan that fits your operation.",
  },
  {
    q: "Can I use LottoTally for multiple stores?",
    a: "Yes. The Multi plan supports up to 20 locations. Each store gets its own terminal inventory tracking and consolidated reporting.",
  },
  {
    q: "What lottery types does it support?",
    a: "Currently supports scratch-off and terminal (pull-tab) lottery tracking. We&apos;re evaluating instant ticket and sports betting additions.",
  },
  {
    q: "How do I import my sales data?",
    a: "Upload a CSV from your state lottery portal directly in the dashboard. You can also photograph your daily report and let OCR do the work.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Your data is encrypted in transit and at rest. We never sell or share your business data with third parties.",
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold">L</span>
            <span className="font-semibold tracking-tight">LottoTally</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <Link href="/login" className="rounded-md px-3 py-2 text-sm text-slate-300 hover:text-white">Log in</Link>
            <Link href="/signup" className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100">Start trial</Link>
          </nav>

          {/* Mobile nav */}
          <div className="flex items-center gap-2 md:hidden">
            <Link href="/signup" className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100">Start trial</Link>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="border-t border-white/10 bg-slate-950 px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-1">
              <a href="#features" className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10" onClick={() => setMenuOpen(false)}>Features</a>
              <a href="#pricing" className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10" onClick={() => setMenuOpen(false)}>Pricing</a>
              <a href="#faq" className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10" onClick={() => setMenuOpen(false)}>FAQ</a>
              <Link href="/login" className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10" onClick={() => setMenuOpen(false)}>Log in</Link>
              <Link href="/signup" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500" onClick={() => setMenuOpen(false)}>Start trial</Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,10,241,0.35),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.2),transparent_45%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-18 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">
              Built for independent lottery retailers
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Stop lottery shrink before it kills your margins.
            </h1>
            <p className="mt-5 text-lg text-slate-300">
              Auto-reconcile scratch-offs and terminal sales. Catch discrepancies in real time. Keep every commission dollar you earned.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500">
                Start free trial
                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
                Sign in
              </Link>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
                <div className="h-3 w-3 rounded-full bg-green-400/60" />
                <span className="ml-2 text-xs text-slate-500">LottoTally Dashboard</span>
              </div>
              <div className="mb-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Short", value: "$842", change: "+12%", positive: false },
                  { label: "Expected", value: "$12,485", change: "+3%", positive: true },
                  { label: "Variance", value: "6.7%", change: "-1.2%", positive: false },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-white/5 p-3">
                    <p className="text-xs text-slate-400">{stat.label}</p>
                    <p className="mt-1 text-lg font-semibold text-white">{stat.value}</p>
                    <p className={`text-xs ${stat.positive ? "text-green-400" : "text-red-400"}`}>{stat.change}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2">
                  <span className="text-sm text-slate-300">Pack #28761 — Scratch Gold Rush</span>
                  <span className="text-sm font-medium text-red-400">-$127.50</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2">
                  <span className="text-sm text-slate-300">Terminal #4 — Pull Tabs</span>
                  <span className="text-sm font-medium text-green-400">+$43.20</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2">
                  <span className="text-sm text-slate-300">Pack #28803 — Mega Millions</span>
                  <span className="text-sm font-medium text-slate-400">Balanced</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-slate-950 py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Everything you need to run a tighter operation</h2>
            <p className="mt-4 text-slate-400">Replace the spreadsheets, the guesswork, and the after-the-fact discovery.</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="mb-4 text-3xl">{f.icon}</div>
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Up and running in 5 minutes</h2>
            <p className="mt-4 text-slate-400">No hardware. No contracts. No training required.</p>
          </div>
          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {[
              { step: "1", title: "Upload your data", desc: "Drop your daily CSV or photograph your report. LottoTally reads it automatically." },
              { step: "2", title: "Set your thresholds", desc: "Define what counts as an alert — by dollar amount, percentage, or pack count." },
              { step: "3", title: "Get paid what you&apos;re owed", desc: "Reconcile in minutes, not hours. Catch every discrepancy before it becomes a loss." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold">{item.step}</div>
                <h3 className="mt-4 text-lg font-semibold text-white" dangerouslySetInnerHTML={{ __html: item.title }} />
                <p className="mt-2 text-sm text-slate-400" dangerouslySetInnerHTML={{ __html: item.desc }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-slate-950 py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Straightforward pricing</h2>
            <p className="mt-4 text-slate-400">14-day free trial on all plans. No credit card required.</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl border p-6 ${plan.featured ? "border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500" : "border-white/10 bg-white/5"}`}>
                {plan.featured && <span className="inline-block rounded-full bg-indigo-500 px-3 py-1 text-xs font-medium text-white">Most popular</span>}
                <h3 className="mt-4 text-lg font-semibold text-white">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400">/month</span>
                </div>
                <p className="mt-3 text-sm text-slate-400">{plan.desc}</p>
                <Link href="/signup" className={`mt-6 block rounded-lg px-4 py-2.5 text-center text-sm font-medium ${plan.featured ? "bg-indigo-600 text-white hover:bg-indigo-500" : "border border-white/20 text-slate-300 hover:bg-white/5"}`}>
                  Start free trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">Frequently asked questions</h2>
          <div className="mt-12 space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5">
                <button
                  className="flex w-full items-center justify-between p-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-white">{faq.q}</span>
                  <svg className={`h-5 w-5 text-slate-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && <div className="border-t border-white/10 px-5 pb-5 pt-3 text-sm text-slate-400" dangerouslySetInnerHTML={{ __html: faq.a }} />}
              </div>
            ))}
          </div>
          <div className="mt-12 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-6 text-center">
            <p className="text-slate-300">Still have questions?</p>
            <a href="mailto:hello@lottotally.com" className="mt-2 inline-block text-indigo-400 hover:text-indigo-300">hello@lottotally.com</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950 py-12 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold">L</span>
                <span className="font-semibold tracking-tight text-white">LottoTally</span>
              </div>
              <p className="mt-3 text-sm text-slate-500">Auto-reconciliation for independent lottery retailers.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white">Product</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="/calculator" className="hover:text-white">ROI Calculator</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white">Company</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
                <li><a href="mailto:hello@lottotally.com" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white">Get started</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li><Link href="/login" className="hover:text-white">Sign in</Link></li>
                <li><Link href="/signup" className="hover:text-white">Start free trial</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-8 text-center text-sm text-slate-500">
            © 2026 LottoTally. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
