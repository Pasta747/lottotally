import { NextResponse } from "next/server";
import { db, ensureTables } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/email";

function isAuthorized(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const headerSecret = req.headers.get("x-worker-secret");
  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!cronSecret) return false;
  return headerSecret === cronSecret || bearer === cronSecret;
}

function asPercent(count: number, total: number) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureTables();

  const body = await req.json().catch(() => ({}));
  const creatorId = String(body?.creatorId ?? "").trim();
  const toEmail = String(body?.toEmail ?? process.env.CANOPY_DIGEST_FALLBACK_EMAIL ?? "").trim().toLowerCase();

  if (!creatorId) return NextResponse.json({ error: "creatorId is required" }, { status: 400 });
  if (!toEmail || !/^\S+@\S+\.\S+$/.test(toEmail)) {
    return NextResponse.json({ error: "toEmail is required" }, { status: 400 });
  }

  const connection = await db().query(
    `SELECT channel_title FROM canopy_youtube_connections WHERE creator_id = $1`,
    [creatorId]
  );

  if (!connection.rows.length) {
    return NextResponse.json({ error: "creator connection not found" }, { status: 404 });
  }

  const channelTitle = connection.rows[0].channel_title as string;

  const countsRes = await db().query(
    `SELECT category, COUNT(*)::int AS count
     FROM canopy_youtube_comments
     WHERE creator_id = $1
     GROUP BY category`,
    [creatorId]
  );

  const counts = { toxic: 0, spam: 0, constructive: 0, positive: 0 };
  for (const row of countsRes.rows as Array<{ category: keyof typeof counts; count: number }>) {
    if (row.category in counts) counts[row.category] = Number(row.count ?? 0);
  }

  const total = counts.toxic + counts.spam + counts.constructive + counts.positive;

  const highlightRes = await db().query(
    `SELECT author, text, category
     FROM canopy_youtube_comments
     WHERE creator_id = $1
       AND category IN ('positive','constructive')
     ORDER BY like_count DESC, published_at DESC NULLS LAST
     LIMIT 5`,
    [creatorId]
  );

  const highlights = highlightRes.rows as Array<{ author: string; text: string; category: string }>;

  const subject = `Canopy Digest: ${channelTitle}`;
  const text = [
    `Your latest Canopy digest for ${channelTitle}`,
    ``,
    `Total classified comments: ${total}`,
    `Positive: ${counts.positive} (${asPercent(counts.positive, total)}%)`,
    `Constructive: ${counts.constructive} (${asPercent(counts.constructive, total)}%)`,
    `Toxic: ${counts.toxic} (${asPercent(counts.toxic, total)}%)`,
    `Spam: ${counts.spam} (${asPercent(counts.spam, total)}%)`,
    ``,
    `Top comments worth reviewing:`,
    ...highlights.map((h, i) => `${i + 1}. [${h.category}] ${h.author}: ${h.text.slice(0, 180)}`),
    ``,
    `Open dashboard: https://canopyfilter.com/dashboard`,
  ].join("\n");

  const htmlHighlights = highlights
    .map((h) => `<li><strong>[${h.category}] ${h.author}</strong>: ${h.text.replace(/</g, "&lt;")}</li>`)
    .join("");

  const html = `
    <h2>Canopy Digest — ${channelTitle}</h2>
    <p>Total classified comments: <strong>${total}</strong></p>
    <ul>
      <li>Positive: <strong>${counts.positive}</strong> (${asPercent(counts.positive, total)}%)</li>
      <li>Constructive: <strong>${counts.constructive}</strong> (${asPercent(counts.constructive, total)}%)</li>
      <li>Toxic: <strong>${counts.toxic}</strong> (${asPercent(counts.toxic, total)}%)</li>
      <li>Spam: <strong>${counts.spam}</strong> (${asPercent(counts.spam, total)}%)</li>
    </ul>
    <h3>Top comments worth reviewing</h3>
    <ol>${htmlHighlights}</ol>
    <p><a href="https://canopyfilter.com/dashboard">Open dashboard</a></p>
  `;

  await sendTransactionalEmail({
    fromInbox: process.env.AGENTMAIL_HELLO_INBOX ?? "hello@canopyfilter.com",
    to: toEmail,
    subject,
    text,
    html,
    labels: ["canopy", "digest"],
  });

  return NextResponse.json({
    ok: true,
    creatorId,
    channelTitle,
    toEmail,
    total,
    counts,
    highlights: highlights.length,
  });
}
