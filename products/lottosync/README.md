# LottoTally MVP

LottoTally is lottery reconciliation software for independent convenience stores.

## Stack
- Next.js (App Router, TypeScript, Tailwind)
- NextAuth (Credentials auth)
- SQLite (`better-sqlite3`) for MVP persistence
- Recharts for trend visualizations

## MVP routes
- `/` landing page with hero, social proof, and pricing
- `/login` + `/signup` auth (14-day trial onboarding copy)
- `/dashboard` overview metrics
- `/dashboard/daily` daily reconciliation entry + history
- `/dashboard/scratch-offs` book tracking + ticket sales + missing flags
- `/dashboard/commissions` settlement reconciliation + discrepancy
- `/dashboard/reports` weekly/monthly summary + trend chart
- `/dashboard/settings` store/state/commission/terminal settings

## Getting started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env file:
   ```bash
   cp .env.example .env.local
   ```
3. Set a secure `NEXTAUTH_SECRET` in `.env.local`.
4. Start dev server:
   ```bash
   npm run dev
   ```

SQLite DB is auto-created at `data/lottotally.db` on first run.

## Notes
- MVP intentionally excludes Stripe billing, OCR, multi-store, and employee tracking (V2).
- Database schema is kept simple and can be migrated to Postgres later.
