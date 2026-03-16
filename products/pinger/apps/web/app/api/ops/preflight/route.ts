import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPreflightReport } from "@/lib/revenue-ops";

export const dynamic = "force-dynamic";

function isAuthorized(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const headerSecret = req.headers.get("x-worker-secret");
  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!cronSecret) return false;
  return headerSecret === cronSecret || bearer === cronSecret;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [monitorCount, paidSubscriptionCount, latestCheck, latestWebhook] = await Promise.all([
    prisma.monitor.count(),
    prisma.subscription.count({ where: { plan: { not: "FREE" } } }),
    prisma.checkResult.findFirst({ orderBy: { checkedAt: "desc" }, select: { checkedAt: true } }),
    prisma.stripeWebhookEvent.findFirst({
      where: { processedAt: { not: null } },
      orderBy: { processedAt: "desc" },
      select: { processedAt: true },
    }),
  ]);

  const report = buildPreflightReport({
    monitorCount,
    paidSubscriptionCount,
    lastCheckAt: latestCheck?.checkedAt ?? null,
    lastStripeWebhookAt: latestWebhook?.processedAt ?? null,
    requiredEnv: {
      DATABASE_URL: process.env.DATABASE_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      CRON_SECRET: process.env.CRON_SECRET,
      POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
      POSTHOG_HOST: process.env.POSTHOG_HOST,
    },
  });

  return NextResponse.json({
    ...report,
    metrics: {
      monitorCount,
      paidSubscriptionCount,
    },
  });
}
