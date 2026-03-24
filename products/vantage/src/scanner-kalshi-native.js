const { KalshiClient } = require('/root/PastaOS/Plutus/oddstool-v2/kalshi-client');
const { weightedSignalStrength } = require('./atlas-manager');
const { estimateNCAASpreadProbForMarket } = require('./models/ncaa-spread-model');
const { estimateTennisMatchProbForMarket } = require('./models/tennis-model');
const { estimateMLBProbForMarket } = require('./models/mlb-model');

function isWithinHours(closeTime, hours = 48) {
  if (!closeTime) return false;
  const d = new Date(closeTime);
  const now = new Date();
  const diffMs = d - now;
  return diffMs > 0 && diffMs < hours * 60 * 60 * 1000;
}

function inferCategory(market) {
  const text = `${market.title || ''} ${market.subtitle || ''} ${market.ticker || ''}`.toLowerCase();
  const ticker = (market.ticker || '').toUpperCase();

  // Ticker-based detection (most reliable)
  if (/^KXATP|^KXWTA/.test(ticker)) return { category: 'tennis', key: 'sports_weight' };
  if (/^KXNCAA|^KXCBB/.test(ticker)) return { category: 'college_basketball', key: 'sports_weight' };
  if (/^KXEPL|^KXMLS|^KXUEFA|^KXLALIGA|^KXSERIE|^KXBUNDES/.test(ticker)) return { category: 'soccer', key: 'sports_weight' };
  if (/^KXNBA/.test(ticker)) return { category: 'nba', key: 'sports_weight' };
  if (/^KXNFL/.test(ticker)) return { category: 'nfl', key: 'sports_weight' };
  if (/^KXNHL/.test(ticker)) return { category: 'nhl', key: 'sports_weight' };
  if (/^KXMLB/.test(ticker)) return { category: 'mlb', key: 'sports_weight' };

  // Text-based fallback
  if (/tennis|atp|wta|wimbledon|open|roland/.test(text)) return { category: 'tennis', key: 'sports_weight' };
  if (/ncaa|march madness|college basketball|cbb/.test(text)) return { category: 'college_basketball', key: 'sports_weight' };
  if (/premier league|epl|mls|la liga|serie a|bundesliga|champions league|soccer|football club/.test(text)) return { category: 'soccer', key: 'sports_weight' };
  if (/nba|nfl|nhl|mlb|game|match/.test(text)) return { category: 'sports', key: 'sports_weight' };
  if (/election|president|senate|house|vote|poll/.test(text)) return { category: 'politics', key: 'politics_weight' };
  if (/cpi|inflation|fed|interest|jobs|unemployment|gdp|treasury/.test(text)) return { category: 'economics', key: 'economics_weight' };
  if (/weather|temp|temperature|rain|snow|storm|hurricane/.test(text)) return { category: 'weather', key: 'weather_weight' };
  if (/btc|bitcoin|eth|crypto/.test(text)) return { category: 'crypto', key: 'crypto_weight' };
  return { category: 'entertainment', key: 'entertainment_weight' };
}

function marketPrices(m) {
  // Live API returns _dollars fields (0.0-1.0); demo returns integer cents (0-100)
  let yes = Number(m.yes_ask_dollars ?? m.yes_ask ?? m.yes_price ?? m.last_price_dollars ?? m.last_price ?? 0);
  // If value > 1, it's in cents format — convert
  if (yes > 1) yes = yes / 100;
  const no = 1 - yes;
  return { yes, no };
}

// Heuristic fallback (used when category-specific model has no data)
function heuristicProb(market) {
  const { yes } = marketPrices(market);
  const volume = Number(market.volume_fp ?? market.volume ?? 0);
  const oi = Number(market.open_interest_fp ?? market.open_interest ?? 0);
  const shrink = Math.max(0, Math.min(0.10, 1 / Math.max(10, Math.log10(volume + oi + 10))));
  return Math.max(0.01, Math.min(0.99, yes * (1 - shrink) + 0.5 * shrink));
}

// Category-specific model results cache (populated asynchronously)
// Keys: market ticker → { prob, ts }
const _modelCache = {};

/**
 * Synchronous wrapper — returns cached model result or heuristic fallback.
 * Kicks off async model computation for next scan cycle.
 */
function estimatedProb(market, category) {
  const ticker = market.ticker;

  // Return cached model result if fresh (< 10 min)
  const cached = _modelCache[ticker];
  if (cached && Date.now() - cached.ts < 10 * 60 * 1000) {
    return cached.prob;
  }

  // Kick off async model computation (result available next cycle)
  if (category === 'college_basketball' || category === 'ncaa') {
    estimateNCAASpreadProbForMarket(market).then(r => {
      if (r?.prob != null) _modelCache[ticker] = { prob: r.prob, ts: Date.now(), source: 'ncaa-model' };
    }).catch(() => {});
  } else if (category === 'tennis') {
    estimateTennisMatchProbForMarket(market).then(r => {
      if (r?.prob != null) _modelCache[ticker] = { prob: r.prob, ts: Date.now(), source: 'tennis-model' };
    }).catch(() => {});
  } else if (category === 'mlb') {
    estimateMLBProbForMarket(market).then(r => {
      if (r?.prob != null) _modelCache[ticker] = { prob: r.prob, ts: Date.now(), source: 'mlb-model' };
    }).catch(() => {});
  }

  // Return heuristic for this cycle
  return heuristicProb(market);
}

