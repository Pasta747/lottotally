import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";
import { planFromPriceId } from "@/lib/billing";
import { trackFunnelEvent } from "../../../../lib/analytics";

function toDate(ts?: number | null): Date | null {
  if (!ts) return null;
  return new Date(ts * 1000);
}

async function applySubscriptionUpdate(
  event: Stripe.Event,
  subscriptionInput: Stripe.Subscription,
  fallbackAgencyId?: string,
) {
  const subscription = subscriptionInput;

  const agencyId =
    (subscription.metadata?.agencyId as string | undefined) ||
    fallbackAgencyId ||
    (await prisma.subscription
      .findFirst({
        where: { stripeSubscriptionId: subscription.id },
        select: { agencyId: true },
      })
      .then((s: { agencyId: string | null } | null) => s?.agencyId));

  if (!agencyId) {
    return NextResponse.json({ received: true, ignored: `missing agencyId metadata for ${event.id}` });
  }

  const item = subscription.items.data[0];
  const priceId = item?.price?.id;
  const plan = planFromPriceId(priceId);
  const periodStart = item?.current_period_start ?? null;
  const periodEnd = item?.current_period_end ?? null;

  await prisma.subscription.upsert({
    where: { agencyId },
    create: {
      agencyId,
      plan,
      status: subscription.status,
      stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : null,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: toDate(periodStart),
      currentPeriodEnd: toDate(periodEnd),
    },
    update: {
      plan,
      status: subscription.status,
      stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : null,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: toDate(periodStart),
      currentPeriodEnd: toDate(periodEnd),
    },
  });

  if (plan !== "FREE" && ["active", "trialing"].includes(subscription.status)) {
    await trackFunnelEvent({
      event: "subscription_activated",
      agencyId,
      source: "stripe_webhook",
      metadata: { plan, status: subscription.status, eventType: event.type },
    }).catch(() => undefined);
  }

  return null;
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
  }

  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, getStripeWebhookSecret());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid signature" },
      { status: 400 },
    );
  }

  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        eventId: event.id,
        type: event.type,
      },
    });
  } catch (error) {
    const maybeCode =
      typeof error === "object" && error && "code" in error
        ? String((error as { code?: string }).code)
        : undefined;

    if (maybeCode === "P2002") {
      return NextResponse.json({ received: true, duplicate: true });
    }

    throw error;
  }

  try {
    const stripe = getStripe();

    if (
      event.type === "checkout.session.completed" ||
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const subscription =
        event.type === "checkout.session.completed"
          ? await (async () => {
              const checkout = event.data.object as Stripe.Checkout.Session;
              if (!checkout.subscription || typeof checkout.subscription !== "string") {
                return null;
              }
              return stripe.subscriptions.retrieve(checkout.subscription);
            })()
          : (event.data.object as Stripe.Subscription);

      if (subscription) {
        const fallbackAgencyId =
          event.type === "checkout.session.completed"
            ? ((event.data.object as Stripe.Checkout.Session).metadata?.agencyId as string | undefined)
            : undefined;

        const early = await applySubscriptionUpdate(event, subscription, fallbackAgencyId);
        if (early) return early;
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const agencyId =
        (subscription.metadata?.agencyId as string | undefined) ||
        (await prisma.subscription
          .findFirst({ where: { stripeSubscriptionId: subscription.id }, select: { agencyId: true } })
          .then((s: { agencyId: string | null } | null) => s?.agencyId));

      if (agencyId) {
        await prisma.subscription.upsert({
          where: { agencyId },
          create: {
            agencyId,
            plan: "FREE",
            status: "canceled",
            stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : null,
            stripeSubscriptionId: subscription.id,
          },
          update: {
            plan: "FREE",
            status: "canceled",
            stripeSubscriptionId: subscription.id,
          },
        });
      }
    }

    await prisma.stripeWebhookEvent.update({
      where: { eventId: event.id },
      data: { processedAt: new Date() },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    await prisma.stripeWebhookEvent.delete({ where: { eventId: event.id } }).catch(() => undefined);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 500 },
    );
  }
}
