#!/usr/bin/env node
'use strict';

/**
 * settlement-tracker.js
 *
 * Polls pending trades from Vantage internal API, checks Kalshi settlement,
 * settles resolved trades, updates ATLAS weights, and appends settlement logs.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '/root/PastaOS/.env' });
const { KalshiClient } = require('/root/PastaOS/Plutus/oddstool-v2/kalshi-client');
const { updateWeightsFromOutcome } = require('./atlas-manager');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SETTLEMENTS_FILE = path.join(DATA_DIR, 'settlements.json');

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function appendSettlement(entry) {
  ensureDir();
  let rows = [];
  try {
    rows = JSON.parse(fs.readFileSync(SETTLEMENTS_FILE, 'utf8'));
    if (!Array.isArray(rows)) rows = [];
  } catch {
    rows = [];
  }
  rows.push({ ...entry, settledAt: new Date().toISOString() });
  fs.writeFileSync(SETTLEMENTS_FILE, `${JSON.stringify(rows, null, 2)}\n`);
}

function normalizeKalshiResult(result) {
  const r = String(result || '').toLowerCase();
  if (r === 'yes') return 'yes';
  if (r === 'no') return 'no';
  return null;
}

function computePnl({ side, executionPrice, contracts, settledResult }) {
  const safePrice = Number(executionPrice);
  const safeContracts = Number(contracts);
  const px = Number.isFinite(safePrice) ? Math.min(1, Math.max(0, safePrice)) : 0.5;
  const qty = Number.isFinite(safeContracts) && safeContracts > 0 ? safeContracts : 1;

  const isWin = String(side || '').toLowerCase() === settledResult;
  const pnl = isWin ? (1 - px) * qty : -px * qty;
  return {
    outcome: isWin ? 'win' : 'loss',
    pnl: Number(pnl.toFixed(4)),
    assumptions: {
      usedExecutionPrice: px,
      usedContracts: qty,
      priceFallbackApplied: !Number.isFinite(safePrice),
      contractsFallbackApplied: !(Number.isFinite(safeContracts) && safeContracts > 0),
    },
  };
}

async function apiGetPendingTrades(baseUrl, secret) {
  const res = await fetch(`${baseUrl}/api/internal/trades`, {
    method: 'GET',
    headers: { 'x-internal-secret': secret },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`pending trades fetch failed (${res.status}): ${JSON.stringify(json)}`);
  return Array.isArray(json?.trades) ? json.trades : [];
}

async function apiSettleTrade(baseUrl, secret, tradeId, body) {
  const res = await fetch(`${baseUrl}/api/internal/trades/${tradeId}/settle`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-internal-secret': secret,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`settle trade ${tradeId} failed (${res.status}): ${JSON.stringify(json)}`);
  return json;
}

async function run() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000';
  const secret = process.env.INTERNAL_API_SECRET;

  if (!secret) {
    throw new Error('Missing INTERNAL_API_SECRET env var');
  }

  // Settlement truth must come from live Kalshi market results.
  // Explicitly enable live-read gate for this worker context.
  if (process.env.KALSHI_LIVE_ENABLED !== 'true') {
    process.env.KALSHI_LIVE_ENABLED = 'true';
  }
  const kalshi = new KalshiClient({ demo: false });
  const pending = await apiGetPendingTrades(baseUrl, secret);

  const summary = { checked: pending.length, settled: 0, wins: 0, losses: 0, skipped: 0, errors: 0 };

  for (const trade of pending) {
    try {
      const ticker = trade.market;
      if (!ticker) {
        summary.skipped += 1;
        continue;
      }

      const market = await kalshi._request('GET', `/markets/${ticker}`);
      const settledResult = normalizeKalshiResult(market?.data?.market?.result);
      if (!settledResult) {
        summary.skipped += 1;
        continue;
      }

      const { outcome, pnl, assumptions } = computePnl({
        side: trade.side,
        executionPrice: trade.execution_price,
        contracts: trade.contracts ?? trade.kelly_amount,
        settledResult,
      });

      const settled = await apiSettleTrade(baseUrl, secret, trade.id, { outcome, pnl });

      const weightUpdate = updateWeightsFromOutcome({
        layer: trade.layer,
        category: trade.category,
        source: trade.source,
      }, outcome);

      appendSettlement({
        tradeId: trade.id,
        userId: trade.user_id,
        ticker,
        side: trade.side,
        settledResult,
        outcome,
        pnl,
        assumptions,
        weightUpdate,
      });

      summary.settled += 1;
      if (outcome === 'win') summary.wins += 1;
      if (outcome === 'loss') summary.losses += 1;

      console.log(`[settled] ${trade.id} ${ticker} -> ${outcome} pnl=${pnl}`);
      if (!settled?.success) {
        console.warn(`[warn] settle endpoint returned non-success for ${trade.id}`);
      }
    } catch (err) {
      summary.errors += 1;
      console.error(`[error] trade ${trade?.id || 'unknown'}: ${err.message}`);
    }
  }

  console.log(`[summary] checked=${summary.checked} settled=${summary.settled} wins=${summary.wins} losses=${summary.losses} skipped=${summary.skipped} errors=${summary.errors}`);
  return summary;
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}

module.exports = { run, computePnl, normalizeKalshiResult };
