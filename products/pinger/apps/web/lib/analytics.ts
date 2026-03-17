import { prisma } from "@/lib/prisma";

type TrackFunnelInput = {
  event: string;
  userId?: string | null;
  agencyId?: string | null;
  source?: string | null;
  metadata?: Record<string, unknown>;
};

function posthogEnabled() {
  return Boolean(process.env.POSTHOG_API_KEY && process.env.POSTHOG_HOST);
}

async function capturePosthog(input: TrackFunnelInput) {
  if (!posthogEnabled()) return;

  const host = process.env.POSTHOG_HOST!;
  const apiKey = process.env.POSTHOG_API_KEY!;

  const distinctId = input.userId ?? input.agencyId ?? "anonymous";

  await fetch(`${host.replace(/\/$/, "")}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      event: input.event,
      distinct_id: distinctId,
      properties: {
        source: input.source,
        agencyId: input.agencyId,
        userId: input.userId,
        ...input.metadata,
      },
    }),
  });
}

export async function trackFunnelEvent(input: TrackFunnelInput) {
  await prisma.funnelEvent.create({
    data: {
      event: input.event,
      userId: input.userId ?? null,
      agencyId: input.agencyId ?? null,
      source: input.source ?? null,
      metadata: input.metadata !== undefined ? (input.metadata as never) : undefined,
    },
  });

  await capturePosthog(input);
}
