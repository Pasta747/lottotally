export type CheckStatus = "pass" | "warn" | "fail";

export type PreflightInput = {
  now?: Date;
  monitorCount: number;
  paidSubscriptionCount: number;
  lastCheckAt: Date | null;
  lastStripeWebhookAt: Date | null;
  requiredEnv: Record<string, string | undefined>;
};

export type PreflightCheck = {
  key: string;
  status: CheckStatus;
  message: string;
};

export function buildPreflightReport(input: PreflightInput) {
  const now = input.now ?? new Date();
  const checks: PreflightCheck[] = [];

  const missingEnv = Object.entries(input.requiredEnv)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  checks.push({
    key: "env",
    status: missingEnv.length === 0 ? "pass" : "fail",
    message:
      missingEnv.length === 0
        ? "All required production env vars are set."
        : `Missing required env vars: ${missingEnv.join(", ")}`,
  });

  if (input.monitorCount === 0) {
    checks.push({
      key: "worker-freshness",
      status: "warn",
      message: "No monitors configured yet; worker freshness is not applicable.",
    });
  } else if (!input.lastCheckAt) {
    checks.push({
      key: "worker-freshness",
      status: "fail",
      message: "Monitors exist but no check results were recorded yet.",
    });
  } else {
    const ageMs = now.getTime() - input.lastCheckAt.getTime();
    const ageMin = Math.round(ageMs / 60000);

    checks.push({
      key: "worker-freshness",
      status: ageMs <= 10 * 60000 ? "pass" : ageMs <= 30 * 60000 ? "warn" : "fail",
      message: `Latest monitor check ran ${ageMin} minute(s) ago.`,
    });
  }

  if (input.paidSubscriptionCount === 0) {
    checks.push({
      key: "stripe-webhook-freshness",
      status: "warn",
      message: "No paid subscriptions yet; webhook freshness is informational.",
    });
  } else if (!input.lastStripeWebhookAt) {
    checks.push({
      key: "stripe-webhook-freshness",
      status: "fail",
      message: "Paid subscriptions exist but no Stripe webhook events were recorded.",
    });
  } else {
    const ageMs = now.getTime() - input.lastStripeWebhookAt.getTime();
    const ageHours = Math.round((ageMs / 3600000) * 10) / 10;
    checks.push({
      key: "stripe-webhook-freshness",
      status: ageMs <= 36 * 3600000 ? "pass" : "warn",
      message: `Latest Stripe webhook processed ${ageHours} hour(s) ago.`,
    });
  }

  const hasPosthog = Boolean(input.requiredEnv.POSTHOG_API_KEY && input.requiredEnv.POSTHOG_HOST);
  checks.push({
    key: "posthog",
    status: hasPosthog ? "pass" : "warn",
    message: hasPosthog
      ? "PostHog capture is configured."
      : "PostHog capture is not configured (POSTHOG_API_KEY/POSTHOG_HOST missing).",
  });

  const hasFail = checks.some((c) => c.status === "fail");
  const hasWarn = checks.some((c) => c.status === "warn");

  return {
    status: hasFail ? "fail" : hasWarn ? "warn" : "pass",
    checkedAt: now.toISOString(),
    checks,
  } as const;
}

export type DigestInput = {
  now?: Date;
  preflightStatus: CheckStatus;
  monitorCount: number;
  paidSubscriptionCount: number;
  newUsers24h: number;
  newPaid24h: number;
  incidentsOpened24h: number;
  incidentsResolved24h: number;
};

export function buildDailyDigest(input: DigestInput) {
  const now = input.now ?? new Date();
  const iso = now.toISOString();

  const subjectPrefix =
    input.preflightStatus === "fail"
      ? "ALERT"
      : input.preflightStatus === "warn"
        ? "WARN"
        : "OK";

  const subject = `Pinger Revenue Ops Daily Digest [${subjectPrefix}]`;

  const text = [
    `Checked at: ${iso}`,
    `Preflight status: ${input.preflightStatus.toUpperCase()}`,
    "",
    "Last 24h:",
    `- New signups: ${input.newUsers24h}`,
    `- New paid conversions: ${input.newPaid24h}`,
    `- Incidents opened: ${input.incidentsOpened24h}`,
    `- Incidents resolved: ${input.incidentsResolved24h}`,
    "",
    "Current state:",
    `- Active monitors: ${input.monitorCount}`,
    `- Paid subscriptions: ${input.paidSubscriptionCount}`,
  ].join("\n");

  return { subject, text };
}
