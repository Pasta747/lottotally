"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Password reset failed");
      }

      setMessage("If an account exists for this email, a password reset link has been sent.");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">Forgot Password?</h1>
        <p className="text-slate-600">Enter your email and we'll send you a link to reset your password.</p>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
          <input
            id="email"
            className="input"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}
        <button disabled={loading || !!message} className="btn-primary w-full" type="submit">
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
        <p className="text-center text-sm text-slate-600">
          Remember your password?{" "}
          <Link className="font-medium text-indigo-600" href="/login">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}
