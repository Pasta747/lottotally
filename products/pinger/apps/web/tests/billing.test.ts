import { describe, expect, it } from "vitest";
import { isSubscriptionActive, monitorLimitForPlan, planFromPriceId } from "../lib/billing";

describe("billing", () => {
  it("maps monitor limits by plan", () => {
    expect(monitorLimitForPlan("FREE")).toBe(5);
    expect(monitorLimitForPlan("AGENCY")).toBe(100);
    expect(monitorLimitForPlan("ENTERPRISE")).toBe(5000);
  });

  it("recognizes active statuses", () => {
    expect(isSubscriptionActive("active")).toBe(true);
    expect(isSubscriptionActive("trialing")).toBe(true);
    expect(isSubscriptionActive("canceled")).toBe(false);
  });

  it("derives plan from stripe price env mappings", () => {
    process.env.STRIPE_PRICE_AGENCY = "price_agency_123";
    expect(planFromPriceId("price_agency_123")).toBe("AGENCY");
    expect(planFromPriceId("unknown")).toBe("FREE");
  });
});
