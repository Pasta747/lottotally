# Pinger Ops Runbook

## Scope
Operational runbook for:
- preflight checks
- digest job
- worker checks cron
- required secrets
- common failure troubleshooting

---

## 1) Preflight Checks

Endpoint:
- `GET /api/ops/preflight`
- Auth: `Authorization: Bearer $CRON_SECRET` or `x-worker-secret: $CRON_SECRET`

Example:
```bash
curl "$APP_URL/api/ops/preflight" -H "authorization: Bearer $CRON_SECRET"
```

Expected output:
- `status`: `pass | warn | fail`
- checks include:
  - env completeness
  - worker freshness (`last check <=10m pass`, `<=30m warn`, else fail)
  - Stripe webhook freshness
  - PostHog configured

### Preflight Required Env
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CRON_SECRET`
- `POSTHOG_API_KEY`
- `POSTHOG_HOST`

---

## 2) Digest Job

Endpoint:
- `GET /api/ops/digest`
- Auth: same as preflight

Example:
```bash
curl "$APP_URL/api/ops/digest" -H "authorization: Bearer $CRON_SECRET"
```

Behavior:
- computes 24h KPIs (new signups, paid conversions, incidents)
- appends preflight check lines
- sends daily digest email
- sends escalation emails when preflight is `warn`/`fail` based on owner mapping

Recommended schedule:
- once daily, early morning local ops timezone

---

## 3) Worker Checks Cron

Endpoint:
- `GET` or `POST /api/worker/checks`
- Auth: `WORKER_SECRET` or `CRON_SECRET`

Example:
```bash
curl -X POST "$APP_URL/api/worker/checks" -H "x-worker-secret: $WORKER_SECRET"
```

Behavior summary:
- fetches all monitors
- runs HEAD request (fallback GET if 405/501)
- writes `check_results`
- updates monitor `status`, `consecutiveFails`, latest latency/status code
- opens incidents when monitor transitions to DOWN
- resolves incidents on recovery
- sends down/recovery emails

Recommended schedule:
- every minute (worker decides per-monitor interval internally)

---

## 4) Required Secrets / Config

Critical:
- `CRON_SECRET`
- `WORKER_SECRET` (optional if same as CRON_SECRET)
- `DATABASE_URL`

Billing:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- plan price IDs

Email:
- `AGENTMAIL_SUPPORT_INBOX`
- `AGENTMAIL_HELLO_INBOX`
- `AGENTMAIL_WEBHOOK_SECRET`
- `ALERT_EMAIL_TO`

Auth:
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

---

## 5) Troubleshooting

## A) `401 Unauthorized` on ops/worker endpoints
Checklist:
- confirm `CRON_SECRET` exists in runtime env
- confirm request sends exact bearer/header secret
- for worker: if using `WORKER_SECRET`, ensure runtime has same value

## B) Preflight returns `fail` for env
- inspect `checks` array for missing keys
- set missing env in deployment platform
- redeploy and rerun preflight

## C) `worker-freshness` failing
Symptoms:
- monitors exist but no recent checks

Fix:
- verify cron schedule is active
- manually trigger `/api/worker/checks`
- inspect response counts (`checked/down/up`)
- verify DB writes in `check_results`

## D) Stripe webhook freshness warn/fail
- verify Stripe webhook endpoint points to `/api/webhooks/stripe`
- verify signing secret (`STRIPE_WEBHOOK_SECRET`)
- verify event deliveries in Stripe dashboard
- replay failed events if needed

## E) Monitor marked DOWN unexpectedly
- inspect monitor `expectedStatusCode`
- validate target supports HEAD (if not, code falls back to GET)
- check timeout (`timeoutMs`) and transient network errors
- check historical `checkResults.error` values

## F) No incident/recovery emails
- verify AgentMail/API configuration
- verify `AGENTMAIL_SUPPORT_INBOX` and fallback recipient (`ALERT_EMAIL_TO`)
- verify owner membership exists for workspace (owner email used first)

## G) Duplicate webhook processing concerns
- Stripe events are deduped via unique `eventId`
- duplicates should return `{received:true, duplicate:true}`

---

## 6) Minimal SRE Verification Script

```bash
set -euo pipefail

curl -sf "$APP_URL/api/ops/preflight" -H "authorization: Bearer $CRON_SECRET" | jq .status
curl -sf -X POST "$APP_URL/api/worker/checks" -H "authorization: Bearer $CRON_SECRET" | jq '{checked,down,up}'
curl -sf "$APP_URL/api/ops/digest" -H "authorization: Bearer $CRON_SECRET" | jq '{ok,preflightStatus,recipient}'
```
