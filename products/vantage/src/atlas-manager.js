const fs = require('fs');
const path = require('path');

const WEIGHTS_FILE = path.join(__dirname, '..', 'data', 'atlas-weights.json');

const DEFAULT = {
  layers: {
    sports: { weight: 1 },
    kalshi_native: { weight: 1 },
    news: { weight: 1 },
  },
  categories: {
    sports_weight: 1,
    politics_weight: 1,
    economics_weight: 1,
    weather_weight: 1,
    crypto_weight: 1,
    entertainment_weight: 1,
  },
  sources: {
    fred_weight: 1,
    noaa_weight: 1,
    newsapi_weight: 1,
    coingecko_weight: 1,
  },
  perf: {},
  updatedAt: new Date().toISOString(),
};

function loadWeights() {
  if (!fs.existsSync(WEIGHTS_FILE)) {
    fs.mkdirSync(path.dirname(WEIGHTS_FILE), { recursive: true });
    fs.writeFileSync(WEIGHTS_FILE, JSON.stringify(DEFAULT, null, 2));
    return { ...DEFAULT };
  }
  try {
    return JSON.parse(fs.readFileSync(WEIGHTS_FILE, 'utf8'));
  } catch {
    return { ...DEFAULT };
  }
}

function saveWeights(weights) {
  weights.updatedAt = new Date().toISOString();
  fs.writeFileSync(WEIGHTS_FILE, `${JSON.stringify(weights, null, 2)}\n`);
}

function weightedSignalStrength({ baseStrength, layer, categoryKey, sourceKey }) {
  const w = loadWeights();
  const layerWeight = w.layers[layer]?.weight ?? 1;
  const categoryWeight = categoryKey ? (w.categories[categoryKey] ?? 1) : 1;
  const sourceWeight = sourceKey ? (w.sources[sourceKey] ?? 1) : 1;
  return Number((baseStrength * layerWeight * categoryWeight * sourceWeight).toFixed(4));
}

module.exports = { loadWeights, saveWeights, weightedSignalStrength };
