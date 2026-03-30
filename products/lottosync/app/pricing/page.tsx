"use client";

import Link from "next/link";
import { useState } from "react";

const plans = [
  {
    name: "Starter",
    tier: "STARTER",
    price: "$49",
    desc: "Single store. Core reconciliation + alerts.",
    trial: "14-day free trial",
  },
  {
    name: "Pro",
    tier: "PRO",
    price: "$79",
    desc: "Up to 5 stores. Team workflow + advanced reporting.",
    featured: true,
    trial: "14-day free trial",
  },
  {
    name: "Multi",
    tier: "MULTI",
    price: "$99",
    desc: "Up to 20 stores. Multi-location controls + priority support.",
    trial: "14-day free trial",
  },
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
    a: "That's one of the main outcomes. The platform is built to highlight irregular deltas and audit gaps quickly.",
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(tier: string) {
    setLoading(tier);
    setError(null);

    const email = prompt("Enter your email to start your free trial:");
    if (!email) {
      setLoading(null);
      return;
    }

    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: tier, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen scroll-smooth bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold">
              L
            </span>
            <span className="font-semibold tracking-tight">LottoTally</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-md px-3 py-2 text-sm text-slate-300 hover:text-white">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              Start trial
            </Link>
          </div>
        </div>
      </header>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Simple pricing by store count
          </h2>
          <p className="mt-3 text-slate-300">
            Start with one store. Expand when operations demand it. All plans include a 14-day free
            trial.
          </p>
        </div>

        {error && (
          <div className="mx-auto mb-6 max-w-md rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 ${
                plan.featured
                  ? "border-indigo-300 bg-indigo-500/20"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
              <p className="mt-2 text-4xl font-bold text-white">
                {plan.price}
                <span className="text-base font-medium text-slate-300">/mo</span>
              </p>
              <p className="mt-3 text-slate-300">{plan.desc}</p>
              <p className="mt-3 text-sm text-indigo-300">{plan.trial}</p>
              <button
                onClick={() => handleCheckout(plan.tier)}
                disabled={loading !== null}
                className={`mt-5 inline-block rounded-lg px-4 py-2 font-medium transition ${
                  plan.featured
                    ? "bg-white text-slate-900 hover:bg-slate-100"
                    : "border border-white/20 text-white hover:bg-white/10"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === plan.tier ? "Redirecting…" : `Choose ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-wide text-indigo-300">Core capabilities</p>
          <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            Everything you need to protect lottery profit.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
            >
              <p className="text-2xl">{f.icon}</p>
              <h3 className="mt-3 text-xl font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-slate-300 leading-7">{f.body}</p>
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
            <p className="mt-2 text-sm text-slate-400">
              Operational control for modern lottery retailers.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Product</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-400">
              <li>
                <a href="#features" className="hover:text-white">Features</a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white">Pricing</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white">FAQ</a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Trust</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-400">
              <li>
                <a href="/privacy" className="hover:text-white">Privacy Policy</a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white">Terms of Service</a>
              </li>
              <li>support@lottotally.com</li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  );
}
