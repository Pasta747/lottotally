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
    body: "Cross-check payouts from lottery statements against actual ticket activity to catch missed revenue.",
    icon: "✅",
  },
  {
    title: "Operational reporting",
    body: "Daily and weekly profit snapshots you can share with ownership in under 60 seconds.",
    icon: "📊",
  },
];

const faqs = [
  {
    q: "How long does setup take?",
    a: "Most retailers connect their first store in under 20 minutes. You can import prior statement data later.",
  },
  {
    q: "Do I need to replace my POS?",
    a: "No. LottoTally layers on top of your current workflow and gives you a clear exception queue each day.",
  },
  {
    q: "Can I manage multiple stores?",
    a: "Yes. Pro and Multi plans support multi-store operations with location-level reporting and alerts.",
  },
  {
    q: "Will this help with employee shrink?",
    a: "That’s one of the main outcomes. The platform is built to highlight irregular deltas and audit gaps quickly.",
  },
];

function DashboardMockup() {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/90 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">LottoTally Dashboard</p>
            <h3 className="text-lg font-semibold text-slate-900">Northside Mart · Daily Snapshot</h3>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">$1,124 verified</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Pack variance</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">-2</p>
            <p className="text-xs text-amber-700">Needs review</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Commission mismatch</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">$84</p>
            <p className="text-xs text-red-700">Potential missed payout</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Incidents</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">1</p>
            <p className="text-xs text-slate-600">Open anomaly ticket</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 p-3">
          <p className="text-xs font-medium text-slate-500">Exception feed</p>
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span>Pack #28761 short by 3 tickets</span>
              <span className="text-red-600">High</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span>Commission delta on Scratch Gold Rush</span>
              <span className="text-amber-600">Medium</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen scroll-smooth bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold">L</span>
            <span className="font-semibold tracking-tight">LottoTally</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <Link href="/login" className="rounded-md px-3 py-2 text-sm text-slate-300 hover:text-white">Log in</Link>
            <Link href="/signup" className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100">Start trial</Link>
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            <Link href="/login" className="rounded-md px-3 py-2 text-sm text-slate-300 hover:text-white">Log in</Link>
            <Link href="/signup" className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100">Start trial</Link>
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

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.35),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.2),transparent_45%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-18 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">
              Built for independent lottery retailers
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Stop lottery shrink before it kills your margins.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
              LottoTally gives you daily reconciliation, theft detection, and commission verification in one clean control panel.
              Know exactly where money is leaking — and fix it fast.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="rounded-lg bg-indigo-500 px-5 py-3 font-medium text-white hover:bg-indigo-400">
                Start Free Trial
              </Link>
              <Link href="/calculator" className="rounded-lg border border-white/20 px-5 py-3 font-medium text-slate-100 hover:bg-white/10">
                Free Loss Calculator
              </Link>
              <a href="#pricing" className="rounded-lg border border-white/20 px-5 py-3 font-medium text-slate-100 hover:bg-white/10">
                View Pricing
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-400">No hardware replacement. No long contracts. Setup in under 20 minutes. <strong className="text-emerald-300">14-day free trial available.</strong></p>
          </div>
          <DashboardMockup />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 md:grid-cols-3">
          <div>
            <p className="text-3xl font-bold text-white">$12,000+</p>
            <p className="text-sm text-slate-300">Annual savings potential per store from tighter reconciliation</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">5 min</p>
            <p className="text-sm text-slate-300">Daily workflow to review exceptions and close gaps</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">24/7</p>
            <p className="text-sm text-slate-300">Visibility into ticket movement, payout accuracy, and anomaly alerts</p>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-wide text-indigo-300">Core capabilities</p>
          <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Everything you need to protect lottery profit.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10">
              <p className="text-2xl">{f.icon}</p>
              <h3 className="mt-3 text-xl font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-slate-300 leading-7">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Simple pricing by store count</h2>
          <p className="mt-3 text-slate-300">Start with one store. Expand when operations demand it.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 ${plan.featured ? "border-indigo-300 bg-indigo-500/20" : "border-white/10 bg-white/5"}`}
            >
              <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
              <p className="mt-2 text-4xl font-bold text-white">
                {plan.price}
                <span className="text-base font-medium text-slate-300">/mo</span>
              </p>
              <p className="mt-3 text-slate-300">{plan.desc}</p>
              <Link
                href="/signup"
                className={`mt-5 inline-block rounded-lg px-4 py-2 font-medium ${plan.featured ? "bg-white text-slate-900" : "border border-white/20 text-white"}`}
              >
                Choose {plan.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-3xl font-semibold text-white">FAQ</h2>
        <div className="mt-6 space-y-4">
          {faqs.map((item) => (
            <div key={item.q} className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-semibold text-white">{item.q}</h3>
              <p className="mt-2 text-slate-300">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950/80">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-3">
          <div>
            <p className="font-semibold text-white">LottoTally</p>
            <p className="mt-2 text-sm text-slate-400">Operational control for modern lottery retailers.</p>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Product</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-400">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><a href="#faq" className="hover:text-white">FAQ</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Trust</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-400">
              <li><a href="/privacy" className="hover:text-white">Privacy</a></li>
              <li><a href="/terms" className="hover:text-white">Terms</a></li>
              <li>hello@lottotally.com</li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  );
}
