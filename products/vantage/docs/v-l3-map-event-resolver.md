# V-L3-MAP — Event-to-Market Resolver
_Research by Achille | 2026-03-20_
_For Einstein+Coder — maps news/data events to specific Kalshi tickers_

---

## Problem

The news scanner (`scanner-news.js`) currently uses a naive keyword search:
```javascript
async function mapNewsToMarkets(client, keyword) {
  const markets = await client.getMarkets({ limit: 200 });
  return markets.filter(m => m.title.includes(keyword));
}
```

This generates false positives (e.g. "bitcoin" matches "Bitcoin ETF flows" AND "Will Bitcoin exceed $100K?") and misses markets with different phrasing. The V-L3-MAP task is to build a proper event→market resolver.

---

## Architecture: Event Types → Market Matchers

Each news/data event has a type. Each type maps to a set of market matching strategies.

```javascript
const EVENT_RESOLVERS = {
  'btc_price_move':    cryptoPriceResolver('bitcoin', 'BTC'),
  'eth_price_move':    cryptoPriceResolver('ethereum', 'ETH'),
  'cpi_release':       economicThresholdResolver('CPI', ['cpi', 'inflation', 'consumer price']),
  'fed_decision':      economicThresholdResolver('FED', ['fed', 'federal reserve', 'rate', 'fomc']),
  'unemployment':      economicThresholdResolver('JOBS', ['unemployment', 'jobs', 'nonfarm']),
  'weather_temp':      weatherResolver(['temperature', 'temp', '°f', 'degrees']),
  'weather_precip':    weatherResolver(['rain', 'snow', 'precipitation', 'inches']),
  'nba_game':          sportsGameResolver('NBA', ['nba', 'lakers', 'celtics', 'warriors']),
  'nfl_game':          sportsGameResolver('NFL', ['nfl', 'eagles', 'chiefs', 'patriots']),
};
```

---

## Resolver Functions

### 1. Crypto Price Resolver

```javascript
function cryptoPriceResolver(coinName, symbol) {
  return async (client, eventData) => {
    const { currentPrice, change24h } = eventData;
    const markets = await getMarketsWithCache(client);
    
    return markets
      .filter(m => {
        const title = m.title.toLowerCase();
        // Match: coin name OR ticker symbol in title
        if (!title.includes(coinName) && !title.includes(symbol.toLowerCase())) return false;
        // Must be a price threshold market (has a $ amount)
        if (!title.match(/\$[\d,]+/) && !title.match(/\d+k\b/)) return false;
        return true;
      })
      .map(m => {
        // Extract threshold from title
        const threshold = extractPriceThreshold(m.title);
        if (!threshold) return null;
        
        // Determine relevance: how close is current price to threshold?
        const distancePct = Math.abs(currentPrice - threshold) / currentPrice;
        if (distancePct > 0.20) return null; // >20% away = not relevant right now
        
        return {
          market: m,
          eventType: `${symbol}_price_move`,
          threshold,
          currentPrice,
          relevanceScore: 1 - distancePct, // closer = more relevant
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  };
}

function extractPriceThreshold(title) {
  // "Will BTC close above $85,000?" → 85000
  // "Bitcoin above 90k?" → 90000
  const dollarMatch = title.match(/\$(\d[\d,]*)/);
  if (dollarMatch) return parseFloat(dollarMatch[1].replace(/,/g, ''));
  const kMatch = title.match(/(\d+(?:\.\d+)?)k\b/);
  if (kMatch) return parseFloat(kMatch[1]) * 1000;
  return null;
}
```

---

### 2. Economic Threshold Resolver

```javascript
function economicThresholdResolver(seriesName, keywords) {
  return async (client, eventData) => {
    const { currentValue, previousValue, forecastValue } = eventData;
    const markets = await getMarketsWithCache(client);
    
    return markets
      .filter(m => {
        const title = m.title.toLowerCase();
        return keywords.some(kw => title.includes(kw));
      })
      .map(m => {
        // Extract threshold: "Will CPI exceed 3.5%?" → 3.5
        const pctMatch = m.title.match(/(\d+\.?\d*)%/);
        if (!pctMatch) return null;
        const threshold = parseFloat(pctMatch[1]);
        
        // Determine directional signal
        const above = m.title.toLowerCase().includes('above') || 
                      m.title.toLowerCase().includes('exceed') ||
                      m.title.toLowerCase().includes('higher');
        
        return {
          market: m,
          eventType: `economic_${seriesName}`,
          threshold,
          currentValue,
          forecastValue,
          suggestedSide: above
            ? (currentValue > threshold ? 'yes' : 'no')
            : (currentValue < threshold ? 'yes' : 'no'),
          confidence: forecastValue 
            ? Math.abs(forecastValue - threshold) > 0.1 ? 'high' : 'medium'
            : 'low',
        };
      })
      .filter(Boolean);
  };
}
```

---

### 3. Weather Resolver

