import { randomUUID } from "crypto";
import { db, ensureTables } from "@/lib/db";

export async function trackFunnelEvent(input: {
  event: string;
  source?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await ensureTables();
  await db().query(
    `INSERT INTO canopy_funnel_events (id, event, source, metadata)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [randomUUID(), input.event, input.source ?? null, JSON.stringify(input.metadata ?? {})]
  );

  if (process.env.POSTHOG_API_KEY && process.env.POSTHOG_HOST) {
    await fetch(`${process.env.POSTHOG_HOST.replace(/\/$/, "")}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.POSTHOG_API_KEY,
        event: input.event,
        distinct_id: "anonymous",
        properties: { source: input.source, ...input.metadata },
      }),
    });
  }
}
