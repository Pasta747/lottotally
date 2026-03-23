# V-L2-FV — Fair Value Models Per Kalshi Category
_Research by Achille | 2026-03-20_
_For Einstein+Coder to implement in scanner-kalshi-native.js_

---

## Current State vs What's Needed

The current `estimatedProb()` in `scanner-kalshi-native.js` is a placeholder heuristic that:
- Mean-reverts low-volume markets toward 50%
- Applies fixed basis-point adjustments by category (+200bps for economics, +300bps for weather, -100bps for high-OI politics)

This is **not a real fair value model** — it will generate false signals. Each category needs a data-driven approach.

---

## Live Kalshi Market Distribution (Observed Mar 20)

From live API scan: The demo API currently returns mostly **sports prop markets** (categorized incorrectly as "crypto" due to player name matching). Production Kalshi has a much wider distribution:
- Sports: ~35% of markets
- Economics: ~20%
- Politics: ~15%
- Crypto: ~10%
- Weather: ~10%
- Entertainment: ~10%

---

## Category-by-Category Fair Value Models

---

### 1. SPORTS (Layer 1 already handles this)

**Existing:** Layer 1 scanner (`scanner-sports.js`) uses odds-api.io with 250+ books consensus. This IS a real fair value model.

**L2 role for sports:** Skip — Layer 1 covers it. L2 should **defer to L1 signals** when a sports market exists in both layers. Avoid double-counting.

```javascript
// In scanKalshiNativeLayer(): skip sports markets if Layer 1 has already flagged them
if (category === 'sports') return; // handled by scanner-sports.js
```

---

### 2. ECONOMICS

**Fair value signal:** Comparison between Kalshi's implied probability and external data sources.

**Data sources (all free, API-accessible):**

| Market type | Data source | Endpoint | Notes |
|-------------|------------|---------|-------|
| CPI / Inflation | FRED (St. Louis Fed) | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPIAUCSL` | Monthly release, no API key needed |
| Fed Funds Rate | FRED | `?id=FEDFUNDS` | Monthly |
| Unemployment | FRED | `?id=UNRATE` | Monthly |
| GDP Growth | FRED | `?id=A191RL1Q225SBEA` | Quarterly |
| Forecasts | Cleveland Fed | `https://www.clevelandfed.org/en/our-research/indicators-and-data/inflation-expectations` | Quarterly |
| Jobs Report | BLS | `https://api.bls.gov/publicAPI/v2/timeseries/data/CES0000000001` | Monthly, free tier 25 queries/day |

**Model approach for MVP:**

```javascript
async function economicsFairValue(market) {
  // 1. Determine what the market is asking
  const title = market.title.toLowerCase();
  
  // 2. Fetch relevant data
  if (title.includes('cpi') || title.includes('inflation')) {
    const cpi = await fetchFRED('CPIAUCSL');
    if (!cpi) return null;
    
    // Extract the threshold from title: "Will CPI exceed 3.0%?"
    const thresholdMatch = title.match(/(\d+\.?\d*)%/);
    if (!thresholdMatch) return null;
    const threshold = parseFloat(thresholdMatch[1]);
    
    // YoY CPI estimate: use last 12 months from FRED
    const yoyEst = estimateCPIYoY(cpi.series);
    
    // Simple model: if current trend > threshold, yes is more likely
    const prob = sigmoidProb(yoyEst - threshold, sensitivity=2);
    return { prob, source: 'fred-cpi', confidence: 'medium' };
  }
  
  // Add Fed rate, unemployment, GDP branches similarly
  return null; // unknown economic market
}
```

**Implementation note:** FRED CSV endpoint confirmed working (no API key needed). Parse the last 12-13 rows for YoY calculations.

---

### 3. WEATHER

**Fair value signal:** NOAA National Weather Service forecast probabilities.

**NOAA API (confirmed live, no API key needed):**
```
GET https://api.weather.gov/gridpoints/{office}/{gridX},{gridY}/forecast
```

NOAA already provides **probability of precipitation** and temperature forecasts in the response. Map these directly to Kalshi markets.

**Model approach:**

```javascript
async function weatherFairValue(market) {
  const title = market.title.toLowerCase();
  
  // Step 1: Extract location from market title
  // "Will it snow in NYC on March 22?" → NYC → lat/lon lookup
  const location = extractLocationFromTitle(title);
  if (!location) return null;
  
  // Step 2: Get NOAA grid point for that location
  // GET https://api.weather.gov/points/{lat},{lon}
  // Returns office + gridX + gridY
  const grid = await noaaGetGrid(location.lat, location.lon);
  if (!grid) return null;
  
  // Step 3: Get forecast
  const forecast = await noaaGetForecast(grid.office, grid.gridX, grid.gridY);
  
  // Step 4: Find the relevant forecast period
  // "Will temp exceed 70°F on Friday?" → find Friday's forecast period
  const period = findForecastPeriod(forecast, market.close_time);
  
  // Step 5: Extract probability
  if (title.includes('rain') || title.includes('precipitation')) {
    return { prob: period.probabilityOfPrecipitation / 100, source: 'noaa', confidence: 'high' };
  }
  if (title.includes('snow')) {
    // NOAA has snow probability in hourly forecast (not period)
    return { prob: estimateSnowProb(period), source: 'noaa', confidence: 'medium' };
  }
  if (title.includes('temp') || title.match(/\d+°/)) {
    const threshold = extractTempThreshold(title);
    const prob = tempExceedProb(period.temperature, period.temperatureTrend, threshold);
    return { prob, source: 'noaa', confidence: 'high' };
  }
  return null;
}
```

