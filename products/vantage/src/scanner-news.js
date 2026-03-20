const { KalshiClient } = require('/root/PastaOS/Plutus/oddstool-v2/kalshi-client');
const { weightedSignalStrength } = require('./atlas-manager');

async function fetchCoinGecko() {
  const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
  if (!res.ok) return null;
  return res.json();
}

async function fetchFRED() {
  // No-key endpoint fallback: latest CPIAUCSL series via St. Louis CSV endpoint
  const url = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPIAUCSL';
  const res = await fetch(url);
  if (!res.ok) return null;
  const text = await res.text();
  const rows = text.trim().split(/\r?\n/);
  const last = rows[rows.length - 1]?.split(',');
  const prev = rows[rows.length - 2]?.split(',');
  if (!last || !prev) return null;
  const v1 = Number(last[1]);
  const v0 = Number(prev[1]);
  if (!Number.isFinite(v1) || !Number.isFinite(v0)) return null;
  return { latest: v1, prev: v0, momDelta: v1 - v0 };
}

async function fetchNOAA() {
  // Lightweight weather check (NYC station sample)
  const url = 'https://api.weather.gov/gridpoints/OKX/33,35/forecast';
  const res = await fetch(url, { headers: { 'User-Agent': 'vantage-scanner/0.1' } });
  if (!res.ok) return null;
  const json = await res.json();
  const p = json?.properties?.periods?.[0];
  if (!p) return null;
  return { tempF: Number(p.temperature), name: p.name };
}

async function mapNewsToMarkets(client, keyword) {
  const marketsRes = await client.getMarkets({ limit: 200 });
  const markets = marketsRes?.markets || [];
  return markets.filter((m) => `${m.title || ''} ${m.subtitle || ''}`.toLowerCase().includes(keyword.toLowerCase()));
}

async function scanNewsLayer() {
  const client = new KalshiClient({ demo: true });
  const out = [];

  const [cg, fred, noaa] = await Promise.all([fetchCoinGecko(), fetchFRED(), fetchNOAA()]);

  if (cg?.bitcoin?.usd_24h_change != null) {
    const change = Number(cg.bitcoin.usd_24h_change);
    const markets = await mapNewsToMarkets(client, 'bitcoin');
    for (const m of markets.slice(0, 5)) {
      const strength = Math.min(0.2, Math.abs(change) / 100);
      out.push({
        layer: 3,
        source: 'coingecko',
        category: 'crypto',
        ticker: m.ticker,
        side: change > 0 ? 'yes' : 'no',
        signalStrength: weightedSignalStrength({ baseStrength: strength, layer: 'news', categoryKey: 'crypto_weight', sourceKey: 'coingecko_weight' }),
        executionPrice: m.yes_ask ?? m.yes_price ?? null,
        rationale: `BTC 24h change ${change.toFixed(2)}%`,
      });
    }
  }

  if (fred) {
    const markets = await mapNewsToMarkets(client, 'inflation');
    for (const m of markets.slice(0, 5)) {
      const strength = Math.min(0.15, Math.abs(fred.momDelta) / 10);
      out.push({
        layer: 3,
        source: 'fred',
        category: 'economics',
        ticker: m.ticker,
        side: fred.momDelta > 0 ? 'yes' : 'no',
        signalStrength: weightedSignalStrength({ baseStrength: strength, layer: 'news', categoryKey: 'economics_weight', sourceKey: 'fred_weight' }),
        executionPrice: m.yes_ask ?? m.yes_price ?? null,
        rationale: `CPI delta ${fred.momDelta.toFixed(3)}`,
      });
    }
  }

  if (noaa?.tempF) {
    const markets = await mapNewsToMarkets(client, 'temperature');
    for (const m of markets.slice(0, 5)) {
      const strength = Math.min(0.2, Math.abs(noaa.tempF - 70) / 50);
      out.push({
        layer: 3,
        source: 'noaa',
        category: 'weather',
        ticker: m.ticker,
        side: noaa.tempF >= 73 ? 'yes' : 'no',
        signalStrength: weightedSignalStrength({ baseStrength: strength, layer: 'news', categoryKey: 'weather_weight', sourceKey: 'noaa_weight' }),
        executionPrice: m.yes_ask ?? m.yes_price ?? null,
        rationale: `NOAA temp ${noaa.tempF}F`,
      });
    }
  }

  out.sort((a, b) => b.signalStrength - a.signalStrength);
  return out;
}

module.exports = { scanNewsLayer };
