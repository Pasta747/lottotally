export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="inline-block rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium">Private beta · Paper trading only</p>
        <h1 className="mt-6 text-5xl font-bold tracking-tight">Your AI prediction market agent.</h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-600">
          Vantage scans Kalshi markets, surfaces actionable same-day signals, and adapts strategy weights from real outcomes.
          Built for fast feedback cycles and disciplined paper testing.
        </p>
        <div className="mt-8 flex gap-3">
          <a className="rounded-lg bg-zinc-900 px-5 py-3 text-white" href="/signup">Join Beta</a>
          <a className="rounded-lg border border-zinc-300 px-5 py-3" href="#scan">See what we scan</a>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-10 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5"><h3 className="font-semibold">1) We scan</h3><p className="mt-2 text-sm text-zinc-600">Sports EV+, native Kalshi markets, and event-driven news catalysts.</p></div>
        <div className="rounded-xl border bg-white p-5"><h3 className="font-semibold">2) We score</h3><p className="mt-2 text-sm text-zinc-600">ATLAS Darwinian weighting boosts top-performing layers, categories, and sources.</p></div>
        <div className="rounded-xl border bg-white p-5"><h3 className="font-semibold">3) You decide</h3><p className="mt-2 text-sm text-zinc-600">Beta is approval-first in paper mode. Every trade is logged with outcome feedback.</p></div>
      </section>

      <section id="scan" className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="text-2xl font-semibold">What we scan on Kalshi</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {['Sports', 'Politics', 'Economics', 'Weather', 'Crypto', 'Entertainment'].map((x) => (
            <div key={x} className="rounded-lg border bg-white p-4 text-sm">{x}</div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-semibold">Beta disclaimer</p>
          <p className="mt-2 text-sm text-zinc-700">Paper trading only. Not financial advice. For testing and research purposes.</p>
        </div>
      </section>
    </main>
  );
}
