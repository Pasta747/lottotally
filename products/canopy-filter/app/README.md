# Canopy Filter App (Next.js)

Canopy helps creators filter and review YouTube comments with category-level intelligence (toxic, spam, constructive, positive), then act from a cleaner dashboard.

## Current Implementation Status

Implemented now:
- Waitlist API + confirmation emails
- Stripe checkout session creation (`CREATOR`, `PRO`, `STUDIO`)
- YouTube OAuth connect/callback
- Channel comment ingestion and classification persistence
- Dashboard with category filters and per-video review
- Manual digest trigger endpoint (`/api/digest/run`)
- Ops preflight endpoint (`/api/ops/preflight`)

## Docs
See `/docs`:
- `docs/getting-started.md`
- `docs/api-reference.md`
- `docs/oauth-youtube.md`
- `docs/data-model.md`
- `docs/ops-runbook.md`

## Local Dev

```bash
npm install
npm run dev
```

## Core Environment Variables

- `DATABASE_URL`
- `CRON_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_CREATOR`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_STUDIO`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (or `GOOGLE_OAUTH_*` aliases)
- `NEXT_PUBLIC_APP_URL`
- `AGENTMAIL_API_KEY`
- `AGENTMAIL_HELLO_INBOX`

## Deploy

```bash
cd /root/PastaOS/products/canopy-filter/app
source /root/PastaOS/.env
npx vercel deploy --prod --yes --token "$VERCEL_TOKEN"
```