```javascript
function weatherResolver(keywords) {
  return async (client, eventData) => {
    const { city, forecastTemp, precipProb, forecastDate } = eventData;
    const markets = await getMarketsWithCache(client);
    
    return markets
      .filter(m => {
        const title = m.title.toLowerCase();
        // Must mention the city AND a weather keyword
        const cityMatch = city ? title.includes(city.toLowerCase()) : true;
        const keywordMatch = keywords.some(kw => title.includes(kw));
        return cityMatch && keywordMatch;
      })
      .map(m => {
        const close = new Date(m.close_time || m.closeTime);
        const target = new Date(forecastDate);
        
        // Match forecast date to market close date (within 1 day)
        const dayDiff = Math.abs(close - target) / 86400000;
        if (dayDiff > 1.5) return null;
        
        const title = m.title.toLowerCase();
        let suggestedSide, confidence;
        
        if (title.includes('rain') || title.includes('precipitation')) {
          suggestedSide = precipProb > 0.5 ? 'yes' : 'no';
          confidence = Math.abs(precipProb - 0.5) > 0.2 ? 'high' : 'medium';
        } else if (title.match(/\d+°/)) {
          const threshold = extractTempThreshold(m.title);
          const above = title.includes('above') || title.includes('exceed');
          suggestedSide = above 
            ? (forecastTemp > threshold ? 'yes' : 'no')
            : (forecastTemp < threshold ? 'yes' : 'no');
          confidence = Math.abs(forecastTemp - threshold) > 5 ? 'high' : 'medium';
        }
        
        return suggestedSide ? { market: m, eventType: 'weather', suggestedSide, confidence } : null;
      })
      .filter(Boolean);
  };
}

function extractTempThreshold(title) {
  const match = title.match(/(\d+)\s*°/);
  return match ? parseInt(match[1]) : null;
}
```

---

### 4. Sports Game Resolver

```javascript
function sportsGameResolver(league, keywords) {
  return async (client, eventData) => {
    // Sports is handled by Layer 1 — L3 should defer
    // Only use L3 for "over/under wins" type markets, not game outcomes
    const markets = await getMarketsWithCache(client);
    
    return markets
      .filter(m => {
        const title = m.title.toLowerCase();
        return keywords.some(kw => title.includes(kw)) &&
               (title.includes('season wins') || title.includes('playoff') || title.includes('championship'));
      })
      .map(m => ({
        market: m,
        eventType: `sports_futures_${league}`,
        // Fair value from Layer 1 odds-api.io — defer signal generation to L1
        deferToLayer1: true,
      }));
  };
}
```

---

## Market Cache (Critical for Performance)

The resolver fetches all markets once per scan cycle and caches. Don't call `getMarkets()` per resolver.

```javascript
// In scanner-news.js — replace mapNewsToMarkets with cached version
let _marketCache = null;
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getMarketsWithCache(client) {
  if (_marketCache && Date.now() - _cacheTime < CACHE_TTL) return _marketCache;
  
  const res = await client.getMarkets({ limit: 1000, status: 'active' });
  _marketCache = res?.markets || res?.data?.markets || [];
  _cacheTime = Date.now();
  return _marketCache;
}
```

---

## Wiring into scanNewsLayer()

```javascript
async function scanNewsLayer() {
  const client = new KalshiClient({ demo: true });
  const out = [];

  // Fetch all data sources in parallel
  const [cg, fred, noaa] = await Promise.all([
    fetchCoinGecko(),
    fetchFRED('CPIAUCSL'),
    fetchNOAA({ city: 'new york', lat: 40.71, lon: -74.01 }),
  ]);

  // Resolve events to markets
  const eventQueue = [];

  if (cg?.bitcoin) {
    eventQueue.push({
      type: 'btc_price_move',
      data: { currentPrice: cg.bitcoin.usd, change24h: cg.bitcoin.usd_24h_change },
    });
  }
  if (fred) {
    eventQueue.push({
      type: 'cpi_release',
      data: { currentValue: fred.latest, previousValue: fred.prev, forecastValue: null },
    });
  }
  if (noaa) {
    eventQueue.push({
      type: 'weather_temp',
      data: { city: 'new york', forecastTemp: noaa.tempF, precipProb: noaa.precipProb, forecastDate: noaa.date },
    });
  }

  // Run resolvers
  for (const event of eventQueue) {
    const resolver = EVENT_RESOLVERS[event.type];
    if (!resolver) continue;
    const matches = await resolver(client, event.data);
    for (const match of matches) {
      if (match.deferToLayer1) continue; // sports handled by L1
      const strength = weightedSignalStrength({
        baseStrength: match.confidence === 'high' ? 0.12 : 0.06,
        layer: 'news',
        categoryKey: getCategoryWeight(match.market),
        sourceKey: getSourceWeight(event.type),
      });
      out.push({
        layer: 3,
        source: event.type,
        ...match,
        signalStrength: strength,
        executionPrice: match.market.yes_ask ?? match.market.yes_price ?? null,
        side: match.suggestedSide,
        ticker: match.market.ticker,
        title: match.market.title,
      });
    }
  }

  return out.sort((a, b) => b.signalStrength - a.signalStrength);
}
```

---

## MVP Scope (What to Actually Build for Mar 23)

For the MVP event resolver, implement these 4 in priority order:

| # | Event type | Data source | Effort | Value |
|---|-----------|------------|--------|-------|
| 1 | BTC/ETH price move | CoinGecko (already in code) | 1h | High |
| 2 | Weather (NYC, LA, CHI) | NOAA (confirmed live) | 2h | High |
| 3 | CPI/inflation | FRED CSV (no key) | 1.5h | Medium |
| 4 | Fed rate decision | FRED (same as CPI) | 0.5h | Medium |

**Skip for V1:** Sports (Layer 1 covers), Entertainment (no data source), generic keyword matching.

**Total: ~5 hours of engineering for V-L3-MAP MVP.**
