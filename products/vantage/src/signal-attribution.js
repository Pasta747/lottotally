#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: '/root/PastaOS/.env' });
require('dotenv').config({ path: '/root/PastaOS/products/vantage/.env.local' });

const fs = require('fs');
const path = require('path');

const TRADES_FILE = path.join(__dirname, '..', 'data', 'vantage-trades.json');
const REPORT_FILE = path.join(__dirname, '..', 'data', 'signal-attribution-report.json');

async function main() {
  // 1. Load rich signal data from local log
  const signals = JSON.parse(fs.readFileSync(TRADES_FILE, 'utf8'));
  console.log('Loaded', signals.length, 'trades from vantage-trades.json');

  // 2. Load outcomes from DB
  const { sql } = await import('@vercel/postgres');
  const dbResult = await sql`SELECT kalshi_order_id, outcome, pnl FROM trades WHERE kalshi_order_id IS NOT NULL`;
  const outcomeMap = {};
  for (const row of dbResult.rows) {
    outcomeMap[row.kalshi_order_id] = { outcome: row.outcome, pnl: Number(row.pnl) };
  }
  console.log('Loaded', dbResult.rows.length, 'outcomes from DB');

  // 3. Join datasets
  const joined = [];
  for (const s of signals) {
    const oid = s.kalshiOrderId;
    if (!oid || !outcomeMap[oid]) continue;
    joined.push({ ...s, ...outcomeMap[oid] });
  }
  console.log('Joined:', joined.length, 'trades with both signal data and outcomes');

  // 4. Analysis
  const report = {
    generatedAt: new Date().toISOString(),
    totalTrades: joined.length,
    byCategory: {},
    bySignalStrengthBucket: {},
    byEstimatedProbBucket: {},
    signalCorrelation: null,
    probAccuracy: null,
  };

  // -- By category --
  for (const t of joined) {
    const cat = t.category || 'unknown';
    if (!report.byCategory[cat]) report.byCategory[cat] = { trades: 0, wins: 0, losses: 0, pending: 0, totalPnl: 0 };
    const b = report.byCategory[cat];
    b.trades++;
    if (t.outcome === 'win') { b.wins++; b.totalPnl += t.pnl; }
    else if (t.outcome === 'loss') { b.losses++; b.totalPnl += t.pnl; }
    else b.pending++;
  }

  // -- By signal strength bucket --
  const sigBuckets = { '5-6%': [0.05, 0.06], '6-7%': [0.06, 0.07], '7-8%': [0.07, 0.08], '8%+': [0.08, Infinity] };
  for (const [label, [lo, hi]] of Object.entries(sigBuckets)) {
    const bucket = joined.filter(t => t.signalStrength >= lo && t.signalStrength < hi);
    const wins = bucket.filter(t => t.outcome === 'win').length;
    const losses = bucket.filter(t => t.outcome === 'loss').length;
    const totalPnl = bucket.reduce((s, t) => s + (t.pnl || 0), 0);
    report.bySignalStrengthBucket[label] = { trades: bucket.length, wins, losses, winRate: bucket.length ? (wins / (wins + losses) * 100).toFixed(1) + '%' : 'N/A', totalPnl: Math.round(totalPnl * 100) / 100 };
  }

  // -- By estimated prob bucket --
  const probBuckets = { '<10%': [0, 0.10], '10-15%': [0.10, 0.15], '15-20%': [0.15, 0.20], '20%+': [0.20, Infinity] };
  for (const [label, [lo, hi]] of Object.entries(probBuckets)) {
    const bucket = joined.filter(t => (t.estimatedProb || 0) >= lo && (t.estimatedProb || 0) < hi);
    const wins = bucket.filter(t => t.outcome === 'win').length;
    const losses = bucket.filter(t => t.outcome === 'loss').length;
    const totalPnl = bucket.reduce((s, t) => s + (t.pnl || 0), 0);
    report.byEstimatedProbBucket[label] = { trades: bucket.length, wins, losses, winRate: bucket.length ? (wins / (wins + losses) * 100).toFixed(1) + '%' : 'N/A', totalPnl: Math.round(totalPnl * 100) / 100 };
  }

  // -- Signal strength correlation --
  const settled = joined.filter(t => t.outcome === 'win' || t.outcome === 'loss');
  if (settled.length > 0) {
    const winSignals = settled.filter(t => t.outcome === 'win').map(t => t.signalStrength);
    const lossSignals = settled.filter(t => t.outcome === 'loss').map(t => t.signalStrength);
    const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    report.signalCorrelation = {
      avgWinSignal: Math.round(avg(winSignals) * 10000) / 10000,
      avgLossSignal: Math.round(avg(lossSignals) * 10000) / 10000,
      higherSignalPredictsWin: avg(winSignals) > avg(lossSignals),
    };
  }

  // -- Prob accuracy --
  const withProb = settled.filter(t => t.estimatedProb && t.marketPrice);
  if (withProb.length > 0) {
    let modelCloser = 0;
    let marketCloser = 0;
    for (const t of withProb) {
      const actual = t.outcome === 'win' ? 1 : 0;
      const modelErr = Math.abs(t.estimatedProb - actual);
      const marketErr = Math.abs(t.marketPrice - actual);
      if (modelErr < marketErr) modelCloser++;
      else marketCloser++;
    }
    report.probAccuracy = { modelCloserCount: modelCloser, marketCloserCount: marketCloser, modelBetter: modelCloser > marketCloser };
  }

  // Compute win rates for categories
  for (const cat of Object.keys(report.byCategory)) {
    const b = report.byCategory[cat];
    const decided = b.wins + b.losses;
    b.winRate = decided ? (b.wins / decided * 100).toFixed(1) + '%' : 'N/A';
    b.avgPnl = decided ? Math.round(b.totalPnl / decided * 100) / 100 : 0;
  }

  // 5. Save report
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2) + '\n');
  console.log('Report saved to', REPORT_FILE);

  // 6. Print human summary
  console.log('\n========== SIGNAL ATTRIBUTION REPORT ==========');
  console.log('Total trades analyzed:', report.totalTrades);
  console.log('\n--- BY CATEGORY ---');
  for (const [cat, s] of Object.entries(report.byCategory)) {
    console.log('  ' + cat + ': ' + s.winRate + ' win rate (' + s.wins + 'W/' + s.losses + 'L), avg PnL: $' + s.avgPnl);
  }
  console.log('\n--- BY SIGNAL STRENGTH ---');
  for (const [bucket, s] of Object.entries(report.bySignalStrengthBucket)) {
    console.log('  ' + bucket + ': ' + s.winRate + ' (' + s.trades + ' trades, PnL: $' + s.totalPnl + ')');
  }
  console.log('\n--- BY ESTIMATED PROBABILITY ---');
  for (const [bucket, s] of Object.entries(report.byEstimatedProbBucket)) {
    console.log('  ' + bucket + ': ' + s.winRate + ' (' + s.trades + ' trades, PnL: $' + s.totalPnl + ')');
  }
  if (report.signalCorrelation) {
    console.log('\n--- SIGNAL CORRELATION ---');
    console.log('  Avg signal (wins):', report.signalCorrelation.avgWinSignal);
    console.log('  Avg signal (losses):', report.signalCorrelation.avgLossSignal);
    console.log('  Higher signal predicts win?', report.signalCorrelation.higherSignalPredictsWin);
  }
  if (report.probAccuracy) {
    console.log('\n--- PROBABILITY ACCURACY ---');
    console.log('  Model closer to truth:', report.probAccuracy.modelCloserCount, 'times');
    console.log('  Market closer to truth:', report.probAccuracy.marketCloserCount, 'times');
    console.log('  Model better than market?', report.probAccuracy.modelBetter);
  }
  console.log('\n================================================');

  process.exit(0);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
