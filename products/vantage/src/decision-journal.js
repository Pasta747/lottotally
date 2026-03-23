'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const JOURNAL_FILE = path.join(DATA_DIR, 'decision-journal.json');

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(f, fallback) {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fallback; }
}

function logDecision(entry) {
  ensureDir();
  const record = {
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    ticker: entry.ticker || null,
    title: entry.title || null,
    side: entry.side || null,
    signalStrength: entry.signalStrength ?? null,
    estimatedProb: entry.estimatedProb ?? null,
    marketPrice: entry.marketPrice ?? null,
    executionPrice: entry.executionPrice ?? null,
    category: entry.category || null,
    source: entry.source || null,
    riskLevel: entry.riskLevel || null,
    kellyFraction: entry.kellyFraction ?? null,
    bankroll: entry.bankroll ?? null,
    wagerDollars: entry.wagerDollars ?? null,
    mode: entry.mode || null,
    userId: entry.userId || null,
    decision: entry.decision,
    rejectionReason: entry.rejectionReason || null,
    orderId: entry.orderId || null,
  };

  const log = readJSON(JOURNAL_FILE, []);
  log.push(record);
  fs.writeFileSync(JOURNAL_FILE, JSON.stringify(log, null, 2) + '\n');
}

module.exports = { logDecision };
