import { NextResponse } from "next/server";
import { getStripe, planFromPriceId } from "@/lib/stripe";
import { sql } from "@/lib/db";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_email?.toLowerCase();
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

        if (!email || !customerId || !subscriptionId) {
          console.warn("checkout.session.completed missing email/customer/subscription", { email, customerId, subscriptionId });
          break;
        }

        // Retrieve subscription to get the price ID → plan tier
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = sub.items.data[0]?.price?.id;
        const plan = priceId ? (planFromPriceId(priceId) ?? "STARTER") : "STARTER";

        await sql`
          UPDATE lt_users
          SET stripe_customer_id = ${customerId},
              stripe_subscription_id = ${subscriptionId},
              plan = ${plan.toLowerCase()}
          WHERE email = ${email}
        `;
        console.log(`[webhook] checkout.session.completed: ${email} → plan=${plan}, customer=${customerId}`);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (!customerId) break;

        if (sub.status === "active" || sub.status === "trialing") {
          const priceId = sub.items.data[0]?.price?.id;
          const plan = priceId ? (planFromPriceId(priceId) ?? "starter") : "starter";
          await sql`
            UPDATE lt_users
            SET plan = ${plan.toLowerCase()},
                stripe_subscription_id = ${sub.id}
            WHERE stripe_customer_id = ${customerId}
          `;
          console.log(`[webhook] subscription updated: customer=${customerId} → plan=${plan}`);
        } else {
          // canceled, past_due, unpaid → downgrade to free
          await sql`
            UPDATE lt_users
            SET plan = 'free',
                stripe_subscription_id = NULL
            WHERE stripe_customer_id = ${customerId}
          `;
          console.log(`[webhook] subscription ${sub.status}: customer=${customerId} → free`);
        }
        break;
      }

      default:
        // Unhandled event type — safe to ignore
        break;
    }
  } catch (err: any) {
    console.error(`[webhook] Error processing ${event.type}:`, err.message);
    // Return 200 to Stripe so it doesn't retry, but log the error
  }

  return NextResponse.json({ received: true });
}
