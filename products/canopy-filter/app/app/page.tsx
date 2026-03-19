import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { PricingCheckout } from "@/components/landing/pricing-checkout";
import { db, ensureTables } from "@/lib/db";

type Connection = {
  channel_title: string;
  subscriber_count: string | null;
  recent_videos: Array<{ id: string; title: string; publishedAt: string; thumbnail: string | null }> | null;
};

function formatSubscribers(value: string | null) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat().format(n);
}

async function getConnection() {
  const cookieStore = await cookies();
  const creatorId = cookieStore.get("canopy_creator_id")?.value;
  if (!creatorId) return null;

  await ensureTables();
  const result = await db().query(
    `SELECT channel_title, subscriber_count, recent_videos
     FROM canopy_youtube_connections
     WHERE creator_id = $1`,
    [creatorId]
  );

  return (result.rows[0] as Connection | undefined) ?? null;
}

export default async function Home() {
  const connection = await getConnection();

  return (
    <main className="bg-[#FAF9F5] text-[#1F2C24]">
      <section className="mx-auto max-w-6xl space-y-12 px-6 py-16 md:px-10 md:py-20">
        <header className="sticky top-0 z-40 -mx-6 flex items-center justify-between border-b border-[#D9E2DA] bg-[#FAF9F5]/90 px-6 py-4 backdrop-blur md:-mx-10 md:px-10">
          <div className="flex items-center gap-3">
            <Image src="/brand/canopy-logo.png" alt="Canopy logo" width={44} height={44} />
            <span className="text-sm font-semibold tracking-[0.08em] text-[#355F44]">CANOPY FILTER</span>
          </div>
          <nav className="hidden items-center gap-4 text-sm text-[#4D5E52] md:flex">
            <a href="#features" className="hover:text-[#1F2C24]">Features</a>
            <a href="#pricing" className="hover:text-[#1F2C24]">Pricing</a>
            <a href="#start-free" className="hover:text-[#1F2C24]">Start free</a>
          </nav>
          <Link
            href="#pricing"
            className="rounded-md bg-[#355F44] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2B4E38]"
          >
            Upgrade
          </Link>
        </header>

        <div className="space-y-5">
          <h1 className="max-w-4xl text-4xl leading-tight md:text-6xl">Engage with your community on your terms.</h1>
          <p className="max-w-3xl text-lg text-[#4D5E52] md:text-xl">
            Canopy removes the comments designed to sting — and surfaces the conversation your community is actually having.
            You stay in it. You just stop dreading it.
          </p>
        </div>

        <section className="rounded-3xl border border-[#D9E2DA] bg-white p-6 shadow-[0_6px_20px_rgba(31,44,36,0.05)] md:p-8">
          <h2 className="text-xl font-semibold text-[#355F44]">Set it up once. Feel the difference right away.</h2>
          {!connection ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/api/youtube/connect"
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#355F44] px-5 font-semibold text-white transition hover:bg-[#2B4E38] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(53,95,68,0.18)]"
              >
                Get started fast.
              </a>
              <p className="text-sm text-[#4D5E52]">Start with YouTube today. Additional platform support is rolling out next. Setup is quick.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-[#D9E2DA] bg-[#FAF9F5] p-4">
                <p className="text-sm text-[#4D5E52]">Connected channel</p>
                <p className="text-lg font-semibold">{connection.channel_title}</p>
                <p className="text-sm text-[#4D5E52]">{formatSubscribers(connection.subscriber_count)} subscribers</p>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-[#355F44]">Recent videos</p>
                <ul className="grid gap-2 md:grid-cols-2">
                  {(connection.recent_videos ?? []).map((video) => (
                    <li key={video.id} className="rounded-2xl border border-[#D9E2DA] bg-white p-3 text-sm">
                      <p className="font-medium">{video.title}</p>
                      <p className="text-[#4D5E52]">{video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : ""}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex rounded-md bg-[#355F44] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2B4E38] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(53,95,68,0.18)]"
              >
                Open Dashboard
              </Link>
            </div>
          )}
        </section>

        <section id="features" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-[#D9E2DA] bg-white p-6 shadow-[0_6px_20px_rgba(31,44,36,0.05)]">
            <h3 className="font-semibold">Multi-platform, rolling out</h3>
            <p className="mt-2 text-sm text-[#4D5E52]">Start with YouTube now. Podcast and additional social integrations are rolling out next.</p>
          </div>
          <div className="rounded-3xl border border-[#D9E2DA] bg-white p-6 shadow-[0_6px_20px_rgba(31,44,36,0.05)]">
            <h3 className="font-semibold">Weekly community digest — rolling out in beta</h3>
            <p className="mt-2 text-sm text-[#4D5E52]">A simple summary of what your community is actually talking about: top themes, standout comments, and questions worth answering.</p>
          </div>
          <div className="rounded-3xl border border-[#D9E2DA] bg-white p-6 shadow-[0_6px_20px_rgba(31,44,36,0.05)]">
            <h3 className="font-semibold">Response drafts in your voice — coming soon</h3>
            <p className="mt-2 text-sm text-[#4D5E52]">Soon, Canopy will help you draft replies in your voice so staying engaged takes less energy.</p>
          </div>
        </section>

        <section className="rounded-3xl border border-[#D9E2DA] bg-[#EEF4EF] p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-[#355F44]">Filtering defaults</h2>
          <ul className="mt-3 space-y-2 text-sm text-[#1F2C24]">
            <li>Appearance attacks — ❌ (filtered by default)</li>
            <li>Sexual harassment — ❌ (filtered by default)</li>
          </ul>
          <p className="mt-3 text-sm text-[#4D5E52]">Appearance attacks and sexual harassment are filtered by default in every mode. Some things don&apos;t need your attention.</p>
        </section>

        <section className="rounded-3xl border border-[#D9E2DA] bg-white p-6 shadow-[0_6px_20px_rgba(31,44,36,0.05)] md:p-8">
          <h2 className="text-2xl font-semibold text-[#355F44]">Built with creator input.</h2>
          <p className="mt-2 text-[#4D5E52]">Canopy was shaped by conversations with female creators who wanted to stay close to their community without having to absorb every comment written to sting.</p>
          <p className="mt-2 text-sm text-[#4D5E52]">Real customer quotes will go here once beta creators have used the product long enough to speak from experience.</p>
        </section>

        <section className="rounded-3xl border border-[#D9E2DA] bg-white p-6 shadow-[0_6px_20px_rgba(31,44,36,0.05)] md:p-8">
          <h2 className="text-2xl font-semibold text-[#355F44]">FAQ</h2>
          <p className="mt-2 text-[#4D5E52]">
            YouTube&apos;s tools block keywords you anticipated. Canopy reads intent and tone — it knows the difference between a comment that disagrees with you and one that was written to make you quit. It starts with YouTube and expands from there, while giving you a cleaner way to review and engage with the conversation that matters. YouTube&apos;s filter is a bouncer. Canopy is a better front door.
          </p>
        </section>

        <section id="start-free" className="rounded-3xl border border-[#D9E2DA] bg-white p-6 shadow-[0_6px_20px_rgba(31,44,36,0.05)] md:p-8">
          <h2 className="text-2xl font-semibold text-[#355F44]">Start free.</h2>
          <p className="mt-2 max-w-2xl text-[#4D5E52]">Join the free tier now, connect YouTube, and start filtering comments immediately. Upgrade to paid plans when you want higher limits and team workflows.</p>
          <div className="mt-4">
            <WaitlistForm />
          </div>
          <p className="mt-3 text-sm text-[#4D5E52]">No credit card required for free tier.</p>
        </section>

        <PricingCheckout />

        <section className="rounded-3xl border border-[#355F44] bg-[#355F44] p-6 text-white shadow-[0_10px_30px_rgba(31,44,36,0.25)] md:p-8">
          <h2 className="text-2xl font-semibold">Keep your energy for creators, not comment triage.</h2>
          <p className="mt-2 max-w-2xl text-[#DDE8DF]">Connect YouTube, review what matters, and let Canopy filter the rest.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="/api/youtube/connect" className="rounded-md bg-white px-4 py-2 font-semibold text-[#355F44]">Connect YouTube</a>
            <a href="#pricing" className="rounded-md border border-white/40 px-4 py-2 font-semibold text-white">View paid plans</a>
          </div>
        </section>
      </section>
    </main>
  );
}
