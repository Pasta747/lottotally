import { NextResponse } from "next/server";
import { trackFunnelEvent } from "@/lib/analytics";

function clean(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const utm = {
      source: clean(body?.utm?.source),
      medium: clean(body?.utm?.medium),
      campaign: clean(body?.utm?.campaign),
      content: clean(body?.utm?.content),
      term: clean(body?.utm?.term),
    };

    await trackFunnelEvent({
      event: "visit_landing",
      source: "landing_page",
      metadata: {
        path: clean(body?.path) ?? "/",
        referrer: clean(body?.referrer),
        utmSource: utm.source,
        utmMedium: utm.medium,
        utmCampaign: utm.campaign,
        utmContent: utm.content,
        utmTerm: utm.term,
      },
    }).catch(() => undefined);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
