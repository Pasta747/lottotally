import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/email";
import { buildEscalationRecipients } from "../../../../lib/escalation";
import { buildDailyDigest, buildPreflightReport } from "@/lib/revenue-ops";

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

  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    monitorCount,
    paidSubscriptionCount,
    latestCheck,
    latestWebhook,
    newUsers24h,
    newPaid24h,
    incidentsOpened24h,
    incidentsResolved24h,
  ] = await Promise.all([
    prisma.monitor.count(),
    prisma.subscription.count({ where: { plan: { not: "FREE" } } }),
    prisma.checkResult.findFirst({ orderBy: { checkedAt: "desc" }, select: { checkedAt: true } }),
    prisma.stripeWebhookEvent.findFirst({
      where: { processedAt: { not: null } },
      orderBy: { processedAt: "desc" },
      select: { processedAt: true },
    }),
    prisma.funnelEvent.count({ where: { event: "signup_completed", createdAt: { gte: since } } }),
    prisma.funnelEvent.count({ where: { event: "subscription_activated", createdAt: { gte: since } } }),
    prisma.incident.count({ where: { createdAt: { gte: since } } }),
    prisma.incident.count({ where: { resolvedAt: { gte: since } } }),
  ]);

  const preflight = buildPreflightReport({
    now,
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

  const digest = buildDailyDigest({
    now,
    preflightStatus: preflight.status,
    monitorCount,
    paidSubscriptionCount,
    newUsers24h,
    newPaid24h,
    incidentsOpened24h,
    incidentsResolved24h,
  });

  const recipient = process.env.ALERT_EMAIL_TO ?? "mario@pingerhq.com";

  const preflightLines = preflight.checks
    .map((check) => `- [${check.status.toUpperCase()}] ${check.key}: ${check.message}`)
    .join("\n");

  const digestBody = `${digest.text}\n\nPreflight checks:\n${preflightLines}`;

  await sendTransactionalEmail({
    fromInbox: process.env.AGENTMAIL_SUPPORT_INBOX ?? "support@pingerhq.com",
    to: recipient,
    subject: digest.subject,
    text: digestBody,
    labels: ["ops", "revenue", "digest"],
  });

  const escalationRecipients = buildEscalationRecipients(preflight.checks, preflight.status);
  for (const owner of escalationRecipients) {
    await sendTransactionalEmail({
      fromInbox: process.env.AGENTMAIL_SUPPORT_INBOX ?? "support@pingerhq.com",
      to: owner,
      subject: `[Pinger Escalation] ${preflight.status.toUpperCase()} preflight checks`,
      text: `Owner alert for ${owner}.\n\n${preflightLines}`,
      labels: ["ops", "revenue", "escalation"],
    });
  }

  return NextResponse.json({
    ok: true,
    recipient,
    preflightStatus: preflight.status,
    escalationsSent: escalationRecipients,
    digest,
  });
}
