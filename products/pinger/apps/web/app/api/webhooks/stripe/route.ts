import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";
import { planFromPriceId } from "@/lib/billing";
import { trackFunnelEvent } from "../../../../lib/analytics";

function stripeMoney(amount?: number | null, currency?: string | null) {
  if (typeof amount !== "number") return null;
  return {
    amount,
    currency: (currency ?? "usd").toUpperCase(),
    amountDollars: Number((amount / 100).toFixed(2)),
  };
}

function inferProductName(obj: Record<string, unknown> | null | undefined): string | null {
  if (!obj) return null;

  const metadata = (obj.metadata as Record<string, unknown> | undefined) ?? {};
  const fromMeta = metadata.product_name ?? metadata.product ?? metadata.plan;
  if (typeof fromMeta === "string" && fromMeta.trim()) return fromMeta;

  if (typeof obj.description === "string" && obj.description.trim()) {
    return obj.description;
  }

  return null;
}

async function captureStripeSignal(event: Stripe.Event) {
  if (!["payment_intent.succeeded", "charge.refunded", "charge.dispute.created"].includes(event.type)) {
    return;
  }

  const object = event.data.object as Record<string, unknown>;
  const amount = typeof object.amount === "number" ? object.amount : null;
  const currency = typeof object.currency === "string" ? object.currency : null;

  const customerEmail =
    (typeof object.receipt_email === "string" && object.receipt_email) ||
    (typeof object["customer_email"] === "string" && (object["customer_email"] as string)) ||
    null;

  const normalizedEvent = event.type === "charge.dispute.created" ? "dispute.created" : event.type;

  await trackFunnelEvent({
    event: `stripe.${normalizedEvent}`,
    source: "stripe_webhook",
    metadata: {
      stripeEventType: event.type,
      stripeEventId: event.id,
      customerEmail,
      productName: inferProductName(object),
      ...stripeMoney(amount, currency),
    },
  });
}

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

    await captureStripeSignal(event).catch(() => undefined);

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
