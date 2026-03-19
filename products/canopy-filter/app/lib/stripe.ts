import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function getStripe(): Stripe {
  const secretKey = requireEnv("STRIPE_SECRET_KEY");
  if (!stripeClient) stripeClient = new Stripe(secretKey);
  return stripeClient;
}

export function getPriceId(plan: "CREATOR" | "PRO" | "STUDIO") {
  switch (plan) {
    case "CREATOR":
      return requireEnv("STRIPE_PRICE_CREATOR");
    case "PRO":
      return requireEnv("STRIPE_PRICE_PRO");
    case "STUDIO":
      return requireEnv("STRIPE_PRICE_STUDIO");
  }
}
