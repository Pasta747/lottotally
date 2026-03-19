# Canopy Filter App (Next.js)

## Local dev

```bash
npm install
npm run dev
```

## Required env vars

Already in prod:
- `DATABASE_URL`
- `AGENTMAIL_API_KEY`
- `AGENTMAIL_HELLO_INBOX`
- `POSTHOG_API_KEY`
- `POSTHOG_HOST`

Required for Stripe checkout:
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_CREATOR`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_STUDIO`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (recommended)

Required for YouTube OAuth:
- `GOOGLE_CLIENT_ID` (or `GOOGLE_OAUTH_CLIENT_ID`)
- `GOOGLE_CLIENT_SECRET` (or `GOOGLE_OAUTH_CLIENT_SECRET`)
- `NEXT_PUBLIC_APP_URL` (recommended, e.g. `https://canopyfilter.com`)

## YouTube OAuth flow implemented

- Entry: `GET /api/youtube/connect`
  - sets `canopy_creator_id` cookie (session identity)
  - sets OAuth state cookie
  - redirects to Google OAuth consent with `youtube.readonly`
- Callback: `GET /api/youtube/callback`
  - validates OAuth state
  - exchanges code for tokens
  - fetches channel + subscriber count + 5 recent upload videos
  - upserts into `canopy_youtube_connections`
- UI: `/`
  - shows **Connect Your Channel** button when disconnected
  - shows connected channel summary + recent videos when connected

## DB table added

`canopy_youtube_connections`
- `creator_id` (PK)
- `channel_id`, `channel_title`, `subscriber_count`
- `access_token`, `refresh_token`, `token_scope`, `token_type`, `token_expires_at`
- `recent_videos` (jsonb)
- `connected_at`, `updated_at`

## Ops preflight

`GET /api/ops/preflight` with header `Authorization: Bearer <CRON_SECRET>`

Checks:
- DB connectivity/tables
- Stripe checkout env completeness
- basic counts (waitlist signups, YouTube connections)

## Digest delivery (manual trigger for beta)

`POST /api/digest/run` with auth header `Authorization: Bearer <CRON_SECRET>`

Body:
```json
{
  "creatorId": "<canopy_creator_id>",
  "toEmail": "creator@example.com"
}
```

Returns digest stats and sends an email digest via AgentMail.

## Deploy

```bash
cd /root/PastaOS/products/canopy-filter/app
source /root/PastaOS/.env
npx vercel deploy --prod --yes --token "$VERCEL_TOKEN"
```
