# Pinger API Reference

Pinger is a SaaS uptime monitoring app with workspace isolation, monitor checks, incident lifecycle, status pages, and billing.

This document covers:
- product overview + architecture
- auth/session model + workspace scoping
- full reference for all routes under `app/api/*`

---

## Product Overview

Pinger lets customers:
- create monitors (URL + interval + expected status)
- run worker checks and track uptime
- receive incident alerts/recovery emails
- manage status-page branding
- subscribe to paid plans via Stripe
- run ops preflight + daily digest checks

### High-level Architecture

```mermaid
flowchart TD
  U[User Browser] --> N[Next.js App Router]
  N --> A[NextAuth Credentials + JWT Session]
  N --> API[API Routes app/api/*]
  API --> DB[(Postgres via Prisma)]
  API --> S[Stripe API]
  API --> M[AgentMail Email API]
  API --> P[PostHog Funnel Events]

  W[Cron/Worker] --> WC[/api/worker/checks]
  W --> OP[/api/ops/preflight]
  W --> OD[/api/ops/digest]
  WC --> DB
  OP --> DB
  OD --> DB
  OD --> M

  SW[Stripe Webhooks] --> WS[/api/webhooks/stripe]
  WS --> DB
```

---

## Auth Model

### Session/Auth
- Auth provider: **NextAuth Credentials** (`/api/auth/[...nextauth]`)
- Session strategy: **JWT** (`maxAge: 24h`)
- Login uses email/password against `User.passwordHash`
- Login rate-limit: in-memory, per email (5 attempts / 15 min)
- Register rate-limit: in-memory, per IP (3 attempts / hour)

### Workspace Scoping
Most authenticated API routes call `ensureDefaultWorkspace(userId, email)`.

Behavior:
- If user has an existing membership + project: use that workspace.
- If missing defaults (status page/subscription): create them.
- If user has no workspace: bootstrap a default `Agency`, `Project`, `StatusPage`, and FREE `Subscription`.

**Result:** monitor/status-page/billing APIs are scoped to a workspace (`agencyId` + `projectId`) tied to the session user.

---

## Common Error Format

Most endpoints return JSON errors:

```json
{ "error": "Message" }
```

Some include a `code`:

```json
{ "error": "Monitor limit reached (5)...", "code": "PLAN_LIMIT" }
```

Common statuses:
- `400` bad request / invalid input
- `401` unauthorized
- `403` forbidden (plan limits)
- `404` not found
- `409` conflict
- `429` rate-limited
- `500` internal server error
- `502` upstream dependency issue

---

## API Reference (`app/api/*`)

## 1) Auth

### `GET|POST /api/auth/[...nextauth]`
NextAuth handler route.

- **Auth required:** No (this is the auth entrypoint)
- **Purpose:** Session creation, callbacks, sign-in/sign-out flows
- **Request/Response:** Managed by NextAuth internals

---

### `POST /api/auth/register`
Register a local credentials account.

- **Auth required:** No
- **Rate limit:** 3 registrations/hour per IP (in-memory)

Request schema:
```json
{
  "name": "Optional Name",
  "email": "user@example.com",
  "password": "min-8-max-128"
}
```

Success `201`:
```json
{
  "ok": true,
  "user": { "id": "cuid", "email": "user@example.com" }
}
```

Errors:
- `400` invalid input
- `409` account exists/generic account-creation conflict
- `429` too many attempts
- `500` registration failure

Example:
```bash
curl -X POST "$APP_URL/api/auth/register" \
  -H "content-type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com","password":"supersecure123"}'
```

---

## 2) Monitors

### `GET /api/monitors`
Fetch monitors in the current workspace project, with calculated uptime metrics and 24h history.

- **Auth required:** Yes (session)

Response `200`:
```json
{
  "monitors": [
    {
      "id": "cuid",
      "name": "Homepage",
      "url": "https://example.com/",
      "interval": "ONE_MINUTE",
      "expectedStatusCode": 200,
      "status": "UP",
      "uptime24h": 99.9,
      "uptime7d": 99.8,
      "uptime30d": 99.7,
      "history24h": [
        { "t": "2026-03-21T12:00:00.000Z", "ms": 184, "up": true }
      ]
    }
  ],
  "statusPageUrl": "/status/<slug>"
}
```

Errors:
- `401` unauthorized

Example:
```bash
curl "$APP_URL/api/monitors" -H "cookie: next-auth.session-token=..."
```

---

### `POST /api/monitors`
Create a monitor in the current workspace project.

