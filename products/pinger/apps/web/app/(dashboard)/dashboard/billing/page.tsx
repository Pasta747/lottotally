"use client";

import { useState } from "react";

const plans = [
  { id: "FREELANCER", name: "Freelancer", monitors: 25 },
  { id: "AGENCY", name: "Agency", monitors: 100 },
  { id: "STUDIO", name: "Studio", monitors: 500 },
  { id: "ENTERPRISE", name: "Enterprise", monitors: 5000 },
] as const;

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<(typeof plans)[number]["id"]>("AGENCY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: selectedPlan }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok || !data.url) {
      setError(data?.error ?? "Could not start checkout");
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl border bg-white p-6">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="mt-1 text-zinc-600">Choose a plan and launch Stripe Checkout.</p>
      </header>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Plans</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {plans.map((plan) => (
            <label key={plan.id} className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">{plan.name}</p>
                <p className="text-sm text-zinc-500">Up to {plan.monitors} monitors</p>
              </div>
              <input
                type="radio"
                name="plan"
                checked={selectedPlan === plan.id}
                onChange={() => setSelectedPlan(plan.id)}
              />
            </label>
          ))}
        </div>

        <button
          className="mt-6 rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
          disabled={loading}
          onClick={startCheckout}
        >
          {loading ? "Starting checkout..." : "Continue to Checkout"}
        </button>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>
    </div>
  );
}
