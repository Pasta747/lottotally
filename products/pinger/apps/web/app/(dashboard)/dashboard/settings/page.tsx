"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type BrandingState = {
  name: string;
  logoUrl: string;
  brandColor: string;
  slug: string;
};

const DEFAULTS: BrandingState = {
  name: "Client Status",
  logoUrl: "",
  brandColor: "#16a34a",
  slug: "",
};

export default function SettingsPage() {
  const [state, setState] = useState<BrandingState>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/status-page/branding", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.statusPage) {
        setState({
          name: data.statusPage.name ?? DEFAULTS.name,
          logoUrl: data.statusPage.logoUrl ?? "",
          brandColor: data.statusPage.brandColor ?? DEFAULTS.brandColor,
          slug: data.statusPage.slug ?? "",
        });
      }
      setLoading(false);
    })();
  }, []);

  async function onLogoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Logo must be 2MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setState((prev) => ({ ...prev, logoUrl: String(reader.result ?? "") }));
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/status-page/branding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: state.name,
        logoUrl: state.logoUrl,
        brandColor: state.brandColor,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error ?? "Failed to save settings");
      return;
    }

    setState((prev) => ({ ...prev, slug: data.statusPage?.slug ?? prev.slug }));
    setMessage("Branding saved.");
  }

  if (loading) {
    return <div className="rounded-xl border bg-white p-6">Loading settings…</div>;
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl border bg-white p-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-zinc-600">Agency and status page branding settings.</p>
      </header>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Status page branding</h2>
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Status page name</span>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={state.name}
              onChange={(e) => setState((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Client Status"
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-sm font-medium">Primary color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={state.brandColor}
                  onChange={(e) => setState((prev) => ({ ...prev, brandColor: e.target.value }))}
                  className="h-10 w-12 rounded border"
                />
                <input
                  className="w-full rounded-md border px-3 py-2 font-mono"
                  value={state.brandColor}
                  onChange={(e) => setState((prev) => ({ ...prev, brandColor: e.target.value }))}
                  pattern="^#[0-9a-fA-F]{6}$"
                  required
                />
              </div>
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium">Logo upload (2MB max)</span>
              <input type="file" accept="image/*" onChange={onLogoUpload} className="w-full rounded-md border px-3 py-2" />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Logo URL (optional)</span>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={state.logoUrl}
              onChange={(e) => setState((prev) => ({ ...prev, logoUrl: e.target.value }))}
              placeholder="https://... or upload above"
            />
          </label>

          {state.logoUrl ? (
            <div className="rounded-md border p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.logoUrl} alt="Logo preview" className="h-12 w-12 rounded object-cover" />
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-600">
              Public page: {state.slug ? <a className="underline" href={`/status/${state.slug}`} target="_blank" rel="noreferrer">/status/{state.slug}</a> : "Not created yet"}
            </p>
            <button type="submit" disabled={saving} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {saving ? "Saving…" : "Save branding"}
            </button>
          </div>

          {message ? <p className="text-sm text-zinc-700">{message}</p> : null}
        </form>
      </section>
    </div>
  );
}
