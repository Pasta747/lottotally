import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { sendTransactionalEmail } from "@/lib/email";
import { trackFunnelEvent } from "@/lib/analytics";
import { db, ensureTables } from "@/lib/db";

function cleanUtm(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const utm = {
      source: cleanUtm(body?.utm?.source),
      medium: cleanUtm(body?.utm?.medium),
      campaign: cleanUtm(body?.utm?.campaign),
      content: cleanUtm(body?.utm?.content),
      term: cleanUtm(body?.utm?.term),
    };

    await ensureTables();

    const inserted = await db().query(
      `INSERT INTO canopy_waitlist_signups (id, email, source, utm_source, utm_medium, utm_campaign, utm_content, utm_term)
       VALUES ($1,$2,'landing-page',$3,$4,$5,$6,$7)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      [randomUUID(), email, utm.source, utm.medium, utm.campaign, utm.content, utm.term]
    );

    await trackFunnelEvent({
      event: "canopy_waitlist_signup",
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
      fromInbox: process.env.AGENTMAIL_HELLO_INBOX ?? "hello@canopyfilter.com",
      to: email,
      subject: "You’re on the Canopy waitlist 🌿",
      text: "Thanks for joining the Canopy waitlist. We’ll send your early access invite soon.",
      html: "<p>Thanks for joining the <strong>Canopy</strong> waitlist 🌿.</p><p>We’ll send your early access invite soon.</p>",
      labels: ["waitlist", "confirmation"],
    });

    return NextResponse.json({ ok: true, id: inserted.rows[0]?.id ?? null });
  } catch (error) {
    console.error("waitlist signup failed", error);
    return NextResponse.json({ error: "Unable to submit waitlist request" }, { status: 500 });
  }
}
