"use client";

import { useState } from "react";

const plans = [
  { id: "CREATOR", name: "Creator", price: "$24/mo", desc: "1 channel · 5k comments/mo" },
  { id: "PRO", name: "Pro", price: "$59/mo", desc: "1 channel · 50k comments/mo" },
  { id: "STUDIO", name: "Studio", price: "$169/mo", desc: "5 channels · team workflow" },
] as const;

export function PricingCheckout() {
  const [email, setEmail] = useState("");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: (typeof plans)[number]["id"]) {
    setLoadingPlan(plan);
    setError(null);

    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, email }),
    });
    const data = await res.json().catch(() => ({}));

    setLoadingPlan(null);

    if (!res.ok || !data.url) {
      setError(data?.error ?? "Could not start checkout");
      return;
    }

    window.location.href = data.url;
  }

  return (
    <section id="pricing" className="rounded-3xl border border-[#D9E2DA] bg-white p-6 shadow-[0_6px_20px_rgba(31,44,36,0.05)] md:p-8">
      <h2 className="text-2xl font-semibold text-[#355F44]">Upgrade when you’re ready</h2>
      <p className="mt-2 text-[#4D5E52]">Enter your email once, then choose a plan to launch Stripe checkout.</p>

      <input
        type="email"
        placeholder="you@channel.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-4 h-11 w-full rounded-md border border-[#D9E2DA] px-3 text-sm"
      />

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-2xl border border-[#D9E2DA] p-4">
            <p className="font-semibold">{plan.name}</p>
            <p className="mt-2 text-2xl font-bold">{plan.price}</p>
            <p className="mt-2 text-sm text-[#4D5E52]">{plan.desc}</p>
            <button
              onClick={() => startCheckout(plan.id)}
              disabled={loadingPlan !== null}
              className="mt-4 w-full rounded-md bg-[#355F44] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loadingPlan === plan.id ? "Opening..." : `Choose ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}
