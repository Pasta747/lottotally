#!/usr/bin/env node
/**
 * index.js — Vantage main scan + execute runner
 *
 * Usage:
 *   node src/index.js --l2             # scan Kalshi native layer only (default)
 *   node src/index.js --all            # all layers
 *   node src/index.js --exec           # scan + execute for all active users
 *   node src/index.js --exec --user <userId>  # single user
 *   node src/index.js --dry-run        # scan only, print signals, no execution
 *
 * Risk-level effects (per user, read from DB):
 *   conservative  kellyFraction=0.10, minSignalStrength=8%
 *   moderate      kellyFraction=0.25, minSignalStrength=5%
 *   aggressive    kellyFraction=0.50, minSignalStrength=3%
 */

'use strict';

const { scanSportsLayer }       = require('./scanner-sports');
const { scanKalshiNativeLayer } = require('./scanner-kalshi-native');
const { scanNewsLayer }         = require('./scanner-news');
const { executeSignalForUser }  = require('./executor');
const { loadActiveUsers, loadUserProfile } = require('./user-profile');

async function main() {
  const args    = new Set(process.argv.slice(2));
  const allArgs = process.argv.slice(2);

  const runL1  = args.has('--l1') || args.has('--all');
  const runL2  = args.has('--l2') || args.has('--all') || (!args.has('--l1') && !args.has('--l3'));
  const runL3  = args.has('--l3') || args.has('--all');
  const doExec = args.has('--exec');
  const dryRun = args.has('--dry-run');

  const targetUserId = allArgs[allArgs.indexOf('--user') + 1] || null;

  // ── Scan ──────────────────────────────────────────────────────────────────
  // Load first active user's profile for authenticated scanning (keys for L2/L3)
  let primaryUser = null;
  if (doExec || targetUserId) {
    const usersForScan = targetUserId ? [await loadUserProfile(targetUserId)] : await loadActiveUsers();
    primaryUser = usersForScan[0] || null;
  }

  const signals = [];
  if (runL1) signals.push(...(await scanSportsLayer()));
  if (runL2) signals.push(...(await scanKalshiNativeLayer(primaryUser)));
  if (runL3) signals.push(...(await scanNewsLayer()));

  // Sort by signal strength descending
  signals.sort((a, b) => b.signalStrength - a.signalStrength);

  console.log(`\n── Vantage Scan ──────────────────────────────────`);
  console.log(`Layers: ${[runL1&&'L1',runL2&&'L2',runL3&&'L3'].filter(Boolean).join('+')}`);
  console.log(`Signals found: ${signals.length}`);

  signals.slice(0, 15).forEach((s, i) => {
    const pct = (s.signalStrength * 100).toFixed(1);
    const price = s.executionPrice ? `@${(s.executionPrice * 100).toFixed(0)}¢` : '';
    console.log(`  ${i + 1}. L${s.layer} [${s.category}] ${s.ticker || s.market || ''} ${s.side?.toUpperCase()} ${price} strength=${pct}%`);
  });

  if (dryRun || (!doExec && !args.has('--paper-exec'))) {
    console.log('\n[dry-run] No execution. Pass --exec to trade.');
    return;
  }

  // ── Load users ────────────────────────────────────────────────────────────
  let users = [];
  if (targetUserId) {
    const u = await loadUserProfile(targetUserId);
    users = [u];
  } else {
    users = await loadActiveUsers();
  }

  if (!users.length) {
    console.log('\nNo active users with API keys configured. Nothing to execute.');
    return;
  }

  console.log(`\n── Execution ─────────────────────────────────────`);
  console.log(`Users: ${users.length}`);

  // ── Execute for each user ─────────────────────────────────────────────────
  for (const user of users) {
    console.log(`\nUser: ${user.email || user.userId} | risk=${user.riskLevel} | kelly=${user.kellyFraction} | minStrength=${(user.minSignalStrength*100).toFixed(0)}% | maxWager=$${user.maxWagerDollars} | mode=${user.kalshiMode}`);

    let placed = 0, rejected = 0;

    for (const signal of signals) {
      const result = await executeSignalForUser(signal, user);

      if (result.ok) {
        placed++;
        const wager = result.trade?.wagerDollars?.toFixed(2);
        console.log(`  ✅ ${result.paper ? 'PAPER' : 'LIVE'} ${signal.ticker} ${signal.side?.toUpperCase()} $${wager}`);
      } else {
        rejected++;
        // Only print first rejection per user to avoid noise
        if (rejected === 1) {
          console.log(`  ⏭  First rejection: ${result.reason}`);
        }
        // Stop after daily limits hit
        if (result.reason?.includes('daily_')) break;
      }
    }

    console.log(`  → Placed: ${placed} | Rejected/filtered: ${rejected}`);
  }
}

main().catch(err => {
  console.error('Vantage scan failed:', err.message);
  process.exit(1);
});
