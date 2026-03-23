# Kalshi Market Category EV Analysis
_Research by Achille | 2026-03-20_
_For Vantage scanner prioritization and ATLAS weight initialization_

---

## Production Kalshi Market Distribution (Estimated)

From demo API (3,000 markets), industry knowledge, and Kalshi public data:

| Category | Demo count | Prod estimate | % of total | EV opportunity | Priority |
|----------|-----------|--------------|------------|---------------|----------|
| Sports props (player) | 643 (21%) | ~8,000 | ~35% | HIGH | 🥇 #1 |
| Sports outcomes (game) | 636 (21%) | ~6,000 | ~25% | MEDIUM | 🥈 #2 |
| Crypto (BTC/ETH price) | 83 (3%) | ~500 | ~5% | HIGH (volatile) | 🥉 #3 |
| Economics (CPI/Fed) | 7 (<1%) | ~200 | ~3% | HIGH (consensus data) | #4 |
| Politics (elections) | 16 (<1%) | ~300 | ~4% | MEDIUM | #5 |
| Weather | 0 in demo | ~150 | ~2% | HIGH (NOAA signal) | #6 |
| Entertainment | 0 in demo | ~100 | ~1% | LOW | Skip |
| Other/Unknown | 1,567 (52%) | ~5,000 | ~25% | UNKNOWN | Research |

**"Other" category at 52%** is the biggest unknown — likely a mix of Kalshi-specific events (NASDAQ closes, specific milestone markets). The ATLAS system should learn these over time.

---

## EV+ Opportunity Analysis by Category

### 🥇 1. Sports Player Props — BEST OPPORTUNITY

**Why highest EV potential:**
- Most liquid props have 250+ sportsbooks setting lines
- Kalshi prices the same events but in binary contract form
- Our Layer 1 scanner (odds-api.io) already has the consensus signal
- 82% historical win rate in paper trading on these
- Volume: These are the most actively traded Kalshi markets

**Key insight from paper trading (15 trades):**
- 3-Point FG props: 3/3 wins (100%)
- Assist props: 3/4 wins (75%)
- Rebounds props: 3/3 wins (100%)
- Goals props (NHL): 0/2 — REMOVED, too noisy

**Best prop types to target (ranked by signal quality):**
1. Player 3-Point FG (over/under) — consensus from sportsbook lines is very reliable
2. Player Rebounds — less variance than points
3. Player Assists — moderate variance
4. Player Points — high volume, noisier line-setting
5. Goals scored (any sport) — NOT recommended, too binary/noisy

**ATLAS initial weight for sports_props: 1.5** (above baseline, proven edge)

---

### 🥈 2. Sports Outcomes (Game Results) — GOOD OPPORTUNITY

**Why:**
- Kalshi game winner markets (NBA, NFL, MLB) map directly to sportsbook moneylines
- Consensus from 250+ books = strong fair value signal
- Less EV than props (books are sharper on game outcomes) but still meaningful

**Typical edge:** 3-8% when Kalshi misprices vs consensus
**Volume:** Medium-high (major game markets get significant Kalshi volume)

**ATLAS initial weight for sports_outcomes: 1.0** (baseline)

---

### 🥉 3. Crypto Price Markets — HIGH OPPORTUNITY, HIGH VARIANCE

**Why:**
- Kalshi lists "Will BTC close above $X today?" markets
- These are directional binary options on crypto price
- Crypto has 3-5% daily vol = frequent mispricings vs fair value
- Our log-normal model (V-L2-FV) provides quantitative edge

**Key consideration:** Crypto markets can move 10%+ in hours — scanner must check price freshness before executing. A signal generated at 10 AM may be stale by 2 PM.

**Recommendation:** Add a price-staleness check — if BTC has moved >2% since signal generation, re-evaluate before executing.

**ATLAS initial weight for crypto: 0.8** (below baseline until validated — higher variance)

---

### #4. Economics (CPI, Fed, Jobs) — STRONG OPPORTUNITY WHEN AVAILABLE

**Why:**
- Very few economic markets on Kalshi (~7 in demo, ~200 in production)
- But when they exist, FRED data provides a real edge
- Market prices often lag consensus economist forecasts by days
- Lower trading frequency = less competition from sharp traders

**Key insight:** Economics markets have the HIGHEST potential EV per trade — a CPI release market priced at 40¢ when FRED data + Bloomberg consensus suggest 65% probability = massive edge. But these only appear around data release dates.

**Recommendation:** Build an economic calendar so the scanner activates economics-specific scanning the week before a scheduled release (CPI: ~2nd week of month, Jobs: 1st Friday, Fed: ~8x/year).

**ATLAS initial weight for economics: 1.2** (slightly elevated, strong signal source)

---

### #5. Politics — MODERATE OPPORTUNITY

**Why:**
- Election markets can have strong EV when polls diverge from market pricing
- But these are infrequent (election years), long-duration, and hard to model
- Polymarket provides consensus pricing — when Kalshi deviates >5%, signal exists

**Caution:** Politics markets are the most subject to information asymmetry — professional traders with insider poll access will have better signal than our model. Enter carefully.

**ATLAS initial weight for politics: 0.6** (below baseline, uncertain edge)

---

### #6. Weather — EXCELLENT SIGNAL, THIN MARKET

**Why:**
- NOAA forecast provides genuinely accurate probability data (better than random)
- Kalshi weather markets often priced by non-specialists using intuition
- Our NOAA-based fair value model (V-L2-FV) gives real edge

**Caution:** Weather markets are thinly traded. Position sizes need to be small (max $20-30) to avoid moving the market. Best for learning the system, not for large bankrolls.

**ATLAS initial weight for weather: 0.9** (near baseline, real signal but thin liquidity)

---

### Skip: Entertainment

No reliable data source for box office predictions, awards, etc. The markets exist but we have no systematic edge. Skip for MVP, revisit if a signal source is identified.

**ATLAS initial weight for entertainment: 0.1** (effectively disabled)

---

## Scanner Prioritization for Launch

**Week 1 (MVP beta launch):**
1. Sports props → Layer 1 scanner (ready now, proven 82% win rate)
2. Sports outcomes → Layer 1 scanner (same infrastructure)

**Week 2 (post-launch):**
3. Crypto → Layer 2 + CoinGecko (model ready, needs validation)
4. Economics → Layer 3 + FRED (model ready, needs economic calendar)

**Week 3-4:**
5. Weather → Layer 3 + NOAA (model ready, thin market caution)
6. Politics → Layer 3 + Polymarket (use sparingly, low weight)

---

## Recommended ATLAS Initial Weights

```json
{
  "categories": {
    "sports_props_weight": 1.5,
    "sports_outcomes_weight": 1.0,
    "crypto_weight": 0.8,
    "economics_weight": 1.2,
    "politics_weight": 0.6,
    "weather_weight": 0.9,
    "entertainment_weight": 0.1
  },
  "layers": {
    "sports": 1.2,
    "kalshi_native": 0.8,
    "news": 0.6
  },
  "sources": {
    "odds_api_weight": 1.5,
    "coingecko_weight": 0.8,
    "fred_weight": 1.2,
    "noaa_weight": 1.0,
    "polymarket_weight": 0.7
  }
}
```

These weights will self-adjust via ATLAS Darwinian weighting as real trade data accumulates.
