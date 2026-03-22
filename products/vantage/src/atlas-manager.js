const fs = require('fs');
const path = require('path');

const WEIGHTS_FILE = path.join(__dirname, '..', 'data', 'atlas-weights.json');
const MIN_WEIGHT = 0.5;
const MAX_WEIGHT = 2.0;

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

function clampWeight(value) {
  return Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, Number(value.toFixed(4))));
}

function toCategoryKey(signal = {}) {
  if (signal.categoryKey) return signal.categoryKey;
  const raw = String(signal.category || '').trim().toLowerCase();
  if (!raw) return null;
  return raw.endsWith('_weight') ? raw : `${raw}_weight`;
}

function toSourceKey(signal = {}) {
  if (signal.sourceKey) return signal.sourceKey;
  const raw = String(signal.source || '').trim().toLowerCase();
  if (!raw) return null;
  return raw.endsWith('_weight') ? raw : `${raw}_weight`;
}

function updateWeightsFromOutcome(signal = {}, outcome) {
  const normalizedOutcome = String(outcome || '').toLowerCase();
  if (!['win', 'loss'].includes(normalizedOutcome)) {
    return { ok: false, reason: 'invalid_outcome' };
  }

  const factor = normalizedOutcome === 'win' ? 1.05 : 0.95;
  const weights = loadWeights();
  const updates = {};

  const layer = signal.layer;
  if (layer) {
    const current = weights.layers[layer]?.weight ?? 1;
    const next = clampWeight(current * factor);
    if (!weights.layers[layer]) weights.layers[layer] = { weight: 1 };
    weights.layers[layer].weight = next;
    updates.layer = { key: layer, from: current, to: next };
  }

  const categoryKey = toCategoryKey(signal);
  if (categoryKey) {
    const current = weights.categories[categoryKey] ?? 1;
    const next = clampWeight(current * factor);
    weights.categories[categoryKey] = next;
    updates.category = { key: categoryKey, from: current, to: next };
  }

  const sourceKey = toSourceKey(signal);
  if (sourceKey) {
    const current = weights.sources[sourceKey] ?? 1;
    const next = clampWeight(current * factor);
    weights.sources[sourceKey] = next;
    updates.source = { key: sourceKey, from: current, to: next };
  }

  // Track per-model performance for model quality assessment
  const modelSource = signal.modelSource || 'heuristic';
  if (!weights.perf[modelSource]) {
    weights.perf[modelSource] = { wins: 0, losses: 0, edge_sum: 0, count: 0 };
  }
  const p = weights.perf[modelSource];
  if (normalizedOutcome === 'win') p.wins++;
  else p.losses++;
  p.count++;
  p.edge_sum = (p.edge_sum || 0) + (signal.signalStrength || 0);
  p.win_rate = p.count > 0 ? (p.wins / p.count) : 0;
  p.avg_edge = p.count > 0 ? (p.edge_sum / p.count) : 0;

  saveWeights(weights);
  return { ok: true, outcome: normalizedOutcome, factor, updates, weights };
}

module.exports = { loadWeights, saveWeights, weightedSignalStrength, updateWeightsFromOutcome };
