import { beforeEach, describe, expect, it, vi } from "vitest";

const constructEvent = vi.fn();
const retrieveSubscription = vi.fn();
const upsertSubscription = vi.fn();
const createEvent = vi.fn();
const updateEvent = vi.fn();
const deleteEvent = vi.fn();
const trackFunnelEvent = vi.fn();

vi.mock("@/lib/billing", () => ({ planFromPriceId: () => "AGENCY" }));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    webhooks: { constructEvent },
    subscriptions: { retrieve: retrieveSubscription },
  }),
  getStripeWebhookSecret: () => "whsec_test",
}));

vi.mock("@/lib/analytics", () => ({
  trackFunnelEvent,
}));
vi.mock("../lib/analytics", () => ({
  trackFunnelEvent,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    stripeWebhookEvent: { create: createEvent, update: updateEvent, delete: deleteEvent },
    subscription: { upsert: upsertSubscription, findFirst: vi.fn().mockResolvedValue(null) },
  },
}));

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    trackFunnelEvent.mockResolvedValue(undefined);
  });

  it("ignores duplicate webhook events", async () => {
    constructEvent.mockReturnValue({ id: "evt_1", type: "customer.subscription.updated", data: { object: {} } });
    createEvent.mockRejectedValue({ code: "P2002" });

    const { POST } = await import("../app/api/webhooks/stripe/route");
    const res = await POST(new Request("http://localhost/api/webhooks/stripe", { method: "POST", headers: { "stripe-signature": "sig" }, body: "{}" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.duplicate).toBe(true);
  });

  it("processes subscription.updated events", async () => {
    constructEvent.mockReturnValue({
      id: "evt_2",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_123",
          status: "active",
          customer: "cus_1",
          metadata: { agencyId: "agency_1" },
          items: { data: [{ price: { id: "price_unknown" }, current_period_start: 1700000000, current_period_end: 1700003600 }] },
        },
      },
    });
    createEvent.mockResolvedValue({ id: "w1" });

    const { POST } = await import("../app/api/webhooks/stripe/route");
    const res = await POST(new Request("http://localhost/api/webhooks/stripe", { method: "POST", headers: { "stripe-signature": "sig" }, body: "{}" }));

    expect(res.status).toBe(200);
    expect(upsertSubscription).toHaveBeenCalledOnce();
    expect(updateEvent).toHaveBeenCalledOnce();
  });

  it("captures payment/refund/dispute events to posthog funnel pipeline", async () => {
    constructEvent.mockReturnValue({
      id: "evt_3",
      type: "payment_intent.succeeded",
      data: {
        object: {
          amount: 7900,
          currency: "usd",
          description: "Pinger Studio",
          receipt_email: "buyer@example.com",
        },
      },
    });
    createEvent.mockResolvedValue({ id: "w2" });

    const { POST } = await import("../app/api/webhooks/stripe/route");
    const res = await POST(new Request("http://localhost/api/webhooks/stripe", { method: "POST", headers: { "stripe-signature": "sig" }, body: "{}" }));

    expect(res.status).toBe(200);
    expect(trackFunnelEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "stripe.payment_intent.succeeded",
        source: "stripe_webhook",
        metadata: expect.objectContaining({
          customerEmail: "buyer@example.com",
          productName: "Pinger Studio",
          amount: 7900,
          currency: "USD",
          amountDollars: 79,
        }),
      }),
    );
  });
});
