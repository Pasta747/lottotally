# Equity Scanner — Skill

## Purpose
Run the equity multi-strategy scanner in paper mode during market hours. Log signals. Stay silent unless alert threshold is hit.

## Location
`/root/PastaOS/Plutus/equity-bot/`

## Run Command
```bash
cd /root/PastaOS/Plutus/equity-bot && STRATEGY_TIMEOUT_MS=3000 timeout 90 node index.js --scan 2>&1
```

**Important:** Scanner now runs strategies in parallel with per-strategy timeout guard. Use `timeout 90` at cron level to cap total runtime.

## Universe
S&P 100 starter universe (100 tickers) + sector ETFs for macro context.

This is the bridge step before full S&P 500 rollout: larger than the original 50 while keeping runtime manageable under parallel execution.

## Strategies Active (20 total)
momentum, mean-reversion, earnings-play, gap-fill, vwap-bounce, breakout, pullback-buy, sector-rotation, pairs-trading, golden-cross, rsi-divergence, macd-crossover, bollinger-squeeze, high-short-interest, insider-buying, dividend-capture, opening-range-breakout, relative-strength, volume-spike, support-resistance

## Risk Rules (Paper Mode)
- Max positions: 50
- Max position size: $5,000
- Stop loss: 2%
- Take profit: 5%
- Broker: IBKR paper account `DUP472682` (NOT live)
- Data provider: OpenBB / yfinance

## Data Files
| File | Purpose |
|------|---------|
| `data/equity-trades.json` | Trade log |
| `data/paper-positions.json` | Open positions |
| `data/closed-trades.json` | Closed trade history |
| `data/signals-log.jsonl` | Raw signal stream |

## Alert Thresholds (escalate to Pasta → Mario)
Only escalate if:
- Scanner exits with non-zero code (runtime error)
- 10+ simultaneous BUY signals (unusual activity)
- Any SELL signal on a position with >3% unrealized loss (stop-loss breach)

Otherwise: log and exit silently.

## Known Issues
- Scanner can hang if OpenBB/yfinance is slow. The `timeout 60` wrapper is mandatory.
- IBKR connection errors are non-fatal in paper mode — scanner continues with cached data.

## Cron Schedule
Every 5 minutes, 6 AM–1 PM PT, Monday–Friday (market hours).

## Owner
Plutus (CIO/Trading)
