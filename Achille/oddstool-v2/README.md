# OddsTool V2

Kalshi EV+ scanner for NBA/NHL/NFL. Uses odds-api.io's built-in value-bet engine — the API compares each bookmaker's odds against consensus from 250+ books to calculate true probability and flag positive expected value.

Built: 2026-03-15 | Rebuilt: 2026-03-15

## Quick Start

```bash
node index.js --scan     # Scan and display EV+ opportunities
node index.js --paper    # Scan + log paper trades
node index.js --scan --all    # Show all sports (not just NBA/NHL/NFL)
node index.js --scan --verbose  # Extra debug output
```

## How It Works

1. **Poll `/v3/value-bets`** for each bookmaker (Kalshi, BookMaker.eu, BetOnline.ag)
   - API computes `expectedValue = (trueProb × bookmakerOdds) × 100`
   - `100` = break-even, `103` = 3% EV, `138` = 38% EV
2. **Filter** to NBA/NHL/NFL + minimum EV threshold (default: 3%)
3. **Poll `/v3/arbitrage-bets`** for outright arb between the three books
4. **Log paper trade** if qualifying opportunity found ($5/bet, $200/day cap)
5. **Alert** via file (and optionally WhatsApp when `ALERT_METHOD=agent`)

## Why It Finds Nothing Most Days

That's correct behavior. When markets are efficient, the EV+ scanner returns nothing.
The tool is waiting for Kalshi to misprice a line relative to sharp consensus.
When that happens — that's the signal. Check the `--all` flag to see what's below threshold.

Current Kalshi NBA value bets (2026-03-15, 12pm): 0.12%–1.30% EV across 3 games.
Threshold is 3%, so nothing logged. This is normal.

## Architecture

| File | Purpose |
|------|---------|
| `config.js` | Settings — API key, EV threshold, unit size, exposure cap |
| `engine.js` | Fetches `/v3/value-bets` and `/v3/arbitrage-bets` from odds-api.io |
| `calculator.js` | Filters by sport+EV, ranks, formats for display |
| `paper-trader.js` | Logs simulated trades to JSON, tracks P&L, enforces daily cap |
| `alerts.js` | Formats and delivers alerts (file or WhatsApp) |
| `index.js` | CLI entry point |

## Config

Set via env vars or edit `config.js`:

| Var | Default | Description |
|-----|---------|-------------|
| `ODDS_API_IO_KEY` | (required) | API key from odds-api.io |
| `MIN_EV` | `0.03` | Minimum EV to flag (0.03 = 3%) |
| `UNIT_SIZE` | `5` | $ per bet |
| `MAX_DAILY` | `200` | Max daily exposure $ |
| `ALERT_METHOD` | `file` | `file`, `agent` (WhatsApp), or `both` |

## Cron Setup (after 1-week paper trading)

```bash
# Every 5 min, 4pm-11pm PT (NBA slate)
*/5 16-23 * * * cd /root/PastaOS/Achille/oddstool-v2 && node index.js --paper >> /tmp/oddstool.log 2>&1
```

Exit codes: `0` = no opps, `1` = error, `2` = opportunities found (useful for cron alerting)

## Phase Status

- ✅ Phase 1: value-bets + arbitrage-bets endpoints integrated
- ✅ Phase 2: NBA/NHL/NFL filter working (soccer mispricings excluded)
- ✅ Phase 3: Paper trading engine live ($5/bet, $200/day cap)
- ✅ Phase 4: Alert system (file + WhatsApp agent relay)
- ⏳ Phase 5: Settlement automation (mark winners after games)
- ⏳ Phase 6: 1-week paper trade backtest
- ❌ Phase 7: Kalshi live order placement — Mario flips the switch after backtest
