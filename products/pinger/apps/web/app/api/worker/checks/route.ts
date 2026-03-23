import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/email";
import { shouldRunMonitor, statusFromConsecutiveFails } from "@/lib/monitoring";

function isWorkerAuthorized(req: Request) {
  const explicitSecret = process.env.WORKER_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  const headerSecret = req.headers.get("x-worker-secret");
  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const acceptedSecrets = [explicitSecret, cronSecret].filter(Boolean);
  if (acceptedSecrets.length === 0) return false;

  return acceptedSecrets.includes(headerSecret ?? "") || acceptedSecrets.includes(bearer ?? "");
}

/** Max concurrent HTTP checks to avoid overwhelming the serverless function / target servers */
const CHECK_CONCURRENCY = 5;

async function runChecks(req: Request) {
  if (!isWorkerAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const monitors = await prisma.monitor.findMany({
    where: { status: { not: "PAUSED" } },
    include: {
      project: {
        include: {
          agency: {
            include: {
              memberships: {
                where: { role: "OWNER" },
                include: { user: { select: { email: true } } },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  // Pre-filter monitors that are due for a check to avoid processing unnecessary items
  const dueMonitors = monitors.filter((m) => shouldRunMonitor(m.interval, m.lastCheckedAt));

  const results: Array<{ id: string; ok: boolean }> = [];

  // Process monitors in bounded concurrency batches
  for (let i = 0; i < dueMonitors.length; i += CHECK_CONCURRENCY) {
    const batch = dueMonitors.slice(i, i + CHECK_CONCURRENCY);
    const batchResults = await Promise.allSettled(batch.map((monitor) => checkSingleMonitor(monitor)));
    for (const result of batchResults) {
      if (result.status === "fulfilled" && result.value) {
        results.push(result.value);
      }
    }
  }

  const down = results.filter((r) => !r.ok).length;
  return NextResponse.json({ ok: true, checked: results.length, down, up: results.length - down, results });
}

async function checkSingleMonitor(
  monitor: Awaited<ReturnType<typeof prisma.monitor.findMany>>[number] & {
    project: {
      agency: {
        memberships: Array<{ user: { email: string } | null }>;
      };
    };
  },
): Promise<{ id: string; ok: boolean }> {
  const started = Date.now();
  let ok = false;
  let statusCode: number | null = null;
  let error: string | null = null;

  try {
    const controller = new AbortController();
    const timeoutMs = Math.min(10_000, monitor.timeoutMs || 10_000);
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let res = await fetch(monitor.url, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-store",
      redirect: "follow",
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(monitor.url, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
        redirect: "follow",
      });
    }

    clearTimeout(timeout);
    statusCode = res.status;
    ok = res.status === monitor.expectedStatusCode;
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  const latencyMs = Date.now() - started;
  const nextFails = ok ? 0 : monitor.consecutiveFails + 1;
  const newStatus = statusFromConsecutiveFails(nextFails);

  const recipient =
    monitor.project.agency.memberships[0]?.user?.email ||
    process.env.ALERT_EMAIL_TO ||
    "mario@pingerhq.com";
  let sendDownAlert = false;
  let sendRecoveryAlert = false;
  let downMins = 0;

  await prisma.$transaction(async (tx) => {
    await tx.checkResult.create({
      data: {
        monitorId: monitor.id,
        ok,
        statusCode,
        latencyMs,
        error,
      },
    });

    const openIncident = await tx.incident.findFirst({
      where: { monitorId: monitor.id, resolvedAt: null },
      select: { id: true, startedAt: true },
    });

    await tx.monitor.update({
      where: { id: monitor.id },
      data: {
        status: newStatus,
        consecutiveFails: nextFails,
        lastStatusCode: statusCode,
        lastLatencyMs: latencyMs,
        lastCheckedAt: new Date(),
      },
    });

    if (newStatus === "DOWN" && !openIncident) {
      await tx.incident.create({
        data: {
          monitorId: monitor.id,
          title: `${monitor.name} is down`,
          status: "INVESTIGATING",
        },
      });
      sendDownAlert = true;
    }

    if (ok && openIncident) {
      await tx.incident.update({
        where: { id: openIncident.id },
        data: { status: "RESOLVED", resolvedAt: new Date() },
      });
      const downMs = Date.now() - new Date(openIncident.startedAt).getTime();
      downMins = Math.max(1, Math.round(downMs / 60000));
      sendRecoveryAlert = true;
    }
  });

  // Fire-and-forget email alerts (don't block the check loop)
  if (sendDownAlert) {
    sendTransactionalEmail({
      fromInbox: process.env.AGENTMAIL_SUPPORT_INBOX ?? "support@pingerhq.com",
      to: recipient,
      subject: `🔴 ${monitor.url} is down`,
      text: `🔴 ${monitor.url} is down — responded with ${statusCode ?? error ?? "error"} at ${new Date().toISOString()}`,
      labels: ["incident", "alert"],
    }).catch(() => undefined);
  }

  if (sendRecoveryAlert) {
    sendTransactionalEmail({
      fromInbox: process.env.AGENTMAIL_SUPPORT_INBOX ?? "support@pingerhq.com",
      to: recipient,
      subject: `🟢 ${monitor.url} recovered`,
      text: `🟢 ${monitor.url} is back up after ${downMins} minutes.`,
      labels: ["incident", "recovery"],
    }).catch(() => undefined);
  }

  return { id: monitor.id, ok };
}

export async function POST(req: Request) {
  return runChecks(req);
}

export async function GET(req: Request) {
  return runChecks(req);
}
