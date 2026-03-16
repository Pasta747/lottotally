import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const ensureDefaultWorkspace = vi.fn();
const findFirst = vi.fn();
const update = vi.fn();
const createCustomer = vi.fn();
const createCheckout = vi.fn();

vi.mock("next-auth", () => ({ getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/bootstrap", () => ({ ensureDefaultWorkspace }));
vi.mock("@/lib/prisma", () => ({ prisma: { subscription: { findFirst, update } } }));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    customers: { create: createCustomer },
    checkout: { sessions: { create: createCheckout } },
  }),
  getStripePriceId: (plan: string) => `price_${plan.toLowerCase()}`,
}));

describe("POST /api/billing/checkout", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXTAUTH_URL = "http://localhost:3000";
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSession.mockResolvedValue(null);
    const { POST } = await import("../app/api/billing/checkout/route");

    const res = await POST(new Request("http://localhost/api/billing/checkout", { method: "POST", body: JSON.stringify({ plan: "AGENCY" }) }));
    expect(res.status).toBe(401);
  });

  it("creates checkout session for valid plan", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1", email: "user@example.com" } });
    ensureDefaultWorkspace.mockResolvedValue({ agencyId: "a1" });
    findFirst.mockResolvedValue({ id: "sub1", stripeCustomerId: null });
    createCustomer.mockResolvedValue({ id: "cus_123" });
    createCheckout.mockResolvedValue({ url: "https://checkout.stripe.test/session" });

    const { POST } = await import("../app/api/billing/checkout/route");
    const res = await POST(new Request("http://localhost/api/billing/checkout", { method: "POST", body: JSON.stringify({ plan: "AGENCY" }) }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toContain("checkout.stripe");
    expect(createCheckout).toHaveBeenCalledOnce();
  });
});
