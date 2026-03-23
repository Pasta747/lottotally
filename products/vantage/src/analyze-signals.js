#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const AUDIT_FILE = path.join(__dirname, '..', 'data', 'founder-audit.json'); // Source of truth for trade details

function analyzeSignals() {
  let trades = [];
  try {
    const auditData = fs.readFileSync(AUDIT_FILE, 'utf8');
    trades = JSON.parse(auditData);
    console.log(`Loaded ${trades.length} records from founder-audit.json for analysis.`);
  } catch (err) {
    console.error('Error loading founder-audit.json:', err.message);
    return;
  }

  const outcomes = {};
  const categoryAverages = {};
  const riskAverages = {};
  let totalTrades = 0;

  for (const trade of trades) {
    // Inferring outcome - this is a simplification as founder-audit.json lacks resolved outcomes.
    // We'll primarily use signal strength, category and risk for analysis, assuming potential for wins/losses.
    let outcome = 0; // Default to neutral
    // NOTE: Since founder-audit.json doesn't have resolved outcomes, this part is conceptual.
    // Actual analysis would require matched settlement data.

    // Use available signal data, defaulting to placeholders if missing
    const signalStrength = trade.signalStrength || trade.wagerDollars || 0.01; // Using wagerDollars as a proxy if signalStrength is absent, with a small default value
    const category = trade.category || 'unknown';
    const riskLevel = trade.riskLevel || 'unknown'; // Placeholder, as this wasn't in original audit data
    
    // Placeholder for estimated probability - in real scenarios, this would come from the model.
    // For this analysis, we'll simulate it based on signal strength for demonstration.
    const estimatedProbability = signalStrength ? Math.max(0.1, Math.min(0.9, signalStrength * 1.5)) : 0.5;

    // Aggregate by signal strength (simplified binning)
    const signalBin = Math.floor(signalStrength * 100) / 10; // Binning to 0, 0.1, 0.2 etc.
    if (!outcomes[signalBin]) {
      outcomes[signalBin] = { totalOutcome: 0, count: 0 };
    }
    outcomes[signalBin].totalOutcome += outcome; // outcome is 0 here due to lack of data
    outcomes[signalBin].count++;

    // Aggregate by category
    if (!categoryAverages[category]) {
      categoryAverages[category] = { totalOutcome: 0, count: 0 };
    }
    categoryAverages[category].totalOutcome += outcome;
    categoryAverages[category].count++;

    // Aggregate by risk level
    if (!riskAverages[riskLevel]) {
      riskAverages[riskLevel] = { totalOutcome: 0, count: 0 };
    }
    riskAverages[riskLevel].totalOutcome += outcome;
    riskAverages[riskLevel].count++;

    totalTrades++;
  }

  console.log('\n--- Signal-to-Outcome Analysis (using founder-audit.json with inferred data) ---');
  console.log(`Total trades analyzed: ${totalTrades}\n`);

  // Calculate average outcome per signal strength bin (simplified)
  console.log('Signal Strength Analysis (Average Outcome per Signal Bin):');
  const sortedSignals = Object.keys(outcomes).map(Number).sort((a, b) => a - b);
  for (const signalBin of sortedSignals) {
    const avg = outcomes[signalBin].totalOutcome / outcomes[signalBin].count;
    console.log(`  Signal Bin ${(signalBin * 10).toFixed(1)}%: ${(avg).toFixed(4)} (count: ${outcomes[signalBin].count})`);
  }

  // Calculate average outcome per category
  console.log('\nCategory Analysis (Average Outcome):');
  for (const category in categoryAverages) {
    const avg = categoryAverages[category].totalOutcome / categoryAverages[category].count;
    console.log(`  ${category}: ${(avg).toFixed(4)} (count: ${categoryAverages[category].count})`);
  }

  // Calculate average outcome per risk level
  console.log('\nRisk Level Analysis (Average Outcome):');
  for (const risk in riskAverages) {
    const avg = riskAverages[risk].totalOutcome / riskAverages[risk].count;
    console.log(`  ${risk}: ${(avg).toFixed(4)} (count: ${riskAverages[risk].count})`);
  }

  console.log('\n--- End Analysis ---');
}

analyzeSignals();