- **Auth required:** Yes
- **Plan enforcement:** monitor count limited by subscription plan
  - FREE 5, FREELANCER 25, AGENCY 100, STUDIO 500, ENTERPRISE 5000

Request schema:
```json
{
  "name": "API Health",
  "url": "https://api.example.com/health",
  "interval": "ONE_MINUTE",
  "expectedStatusCode": 200
}
```

Notes:
- If `url` has no protocol, `https://` is prefixed.
- Allowed intervals: `ONE_MINUTE | FIVE_MINUTES | FIFTEEN_MINUTES`

Success `201`:
```json
{ "monitor": { "id": "cuid", "name": "API Health", "url": "https://api.example.com/health", "interval": "ONE_MINUTE" } }
```

Errors:
- `400` invalid URL / bad payload
- `401` unauthorized
- `403` `PLAN_LIMIT`

Example:
```bash
curl -X POST "$APP_URL/api/monitors" \
  -H "content-type: application/json" \
  -H "cookie: next-auth.session-token=..." \
  -d '{"name":"Homepage","url":"example.com","interval":"ONE_MINUTE","expectedStatusCode":200}'
```

---

### `PATCH /api/monitors/:id`
Update selected monitor fields.

- **Auth required:** Yes
- **Workspace-scoped:** monitor must belong to session workspace project

Request schema (partial):
```json
{
  "name": "New Name",
  "url": "https://example.com/new",
  "interval": "FIVE_MINUTES",
  "timeoutMs": 10000,
  "expectedStatusCode": 200
}
```

Success `200`:
```json
{ "monitor": { "id": "cuid", "name": "New Name" } }
```

Errors:
- `401` unauthorized
- `404` monitor not found in workspace

Example:
```bash
curl -X PATCH "$APP_URL/api/monitors/$MONITOR_ID" \
  -H "content-type: application/json" \
  -H "cookie: next-auth.session-token=..." \
  -d '{"interval":"FIVE_MINUTES","expectedStatusCode":204}'
```

---

### `DELETE /api/monitors/:id`
Delete a monitor.

- **Auth required:** Yes
- **Workspace-scoped:** yes

Success `200`:
```json
{ "ok": true }
```

Errors:
- `401` unauthorized
- `404` monitor not found

Example:
```bash
curl -X DELETE "$APP_URL/api/monitors/$MONITOR_ID" \
  -H "cookie: next-auth.session-token=..."
```

---

## 3) Worker + Ops

### `GET|POST /api/worker/checks`
Runs monitor checks (HEAD fallback to GET), writes check results, updates incident/monitor state, sends down/recovery emails.

- **Auth required:** Worker secret (not user session)
- Accepts `x-worker-secret: <secret>` or `Authorization: Bearer <secret>`
- Valid secret = `WORKER_SECRET` or `CRON_SECRET`

Response `200`:
```json
{
  "ok": true,
  "checked": 12,
  "down": 1,
  "up": 11,
  "results": [{ "id": "monitor_cuid", "ok": true }]
}
```

Errors:
- `401` unauthorized worker request

Example:
```bash
curl -X POST "$APP_URL/api/worker/checks" \
  -H "authorization: Bearer $CRON_SECRET"
```

---

### `GET /api/ops/preflight`
Runs production readiness checks (env, worker freshness, Stripe webhook freshness, PostHog config).

- **Auth required:** `CRON_SECRET` header/bearer

Response `200`:
```json
{
  "status": "pass|warn|fail",
  "checkedAt": "2026-03-21T12:00:00.000Z",
  "checks": [
    { "key": "env", "status": "pass", "message": "All required production env vars are set." }
  ],
  "metrics": { "monitorCount": 10, "paidSubscriptionCount": 2 }
}
```

Errors:
- `401` unauthorized

Example:
```bash
curl "$APP_URL/api/ops/preflight" -H "x-worker-secret: $CRON_SECRET"
```

---

### `GET /api/ops/digest`
Builds + sends daily digest email and escalation emails based on preflight status.

- **Auth required:** `CRON_SECRET` header/bearer

Response `200`:
```json
{
  "ok": true,
  "recipient": "ops@example.com",
  "preflightStatus": "pass|warn|fail",
  "escalationsSent": ["owner@example.com"],
  "digest": { "subject": "...", "text": "..." }
}
```

Errors:
- `401` unauthorized

Example:
```bash
curl "$APP_URL/api/ops/digest" -H "authorization: Bearer $CRON_SECRET"
```

---

## 4) Billing

### `POST /api/billing/checkout`
Creates a Stripe Checkout session for paid plans.

- **Auth required:** Yes
- Plans allowed: `FREELANCER | AGENCY | STUDIO | ENTERPRISE`

