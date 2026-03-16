import { PrismaClient, IncidentStatus, MonitorInterval, MonitorStatus, MemberRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@smithdigital.com";
const DEMO_PASSWORD = "DemoPass123!";

const MONITORS = [
  {
    name: "Smith Digital Main Site",
    url: "https://smithdigital.com",
    status: MonitorStatus.UP,
    interval: MonitorInterval.ONE_MINUTE,
    expectedStatusCode: 200,
    avgLatency: 180,
    jitter: 35,
    fails24h: 2,
    uptimeTarget: "99.98%",
  },
  {
    name: "Smith Digital App",
    url: "https://app.smithdigital.com",
    status: MonitorStatus.UP,
    interval: MonitorInterval.ONE_MINUTE,
    expectedStatusCode: 200,
    avgLatency: 220,
    jitter: 45,
    fails24h: 4,
    uptimeTarget: "99.95%",
  },
  {
    name: "Smith Digital Blog",
    url: "https://blog.smithdigital.com",
    status: MonitorStatus.UP,
    interval: MonitorInterval.FIVE_MINUTES,
    expectedStatusCode: 200,
    avgLatency: 95,
    jitter: 22,
    fails24h: 0,
    uptimeTarget: "100%",
  },
  {
    name: "Client Storefront",
    url: "https://store.clientsite.com",
    status: MonitorStatus.DOWN,
    interval: MonitorInterval.ONE_MINUTE,
    expectedStatusCode: 200,
    avgLatency: 260,
    jitter: 50,
    fails24h: 112,
    uptimeTarget: "98.7%",
    downSinceMinutes: 12,
  },
  {
    name: "Acme Corporate Site",
    url: "https://www.acmecorp.io",
    status: MonitorStatus.UP,
    interval: MonitorInterval.ONE_MINUTE,
    expectedStatusCode: 200,
    avgLatency: 150,
    jitter: 28,
    fails24h: 1,
    uptimeTarget: "99.99%",
  },
];

const HISTORY_WINDOW_HOURS = 24;
const STEP_SECONDS = 10;
const POINTS = (HISTORY_WINDOW_HOURS * 60 * 60) / STEP_SECONDS;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickFailureIndexes({ points, fails, forcedDownTail = 0 }) {
  const failures = new Set();

  if (forcedDownTail > 0) {
    for (let i = points - forcedDownTail; i < points; i++) failures.add(i);
  }

  while (failures.size < Math.min(points, fails)) {
    const i = randomInt(0, points - forcedDownTail - 1);
    failures.add(i);
  }

  return failures;
}

function buildCheckResults(monitorSpec, now) {
  const forcedDownTail = monitorSpec.downSinceMinutes
    ? Math.floor((monitorSpec.downSinceMinutes * 60) / STEP_SECONDS)
    : 0;

  const failureIndexes = pickFailureIndexes({
    points: POINTS,
    fails: monitorSpec.fails24h,
    forcedDownTail,
  });

  const rows = [];
  for (let i = 0; i < POINTS; i++) {
    const checkedAt = new Date(now.getTime() - (POINTS - i) * STEP_SECONDS * 1000);
    const isDown = failureIndexes.has(i);

    const latencyBase = monitorSpec.avgLatency;
    const wave = Math.sin(i / 34) * (monitorSpec.jitter * 0.55);
    const jitter = randomInt(-monitorSpec.jitter, monitorSpec.jitter);
    const latencyMs = isDown ? null : clamp(Math.round(latencyBase + wave + jitter), 45, 1500);

    rows.push({
      ok: !isDown,
      statusCode: isDown ? (Math.random() > 0.5 ? 502 : 0) : monitorSpec.expectedStatusCode,
      latencyMs,
      error: isDown ? (Math.random() > 0.5 ? "Connection timeout" : "Bad gateway") : null,
      checkedAt,
    });
  }

  const successful = rows.filter((r) => r.ok).length;
  const uptime = Math.round((successful / rows.length) * 10000) / 100;

  return { rows, uptime };
}

async function createCheckResultsInBatches(monitorId, rows) {
  const batchSize = 1000;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize).map((r) => ({ ...r, monitorId }));
    await prisma.checkResult.createMany({ data: chunk });
  }
}

