/**
 * executor.js — Vantage Trade Executor
 *
 * Modes:
 *   paper   — logs trade locally, no real API call (beta users w/o live keys)
 *   live    — places real Kalshi orders using the user's stored API keys
 *
 * Everything flows through executeSignalForUser(), which:
 *   1. Reads the user's live settings from Postgres (risk_level, limits)
 *   2. Applies the risk-level signal strength gate (filters weak signals)
 *   3. Kelly-sizes the wager using the user's fraction + bankroll
 *   4. Enforces hard daily spend/count limits
 *   5. Places the order (or logs it as paper)
 *   6. Writes full audit log
 *
 * Risk level effects:
 *   conservative  kellyFraction=0.10, minStrength=8%, maxWager user-set
 *   moderate      kellyFraction=0.25, minStrength=5%, maxWager user-set
 *   aggressive    kellyFraction=0.50, minStrength=3%, maxWager user-set
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { calcKellyStake } = require('/root/PastaOS/Plutus/oddstool-v2/kelly');

// ─── Storage ──────────────────────────────────────────────────────────────────
const DATA_DIR    = path.join(__dirname, '..', 'data');
const TRADES_FILE = path.join(DATA_DIR, 'vantage-trades.json');
const AUDIT_FILE  = path.join(DATA_DIR, 'founder-audit.json');

function ensureDir()             { fs.mkdirSync(DATA_DIR, { recursive: true }); }
function readJSON(f, fb)         { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fb; } }
function writeJSON(f, d)         { fs.writeFileSync(f, JSON.stringify(d, null, 2) + '\n'); }
function todayStr()              { return new Date().toISOString().slice(0, 10); }

// ─── Audit log ────────────────────────────────────────────────────────────────
function auditLog(entry) {
  ensureDir();
  const log = readJSON(AUDIT_FILE, []);
  log.push({ ...entry, ts: new Date().toISOString() });
  writeJSON(AUDIT_FILE, log);
}

// ─── Trade log ────────────────────────────────────────────────────────────────
function logTrade(t) {
  ensureDir();
  const rows = readJSON(TRADES_FILE, []);
  rows.push({ ...t, loggedAt: new Date().toISOString() });
  writeJSON(TRADES_FILE, rows);
}

// ─── Daily spend tracker (reads audit log) ───────────────────────────────────
function getDailyStats(userId) {
  const today  = todayStr();
  const audit  = readJSON(AUDIT_FILE, []);
  const placed = audit.filter(e =>
    e.ts?.startsWith(today) &&
    e.result === 'PLACED' &&
    (!userId || e.userId === userId)
  );
  return {
    orderCount: placed.length,
    totalDollars: placed.reduce((s, e) => s + (e.wagerDollars || 0), 0),
  };
}

// ─── Kelly sizing ─────────────────────────────────────────────────────────────
/**
 * Compute the wager size for this signal given the user's profile.
 *
 * Kelly formula:  f* = (b·p - q) / b  where b = decimal_odds - 1
 * We then apply: stake = bankroll × (kellyFraction × f*)
 * And hard-cap at: min(stake, user.maxWagerDollars)
 *
 * For Kalshi binary markets (payout = $1/contract):
 *   decimal odds = 1 / yes_ask   (e.g. yes_ask=0.65 → odds=1.538)
 */
function computeWager(signal, userProfile) {
  const { bankroll, kellyFraction, maxWagerDollars } = userProfile;
  const askPrice = signal.executionPrice; // 0.0–1.0 (Kalshi cents/100)

  if (!askPrice || askPrice <= 0 || askPrice >= 1) {
    // No price info — fall back to minimum bet
    return Math.min(1.00, maxWagerDollars);
  }

  const decimalOdds = 1 / askPrice;         // implied payout odds
  const trueProb    = signal.estimatedProb; // our model's estimate

  const kelly = calcKellyStake({
    decimalOdds,
    trueProb,
    bankroll: Math.max(bankroll, 1),
    fraction: kellyFraction,
    maxBet: maxWagerDollars,
    minBet: 0.01,
  });

  // Final: clamp between $0.01 and user's configured max wager
  const wager = Math.min(kelly.stake, maxWagerDollars);
  return Math.max(0.01, Math.round(wager * 100) / 100); // round to cents
}

// ─── Main executor ────────────────────────────────────────────────────────────
/**
 * Execute a signal for a specific user, applying all their risk settings.
 *
 * @param {Object} signal      — from scanner (ticker, side, signalStrength, estimatedProb, executionPrice, …)
 * @param {Object} userProfile — from user-profile.js (loadUserProfile / loadActiveUsers)
 * @param {Object} opts        — { forceMode: 'paper' | 'live' }  (overrides userProfile.kalshiMode)
 */
