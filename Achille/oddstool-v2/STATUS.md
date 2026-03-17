# OddsTool v2 — Status

**Last updated:** 2026-03-15  
**Owner:** Achille ⚡  
**Oversight:** Pasta 🍝 (COO)

---

## Current State: LIVE (Paper Trading)

OddsTool v2 is running. Full Node.js rebuild shipped March 15, 2026. Two independent engines active on a cron, placing real orders against the Kalshi demo exchange.

---

## Architecture

```
oddstool-v2/
├── index.js          — Main entry point, runs both engines
├── engine.js         — EV+ engine orchestration
├── ev-scanner.js     — odds-api.io /v3/value-bets consumer
├── calculator.js     — EV + probability math
├── kalshi-client.js  — RSA-PSS auth, demo + prod endpoints
├── paper-trader.js   — Order execution on Kalshi demo exchange
├── lowhold-engine.js — BookMaker.eu ↔ Kalshi pair finder
├── lowhold-trader.js — Low-hold order execution
├── lowhold.js        — Low-hold entry point
├── alerts.js         — Daily summary builder (Athena briefing)
├── config.js         — Loads /root/PastaOS/.env
└── data/             — Trade logs, P&L, rollover tracker
```

---

## EV+ Engine

| Parameter | Value |
|-----------|-------|
| Data source | odds-api.io `/v3/value-bets` |
| Consensus | 250+ books |
| Min EV | 3% |
| Min probability | 25% |
| Sports | NBA, NHL |
| Market timing | Pre-game only (no live markets) |
| Exchange | Kalshi ONLY |
| Unit size | $5/side |
| Sharp confirmation | Logged — NOT a trade gate |

**Sharp confirmation note:** Mario's explicit decision. Kalshi itself may be the sharp signal. We log sharp book positions for analysis but don't require agreement before executing.

---

## Low-Hold Engine

| Parameter | Value |
|-----------|-------|
| Strategy | BookMaker.eu ↔ Kalshi arb pairs |
| Goal | Clear $350 BookMaker.eu rollover |
| Method | Minimal combined vig, dual-side execution |
| Tracker | `data/rollover-tracker.json` |

---

## Kalshi API Client

- **Auth:** RSA-PSS signing (Kalshi's required method)
- **Demo endpoint:** `demo-api.kalshi.co` — real order flow, fake balance
- **Prod endpoint:** `trading-api.kalshi.co` — Phase 7 target
- **Credentials:** `/root/PastaOS/.env` (KALSHI_DEMO_*, KALSHI_PROD_*)

---

## Automation

- **Cron schedule:** Every 2 hours, 6:00 AM – 8:00 PM PT
- **Alerts:** None per-trade. Daily summary only.
- **Reporting:** Athena's morning briefing reads `data/` and summarizes:
  - Paper trades placed (count)
  - Cumulative P&L vs $0 baseline
  - Rollover progress vs $350 BookMaker.eu target

---

## Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1–6 | Build all engines + Kalshi auth + cron | ✅ Done (Mar 15) |
| 7 | Swap to Kalshi production API (live money) | ⏳ After 1 week paper validation (~Mar 22) |

**Phase 7 gate:** 1 full week of paper trading without logic errors or misfires. Mario approves before going live.

---

## Credentials Location

All in `/root/PastaOS/.env`:
- `ODDS_API_IO_KEY` — odds-api.io API key
- `KALSHI_DEMO_API_KEY` / `KALSHI_DEMO_PRIVATE_KEY` — demo exchange
- `KALSHI_PROD_API_KEY` / `KALSHI_PROD_PRIVATE_KEY` — production (Phase 7)

---

## Known Constraints (Mario's Decisions)

1. **Kalshi-only** — No FanDuel, no DraftKings. Regulatory risk + vig concerns.
2. **Pre-game only** — No live/in-game markets. Latency + edge degradation.
3. **Sharp confirmation = context only** — Don't gate on sharp agreement. Log it, don't block on it.
4. **No per-trade alerts** — Daily Athena briefing is sufficient.
5. **Phase 7 requires full week of paper validation first** — No exceptions.

---

## Data Files

| File | Purpose |
|------|---------|
| `data/trades.json` | Running log of all paper trades |
| `data/pnl.json` | Cumulative P&L tracker |
| `data/rollover-tracker.json` | BookMaker.eu rollover progress |
| `data/sharp-log.json` | Sharp confirmation records (analysis only) |
