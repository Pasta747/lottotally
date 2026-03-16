import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { ensureDefaultWorkspace } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";
import { getStripe, getStripePriceId } from "@/lib/stripe";
import { trackFunnelEvent } from "../../../../lib/analytics";

const ALLOWED_PLANS = ["FREELANCER", "AGENCY", "STUDIO", "ENTERPRISE"] as const;

type PaidPlan = (typeof ALLOWED_PLANS)[number];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const plan = String(body?.plan ?? "").toUpperCase() as PaidPlan;

    if (!ALLOWED_PLANS.includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = getStripePriceId(plan);
    const stripe = getStripe();
    const { agencyId } = await ensureDefaultWorkspace(session.user.id, session.user.email);

    const subscription = await prisma.subscription.findFirst({ where: { agencyId } });

    let customerId = subscription?.stripeCustomerId ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: { agencyId, userId: session.user.id },
      });
      customerId = customer.id;

      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { stripeCustomerId: customerId },
        });
      }
    }

    const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${appUrl}/dashboard/billing?checkout=success`,
      cancel_url: `${appUrl}/dashboard/billing?checkout=cancel`,
      metadata: { agencyId, plan },
    });

    if (!checkout.url) {
      return NextResponse.json({ error: "Stripe checkout URL missing" }, { status: 502 });
    }

    await trackFunnelEvent({
      event: "checkout_initiated",
      userId: session.user.id,
      agencyId,
      source: "billing_checkout_api",
      metadata: { plan, priceId },
    }).catch(() => undefined);

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
