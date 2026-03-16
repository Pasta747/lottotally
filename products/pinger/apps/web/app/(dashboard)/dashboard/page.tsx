"use client";

import { FormEvent, useEffect, useMemo, useReducer, useState } from "react";

type HistoryPoint = { t: string; ms?: number | null; up: boolean };

type Monitor = {
  id: string;
  name: string;
  url: string;
  status: "UP" | "DOWN" | "DEGRADED" | "PAUSED";
  interval: "ONE_MINUTE" | "FIVE_MINUTES" | "FIFTEEN_MINUTES";
  expectedStatusCode: number;
  lastLatencyMs?: number | null;
  lastCheckedAt?: string | null;
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
  history24h: HistoryPoint[];
};

type MonitorState = {
  monitors: Monitor[];
  statusPageUrl: string | null;
};

type MonitorAction =
  | { type: "loaded"; monitors: Monitor[]; statusPageUrl: string | null }
  | { type: "reset" };

function monitorReducer(_state: MonitorState, action: MonitorAction): MonitorState {
  switch (action.type) {
    case "loaded":
      return { monitors: action.monitors, statusPageUrl: action.statusPageUrl };
    case "reset":
      return { monitors: [], statusPageUrl: null };
  }
}

async function fetchMonitors(signal?: AbortSignal): Promise<MonitorState | null> {
  const res = await fetch("/api/monitors", { cache: "no-store", signal });
  if (!res.ok) return null;
  const data = await res.json();
  return { monitors: data.monitors, statusPageUrl: data.statusPageUrl };
}

