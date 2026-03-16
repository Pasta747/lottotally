import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function getStripe(): Stripe {
  const secretKey = requireEnv("STRIPE_SECRET_KEY");

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  return requireEnv("STRIPE_WEBHOOK_SECRET");
}

export function getStripePriceId(plan: "FREELANCER" | "AGENCY" | "STUDIO" | "ENTERPRISE"): string {
  switch (plan) {
    case "FREELANCER":
      return requireEnv("STRIPE_PRICE_FREELANCER");
    case "AGENCY":
      return requireEnv("STRIPE_PRICE_AGENCY");
    case "STUDIO":
      return requireEnv("STRIPE_PRICE_STUDIO");
    case "ENTERPRISE":
      return requireEnv("STRIPE_PRICE_ENTERPRISE");
  }
}
