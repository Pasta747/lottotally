type SubscriptionPlan = "FREE" | "FREELANCER" | "AGENCY" | "STUDIO" | "ENTERPRISE";

export const PLAN_MONITOR_LIMITS: Record<SubscriptionPlan, number> = {
  FREE: 5,
  FREELANCER: 25,
  AGENCY: 100,
  STUDIO: 500,
  ENTERPRISE: 5000,
};

export function monitorLimitForPlan(plan: SubscriptionPlan): number {
  return PLAN_MONITOR_LIMITS[plan] ?? PLAN_MONITOR_LIMITS.FREE;
}

export function isSubscriptionActive(status: string | null | undefined): boolean {
  if (!status) return false;
  return ["active", "trialing", "past_due"].includes(status);
}

export function planFromPriceId(priceId: string | null | undefined): SubscriptionPlan {
  const normalized = (priceId ?? "").toLowerCase();

  if (normalized === process.env.STRIPE_PRICE_FREELANCER?.toLowerCase()) return "FREELANCER";
  if (normalized === process.env.STRIPE_PRICE_AGENCY?.toLowerCase()) return "AGENCY";
  if (normalized === process.env.STRIPE_PRICE_STUDIO?.toLowerCase()) return "STUDIO";
  if (normalized === process.env.STRIPE_PRICE_ENTERPRISE?.toLowerCase()) return "ENTERPRISE";

  return "FREE";
}
