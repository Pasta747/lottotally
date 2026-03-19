import { NextResponse } from "next/server";
import { db, ensureTables } from "@/lib/db";

function isAuthorized(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const headerSecret = req.headers.get("x-worker-secret");
  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!cronSecret) return false;
  return headerSecret === cronSecret || bearer === cronSecret;
}

function checkEnv(name: string, value: string | undefined) {
  return { name, ok: !!value, message: value ? "set" : "missing" };
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureTables();

  const [waitlistCount, youtubeCount] = await Promise.all([
    db().query("SELECT COUNT(*)::int AS count FROM canopy_waitlist_signups"),
    db().query("SELECT COUNT(*)::int AS count FROM canopy_youtube_connections"),
  ]);

  const checks = [
    checkEnv("DATABASE_URL", process.env.DATABASE_URL),
    checkEnv("CRON_SECRET", process.env.CRON_SECRET),
    checkEnv("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY),
    checkEnv("STRIPE_PRICE_CREATOR", process.env.STRIPE_PRICE_CREATOR),
    checkEnv("STRIPE_PRICE_PRO", process.env.STRIPE_PRICE_PRO),
    checkEnv("STRIPE_PRICE_STUDIO", process.env.STRIPE_PRICE_STUDIO),
  ];

  const failed = checks.filter((c) => !c.ok);

  return NextResponse.json({
    status: failed.length ? "fail" : "pass",
    checks,
    metrics: {
      waitlistCount: waitlistCount.rows[0]?.count ?? 0,
      youtubeConnections: youtubeCount.rows[0]?.count ?? 0,
    },
  });
}
