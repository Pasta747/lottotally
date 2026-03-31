"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function SignupClient() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", storeName: "", state: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Signup failed");
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">Start your 14-day free trial</h1>
        <input
          className="input"
          placeholder="Store name"
          value={form.storeName}
          onChange={(e) => setForm((s) => ({ ...s, storeName: e.target.value }))}
          required
        />
        <input
          className="input"
          placeholder="State (e.g., CA)"
          value={form.state}
          onChange={(e) => setForm((s) => ({ ...s, state: e.target.value }))}
          required
        />
        <input
          className="input"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
          required
        />
        <input
          className="input"
          placeholder="Password (min 8 chars)"
          type="password"
          value={form.password}
          onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
          required
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button disabled={loading} className="btn-primary w-full" type="submit">
          {loading ? "Creating account..." : "Create Account"}
        </button>
        <p className="text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-medium text-indigo-600" href="/login">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}
