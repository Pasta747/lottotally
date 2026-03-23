# Kalshi API — Edge Cases for Vantage Scanner
_Research by Achille | 2026-03-20_
_Sources: live API testing (OddsTool v2 production), Kalshi docs, observed behavior_

---

## 1. Price Constraints (CRITICAL for order placement)

**YES price must be 1–99 cents.** Anything outside this range is rejected.
- Always clamp: `Math.min(99, Math.max(1, Math.round(prob * 100)))`
- A market priced at 1¢ or 99¢ means almost certain NO or YES respectively — very low liquidity, skip these
- **Scanner rule:** Skip markets where `yes_ask < 3` or `yes_ask > 97` — too thin to trade profitably

**Taker fee:** $0.02/contract confirmed from live trade. At $0.30 contract price, fee = 6.7% of cost. **This must be factored into EV calculation** — a 3% edge at face value is not enough after fees.
- Minimum viable EV after fees: ~8% gross to net ~1% after fees at small sizes
- Recommend: raise minimum EV threshold in scanner from 3% → 8% for live trading (paper trading is fine at 3%)

**Fill price vs ask price:** Use `yes_ask` (not `yes_price` or `last_price`) for order pricing. `yes_price` may be stale.

---

## 2. Historical Data Access — Two-Tier System

Kalshi splits data into **live** and **historical** buckets with a rolling cutoff:
- `GET /historical/cutoff` returns the timestamps for each cutoff
- Markets settled before `market_settled_ts` → must use `GET /historical/markets`
- Fills before `trades_created_ts` → use `GET /historical/fills`
- Resting (open) orders always available in `GET /portfolio/orders`

**Impact for V-SETTLE (auto-settlement):** Can't just poll `/portfolio/orders` for old fills — need to query historical endpoints for trades older than the cutoff. Check `GET /historical/cutoff` first.

---

## 3. Pagination (MUST implement for full market coverage)

`GET /markets` returns max **200 markets per page** with a cursor.
- Our scanner already handles this with a 20-page loop (4,000 markets max)
- **Edge case:** Cursor expires after ~5 minutes — if the scan loop takes too long, cursor becomes invalid mid-scan
- **Fix already in place:** `scanner-kalshi-native.js` handles null cursor correctly

**Total active Kalshi markets:** typically 800–2,000 at any given time. Our 20-page × 200 = 4,000 cap is safe.

---

## 4. Market Status — Don't Trade Closed/Halted Markets

Market `status` field values:
- `active` / `open` → tradeable
- `closed` → settlement pending, NOT tradeable (orders rejected)
- `settled` → done, payout distributed
- `halted` → suspended trading, orders rejected

**Scanner rule already in place:** `isSameDayClose()` filters to same-day markets, and `isActive` check filters status. **However:** some markets show `status: null` or missing status — treat as active (already handled with `!status || status === 'active' || status === 'open'`).

**Edge case:** Markets can go from `active` → `halted` mid-scan if a newsworthy event happens. Place orders with IOC (Immediate or Cancel) style logic — if fill_count = 0, treat as missed and move on.

---

## 5. Demo vs Production API Differences

**Key differences we've observed:**

| Behavior | Demo | Production |
|----------|------|-----------|
| Base URL | `demo-api.kalshi.co` | `api.elections.kalshi.com` |
| Balance | Fake ($25 starting) | Real money |
| Fees | Real fee structure charged | Real fees |
| Market data | Same real markets | Same real markets |
| Order fills | Real fill simulation | Real fills |
| Settlement | Real settlement | Real settlement |

**Critical:** Demo uses DIFFERENT API keys than production. Users must generate separate demo API keys at kalshi.com → Settings → API.

**Edge case for V-PROVISION:** When provisioning a user, you must verify their keys work against the demo endpoint FIRST before storing. Use `GET /portfolio/balance` as the healthcheck.

---

## 6. Order Types Available

From our live client + docs:
- **Limit orders** — specify yes_price or no_price in cents (1-99). Standard for scanner.
- **Market orders** — fill at best available price. Higher slippage risk on thin markets.

**Recommendation:** Always use limit orders at `yes_ask` price. Avoids slippage on thinly traded markets.

---

## 7. Same-Day Settlement Markets — Timing Risk

Our scanner focuses on `isSameDayClose` markets — this is correct for finding edge but creates timing risk:

- Markets close at their `close_time` (often market close, end of game, or midnight ET)
- If the scanner finds an edge at 11:55 PM ET and the market closes at midnight ET, there may be only 5 minutes to execute
- **Minimum time-to-close filter needed:** Skip markets with `close_time` within 30 minutes of now
- **Not currently implemented** in `scanner-kalshi-native.js` — recommend adding before launch

```javascript
function hasAdequateTimeToClose(closeTime, minMinutes = 30) {
  if (!closeTime) return false;
  const closeMs = new Date(closeTime).getTime();
  const nowMs = Date.now();
  return (closeMs - nowMs) > minMinutes * 60 * 1000;
}
```

---

## 8. Rate Limits (from Kalshi docs + experience)

No explicit published rate limit found in docs, but from OddsTool experience:
- Heavy pagination loops (20 pages × 200 markets) take ~3-5 seconds — no issues observed
- Rapid order placement: recommended 1-2 second delay between orders
- Authentication: timestamp must be within 30 seconds of server time (clock skew = auth failure)

**Recommendation for V-EXEC:** Add `Date.now()` freshness check before each order — if system clock drifts, auth will fail silently.

---

## 9. Fair Value Model Gaps (V-L2-FV)

Current `estimatedProb()` in `scanner-kalshi-native.js` is a **placeholder heuristic** — it mean-reverts small-volume markets toward 50% and applies fixed basis-point adjustments by category. This is NOT a real fair value model.

**Needed for each category:**

| Category | Real fair value signal |
|----------|----------------------|
| Sports | Consensus sportsbook probabilities (our existing EV scanner via odds-api.io) |
| Economics | FRED data + consensus forecasts (Bloomberg consensus) |
| Weather | NOAA forecast probability at specific location/time |
| Politics | 538-style polling aggregator or Polymarket consensus |
| Crypto | BTC/ETH implied probability from options market |
| Entertainment | Hard to model — skip for beta or use Polymarket as consensus |

**For MVP:** Sports category is already covered by Layer 1 scanner. Focus on economics + weather for differentiation — those have real data sources (FRED, NOAA) that are API-accessible and free.

---

## 10. Known Issues in Current Scanner Design

| Issue | Location | Severity | Fix |
|-------|----------|----------|-----|
| Missing taker fee in EV calc | `estimatedProb()` | HIGH — overstates edge | Subtract $0.02/contract from expected value |
| No min time-to-close filter | `isSameDayClose()` | MEDIUM — execution risk | Add 30-min buffer |
| Using demo KalshiClient by default | `scanKalshiNativeLayer()` | MEDIUM — won't work for live users | Pass user's credentials |
| `close_time` field name inconsistency | `isSameDayClose()` | LOW | Handled with `m.close_time \|\| m.closeTime` |
| No staleness check on market prices | `marketPrices()` | MEDIUM | Check `last_updated` or `updated_time` field |
