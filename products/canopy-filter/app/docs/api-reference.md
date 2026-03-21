# Canopy API Reference

Base path: `app/api/*`

## Auth model
- User auth is currently cookie-based creator identity (`canopy_creator_id`) for YouTube connection context.
- Operational endpoints use `CRON_SECRET` via bearer or `x-worker-secret`.

---

## `POST /api/waitlist`
Create/update waitlist signup.

Request:
```json
{
  "email": "creator@example.com",
  "utm": { "source": "x", "campaign": "beta" }
}
```

Success `200`:
```json
{ "ok": true, "id": "uuid" }
```

Errors:
- `400` invalid email
- `500` internal error

---

## `POST /api/billing/checkout`
Create Stripe subscription checkout session.

Request:
```json
{ "plan": "CREATOR|PRO|STUDIO", "email": "creator@example.com" }
```

Success `200`:
```json
{ "url": "https://checkout.stripe.com/..." }
```

Errors:
- `400` invalid plan
- `500` checkout failed

---

## `GET /api/youtube/connect`
Starts OAuth flow.

Behavior:
- creates `canopy_creator_id` cookie (if missing)
- creates short-lived `canopy_youtube_oauth_state` cookie
- redirects to Google consent URL

Response: HTTP redirect

---

## `GET /api/youtube/callback`
OAuth callback + ingestion + classification.

Query params:
- `code`
- `state`
- optional `error`

Behavior:
- validates state cookie
- exchanges code for tokens
- fetches channel summary + recent videos
- upserts `canopy_youtube_connections`
- fetches up to 250 channel comments
- classifies comments and upserts `canopy_youtube_comments`
- clears oauth-state cookie
- redirects to `/dashboard?connected=1...`

Failure redirect patterns:
- `/?youtube_error=missing_code_or_state`
- `/?youtube_error=state_validation_failed`
- `/?youtube_error=callback_failed`

---

## `POST /api/digest/run`
Manual digest sender for one creator.

Auth:
- `CRON_SECRET` bearer/header required

Request:
```json
{
  "creatorId": "<canopy_creator_id>",
  "toEmail": "creator@example.com"
}
```

Success `200`:
```json
{
  "ok": true,
  "creatorId": "...",
  "channelTitle": "...",
  "toEmail": "...",
  "total": 123,
  "counts": { "toxic": 10, "spam": 5, "constructive": 40, "positive": 68 },
  "highlights": 5
}
```

Errors:
- `401` unauthorized
- `400` missing creatorId/toEmail
- `404` connection not found

---

## `GET /api/ops/preflight`
Operational readiness check.

Auth:
- `CRON_SECRET` bearer/header required

Success `200`:
```json
{
  "status": "pass|fail",
  "checks": [{ "name": "DATABASE_URL", "ok": true, "message": "set" }],
  "metrics": { "waitlistCount": 42, "youtubeConnections": 8 }
}
```

Errors:
- `401` unauthorized
