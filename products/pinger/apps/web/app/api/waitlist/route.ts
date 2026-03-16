import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/email";
import { trackFunnelEvent } from "@/lib/analytics";

function cleanUtm(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function getUtmFromSearchParams(searchParams: URLSearchParams) {
  return {
    source: cleanUtm(searchParams.get("utm_source")),
    medium: cleanUtm(searchParams.get("utm_medium")),
    campaign: cleanUtm(searchParams.get("utm_campaign")),
    content: cleanUtm(searchParams.get("utm_content")),
    term: cleanUtm(searchParams.get("utm_term")),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const requestUrl = new URL(req.url);
    const referer = req.headers.get("referer");
    let refererUrl: URL | null = null;
    if (referer) {
      try {
        refererUrl = new URL(referer);
      } catch {
        refererUrl = null;
      }
    }

    const utmFromBody = {
      source: cleanUtm(body?.utm?.source),
      medium: cleanUtm(body?.utm?.medium),
      campaign: cleanUtm(body?.utm?.campaign),
      content: cleanUtm(body?.utm?.content),
      term: cleanUtm(body?.utm?.term),
    };

    const utmFromRequest = getUtmFromSearchParams(requestUrl.searchParams);
    const utmFromReferer = refererUrl ? getUtmFromSearchParams(refererUrl.searchParams) : utmFromRequest;

    const utm = {
      source: utmFromBody.source ?? utmFromRequest.source ?? utmFromReferer.source,
      medium: utmFromBody.medium ?? utmFromRequest.medium ?? utmFromReferer.medium,
      campaign: utmFromBody.campaign ?? utmFromRequest.campaign ?? utmFromReferer.campaign,
      content: utmFromBody.content ?? utmFromRequest.content ?? utmFromReferer.content,
      term: utmFromBody.term ?? utmFromRequest.term ?? utmFromReferer.term,
    };

    const signup = await prisma.waitlistSignup.upsert({
      where: { email },
      update: {},
      create: { email, source: "landing-page" },
    });

    await trackFunnelEvent({
      event: "waitlist_signup",
      source: "waitlist_api",
      metadata: {
        emailDomain: email.split("@")[1] ?? "unknown",
        utmSource: utm.source,
        utmMedium: utm.medium,
        utmCampaign: utm.campaign,
        utmContent: utm.content,
        utmTerm: utm.term,
      },
    }).catch(() => undefined);

    await sendTransactionalEmail({
      fromInbox: process.env.AGENTMAIL_HELLO_INBOX ?? "hello@pingerhq.com",
      to: email,
      subject: "You’re on the Pinger waitlist 🏓",
      text: "Thanks for joining the Pinger waitlist. We’ll send your early access invite soon.",
      html: "<p>Thanks for joining the <strong>Pinger</strong> waitlist 🏓.</p><p>We’ll send your early access invite soon.</p>",
      labels: ["waitlist", "confirmation"],
    });

    return NextResponse.json({ ok: true, id: signup.id });
  } catch (error) {
    console.error("waitlist signup failed", error);
    return NextResponse.json({ error: "Unable to submit waitlist request" }, { status: 500 });
  }
}