function MiniChart({ points }: { points: HistoryPoint[] }) {
  if (!points?.length) return <p className="text-xs text-zinc-400">No data yet</p>;

  const recent = points.slice(-40);
  const max = Math.max(...recent.map((p) => p.ms || 0), 100);

  return (
    <div className="mt-2 flex h-14 items-end gap-[2px]">
      {recent.map((p, i) => {
        const h = p.ms ? Math.max(3, Math.round((p.ms / max) * 56)) : 3;
        return (
          <div
            key={`${p.t}-${i}`}
            className={p.up ? "bg-emerald-400/80" : "bg-red-400/90"}
            style={{ height: `${h}px`, width: "5px" }}
            title={`${new Date(p.t).toLocaleString()} • ${p.ms ?? "—"}ms • ${p.up ? "up" : "down"}`}
          />
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const [state, dispatch] = useReducer(monitorReducer, { monitors: [], statusPageUrl: null });
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [interval, setInterval] = useState<Monitor["interval"]>("ONE_MINUTE");
  const [expectedStatusCode, setExpectedStatusCode] = useState(200);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchMonitors(controller.signal).then((data) => {
      if (data) dispatch({ type: "loaded", ...data });
    });
    return () => controller.abort();
  }, [refreshKey]);

  function reload() {
    setRefreshKey((k) => k + 1);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/monitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || url, url, interval, expectedStatusCode }),
    });
    setLoading(false);
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setError(null);
      setName("");
      setUrl("");
      setInterval("ONE_MINUTE");
      setExpectedStatusCode(200);
      reload();
      return;
    }

    setError(data?.error ?? "Could not add monitor");
  }

  async function remove(id: string) {
    await fetch(`/api/monitors/${id}`, { method: "DELETE" });
    reload();
  }

  async function saveEdit(monitor: Monitor) {
    setLoading(true);
    await fetch(`/api/monitors/${monitor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: monitor.name,
        url: monitor.url,
        interval: monitor.interval,
        expectedStatusCode: monitor.expectedStatusCode,
      }),
    });
    setLoading(false);
    setEditingId(null);
    reload();
  }

  function updateMonitorLocal(id: string, patch: Partial<Monitor>) {
    dispatch({
      type: "loaded",
      statusPageUrl: state.statusPageUrl,
      monitors: state.monitors.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    });
  }

  const { monitors, statusPageUrl } = state;
  const upCount = useMemo(() => monitors.filter((m) => m.status === "UP").length, [monitors]);

  return (
    <div className="space-y-6">
      <header className="rounded-xl border bg-white p-6">
        <h1 className="text-2xl font-semibold">Pinger Dashboard</h1>
        <p className="text-zinc-600 mt-1">Add monitors, track uptime, and share status pages.</p>
        {statusPageUrl && (
          <a className="mt-3 inline-block text-sm font-medium underline" href={statusPageUrl} target="_blank" rel="noreferrer">
            Open public status page
          </a>
        )}
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-zinc-500">Total Monitors</p>
          <p className="text-3xl font-semibold mt-2">{monitors.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-zinc-500">Operational</p>
          <p className="text-3xl font-semibold mt-2">{upCount}</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-zinc-500">Down / Degraded</p>
          <p className="text-3xl font-semibold mt-2">{monitors.length - upCount}</p>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Add monitor</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-5" onSubmit={onSubmit}>
          <input
            className="rounded-md border px-3 py-2"
            placeholder="Client site name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-md border px-3 py-2"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <select
            className="rounded-md border px-3 py-2"
            value={interval}
            onChange={(e) => setInterval(e.target.value as Monitor["interval"])}
          >
            <option value="ONE_MINUTE">Every 1 min</option>
            <option value="FIVE_MINUTES">Every 5 min</option>
            <option value="FIFTEEN_MINUTES">Every 15 min</option>
          </select>
          <input
            className="rounded-md border px-3 py-2"
            type="number"
            min={100}
            max={599}
            value={expectedStatusCode}
            onChange={(e) => setExpectedStatusCode(Number(e.target.value))}
          />
          <button className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-60" disabled={loading}>
            {loading ? "Adding..." : "Add Monitor"}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Monitors</h2>
        <div className="mt-4 space-y-3">
          {monitors.length === 0 && <p className="text-sm text-zinc-500">No monitors yet.</p>}
          {monitors.map((m) => {
            const isEditing = editingId === m.id;
            return (
              <div key={m.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="w-full">
                    {isEditing ? (
                      <div className="grid gap-2 md:grid-cols-4">
                        <input className="rounded border px-2 py-1" value={m.name} onChange={(e) => updateMonitorLocal(m.id, { name: e.target.value })} />
                        <input className="rounded border px-2 py-1" value={m.url} onChange={(e) => updateMonitorLocal(m.id, { url: e.target.value })} />
                        <select className="rounded border px-2 py-1" value={m.interval} onChange={(e) => updateMonitorLocal(m.id, { interval: e.target.value as Monitor["interval"] })}>
                          <option value="ONE_MINUTE">1 min</option>
                          <option value="FIVE_MINUTES">5 min</option>
                          <option value="FIFTEEN_MINUTES">15 min</option>
                        </select>
                        <input className="rounded border px-2 py-1" type="number" value={m.expectedStatusCode} onChange={(e) => updateMonitorLocal(m.id, { expectedStatusCode: Number(e.target.value) })} />
                      </div>
                    ) : (
                      <>
                        <p className="font-medium">{m.name || m.url}</p>
                        <p className="text-sm text-zinc-500">{m.url}</p>
                      </>
                    )}

                    <p className="text-xs text-zinc-500 mt-1">
                      {m.lastLatencyMs ? `${m.lastLatencyMs}ms` : "—"} · Last checked {m.lastCheckedAt ? new Date(m.lastCheckedAt).toLocaleString() : "Not checked yet"}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      <span>24h uptime: <strong>{m.uptime24h}%</strong></span>
                      <span>7d: <strong>{m.uptime7d}%</strong></span>
                      <span>30d: <strong>{m.uptime30d}%</strong></span>
                    </div>

                    <MiniChart points={m.history24h} />
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        m.status === "UP"
                          ? "bg-emerald-100 text-emerald-700"
                          : m.status === "DEGRADED"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {m.status === "UP" ? "🟢 Up" : m.status === "DOWN" ? "🔴 Down" : "🟠 Degraded"}
                    </span>

                    {isEditing ? (
                      <>
                        <button className="text-sm text-blue-700" onClick={() => saveEdit(m)}>Save</button>
                        <button className="text-sm" onClick={() => setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="text-sm" onClick={() => setEditingId(m.id)}>Edit</button>
                    )}

                    <button className="text-sm text-red-600" onClick={() => remove(m.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
