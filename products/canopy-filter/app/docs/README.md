# Canopy Docs

Canopy is a creator-focused comment intelligence product for YouTube.

This docs folder is organized for implementation reality (not roadmap-only copy):

- `getting-started.md` — local setup, env, and first run
- `api-reference.md` — all current API routes under `app/api/*`
- `oauth-youtube.md` — OAuth sequence and token lifecycle
- `data-model.md` — actual Postgres tables and key fields
- `ops-runbook.md` — preflight/digest/checkout troubleshooting

Current implemented surface:
- waitlist capture + confirmation email
- Stripe checkout session creation
- YouTube OAuth connect/callback
- YouTube comment ingestion + classification persistence
- dashboard visualization by category/video
- manual digest trigger endpoint
- ops preflight endpoint
