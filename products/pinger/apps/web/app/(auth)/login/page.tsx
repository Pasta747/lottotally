"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  function nextPath() {
    if (typeof window === "undefined") return "/dashboard";
    return new URLSearchParams(window.location.search).get("next") || "/dashboard";
  }
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(nextPath());
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm"
      >
        <h1 className="text-2xl font-semibold">Sign in to Pinger</h1>
        <p className="text-sm text-zinc-600 mt-1">Uptime monitoring for agencies.</p>

        <div className="mt-6 space-y-4">
          <input
            className="w-full rounded-md border px-3 py-2"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full rounded-md border px-3 py-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            className="w-full rounded-md bg-black text-white py-2 font-medium disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>

        <p className="mt-4 text-sm text-zinc-600">
          New here? <a className="underline" href="/signup">Create account</a>
        </p>
      </form>
    </div>
  );
}
