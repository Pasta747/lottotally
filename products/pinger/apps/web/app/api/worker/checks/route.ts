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

async function runChecks(req: Request) {
  if (!isWorkerAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const monitors = await prisma.monitor.findMany({
    include: {
      project: {
        include: {
          agency: {
            include: {
              memberships: {
                where: { role: "OWNER" },
                include: { user: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  const results: Array<{ id: string; ok: boolean }> = [];

  for (const monitor of monitors) {
    if (!shouldRunMonitor(monitor.interval, monitor.lastCheckedAt)) continue;

    const started = Date.now();
    let ok = false;
    let statusCode: number | null = null;
    let error: string | null = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), Math.min(10_000, monitor.timeoutMs || 10_000));

      let res = await fetch(monitor.url, { method: "HEAD", signal: controller.signal, cache: "no-store" });
      if (res.status === 405 || res.status === 501) {
        res = await fetch(monitor.url, { method: "GET", signal: controller.signal, cache: "no-store" });
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

    const recipient = monitor.project.agency.memberships[0]?.user?.email || process.env.ALERT_EMAIL_TO || "mario@pingerhq.com";
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

      const openIncident = await tx.incident.findFirst({ where: { monitorId: monitor.id, resolvedAt: null } });

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

    if (sendDownAlert) {
      await sendTransactionalEmail({
        fromInbox: process.env.AGENTMAIL_SUPPORT_INBOX ?? "support@pingerhq.com",
        to: recipient,
        subject: `🔴 ${monitor.url} is down`,
        text: `🔴 ${monitor.url} is down — responded with ${statusCode ?? error ?? "error"} at ${new Date().toISOString()}`,
        labels: ["incident", "alert"],
      });
    }

    if (sendRecoveryAlert) {
      await sendTransactionalEmail({
        fromInbox: process.env.AGENTMAIL_SUPPORT_INBOX ?? "support@pingerhq.com",
        to: recipient,
        subject: `🟢 ${monitor.url} recovered`,
        text: `🟢 ${monitor.url} is back up after ${downMins} minutes.`,
        labels: ["incident", "recovery"],
      });
    }

    results.push({ id: monitor.id, ok });
  }

  const down = results.filter((r) => !r.ok).length;
  return NextResponse.json({ ok: true, checked: results.length, down, up: results.length - down, results });
}

export async function POST(req: Request) {
  return runChecks(req);
}

export async function GET(req: Request) {
  return runChecks(req);
}
