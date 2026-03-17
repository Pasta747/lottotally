"use client";

import { FormEvent, useState } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const params = new URLSearchParams(window.location.search);

    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        utm: {
          source: params.get("utm_source"),
          medium: params.get("utm_medium"),
          campaign: params.get("utm_campaign"),
          content: params.get("utm_content"),
          term: params.get("utm_term"),
        },
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessage(body.error ?? "Could not join waitlist");
      return;
    }

    setMessage("You’re in! Check your inbox for confirmation.");
    setEmail("");
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
      <input
        type="email"
        placeholder="you@creator.com"
        className="h-12 flex-1 rounded-md border border-[#D9E2DA] bg-white px-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(53,95,68,0.18)]"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button
        className="h-12 rounded-md bg-[#355F44] px-6 font-semibold text-white transition hover:bg-[#2B4E38] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(53,95,68,0.18)] disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Joining..." : "Start Free — No Credit Card"}
      </button>
      {message && <p className="text-sm text-[#4D5E52] sm:basis-full">{message}</p>}
    </form>
  );
}
