"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 pb-8">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white text-2xl font-bold shadow-lg">
          L
        </div>
        <h1 className="text-2xl font-bold text-slate-900">LottoTally</h1>
      </div>

      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <input
              id="email"
              className="input"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
            <input
              id="password"
              className="input"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          disabled={loading}
          className="btn-primary w-full"
          type="submit"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div className="flex items-center justify-between text-sm">
          <Link className="font-medium text-indigo-600 hover:text-indigo-500" href="/signup">
            Start free trial
          </Link>
          <Link className="font-medium text-indigo-600 hover:text-indigo-500" href="/forgot-password">
            Forgot password?
          </Link>
        </div>
      </form>
    </main>
  );
}
