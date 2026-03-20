const { KalshiClient } = require('/root/PastaOS/Plutus/oddstool-v2/kalshi-client');
const { weightedSignalStrength } = require('./atlas-manager');

function isSameDayClose(closeTime) {
  if (!closeTime) return false;
  const d = new Date(closeTime);
  const now = new Date();
  return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth() && d.getUTCDate() === now.getUTCDate();
}

function inferCategory(market) {
  const text = `${market.title || ''} ${market.subtitle || ''} ${market.ticker || ''}`.toLowerCase();
  if (/nba|nfl|nhl|mlb|soccer|tennis|game|match/.test(text)) return { category: 'sports', key: 'sports_weight' };
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
  // Baseline heuristic model (to be replaced with category-specific models).
  const { yes } = marketPrices(market);
  const volume = Number(market.volume ?? market.volume_24h ?? 0);
  const oi = Number(market.open_interest ?? 0);

  let edgeBps = 0;
  if (category === 'economics' && volume < 5000) edgeBps = 200;
  if (category === 'weather' && volume < 3000) edgeBps = 300;
  if (category === 'politics' && oi > 20000) edgeBps = -100;

  // Mean-revert noisy small markets a bit toward 50%.
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

async function scanKalshiNativeLayer() {
  const client = new KalshiClient({ demo: true });
  const markets = await fetchAllActiveMarkets(client);

  const sameDay = markets.filter((m) => {
    const status = String(m.status || '').toLowerCase();
    const isActive = !status || status === 'active' || status === 'open';
    return isActive && isSameDayClose(m.close_time || m.closeTime);
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
