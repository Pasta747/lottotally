#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { updateWeightsFromOutcome, loadWeights, saveWeights } = require('./atlas-manager');

const REPORT_FILE = path.join(__dirname, '..', 'data', 'signal-attribution-report.json');
const WEIGHTS_FILE = path.join(__dirname, '..', 'data', 'atlas-weights.json');
const CHANGELOG_FILE = path.join(__dirname, '..', 'data', 'feedback-changelog.json');
const TRADES_FILE = path.join(__dirname, '..', 'data', 'vantage-trades.json');

function readJSON(f, fb) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fb; } }

function main() {
  // 1. Load attribution report
  const report = readJSON(REPORT_FILE, null);
  if (!report) { console.error('No signal-attribution-report.json found. Run signal-attribution.js first.'); process.exit(1); }

  console.log('Loaded attribution report from', report.generatedAt);

  // 2. Load current weights
  const weights = loadWeights();
  const changes = [];

  // 3. Rule-based weight adjustments from category performance
  for (const [cat, stats] of Object.entries(report.byCategory || {})) {
    const decided = stats.wins + stats.losses;
    if (decided < 3) continue; // need minimum sample
    const winRate = stats.wins / decided;
    const catKey = cat + '_weight';

    const oldWeight = weights.categories[catKey] || 1;
    let newWeight = oldWeight;

    if (winRate < 0.30) {
      newWeight = Math.max(0.5, oldWeight - 0.1);
      changes.push({ type: 'category_decrease', category: cat, winRate: (winRate * 100).toFixed(1) + '%', oldWeight, newWeight, reason: 'Win rate below 30%' });
    } else if (winRate > 0.50) {
      newWeight = Math.min(2.0, oldWeight + 0.1);
      changes.push({ type: 'category_increase', category: cat, winRate: (winRate * 100).toFixed(1) + '%', oldWeight, newWeight, reason: 'Win rate above 50%' });
    }

    weights.categories[catKey] = Number(newWeight.toFixed(4));
  }

  // 4. Signal correlation check
  if (report.signalCorrelation && !report.signalCorrelation.higherSignalPredictsWin) {
    changes.push({ type: 'threshold_warning', reason: 'Higher signal strength does NOT predict wins. Consider tightening minimum threshold.', avgWinSignal: report.signalCorrelation.avgWinSignal, avgLossSignal: report.signalCorrelation.avgLossSignal });
  }

  // 5. Feed individual trade outcomes through ATLAS
  const trades = readJSON(TRADES_FILE, []);
  let atlasUpdates = 0;
  for (const t of trades) {
    if (!t.outcome || t.outcome === 'pending') continue;
    const signal = { category: t.category, layer: t.layer || 'kalshi_native', source: t.source, categoryKey: (t.category || '') + '_weight', sourceKey: (t.source || '') + '_weight' };
    updateWeightsFromOutcome(signal, t.outcome);
    atlasUpdates++;
  }

  // 6. Save updated weights
  saveWeights(weights);

  // 7. Changelog
  const changelog = readJSON(CHANGELOG_FILE, []);
  changelog.push({ ts: new Date().toISOString(), changes, atlasUpdates, reportDate: report.generatedAt });
  fs.writeFileSync(CHANGELOG_FILE, JSON.stringify(changelog, null, 2) + '\n');

  // 8. Summary
  console.log('\n========== FEEDBACK LOOP RESULTS ==========');
  console.log('Weight changes:', changes.length);
  for (const c of changes) {
    if (c.type === 'threshold_warning') {
      console.log('  WARNING:', c.reason);
    } else {
      console.log('  ' + c.category + ':', c.oldWeight, '->', c.newWeight, '(' + c.reason + ')');
    }
  }
  console.log('ATLAS individual trade updates:', atlasUpdates);
  console.log('Updated weights saved to', WEIGHTS_FILE);
  console.log('Changelog appended to', CHANGELOG_FILE);
  console.log('============================================');
}

main();
