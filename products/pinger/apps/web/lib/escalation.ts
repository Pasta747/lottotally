import type { PreflightCheck, CheckStatus } from "@/lib/revenue-ops";

const DEFAULT_OWNER = process.env.ALERT_EMAIL_TO ?? "mario@pingerhq.com";

const OWNER_BY_CHECK: Record<string, string> = {
  env: process.env.ESCALATION_OWNER_ENV ?? DEFAULT_OWNER,
  "worker-freshness": process.env.ESCALATION_OWNER_WORKER ?? DEFAULT_OWNER,
  "stripe-webhook-freshness": process.env.ESCALATION_OWNER_STRIPE ?? DEFAULT_OWNER,
  posthog: process.env.ESCALATION_OWNER_POSTHOG ?? DEFAULT_OWNER,
};

export function buildEscalationRecipients(checks: PreflightCheck[], preflightStatus: CheckStatus) {
  if (preflightStatus === "pass") return [];

  const actionable = checks.filter((c) => c.status === "fail" || (preflightStatus === "warn" && c.status === "warn"));

  const recipients = new Set<string>();
  for (const check of actionable) {
    recipients.add(OWNER_BY_CHECK[check.key] ?? DEFAULT_OWNER);
  }

  return Array.from(recipients);
}
