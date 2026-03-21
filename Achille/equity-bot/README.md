# Equity Bot

CLI paper-trading bot for equities with pluggable strategies, signal execution, and strategy-level P&L reporting.

## Quickstart

```bash
cd /root/PastaOS/Achille/equity-bot
npm install
node index.js --help
```

Run a scan:
```bash
node index.js --scan
```

Show positions:
```bash
node index.js --positions
```

Show strategy P&L (key command):
```bash
node index.js --pnl
```

## Install / Runtime Requirements

- Node.js 20+
- npm
- Optional local services:
  - OpenBB API (`OPENBB_BASE_URL`, default `http://127.0.0.1:6901`)
  - IBKR TWS/Gateway (only if `EQUITY_USE_IBKR=true`)

## CLI Command Reference

- `--scan` : run enabled strategies and execute paper trades
- `--positions` : show open positions + daily summary
- `--pnl` : show realized/unrealized P&L by strategy + totals
- `--account` : show IBKR account summary/positions (when IBKR enabled)
- `--list` : list strategies and enabled/disabled state
- `--backtest <name>` : placeholder (not implemented)
- `--<strategy-name>` : run only selected strategy flag(s)

Examples:
```bash
node index.js --list
node index.js --momentum
node index.js --momentum --breakout
```

## Environment / Config

Config source is `config.js` + env overrides.

Important env vars:
- `EQUITY_USE_IBKR` (`true|false`, default `false`)
- `IBKR_HOST`, `IBKR_PORT`, `IBKR_CLIENT_ID`
- `OPENBB_BASE_URL`, `OPENBB_PROVIDER`
- `MAX_POSITION_SIZE`
- `STOP_LOSS_PCT`, `TAKE_PROFIT_PCT`
- `EQUITY_MIN_HOLD_MS`
- `EQUITY_CROSS_STRATEGY_EXIT_GUARD_MS`
- `STRATEGY_TIMEOUT_MS`

Data files (auto-created):
- `data/equity-trades.json`
- `data/paper-positions.json`
- `data/closed-trades.json`
- `data/signals-log.jsonl`

## Output Interpretation

## `--scan`
- **Signals** section: strategy-generated BUY/SELL intents
- **Executions** section:
  - `executed` means trade recorded (and optionally sent to IBKR)
  - `SKIP` includes guard reasons (max positions, hold guard, etc.)

## `--positions`
Per symbol row:
- `entry` = recorded entry price
- `last` = latest fetched price
- `pnl` / `pnlPct` = current mark-to-market

## `--pnl`
Shows strategy table:
- `realized` = P&L from closed trades
- `unrealized` = MTM for open positions
- `total` = realized + unrealized
- `trades` = closed trade count for strategy
- `winRatePct` = percentage of winning closed trades
- `avgWin` / `avgLoss` = average pnl per winning/losing trade
- `sharpe` = simplified risk-adjusted metric from strategy module

Totals section:
- `Closed trades`
- `Realized P&L`
- `Unrealized P&L`
- `Net P&L`

## Notes

- Default mode is paper simulation; IBKR is optional.
- Process exits explicitly after command completion.
- If no flags are passed, CLI prints: `No command specified. Try --help`.
