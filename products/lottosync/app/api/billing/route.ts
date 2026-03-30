import { NextResponse } from "next/server";
import { getPriceId, getStripe, planFromPriceId, type PlanTier } from "@/lib/stripe";
import { sql } from "@/lib/db";
import { getServerSession } from "next-auth"; // Import getServerSession
import { authOptions } from "@/lib/auth"; // Import authOptions
import type Stripe from "stripe";

const ALLOWED_PLANS = ["STARTER", "PRO", "MULTI"] as const;

export async function POST(req: Request) {
  try {
    const { plan, email } = await req.json();

    if (!ALLOWED_PLANS.includes(plan as PlanTier)) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    // Get user ID using getServerSession (requires user to be logged in)
    // For signup flow, email might be the only identifier if not yet logged in.
    // If the user is already logged in, use their session ID.
    // If it's a signup flow, we'll likely need to create a temporary user or link later.
    let userId: string | null = null;
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        userId = session.user.id;
      } else {
        // If not logged in, find user by email (assuming email is unique identifier)
        const userResult = await sql`SELECT id FROM lt_users WHERE email = ${email.toLowerCase()}`;
        if (userResult.length > 0) {
          userId = String(userResult[0].id);
        } else {
          // Handle case where user doesn't exist yet (e.g., during onboarding or signup)
          // This might require creating a provisional user record or linking later.
          // For now, we prevent checkout if user is not identifiable.
          console.warn("User not found for checkout:", email);
          return NextResponse.json({ error: "User not found. Please sign up or log in." }, { status: 400 });
        }
      }
    } catch (authError) {
      console.error("Auth error during checkout:", authError);
      return NextResponse.json({ error: "Authentication error. Please log in." }, { status: 401 });
    }

    if (!userId) {
        return NextResponse.json({ error: "Could not identify user for checkout." }, { status: 400 });
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"; // Fallback for local dev

    const priceId = getPriceId(plan as PlanTier);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      customer_email: email,
      metadata: {
        userId: userId, // Use the identified user ID
      },
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${appUrl}/pricing?checkout=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout session creation failed:", error);
    return NextResponse.json({ error: "Failed to create checkout session: " + error.message }, { status: 500 });
  }
}
