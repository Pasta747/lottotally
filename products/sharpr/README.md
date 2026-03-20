# Sharpr (Beta)

Phase 1 multi-tenant sports agent-as-a-service bootstrap.

## What this includes
- Per-user config files (`configs/users/*.json`)
- Centralized EV+ scan broadcast (`src/scan-broadcast.js`)
- Per-user signal/trade logs (`data/users/<userId>/`)
- Daily summary generator (`src/daily-summary.js`)
- WhatsApp outbox queue (`outbox/whatsapp-queue.jsonl`) for OpenClaw relay

## Commands
```bash
cd /root/PastaOS/products/sharpr
node src/scan-broadcast.js
node src/daily-summary.js
```

## Cron suggestions
```bash
# Scan every 5m
*/5 * * * * cd /root/PastaOS/products/sharpr && node src/scan-broadcast.js >> /tmp/sharpr-scan.log 2>&1

# Daily summary at 6pm PT
0 18 * * * cd /root/PastaOS/products/sharpr && node src/daily-summary.js >> /tmp/sharpr-summary.log 2>&1
```

## Notes
- Beta defaults are approval-first (`autoExecute=false`).
- When `autoExecute=true`, trades are written to user trade logs immediately in paper mode.
- OpenClaw delivery bridge can tail `outbox/whatsapp-queue.jsonl` and send via `message` tool.
