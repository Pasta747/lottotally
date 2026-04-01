import { NextResponse } from "next/server";
import Stripe from "stripe";

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "https://openclaw-pastaos.tail6d3ab7.ts.net";
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "0f4647e838a27dd741d8e2b4a9ccc88f0ee9b18469bb1f64";

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

async function sendRevenueAlert(email: string, amount: number, product: string): Promise<void> {
  const message = `💰 Payment Received\n\nCustomer: ${email}\nAmount: $${(amount / 100).toFixed(2)}\nProduct: ${product}\nTime: ${new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}`;

  try {
    await fetch(`${GATEWAY_URL}/api/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify({
        channel: "whatsapp",
        to: "+14083759119",
        message,
      }),
    });
    console.log(`[stripe-webhook] WhatsApp alert sent for ${email}`);
  } catch (err) {
    console.error(`[stripe-webhook] Failed to send WhatsApp alert:`, err);
  }
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const payload = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email || "N/A";
    const amount = session.amount_total || 0;
    const product = session.metadata?.productName || session.metadata?.product_id || "N/A";

    await sendRevenueAlert(email, amount, product);
  }

  return NextResponse.json({ received: true });
}
