import { describe, expect, it } from "vitest";
import { buildDailyDigest, buildPreflightReport } from "../lib/revenue-ops";

describe("revenue ops preflight report", () => {
  it("fails when required env vars are missing", () => {
    const report = buildPreflightReport({
      now: new Date("2026-03-12T08:00:00.000Z"),
      monitorCount: 1,
      paidSubscriptionCount: 1,
      lastCheckAt: new Date("2026-03-12T07:58:00.000Z"),
      lastStripeWebhookAt: new Date("2026-03-12T07:00:00.000Z"),
      requiredEnv: {
        DATABASE_URL: "postgres://x",
        NEXTAUTH_SECRET: "secret",
        STRIPE_SECRET_KEY: undefined,
      },
    });

    expect(report.status).toBe("fail");
    const envCheck = report.checks.find((c) => c.key === "env");
    expect(envCheck?.status).toBe("fail");
  });

  it("warns when monitors are not fresh and there are no paid subscriptions", () => {
    const report = buildPreflightReport({
      now: new Date("2026-03-12T08:00:00.000Z"),
      monitorCount: 2,
      paidSubscriptionCount: 0,
      lastCheckAt: new Date("2026-03-12T07:40:00.000Z"),
      lastStripeWebhookAt: null,
      requiredEnv: {
        DATABASE_URL: "postgres://x",
        NEXTAUTH_SECRET: "secret",
        STRIPE_SECRET_KEY: "sk_test",
      },
    });

    expect(report.status).toBe("warn");
    const workerCheck = report.checks.find((c) => c.key === "worker-freshness");
    expect(workerCheck?.status).toBe("warn");
  });

  it("passes when env and freshness checks are healthy", () => {
    const report = buildPreflightReport({
      now: new Date("2026-03-12T08:00:00.000Z"),
      monitorCount: 3,
      paidSubscriptionCount: 2,
      lastCheckAt: new Date("2026-03-12T07:55:30.000Z"),
      lastStripeWebhookAt: new Date("2026-03-12T00:30:00.000Z"),
      requiredEnv: {
        DATABASE_URL: "postgres://x",
        NEXTAUTH_SECRET: "secret",
        STRIPE_SECRET_KEY: "sk_test",
        STRIPE_WEBHOOK_SECRET: "whsec",
        CRON_SECRET: "cron",
        POSTHOG_API_KEY: "phc_x",
        POSTHOG_HOST: "https://app.posthog.com",
      },
    });

    expect(report.status).toBe("pass");
    expect(report.checks.every((c) => c.status === "pass")).toBe(true);
  });

  it("builds digest subject with alert status", () => {
    const digest = buildDailyDigest({
      now: new Date("2026-03-12T08:00:00.000Z"),
      preflightStatus: "fail",
      monitorCount: 12,
      paidSubscriptionCount: 3,
      newUsers24h: 4,
      newPaid24h: 1,
      incidentsOpened24h: 2,
      incidentsResolved24h: 1,
    });

    expect(digest.subject).toContain("[ALERT]");
    expect(digest.text).toContain("New signups: 4");
    expect(digest.text).toContain("Paid subscriptions: 3");
  });
});
