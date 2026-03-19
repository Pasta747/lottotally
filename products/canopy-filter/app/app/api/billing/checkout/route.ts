import { NextResponse } from "next/server";
import { getPriceId, getStripe } from "@/lib/stripe";

const ALLOWED = ["CREATOR", "PRO", "STUDIO"] as const;
type PaidPlan = (typeof ALLOWED)[number];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const plan = String(body?.plan ?? "").toUpperCase() as PaidPlan;
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!ALLOWED.includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "https://canopyfilter.com";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: getPriceId(plan), quantity: 1 }],
      customer_email: email || undefined,
      allow_promotion_codes: true,
      success_url: `${appUrl}/dashboard?checkout=success&plan=${plan}`,
      cancel_url: `${appUrl}/?checkout=cancel&plan=${plan}`,
      metadata: {
        product: "canopy",
        plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout failed" }, { status: 500 });
  }
}