Request schema:
```json
{ "plan": "AGENCY" }
```

Success `200`:
```json
{ "url": "https://checkout.stripe.com/..." }
```

Errors:
- `401` unauthorized
- `400` invalid plan
- `502` Stripe checkout URL missing
- `500` checkout creation failure

Example:
```bash
curl -X POST "$APP_URL/api/billing/checkout" \
  -H "content-type: application/json" \
  -H "cookie: next-auth.session-token=..." \
  -d '{"plan":"AGENCY"}'
```

---

## 5) Status Page Branding

### `GET /api/status-page/branding`
Returns current workspace status-page branding config.

- **Auth required:** Yes

Response `200`:
```json
{
  "statusPage": {
    "id": "cuid",
    "name": "My Status",
    "slug": "my-status",
    "logoUrl": null,
    "brandColor": "#16a34a",
    "isPublic": true
  }
}
```

Errors:
- `401` unauthorized

---

### `POST /api/status-page/branding`
Create or update workspace status-page branding.

- **Auth required:** Yes

Request schema:
```json
{
  "name": "Acme Status",
  "logoUrl": "https://cdn.example.com/logo.png",
  "brandColor": "#16a34a"
}
```

Validation:
- `name` required
- `brandColor` must match 6-digit hex (`#RRGGBB`)

Success `200`:
```json
{ "statusPage": { "id": "cuid", "slug": "<agency-prefix>-status" } }
```

Errors:
- `400` invalid name/color
- `401` unauthorized

Example:
```bash
curl -X POST "$APP_URL/api/status-page/branding" \
  -H "content-type: application/json" \
  -H "cookie: next-auth.session-token=..." \
  -d '{"name":"Acme Status","brandColor":"#355F44"}'
```

---

## 6) Funnel + Waitlist

### `POST /api/funnel/landing`
Tracks landing-page visit funnel event.

- **Auth required:** No

Request schema:
```json
{
  "path": "/",
  "referrer": "https://example.com",
  "utm": {
    "source": "twitter",
    "medium": "social",
    "campaign": "launch"
  }
}
```

Response `200`:
```json
{ "ok": true }
```

Behavior: returns `{ok:true}` even on internal tracking failures.

---

### `POST /api/waitlist`
Creates/updates a waitlist signup and sends confirmation email.

- **Auth required:** No

Request schema:
```json
{
  "email": "user@example.com",
  "utm": {
    "source": "twitter",
    "medium": "social",
    "campaign": "launch"
  }
}
```

Success `200`:
```json
{ "ok": true, "id": "cuid" }
```

Errors:
- `400` invalid email
- `500` failed submission

Example:
```bash
curl -X POST "$APP_URL/api/waitlist" \
  -H "content-type: application/json" \
  -d '{"email":"user@example.com","utm":{"source":"x"}}'
```

---

## 7) Webhooks

### `POST /api/webhooks/stripe`
Processes Stripe events and syncs subscription state.

- **Auth required:** Stripe signature (`stripe-signature`)
- Idempotency via `StripeWebhookEvent.eventId` unique key

Handled events:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Success `200`:
```json
{ "received": true }
```

Duplicate event `200`:
```json
{ "received": true, "duplicate": true }
```

Errors:
- `400` missing/invalid signature
- `500` processing failure

---

### `POST /api/webhooks/agentmail`
Validates Svix signature and creates support tickets from inbound AgentMail messages.

- **Auth required:** Svix signature headers + `AGENTMAIL_WEBHOOK_SECRET`

Request: raw Svix event payload.

Success `204`: empty body.

Errors:
- `500` missing webhook secret
- `400` invalid signature

---

## Operational Notes

- Worker/ops endpoints are designed for cron-style execution via secret headers.
- In-memory rate limits reset on deploy/restart.
- Webhook/process freshness influences ops preflight severity (`pass/warn/fail`).
- Workspace bootstrap is automatic on first authenticated use.

---

## Environment Variables (critical)

Core:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

Billing:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_FREELANCER`
- `STRIPE_PRICE_AGENCY`
- `STRIPE_PRICE_STUDIO`
- `STRIPE_PRICE_ENTERPRISE`

Ops/worker:
- `CRON_SECRET`
- `WORKER_SECRET` (optional if reusing CRON_SECRET)

Email/analytics:
- `AGENTMAIL_SUPPORT_INBOX`
- `AGENTMAIL_HELLO_INBOX`
- `AGENTMAIL_WEBHOOK_SECRET`
- `ALERT_EMAIL_TO`
- `POSTHOG_API_KEY`
- `POSTHOG_HOST`
