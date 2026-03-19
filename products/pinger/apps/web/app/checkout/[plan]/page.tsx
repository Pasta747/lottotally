"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const allowed = ["FREELANCER", "AGENCY", "STUDIO", "ENTERPRISE"] as const;

type PaidPlan = (typeof allowed)[number];

export default function CheckoutPlanPage() {
  const params = useParams<{ plan: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const plan = useMemo(() => {
    const upper = String(params?.plan || "").toUpperCase();
    return allowed.includes(upper as PaidPlan) ? (upper as PaidPlan) : null;
  }, [params?.plan]);

  useEffect(() => {
    if (!plan) {
      setError("Invalid plan");
      return;
    }

    (async () => {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.replace(`/signup?next=${encodeURIComponent(`/checkout/${plan}`)}`);
        return;
      }

      if (!res.ok || !data.url) {
        setError(data?.error ?? "Could not start checkout");
        return;
      }

      window.location.href = data.url;
    })();
  }, [plan, router]);

  return (
    <main className="min-h-screen bg-zinc-50 p-6 flex items-center justify-center">
      <div className="max-w-md rounded-xl border bg-white p-6 text-center">
        <h1 className="text-xl font-semibold">Preparing checkout…</h1>
        <p className="mt-2 text-zinc-600">Plan: {plan ?? "Unknown"}</p>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </main>
  );
}