**Location extraction for MVP:** Build a small lookup table of the 20 most common Kalshi weather market cities (NYC, LA, Chicago, Miami, Dallas, Seattle, etc.) with their lat/lon. Expand later.

```javascript
const CITY_COORDS = {
  'new york': { lat: 40.7128, lon: -74.0060 },
  'nyc': { lat: 40.7128, lon: -74.0060 },
  'los angeles': { lat: 34.0522, lon: -118.2437 },
  'chicago': { lat: 41.8781, lon: -87.6298 },
  'miami': { lat: 25.7617, lon: -80.1918 },
  'dallas': { lat: 32.7767, lon: -96.7970 },
  'seattle': { lat: 47.6062, lon: -122.3321 },
  'denver': { lat: 39.7392, lon: -104.9903 },
  'boston': { lat: 42.3601, lon: -71.0589 },
  'phoenix': { lat: 33.4484, lon: -112.0740 },
};
```

---

### 4. CRYPTO

**Fair value signal:** Current price vs threshold implied by market title.

**Data source:** CoinGecko free API (already in `scanner-news.js`).

```
GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true
```

**Model approach:**

```javascript
async function cryptoFairValue(market) {
  const title = market.title.toLowerCase();
  const close = new Date(market.close_time);
  const hoursUntilClose = (close - Date.now()) / 3600000;
  
  // Extract threshold: "Will BTC close above $85,000 today?"
  const priceMatch = title.match(/\$?([\d,]+)k?/);
  if (!priceMatch) return null;
  const threshold = parseFloat(priceMatch[1].replace(/,/g,'')) * (title.includes('k') ? 1000 : 1);
  
  // Get current price
  const cg = await fetchCoinGecko();
  const currentPrice = title.includes('btc') || title.includes('bitcoin')
    ? cg?.bitcoin?.usd
    : title.includes('eth') ? cg?.ethereum?.usd : null;
  if (!currentPrice) return null;
  
  // Model: log-normal random walk approximation
  // BTC daily volatility ~2-4%, hourly ~0.5-1%
  const dailyVol = 0.03; // 3% daily vol
  const periodVol = dailyVol * Math.sqrt(hoursUntilClose / 24);
  const logReturn = Math.log(threshold / currentPrice);
  const prob = 1 - normalCDF(logReturn / periodVol);
  
  return { prob: Math.max(0.02, Math.min(0.98, prob)), source: 'coingecko+lognormal', confidence: 'medium' };
}
```

---

### 5. POLITICS

**Fair value signal:** Polymarket as external consensus (no API key needed for public data).

**Model approach:**

```javascript
// Option A: Use Polymarket as consensus
// Their public slug API: https://gamma-api.polymarket.com/markets?active=true
// Find matching market by keyword, use mid-price as fair value

// Option B: Static polling aggregation (for elections)
// FiveThirtyEight-style: average recent polls
// Complex to implement — defer to post-MVP

// MVP recommendation: Use Polymarket mid-price as fair value for matching markets
async function politicsFairValue(market) {
  // Simple: if Kalshi price deviates >5% from Polymarket for same event = signal
  const polyPrice = await getPolymarketPrice(market.title);
  if (!polyPrice) return null;
  return { prob: polyPrice, source: 'polymarket-consensus', confidence: 'high' };
}
```

**Polymarket public API:**
```
GET https://gamma-api.polymarket.com/markets?active=true&limit=100&q={search_term}
```
No API key needed. Returns slug, current prices, volume.

---

### 6. ENTERTAINMENT

**Fair value signal:** Hard to model systematically. Defer for now.

**MVP approach:** Skip entertainment markets in L2 scanner — too noisy, no reliable data source. Focus scanner effort on economics + weather + crypto where we have clean data.

```javascript
if (category === 'entertainment') return null; // skip for MVP
```

---

## Implementation Priority for V-L2-FV

| Category | Data source | Implementation effort | Priority |
|----------|------------|----------------------|----------|
| Sports | Layer 1 already covers | 0 (just skip in L2) | Done |
| Economics | FRED CSV (no key) | 2 hours | HIGH |
| Weather | NOAA API (no key) | 3 hours | HIGH |
| Crypto | CoinGecko (no key) | 1 hour | MEDIUM |
| Politics | Polymarket API (no key) | 2 hours | MEDIUM |
| Entertainment | No good source | Skip for MVP | LOW |

**Total for MVP fair value models: ~8 hours of engineering.**

---

## Helper Functions Needed

```javascript
// Normal CDF approximation (for crypto model)
function normalCDF(x) {
  return (1 + erf(x / Math.sqrt(2))) / 2;
}
function erf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

// Sigmoid for economic threshold models
function sigmoidProb(delta, sensitivity = 2) {
  return 1 / (1 + Math.exp(-sensitivity * delta));
}
```