async function main() {
  const now = new Date();
  const passwordHash = await hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: "Smith Digital Ops", passwordHash },
    create: { email: DEMO_EMAIL, name: "Smith Digital Ops", passwordHash },
  });

  const agency = await prisma.agency.upsert({
    where: { slug: "smith-digital" },
    update: { name: "Smith Digital" },
    create: { name: "Smith Digital", slug: "smith-digital" },
  });

  await prisma.membership.upsert({
    where: { userId_agencyId: { userId: user.id, agencyId: agency.id } },
    update: { role: MemberRole.OWNER },
    create: { userId: user.id, agencyId: agency.id, role: MemberRole.OWNER },
  });

  const existingProject = await prisma.project.findFirst({
    where: { agencyId: agency.id },
    orderBy: { createdAt: "asc" },
  });

  const project = existingProject
    ? await prisma.project.update({
        where: { id: existingProject.id },
        data: { name: "Smith Digital Production" },
      })
    : await prisma.project.create({
        data: { agencyId: agency.id, name: "Smith Digital Production" },
      });

  // Remove existing demo monitor/incident/check history for a clean re-seed
  const existingMonitors = await prisma.monitor.findMany({ where: { projectId: project.id }, select: { id: true } });
  const monitorIds = existingMonitors.map((m) => m.id);

  if (monitorIds.length > 0) {
    await prisma.incident.deleteMany({ where: { monitorId: { in: monitorIds } } });
    await prisma.checkResult.deleteMany({ where: { monitorId: { in: monitorIds } } });
    await prisma.monitor.deleteMany({ where: { id: { in: monitorIds } } });
  }

  await prisma.statusPage.upsert({
    where: { slug: "smith-digital" },
    update: {
      agencyId: agency.id,
      name: "Smith Digital — System Status",
      brandColor: "#0f766e",
      isPublic: true,
    },
    create: {
      agencyId: agency.id,
      name: "Smith Digital — System Status",
      slug: "smith-digital",
      brandColor: "#0f766e",
      isPublic: true,
    },
  });

  const seeded = [];

  for (const spec of MONITORS) {
    const monitor = await prisma.monitor.create({
      data: {
        projectId: project.id,
        name: spec.name,
        url: spec.url,
        interval: spec.interval,
        expectedStatusCode: spec.expectedStatusCode,
        status: spec.status,
      },
    });

    const { rows, uptime } = buildCheckResults(spec, now);
    await createCheckResultsInBatches(monitor.id, rows);

    const lastSuccess = [...rows].reverse().find((r) => r.ok);
    const lastRow = rows[rows.length - 1];

    await prisma.monitor.update({
      where: { id: monitor.id },
      data: {
        status: spec.status,
        lastStatusCode: lastRow.statusCode || undefined,
        lastLatencyMs: spec.status === MonitorStatus.DOWN ? null : lastSuccess?.latencyMs ?? spec.avgLatency,
        lastCheckedAt: new Date(now.getTime() - randomInt(8, 35) * 1000),
        consecutiveFails: spec.status === MonitorStatus.DOWN ? Math.max(3, Math.floor((spec.downSinceMinutes ?? 1) * 6)) : 0,
      },
    });

    if (spec.status === MonitorStatus.DOWN) {
      const startedAt = new Date(now.getTime() - (spec.downSinceMinutes ?? 12) * 60 * 1000);
      await prisma.incident.create({
        data: {
          monitorId: monitor.id,
          title: "Storefront is unreachable — 2 alerts sent (Email + Slack)",
          status: IncidentStatus.INVESTIGATING,
          startedAt,
        },
      });
    }

    seeded.push({ url: spec.url, target: spec.uptimeTarget, actual: `${uptime}%`, status: spec.status });
  }

  console.log("\n✅ Demo data seeded for Pinger dashboard.");
  console.log(`Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log("Status page: /status/smith-digital\n");
  console.table(seeded);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
