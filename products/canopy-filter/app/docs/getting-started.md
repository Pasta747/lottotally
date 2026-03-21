# Getting Started

## Prerequisites
- Node 20+
- npm
- PostgreSQL reachable via `DATABASE_URL`

## Install + Run
```bash
cd /root/PastaOS/products/canopy-filter/app
npm install
npm run dev
```

## Required Environment Variables

Core:
- `DATABASE_URL`
- `CRON_SECRET`

Email/analytics:
- `AGENTMAIL_API_KEY`
- `AGENTMAIL_HELLO_INBOX`
- `POSTHOG_API_KEY`
- `POSTHOG_HOST`

Billing:
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_CREATOR`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_STUDIO`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (frontend use)

YouTube OAuth:
- `GOOGLE_CLIENT_ID` or `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET` or `GOOGLE_OAUTH_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL` (recommended)

## First Run Checklist
1. Start app (`npm run dev`)
2. Submit waitlist once from `/`
3. Click **Get started fast** (YouTube connect)
4. Complete OAuth consent
5. Confirm redirect to `/dashboard?connected=1...`
6. Verify dashboard categories render comments

## Smoke Test Endpoints
```bash
curl -X POST http://localhost:3000/api/waitlist -H 'content-type: application/json' -d '{"email":"test@example.com"}'
curl http://localhost:3000/api/ops/preflight -H "authorization: Bearer $CRON_SECRET"
```
