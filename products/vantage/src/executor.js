/**
 * executor.js — Vantage Trade Executor
 *
 * Modes:
 *   PAPER   — logs trade locally, no API call (default for beta users)
 *   FOUNDER — places real Kalshi orders using Mario's live account
 *             with hard safety rails (see FOUNDER_LIMITS below)
 *
 * FOUNDER mode is the intelligence-gathering layer: every $1 real wager
 * generates real settlement data that trains the Vantage signal engine.
 * Beta users see paper trades; founder sees real trades + real P&L.
 *
 * Safety rails for FOUNDER mode:
 *   - Max $1.00 per order (hard-coded, not configurable at runtime)
 *   - Max 100 orders per calendar day
 *   - Min signal strength threshold before placing (configurable)
 *   - Daily spend cap ($100/day absolute max)
 *   - Full audit log of every order attempt and result
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Storage paths ────────────────────────────────────────────────────────────
const DATA_DIR    = path.join(__dirname, '..', 'data');
const TRADES_FILE = path.join(DATA_DIR, 'vantage-trades.json');
const AUDIT_FILE  = path.join(DATA_DIR, 'founder-audit.json');

// ─── FOUNDER mode safety limits (hard-coded) ─────────────────────────────────
const FOUNDER_LIMITS = {
  MAX_ORDER_CENTS:    100,   // $1.00 max per order
  MAX_ORDERS_PER_DAY: 100,   // 100 orders/day max
  MAX_SPEND_PER_DAY:  10000, // $100/day absolute cap (in cents)
  MIN_SIGNAL_STRENGTH: 0.05, // must have ≥5% edge to place
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (_) { return fallback; }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Audit log ────────────────────────────────────────────────────────────────
function auditLog(entry) {
  ensureDir();
  const log = readJSON(AUDIT_FILE, []);
  log.push({ ...entry, ts: new Date().toISOString() });
  writeJSON(AUDIT_FILE, log);
}

// ─── Daily spend tracker ──────────────────────────────────────────────────────
function getDailyStats() {
  const audit = readJSON(AUDIT_FILE, []);
  const today = todayStr();
  const todayOrders = audit.filter(e => e.ts?.startsWith(today) && e.mode === 'founder' && e.result === 'PLACED');
  return {
    orderCount: todayOrders.length,
    totalCents: todayOrders.reduce((s, e) => s + (e.costCents || 0), 0),
  };
}

// ─── Paper trade logger ───────────────────────────────────────────────────────
function logTrade(t) {
  ensureDir();
  const rows = readJSON(TRADES_FILE, []);
  rows.push({ ...t, loggedAt: new Date().toISOString() });
  writeJSON(TRADES_FILE, rows);
}

// ─── Main executor ────────────────────────────────────────────────────────────
async function executeSignal(signal, opts = {}) {
  const mode = opts.mode || 'paper'; // 'paper' | 'founder'

  // ── PAPER MODE ──────────────────────────────────────────────────────────────
  if (mode === 'paper') {
    const trade = {
      layer: signal.layer,
      category: signal.category,
      source: signal.source || null,
      signalStrength: signal.signalStrength,
      ticker: signal.ticker,
      title: signal.title || null,
      side: signal.side,
      marketPrice: signal.marketPrice,
      estimatedProb: signal.estimatedProb,
      executionPrice: signal.executionPrice,
      settlementResult: null,
      mode: 'paper',
      status: 'EXECUTED_PAPER',
    };
    logTrade(trade);
    auditLog({ mode: 'paper', ticker: signal.ticker, side: signal.side, result: 'LOGGED' });
    return { ok: true, paper: true, trade };
  }

  // ── FOUNDER MODE ────────────────────────────────────────────────────────────
  if (mode === 'founder') {
    // 1. Signal strength gate
    if ((signal.signalStrength || 0) < FOUNDER_LIMITS.MIN_SIGNAL_STRENGTH) {
      auditLog({ mode: 'founder', ticker: signal.ticker, result: 'REJECTED_LOW_SIGNAL', signalStrength: signal.signalStrength });
      return { ok: false, reason: 'signal_too_weak', signalStrength: signal.signalStrength };
    }

    // 2. Daily limits gate
    const daily = getDailyStats();
    if (daily.orderCount >= FOUNDER_LIMITS.MAX_ORDERS_PER_DAY) {
      auditLog({ mode: 'founder', ticker: signal.ticker, result: 'REJECTED_DAILY_ORDER_LIMIT', daily });
      return { ok: false, reason: 'daily_order_limit', count: daily.orderCount };
    }
    if (daily.totalCents >= FOUNDER_LIMITS.MAX_SPEND_PER_DAY) {
      auditLog({ mode: 'founder', ticker: signal.ticker, result: 'REJECTED_DAILY_SPEND_LIMIT', daily });
      return { ok: false, reason: 'daily_spend_limit', spentCents: daily.totalCents };
    }

    // 3. Determine order cost — hard cap at $1.00 (100 cents)
    // Kalshi: count=1 contract, cost = yes_ask price (in cents)
    const askPrice = signal.executionPrice; // e.g. 0.65 = 65 cents
    if (!askPrice || askPrice <= 0) {
      auditLog({ mode: 'founder', ticker: signal.ticker, result: 'REJECTED_NO_PRICE' });
      return { ok: false, reason: 'no_execution_price' };
    }
    const askCents = Math.round(askPrice * 100);
    const costCents = Math.min(askCents, FOUNDER_LIMITS.MAX_ORDER_CENTS); // never > $1

    // 4. Place the order
    let kalshiResult = null;
    try {
      const { KalshiClient } = require('/root/PastaOS/Plutus/oddstool-v2/kalshi-client');
      const client = new KalshiClient({ demo: false }); // live account

      const orderParams = {
        ticker: signal.ticker,
        action: 'buy',
        side: signal.side,       // 'yes' or 'no'
        type: 'market',
        count: 1,                // 1 contract = max $1 payout
      };

      kalshiResult = await client.placeOrder(orderParams);
    } catch (err) {
      auditLog({ mode: 'founder', ticker: signal.ticker, result: 'ERROR', error: err.message, costCents });
      return { ok: false, reason: 'api_error', error: err.message };
    }

    if (!kalshiResult?.ok) {
      auditLog({ mode: 'founder', ticker: signal.ticker, result: 'KALSHI_REJECTED', kalshiResult, costCents });
      return { ok: false, reason: 'kalshi_rejected', detail: kalshiResult };
    }

    // 5. Log the placed trade
    const trade = {
      layer: signal.layer,
      category: signal.category,
      source: signal.source || null,
      signalStrength: signal.signalStrength,
      ticker: signal.ticker,
      title: signal.title || null,
      side: signal.side,
      marketPrice: signal.marketPrice,
      estimatedProb: signal.estimatedProb,
      executionPrice: askPrice,
      costCents,
      kalshiOrderId: kalshiResult?.data?.order?.id || null,
      settlementResult: null,
      mode: 'founder',
      status: 'PLACED_LIVE',
    };
    logTrade(trade);
    auditLog({ mode: 'founder', ticker: signal.ticker, side: signal.side, result: 'PLACED', costCents, orderId: trade.kalshiOrderId });

    return { ok: true, live: true, trade, kalshiOrderId: trade.kalshiOrderId };
  }

  return { ok: false, reason: 'unknown_mode', mode };
}

module.exports = { executeSignal, logTrade, getDailyStats, FOUNDER_LIMITS };