async function executeSignalForUser(signal, userProfile, opts = {}) {
  const mode = opts.forceMode || (userProfile.kalshiMode === 'live' ? 'live' : 'paper');
  const uid  = userProfile.userId;

  // ── 1. Signal strength gate (risk_level controlled) ──────────────────────
  const strength = signal.signalStrength || 0;
  if (strength < userProfile.minSignalStrength) {
    const reason = `signal_too_weak (${(strength * 100).toFixed(1)}% < ${(userProfile.minSignalStrength * 100).toFixed(1)}% threshold for ${userProfile.riskLevel})`;
    auditLog({ userId: uid, ticker: signal.ticker, result: 'REJECTED', reason, mode });
    return { ok: false, reason, signal, userProfile };
  }

  // ── 2. Daily limits gate ─────────────────────────────────────────────────
  const daily = getDailyStats(uid);
  if (daily.orderCount >= userProfile.maxOrdersPerDay) {
    const reason = `daily_order_limit (${daily.orderCount}/${userProfile.maxOrdersPerDay})`;
    auditLog({ userId: uid, ticker: signal.ticker, result: 'REJECTED', reason, mode });
    return { ok: false, reason, daily };
  }
  if (daily.totalDollars >= userProfile.maxDailySpend) {
    const reason = `daily_spend_limit ($${daily.totalDollars.toFixed(2)}/$${userProfile.maxDailySpend.toFixed(2)})`;
    auditLog({ userId: uid, ticker: signal.ticker, result: 'REJECTED', reason, mode });
    return { ok: false, reason, daily };
  }

  // ── 3. Kelly-size the wager ───────────────────────────────────────────────
  const wagerDollars = computeWager(signal, userProfile);

  // ── 4. Build the trade record ─────────────────────────────────────────────
  const trade = {
    userId: uid,
    layer: signal.layer,
    category: signal.category,
    source: signal.source || null,
    ticker: signal.ticker,
    title: signal.title || null,
    side: signal.side,
    marketPrice: signal.marketPrice,
    estimatedProb: signal.estimatedProb,
    executionPrice: signal.executionPrice,
    signalStrength: strength,
    // Risk profile at execution time (for retrospective analysis)
    riskLevel: userProfile.riskLevel,
    kellyFraction: userProfile.kellyFraction,
    bankrollAtExecution: userProfile.bankroll,
    wagerDollars,
    mode,
    settlementResult: null,
  };

  // ── 5a. PAPER mode ────────────────────────────────────────────────────────
  if (mode === 'paper') {
    trade.status = 'EXECUTED_PAPER';
    logTrade(trade);
    auditLog({ userId: uid, ticker: signal.ticker, side: signal.side, result: 'PLACED', mode: 'paper', wagerDollars });
    return { ok: true, paper: true, trade };
  }

  // ── 5b. LIVE mode — place real Kalshi order ───────────────────────────────
  if (!userProfile.kalshiKeyId || !userProfile.kalshiSecretEncrypted) {
    const reason = 'no_kalshi_keys';
    auditLog({ userId: uid, ticker: signal.ticker, result: 'REJECTED', reason });
    return { ok: false, reason };
  }

  let kalshiResult;
  try {
    // Decrypt stored private key
    const { decrypt } = require('../app/utils/encryption.js');
    const privateKeyPem = decrypt(userProfile.kalshiSecretEncrypted);

    const { KalshiClient } = require('/root/PastaOS/Plutus/oddstool-v2/kalshi-client');
    const isDemo = userProfile.kalshiMode !== 'live';
    const client = new KalshiClient({ demo: isDemo });
    // Override auth with user's own keys
    client.apiKeyId      = userProfile.kalshiKeyId;
    client.privateKeyPem = privateKeyPem;

    kalshiResult = await client.placeOrder({
      ticker: signal.ticker,
      action: 'buy',
      side:   signal.side,
      type:   'market',
      count:  Math.max(1, Math.round(wagerDollars)), // Kalshi counts in $1 contracts
    });
  } catch (err) {
    auditLog({ userId: uid, ticker: signal.ticker, result: 'ERROR', error: err.message, wagerDollars });
    return { ok: false, reason: 'api_error', error: err.message };
  }

  if (!kalshiResult?.ok) {
    auditLog({ userId: uid, ticker: signal.ticker, result: 'KALSHI_REJECTED', detail: kalshiResult, wagerDollars });
    return { ok: false, reason: 'kalshi_rejected', detail: kalshiResult };
  }

  trade.status       = 'PLACED_LIVE';
  trade.kalshiOrderId = kalshiResult?.data?.order?.id || null;
  logTrade(trade);
  auditLog({ userId: uid, ticker: signal.ticker, side: signal.side, result: 'PLACED', mode: 'live', wagerDollars, orderId: trade.kalshiOrderId });

  return { ok: true, live: true, trade, kalshiOrderId: trade.kalshiOrderId };
}

// ─── Legacy single-user paper execute (backward compat) ─────────────────────
async function executeSignal(signal, opts = {}) {
  const { loadUserProfile } = require('./user-profile');
  // For legacy calls without userId, use a minimal paper profile
  const profile = opts.userId
    ? await loadUserProfile(opts.userId)
    : { userId: 'legacy', bankroll: 0, riskLevel: 'moderate', kellyFraction: 0.25,
        minSignalStrength: 0.05, categoryMultiplier: 1, maxWagerDollars: 1,
        maxOrdersPerDay: 100, maxDailySpend: 100, kalshiMode: 'paper',
        kalshiKeyId: null, kalshiSecretEncrypted: null, autoExecute: false };
  return executeSignalForUser(signal, profile, { forceMode: 'paper' });
}

module.exports = { executeSignalForUser, executeSignal, logTrade, getDailyStats };
