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

export type PlanTier = "STARTER" | "PRO" | "MULTI";

export function getPriceId(plan: PlanTier): string {
  switch (plan) {
    case "STARTER":
      return requireEnv("STRIPE_PRICE_STARTER");
    case "PRO":
      return requireEnv("STRIPE_PRICE_PRO");
    case "MULTI":
      return requireEnv("STRIPE_PRICE_MULTI");
  }
}

export function planFromPriceId(priceId: string): PlanTier | null {
  const mapping: Record<string, PlanTier> = {
    [process.env.STRIPE_PRICE_STARTER ?? ""]: "STARTER",
    [process.env.STRIPE_PRICE_PRO ?? ""]: "PRO",
    [process.env.STRIPE_PRICE_MULTI ?? ""]: "MULTI",
  };
  return mapping[priceId] ?? null;
}
