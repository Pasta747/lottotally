import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const ensureDefaultWorkspace = vi.fn();
const findFirst = vi.fn();
const count = vi.fn();
const createMonitor = vi.fn();

vi.mock("next-auth", () => ({ getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/bootstrap", () => ({ ensureDefaultWorkspace }));
vi.mock("@/lib/billing", () => ({ monitorLimitForPlan: () => 5 }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: { findFirst },
    monitor: { count, create: createMonitor, findMany: vi.fn() },
    statusPage: { findFirst: vi.fn() },
  },
}));

describe("POST /api/monitors entitlement", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("blocks monitor creation when plan limit reached", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1", email: "user@example.com" } });
    ensureDefaultWorkspace.mockResolvedValue({ projectId: "p1", agencyId: "a1" });
    findFirst.mockResolvedValue({ plan: "FREE" });
    count.mockResolvedValue(5);

    const { POST } = await import("../app/api/monitors/route");
    const req = new Request("http://localhost/api/monitors", {
      method: "POST",
      body: JSON.stringify({ name: "API", url: "https://api.example.com" }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("PLAN_LIMIT");
    expect(createMonitor).not.toHaveBeenCalled();
  });
});
