import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { ensureDefaultWorkspace } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";
import { monitorLimitForPlan } from "@/lib/billing";

function asInterval(value: string) {
  return ["ONE_MINUTE", "FIVE_MINUTES", "FIFTEEN_MINUTES"].includes(value)
    ? (value as "ONE_MINUTE" | "FIVE_MINUTES" | "FIFTEEN_MINUTES")
    : "ONE_MINUTE";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, agencyId } = await ensureDefaultWorkspace(session.user.id, session.user.email);

  const statusPage = await prisma.statusPage.findFirst({ where: { agencyId }, select: { slug: true } });

  const monitors = await prisma.monitor.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      checkResults: {
        where: { checkedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        orderBy: { checkedAt: "desc" },
        take: 1200,
      },
    },
  });

  const now = Date.now();
  const since24h = new Date(now - 24 * 60 * 60 * 1000);
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const since30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const monitorDtos = monitors.map((monitor) => {
    const p24 = monitor.checkResults.filter((r) => r.checkedAt >= since24h);
    const p7 = monitor.checkResults.filter((r) => r.checkedAt >= since7d);
    const p30 = monitor.checkResults.filter((r) => r.checkedAt >= since30d);

    const uptimePct = (rows: typeof p24) => {
      if (rows.length === 0) return 100;
      const up = rows.filter((r) => r.ok).length;
      return Math.round((up / rows.length) * 10000) / 100;
    };

    const history24h = p24
      .slice()
      .reverse()
      .map((r) => ({
        t: r.checkedAt.toISOString(),
        ms: r.latencyMs,
        up: r.ok,
      }));

    return {
      ...monitor,
      uptime24h: uptimePct(p24),
      uptime7d: uptimePct(p7),
      uptime30d: uptimePct(p30),
      history24h,
    };
  });

  return NextResponse.json({ monitors: monitorDtos, statusPageUrl: statusPage ? `/status/${statusPage.slug}` : null });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const rawUrl = String(body?.url ?? "").trim();
  const inputUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
  let url = "";
  try {
    url = new URL(inputUrl).toString();
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  const name = String(body?.name ?? inputUrl).trim();
  const interval = asInterval(String(body?.interval ?? "ONE_MINUTE"));
  const expectedStatusCode = Number(body?.expectedStatusCode ?? 200);

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  const { projectId, agencyId } = await ensureDefaultWorkspace(session.user.id, session.user.email);

  const [subscription, monitorCount] = await Promise.all([
    prisma.subscription.findFirst({ where: { agencyId }, select: { plan: true } }),
    prisma.monitor.count({ where: { projectId } }),
  ]);

  const limit = monitorLimitForPlan(subscription?.plan ?? "FREE");
  if (monitorCount >= limit) {
    return NextResponse.json(
      {
        error: `Monitor limit reached (${limit}). Upgrade plan to add more monitors.`,
        code: "PLAN_LIMIT",
      },
      { status: 403 },
    );
  }

  const monitor = await prisma.monitor.create({
    data: {
      name,
      url,
      projectId,
      interval,
      expectedStatusCode: Number.isFinite(expectedStatusCode) ? expectedStatusCode : 200,
    },
  });

  return NextResponse.json({ monitor }, { status: 201 });
}
