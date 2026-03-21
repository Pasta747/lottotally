const { KalshiClient } = require('/root/PastaOS/Plutus/oddstool-v2/kalshi-client');
const { weightedSignalStrength } = require('./atlas-manager');

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
  const yes = Number(m.yes_ask ?? m.yes_price ?? m.last_price ?? 0);
  const no = Number(m.no_ask ?? (yes ? 100 - yes : 0));
  return { yes: yes / 100, no: no / 100 };
}

function estimatedProb(market, category) {
  // Baseline heuristic model — phase 1 placeholder.
  // Phase 2 will replace this with category-specific models.
  const { yes } = marketPrices(market);
  const volume = Number(market.volume ?? market.volume_24h ?? 0);
  const oi = Number(market.open_interest ?? 0);

  let edgeBps = 0;
  if (category === 'economics' && volume < 5000) edgeBps = 200;
  if (category === 'weather' && volume < 3000) edgeBps = 300;
  if (category === 'politics' && oi > 20000) edgeBps = -100;
  // New sports categories — thin markets may be mispriced
  if (category === 'tennis' && volume < 2000) edgeBps = 150;
  if (category === 'college_basketball' && volume < 3000) edgeBps = 150;
  if (category === 'soccer' && volume < 2000) edgeBps = 100;

  // Mean-revert noisy small markets toward 50%
  const shrink = Math.max(0, Math.min(0.15, 1 / Math.max(10, Math.log10(volume + oi + 10))));
  const centered = yes * (1 - shrink) + 0.5 * shrink;
  return Math.max(0.01, Math.min(0.99, centered + edgeBps / 10000));
}

async function fetchAllActiveMarkets(client) {
  let cursor = null;
  const all = [];
  for (let i = 0; i < 20; i++) {
    const res = await client.getMarkets({ limit: 200, cursor: cursor || undefined });
    const markets = res?.markets || res?.data?.markets || [];
    all.push(...markets);
    cursor = res?.cursor || res?.data?.cursor || null;
    if (!cursor || !markets.length) break;
  }
  return all;
}

async function scanKalshiNativeLayer(userProfile = null) {
  // Use user's stored keys if provided, otherwise fall back to read-only market data
  // (no auth needed for public market listings)
  let client;
  if (userProfile?.kalshiKeyId && userProfile?.kalshiSecretEncrypted) {
    const { decrypt } = require('../app/utils/encryption.js');
    const privateKeyPem = decrypt(userProfile.kalshiSecretEncrypted);
    const isDemo = userProfile.kalshiMode !== 'live';
    client = new KalshiClient({ demo: isDemo });
    client.apiKeyId = userProfile.kalshiKeyId;
    client.privateKeyPem = privateKeyPem;
  } else {
    // Public market data only (no auth) — scanner still works for signal generation
    client = new KalshiClient({ demo: true });
  }
  const markets = await fetchAllActiveMarkets(client);

  const sameDay = markets.filter((m) => {
    const status = String(m.status || '').toLowerCase();
    const isActive = !status || status === 'active' || status === 'open' || status === 'initialized';
    // Within 48h for tennis/soccer/college tournaments that span multiple days
    return isActive && isWithinHours(m.close_time || m.closeTime, 48);
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
      executionPrice: side === 'yes' ? (m.yes_ask ?? m.yes_price ?? null) : (m.no_ask ?? m.no_price ?? null),
      closeTime: m.close_time || m.closeTime,
      raw: m,
    });
  }

  signals.sort((a, b) => b.signalStrength - a.signalStrength);
  return signals;
}

module.exports = { scanKalshiNativeLayer };