// Target series to scan — specific game markets with real liquidity
const TARGET_SERIES = [
  'KXNBAGAME', 'KXNBASPREAD', 'KXNBATOTAL',    // NBA
  'KXMLBGAME', 'KXMLBSPREAD', 'KXMLBTOTAL',    // MLB
  'KXATPMATCH', 'KXATPSETWINNER',               // ATP Tennis
  'KXWTAMATCH',                                  // WTA Tennis
  'KXNCAAMBSPREAD', 'KXNCAAMBTOTAL',            // College basketball
  'KXNCAAWBTOTAL',                               // Women's college basketball
  'KXEPLGOAL', 'KXEPLMATCH',                    // EPL Soccer
  'KXNHLGOAL', 'KXNHLFIRSTGOAL',               // NHL
  'KXBTC', 'KXETH',                             // Crypto
];

// In-memory cache per series
let _seriesCache = {};
let _seriesCacheTs = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5-minute cache

async function fetchAllActiveMarkets(client) {
  const now = Date.now();
  const all = [];

  for (const series of TARGET_SERIES) {
    if (_seriesCache[series] && (now - (_seriesCacheTs[series] || 0)) < CACHE_TTL_MS) {
      all.push(..._seriesCache[series]);
      continue;
    }
    try {
      const res = await client.getMarkets({ limit: 100, series_ticker: series });
      const markets = res?.data?.markets || res?.markets || [];
      _seriesCache[series] = markets;
      _seriesCacheTs[series] = now;
      all.push(...markets);
      await new Promise(r => setTimeout(r, 100)); // 100ms between series calls
    } catch (_) {}
  }

  return all;
}

async function scanKalshiNativeLayer(userProfile = null) {
  // Market data is PUBLIC — no auth needed for scanning.
  // Use live markets by default (real prices, real liquidity).
  // Auth keys are only needed for ORDER PLACEMENT (handled separately via Vercel API).
  const isDemo = userProfile?.kalshiMode === 'demo';
  const client = new KalshiClient({ demo: isDemo });
  // No keys needed for public market listing — null keys = unauthenticated read
  const markets = await fetchAllActiveMarkets(client);

  const sameDay = markets.filter((m) => {
    const status = String(m.status || '').toLowerCase();
    const isActive = !status || status === 'active' || status === 'open' || status === 'initialized';
    if (!isActive) return false;

    const ticker = (m.ticker || '').toUpperCase();
    const closeTime = m.close_time || m.closeTime || '';
    const ct = new Date(closeTime);
    const now = new Date();

    // NBA/MLB game markets close at season end but are live NOW — include if genuinely priced
    // Exclude: KXMVE (complex parlay markets), price=0 or price=1 (no real market)
    const isKXMVE = ticker.startsWith('KXMVE');
    if (isKXMVE) return false;
    const askDollars = parseFloat(m.yes_ask_dollars ?? m.yes_ask ?? 0);
    const hasRealPrice = askDollars > 0.02 && askDollars < 0.98; // real two-sided market
    if (hasRealPrice && ct > now) return true;

    // For all others: within 48h window
    return isWithinHours(closeTime, 48);
  });

  const signals = [];
  for (const m of sameDay) {
    const { category, key } = inferCategory(m);
    const { yes } = marketPrices(m);
    if (!yes) continue;

    const pEst = estimatedProb(m, category);
    const diff = pEst - yes;
    const absDiff = Math.abs(diff);
    if (absDiff < 0.03) continue; // require 3%+ mispricing

    const side = diff > 0 ? 'yes' : 'no';
    const baseStrength = absDiff;
    const signalStrength = weightedSignalStrength({
      baseStrength,
      layer: 'kalshi_native',
      categoryKey: key,
    });

    signals.push({
      layer: 2,
      source: 'kalshi-native',
      category,
      ticker: m.ticker,
      title: m.title,
      side,
      marketPrice: yes,
      estimatedProb: pEst,
      signalStrength,
      executionPrice: side === 'yes'
        ? (m.yes_ask_dollars ?? (m.yes_ask ? m.yes_ask / 100 : null))
        : (m.no_ask_dollars ?? (m.no_ask ? m.no_ask / 100 : null)),
      closeTime: m.close_time || m.closeTime,
      raw: m,
    });
  }

  signals.sort((a, b) => b.signalStrength - a.signalStrength);
  return signals;
}

module.exports = { scanKalshiNativeLayer };
