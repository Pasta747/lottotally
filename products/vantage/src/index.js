#!/usr/bin/env node

const { scanSportsLayer } = require('./scanner-sports');
const { scanKalshiNativeLayer } = require('./scanner-kalshi-native');
const { scanNewsLayer } = require('./scanner-news');
const { executeSignal } = require('./executor');

async function main() {
  const args = new Set(process.argv.slice(2));
  const runL1 = args.has('--l1') || args.has('--all');
  const runL2 = args.has('--l2') || args.has('--all') || (!args.has('--l1') && !args.has('--l3'));
  const runL3 = args.has('--l3') || args.has('--all');
  const autoPaper = args.has('--paper-exec');

  const signals = [];
  if (runL1) signals.push(...(await scanSportsLayer()));
  if (runL2) signals.push(...(await scanKalshiNativeLayer()));
  if (runL3) signals.push(...(await scanNewsLayer()));

  console.log(`Signals found: ${signals.length}`);
  signals.slice(0, 20).forEach((s, i) => {
    console.log(`${i + 1}. L${s.layer} ${s.category} ${s.ticker || s.market || s.game} ${s.side} strength=${s.signalStrength}`);
  });

  if (autoPaper) {
    for (const s of signals.slice(0, 10)) {
      await executeSignal(s, { paper: true });
    }
    console.log(`Executed ${Math.min(10, signals.length)} paper trades.`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
