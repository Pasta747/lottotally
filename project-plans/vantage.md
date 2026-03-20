# Project Plan: Vantage Scanner Upgrade

## 2026-03-20 Progress

### Layer 1 (Sports EV+) — kept
- Reused existing OddsTool EV scanner wrapper in `scanner-sports.js`.

### Layer 2 (Kalshi Native) — built first
- `src/scanner-kalshi-native.js`
- Pulls active markets from Kalshi `/markets`
- Filters to same-day settlement (`close_time` today)
- Pulls price/volume/open interest fields
- Applies baseline fair-value heuristic and emits mispricing signals (>=3%)
- Category detection + ATLAS category weighting

### Layer 3 (News) — scaffold built
- `src/scanner-news.js`
- Integrated sources: FRED (CPI), NOAA forecast, CoinGecko
- Maps events to Kalshi markets by keyword and emits stale-price signals
- Applies ATLAS source weighting

### Shared components
- `src/atlas-manager.js` (weights + signal weighting)
- `src/executor.js` (unified logging + paper execution)
- `src/index.js` (orchestration)

### Remaining
1. Improve fair-value models per category (replace heuristic v0)
2. Add true event->market resolver (ticker-level mapping)
3. Add settlement ingestion and Sharpe-based auto-reweight loop
4. Add 10-min cron for L1+L2 and 2-5 min cron for L3
5. Add per-user fanout (Sharpr integration)
