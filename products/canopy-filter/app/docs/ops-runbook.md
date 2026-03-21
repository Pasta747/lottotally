# Canopy Ops Runbook

## Preflight
Endpoint:
- `GET /api/ops/preflight`
- Auth: `Authorization: Bearer $CRON_SECRET` or `x-worker-secret`

Checks include:
- env presence (DB/cron/stripe price ids)
- table availability (implicit via `ensureTables`)
- metrics (waitlist + YouTube connections)

Run:
```bash
curl "$APP_URL/api/ops/preflight" -H "authorization: Bearer $CRON_SECRET"
```

## Digest Run
Endpoint:
- `POST /api/digest/run`
- Auth required (`CRON_SECRET`)
- Body requires `creatorId` and `toEmail`

Run:
```bash
curl -X POST "$APP_URL/api/digest/run" \
  -H "authorization: Bearer $CRON_SECRET" \
  -H "content-type: application/json" \
  -d '{"creatorId":"<id>","toEmail":"creator@example.com"}'
```

## Common Failures

### 401 unauthorized
- missing/wrong CRON_SECRET header

### OAuth callback fails
- missing/invalid Google OAuth env
- state mismatch due to expired/missing cookie

### Digest 404 connection not found
- wrong `creatorId`
- user never completed YouTube connect

### Empty dashboard comments
- classification ingest may have failed
- no recent comments retrievable for channel
- check `canopy_youtube_comments` row count

### Stripe checkout errors
- invalid/missing price env values
- stripe key not configured

## Required Secrets
- `DATABASE_URL`
- `CRON_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_CREATOR`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_STUDIO`
- `AGENTMAIL_API_KEY`
- `AGENTMAIL_HELLO_INBOX`
- Google OAuth client id/secret
