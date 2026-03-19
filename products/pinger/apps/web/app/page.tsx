import Image from "next/image";
import Link from "next/link";
import { LandingVisitTracker } from "@/components/landing/landing-visit-tracker";

const faqs = [
  {
    q: "How is this different from UptimeRobot?",
    a: "Pinger is built for agencies, not just internal ops teams. You get uptime monitoring plus clean client-facing status pages that reduce support noise and help you communicate better during incidents.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes. Agency plans and above support custom domains for status pages.",
  },
  {
    q: "Can I remove Pinger branding?",
    a: "Yes. Studio and Enterprise plans support full white-label.",
  },
  {
    q: "What happens when a site goes down?",
    a: "Pinger detects the issue, alerts your team fast, and gives you a clear place to communicate status updates so clients know what’s happening without chasing you down.",
  },
];

const chipItems = ["1-minute checks", "Client-ready status pages", "White-label ready"];

function ScreenshotFrame({
  src,
  alt,
  caption,
  tilt = "",
}: {
  src: string;
  alt: string;
  caption?: string;
  tilt?: string;
}) {
  return (
    <div className="w-full">
      <div
        className={`rounded-3xl border border-[#E6E8EC] bg-[#FCFDFD] p-3 shadow-[0_16px_40px_rgba(16,24,40,0.12)] sm:p-4 ${tilt}`}
      >
        <Image
          src={src}
          alt={alt}
          width={2560}
          height={1600}
          className="h-auto w-full rounded-2xl border border-[#EAECF0]"
          priority={src === "/screenshots/status-page.png"}
        />
      </div>
      {caption ? <p className="mt-3 text-sm text-[#667085]">{caption}</p> : null}
    </div>
  );
}

