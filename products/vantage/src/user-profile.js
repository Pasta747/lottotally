/**
 * user-profile.js — Load user settings from the Vantage internal API
 *
 * The scan engine runs on our server; Vercel Postgres is only accessible
 * inside Vercel's runtime. So we call /api/internal/users which proxies
 * the DB query and returns decrypted-ready user profiles.
 */

'use strict';

require('dotenv').config({ path: '/root/PastaOS/.env', override: true });

const fetch = (...args) => import('node-fetch').then(m => m.default(...args));

const API_BASE   = process.env.VANTAGE_APP_URL   || 'https://app.yourvantage.ai';
// Read secret lazily so dotenv has time to load
function getSecret() {
  return process.env.INTERNAL_API_SECRET || '';
}

// ─── Risk profile presets ─────────────────────────────────────────────────────
const RISK_PRESETS = {
  conservative: {
    kellyFraction:      0.10,
    minSignalStrength:  0.08,   // 8% edge minimum
    categoryMultiplier: 0.75,
  },
  moderate: {
    kellyFraction:      0.25,
    minSignalStrength:  0.05,   // 5% edge minimum
    categoryMultiplier: 1.0,
  },
  aggressive: {
    kellyFraction:      0.50,
    minSignalStrength:  0.03,   // 3% edge minimum
    categoryMultiplier: 1.25,
  },
};

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'x-internal-secret': getSecret(), 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Internal API ${path} returned ${res.status}`);
  return res.json();
}

/**
 * Load all users who have API keys configured.
 */
async function loadActiveUsers() {
  try {
    const { users } = await apiGet('/api/internal/users');
    return (users || []).map(buildProfile);
  } catch (err) {
    console.warn('[user-profile] loadActiveUsers failed:', err.message);
    return [];
  }
}

/**
 * Load a single user by ID.
 */
async function loadUserProfile(userId) {
  try {
    const { users } = await apiGet('/api/internal/users');
    const row = (users || []).find(u => u.id === userId);
    if (!row) return defaultProfile(userId);
    return buildProfile(row);
  } catch (err) {
    console.warn('[user-profile] loadUserProfile failed:', err.message);
    return defaultProfile(userId);
  }
}

// ─── Internal builders ────────────────────────────────────────────────────────
function buildProfile(row) {
  const riskLevel = row.risk_level || 'moderate';
  const preset    = RISK_PRESETS[riskLevel] || RISK_PRESETS.moderate;
  const bankroll  = parseFloat(row.bankroll || 0);

  return {
    userId:    row.id,
    email:     row.email,
    bankroll,
    riskLevel,

    // From preset (risk_level controlled)
    kellyFraction:      preset.kellyFraction,
    minSignalStrength:  preset.minSignalStrength,
    categoryMultiplier: preset.categoryMultiplier,

    // From user's explicit settings (always override preset)
    maxWagerDollars:  parseFloat(row.max_wager_dollars  || 1.00),
    maxOrdersPerDay:  parseInt(row.max_orders_per_day   || 10, 10),
    maxDailySpend:    parseFloat(row.max_daily_spend    || 10.00),

    // Kalshi connection
    kalshiMode:            row.key_mode || row.kalshi_mode || 'demo',
    kalshiKeyId:           row.kalshi_key_id || null,
    kalshiSecretEncrypted: row.kalshi_secret_encrypted || null,

    autoExecute: row.auto_execute === true || row.auto_execute === 'true',
    preset,
  };
}

function defaultProfile(userId) {
  const preset = RISK_PRESETS.moderate;
  return {
    userId, email: null, bankroll: 0,
    riskLevel: 'moderate',
    kellyFraction: preset.kellyFraction,
    minSignalStrength: preset.minSignalStrength,
    categoryMultiplier: preset.categoryMultiplier,
    maxWagerDollars: 1.00, maxOrdersPerDay: 10, maxDailySpend: 10.00,
    kalshiMode: 'demo', kalshiKeyId: null, kalshiSecretEncrypted: null,
    autoExecute: false, preset,
  };
}

module.exports = { loadActiveUsers, loadUserProfile, RISK_PRESETS };
