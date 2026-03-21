#!/usr/bin/env node
'use strict';

/**
 * settlement-tracker.js — Cron entry point
 *
 * Calls the Vantage /api/internal/settle endpoint which runs the full
 * settlement loop server-side (where ENCRYPTION_KEY is available).
 * Logs results locally and updates ATLAS weights.
 */

require('dotenv').config({ path: '/root/PastaOS/.env' });
const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
const { updateWeightsFromOutcome } = require('./atlas-manager');

const BASE_URL   = 'https://app.yourvantage.ai';
const SECRET     = process.env.INTERNAL_API_SECRET;

const path = require('path');
const fs   = require('fs');
const DATA_DIR = path.join(__dirname, '..', 'data');
const LOG_FILE = path.join(DATA_DIR, 'settlements.json');

function appendLog(entry) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  let rows = [];
  try { rows = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); } catch (_) {}
  if (!Array.isArray(rows)) rows = [];
  rows.push({ ...entry, ts: new Date().toISOString() });
  fs.writeFileSync(LOG_FILE, JSON.stringify(rows, null, 2) + '\n');
}

async function run() {
  if (!SECRET) throw new Error('INTERNAL_API_SECRET not set in /root/PastaOS/.env');

  const res = await fetch(`${BASE_URL}/api/internal/settle`, {
    method: 'POST',
    headers: { 'x-internal-secret': SECRET, 'content-type': 'application/json' },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Settle API returned ${res.status}: ${txt.slice(0,200)}`);
  }

  const summary = await res.json();
  console.log(`[settlement-tracker] ${JSON.stringify(summary)}`);

  // Update ATLAS weights based on new settlements
  if (summary.settled > 0) {
    // Lightweight: bump weight by win/loss ratio signal
    const winRate = summary.wins / summary.settled;
    const outcome = winRate >= 0.5 ? 'win' : 'loss';
    updateWeightsFromOutcome({ layer: 'kalshi_native', category: 'sports', source: null }, outcome);
    console.log(`[atlas] updated weights — win rate: ${(winRate * 100).toFixed(0)}% over ${summary.settled} settled`);
  }

  appendLog(summary);
  return summary;
}

if (require.main === module) {
  run().then(s => {
    process.exit(0);
  }).catch(err => {
    console.error('[settlement-tracker] error:', err.message);
    process.exit(1);
  });
}

module.exports = { run };