function ProductSection({
  label,
  title,
  body,
  bullets,
  imageSrc,
  imageAlt,
  imageFirst = false,
  caption,
  tilt,
}: {
  label: string;
  title: string;
  body: string;
  bullets: string[];
  imageSrc: string;
  imageAlt: string;
  imageFirst?: boolean;
  caption?: string;
  tilt?: string;
}) {
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-2 lg:items-center">
      <div className={imageFirst ? "order-2 lg:order-1" : "order-1"}>
        <p className="text-sm font-medium text-[#667085]">{label}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
        <p className="mt-4 text-lg text-[#667085]">{body}</p>
        <ul className="mt-6 space-y-2 text-[#344054]">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#16C47F]" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={imageFirst ? "order-1 lg:order-2" : "order-2"}>
        <ScreenshotFrame src={imageSrc} alt={imageAlt} caption={caption} tilt={tilt} />
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-white text-[#111111]">
      <LandingVisitTracker />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-8 md:pt-10">
        <div className="flex items-center gap-3">
          <Image src="/brand/pinger-logo-32.png" alt="Pinger logo" width={40} height={40} className="h-10 w-10" />
          <span className="font-semibold tracking-tight">Pinger</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <Link href="/blog" className="rounded-md px-3 py-2 text-[#475467] transition hover:text-[#111111]">
            Blog
          </Link>
          <Link href="/login" className="rounded-md px-3 py-2 text-[#475467] transition hover:text-[#111111]">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-[#111111] px-4 py-2 text-white transition hover:bg-[#16C47F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(22,196,127,0.18)]"
          >
            Start Free
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-12 lg:grid-cols-[1fr_1.15fr] lg:items-center">
        <div>
          <p className="text-sm font-medium text-[#667085]">Monitoring for agencies</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
            The status page your clients check instead of texting you.
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-[#667085]">
            Pinger monitors every client site, alerts your team fast, and gives clients a clean status page they can trust —
            so you spend less time answering “is the site down?” and more time fixing it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-[#111111] px-5 py-3 text-white transition hover:bg-[#16C47F]"
            >
              Start Free
            </Link>
            <Link
              href="/checkout/AGENCY"
              className="rounded-md border border-[#D0D5DD] px-5 py-3 text-[#111111] transition hover:bg-[#F2F4F7]"
            >
              Start Paid Plan
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {chipItems.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-2 rounded-full border border-[#E6E8EC] bg-[#F7F8FA] px-3 py-1.5 text-sm text-[#344054]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#16C47F]" />
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <ScreenshotFrame
            src="/screenshots/status-page.png"
            alt="Branded Pinger status page showing incident updates for a client site"
            tilt="lg:rotate-[0.5deg]"
          />
          <span className="absolute right-6 top-6 rounded-full border border-[#DDE3E8] bg-white/95 px-3 py-1 text-xs font-medium text-[#344054] shadow-sm">
            Branded for your client
          </span>
        </div>
      </section>

      <ProductSection
        label="Dashboard"
        title="See everything at a glance."
        body="Track every client site in one view, spot issues fast, and know what needs attention without hopping between tools. Pinger gives your team a clear operating picture the moment something changes."
        bullets={[
          "All client monitors in one place",
          "Fast scan of uptime and current status",
          "Built for agencies managing multiple sites",
        ]}
        imageSrc="/screenshots/dashboard.png"
        imageAlt="Pinger dashboard showing multiple client monitors and uptime status"
        imageFirst
        tilt="lg:-rotate-[0.4deg]"
      />

      <ProductSection
        label="Status pages"
        title="Beautiful status pages your clients will love."
        body="Give every client a clean, branded place to check system health, follow incidents, and see updates without emailing your team for answers. When something breaks, clients stay informed and your agency looks prepared."
        bullets={[
          "Branded for your agency or client",
          "Clear incident updates and history",
          "A calmer client experience during outages",
        ]}
        imageSrc="/screenshots/status-page.png"
        imageAlt="Branded Pinger status page showing incident updates for a client site"
        caption="What your client sees during an incident"
        tilt="lg:rotate-[0.35deg]"
      />

      <ProductSection
        label="Alerts"
        title="Know before your clients do."
        body="Get alerted the moment a site has trouble so your team can investigate fast, update the client-facing status page, and stay one step ahead of the next “hey, our site is down” message."
        bullets={[
          "Immediate visibility when a monitor changes",
          "Investigate incidents without digging around",
          "Respond faster and look more proactive",
        ]}
        imageSrc="/screenshots/monitor-detail.png"
        imageAlt="Pinger monitor detail view showing an active incident and alert context"
        imageFirst
        tilt="lg:-rotate-[0.35deg]"
      />

      <section className="border-y border-[#E6E8EC] bg-[#F7F8FA]">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-3xl font-semibold tracking-tight">Built for agencies that want to look sharp when things break.</h2>
          <p className="mt-4 max-w-3xl text-[#667085]">
            We’re onboarding design partners now. Soon this section will feature agencies using Pinger to monitor client
            sites, reduce support noise, and give clients a better status experience.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {["Design partner spot", "Agency case study coming soon", "Early customer quote coming soon"].map((item) => (
              <div
                key={item}
                className="rounded-[20px] border border-[#E6E8EC] bg-white/70 p-6 text-[#667085] shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[20px] border border-[#E6E8EC] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <h3 className="font-semibold">1) Add your client sites</h3>
            <p className="mt-2 text-[#667085]">Paste in a URL and start monitoring in minutes.</p>
          </div>
          <div className="rounded-[20px] border border-[#E6E8EC] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <h3 className="font-semibold">2) Brand the status page</h3>
            <p className="mt-2 text-[#667085]">Add your logo, colors, and custom domain.</p>
          </div>
          <div className="rounded-[20px] border border-[#E6E8EC] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <h3 className="font-semibold">3) Share one client-ready link</h3>
            <p className="mt-2 text-[#667085]">Clients check the page instead of asking your team for updates.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="text-2xl font-semibold">Pricing</h2>
        <p className="mt-3 text-[#667085]">
          Start free, then upgrade when you need branded pages, more monitors, or full white-label.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {[
            ["Free", "$0", "3 sites", "/signup"],
            ["Freelancer", "$29", "10 sites", "/checkout/FREELANCER"],
            ["Agency", "$79", "30 sites", "/checkout/AGENCY"],
            ["Studio", "$179", "100 sites", "/checkout/STUDIO"],
            ["Enterprise", "$499+", "Unlimited", "/checkout/ENTERPRISE"],
          ].map(([name, price, sites, href]) => (
            <div key={name} className="rounded-[20px] border border-[#E6E8EC] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <p className="font-semibold">{name}</p>
              <p className="mt-2 text-3xl font-bold">{price}</p>
              <p className="mt-2 text-sm text-[#667085]">{sites}</p>
              <Link
                href={href}
                className="mt-4 inline-block rounded-md bg-[#111111] px-4 py-2 text-sm font-medium text-white hover:bg-[#16C47F]"
              >
                {name === "Free" ? "Start Free" : "Choose Plan"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20">
        <h2 className="text-2xl font-semibold">FAQ</h2>
        <div className="mt-6 space-y-4">
          {faqs.map((item) => (
            <div key={item.q} className="rounded-[20px] border border-[#E6E8EC] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <h3 className="font-semibold">{item.q}</h3>
              <p className="mt-2 text-[#667085]">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#E6E8EC]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-[#667085] sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Pinger</p>
          <p>X: @pingerhq · LinkedIn: Pinger</p>
        </div>
      </footer>
    </div>
  );
}
