# Project Plan: Sharpr (sports agent-as-a-service)

## March 20 status

### Phase 1 (this week) — IN PROGRESS
- ✅ Product scaffold created at `/root/PastaOS/products/sharpr/`
- ✅ Per-user config system (`configs/users/*.json`)
- ✅ Centralized scan + per-user broadcast (`src/scan-broadcast.js`)
- ✅ Kelly-sized suggestions by user bankroll/risk
- ✅ Per-user signal + trade tracking (`data/users/<userId>/`)
- ✅ Daily summary generator (`src/daily-summary.js`)
- ✅ WhatsApp outbox queue for relay (`outbox/whatsapp-queue.jsonl`)

### Remaining before weekend beta
1. Wire outbox relay to real WhatsApp delivery path in production runtime.
2. Add YES/PASS reply handler to convert pending signals into executed/skipped trades.
3. Add per-user P&L settlement updater.
4. Add onboarding runbook for beta-001 and beta-002.

### Target
- First two beta users paper-trading this weekend.
