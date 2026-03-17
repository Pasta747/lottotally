#!/usr/bin/env node
/**
 * index.js - OddsTool V2 Main Entry Point
 *
 * BETTING CONSTRAINT: All bets placed on Kalshi ONLY.
 * Other books are reference data, never order targets.
 *
 * ─── Modes ───────────────────────────────────────────────────────────────────
 *   --scan              EV+ scan, display only
 *   --scan  --lowhold   Low-hold scan (BookMaker.eu × Kalshi), display only
 *   --paper             EV+ paper trade: log to ev-trades.json + submit demo order on Kalshi
 *   --paper --lowhold   Low-hold paper trade: log to lowhold-trades.json + rollover tracking
 *   --live              LIVE trading on Kalshi (real $). Requires explicit unlock.
 *
 * ─── Options ─────────────────────────────────────────────────────────────────
 *   --all          EV mode: include all sports (default: NBA/NHL/NFL only)
 *   --verbose, -v  Extra output
 *
 * ─── Exit codes ──────────────────────────────────────────────────────────────
 *   0  — Done, no qualifying opportunities
 *   1  — Error
 *   2  — Done, qualifying opportunities found (for cron alerting)
 */

'use strict';

const config = require('./config');

// ── EV+ engine (DO NOT MODIFY) ───────────────────────────────────────────────
const { scanValueBets } = require('./engine');
const { filterValueBets, displayRawSummary, displayOpportunity, decimalToAmerican } = require('./calculator');
const { logTrade, displaySummary, displayFileSummary,
        logLowholdTrade, loadRollover, rolloverProgressLine,
        placeKalshiDemoOrder, updateTradeWithDemoOrder,
        updateLowholdTradeWithKalshiOrder } = require('./paper-trader');
const { sendAlert }  = require('./alerts');

// ── Kalshi API client (demo + live) ──────────────────────────────────────────
const { KalshiClient } = require('./kalshi-client');

// ── Low-hold scanner ──────────────────────────────────────────────────────────
const { scanLowhold, displayPair } = require('./lowhold');

// ── Kalshi ticker builder (for low-hold Side B order placement) ───────────────
const { buildKalshiGameTicker, oddsToYesPrice: lowholdOddsToYesPrice } = require('./kalshi-client');

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args         = process.argv.slice(2);
const MODE_SCAN    = args.includes('--scan');
const MODE_PAPER   = args.includes('--paper');
const MODE_LIVE    = args.includes('--live');
const MODE_ALL     = args.includes('--all');
const MODE_LOWHOLD = args.includes('--lowhold');
const VERBOSE      = args.includes('--verbose') || args.includes('-v');

if (!MODE_SCAN && !MODE_PAPER && !MODE_LIVE) {
  console.log(`
OddsTool V2 — Kalshi EV+ Scanner + BookMaker.eu Rollover Helper

Usage:
  node index.js --scan              Scan for Kalshi EV+ opportunities (NBA/NHL/NFL)
  node index.js --scan  --lowhold   Scan for BookMaker.eu × Kalshi low-hold pairs
  node index.js --paper             EV+ paper trade → Kalshi demo + ev-trades.json
  node index.js --paper --lowhold   Low-hold paper trade → rollover tracker
  node index.js --live              Live trading on Kalshi [requires explicit unlock]

Options:
  --all          Show all sports (not just NBA/NHL/NFL)
  --verbose, -v  Verbose output

Config:
  EV threshold:   ${(config.minEV * 100).toFixed(0)}%
  Hold threshold: <${(config.holdThreshold * 100).toFixed(0)}%
  Unit size:      $${config.unitSize}/bet
  Rollover:       $${config.rolloverTotal} at BookMaker.eu
`);
  process.exit(0);
}

// ─── Kalshi client initializer ────────────────────────────────────────────────
/**
 * Initialize and verify a Kalshi API client.
 *
 * @param {boolean} demo     — true = demo env, false = live
 * @param {boolean} required — if true, exit on failure; if false, return null
 */
async function initKalshiClient(demo, required = false) {
  let client;
  try {
    client = new KalshiClient({ demo, verbose: VERBOSE });
  } catch (e) {
    const tag = demo ? 'demo' : 'LIVE';
    if (required) {
      console.error(`\n❌ Kalshi ${tag} client init failed: ${e.message}`);
      process.exit(1);
    }
    if (demo) {
      console.log(`  ⚠️  Kalshi demo unavailable: ${e.message}`);
      console.log('     Paper trades will be logged locally only (no demo orders placed).');
    } else {
      console.error(`\n❌ Kalshi live client init failed: ${e.message}`);
    }
    return null;
  }

  try {
    const envLabel = demo ? 'demo' : 'LIVE';
    console.log(`\n💰 Connecting to Kalshi ${envLabel} API...`);
    const balData = await client.getBalance();
    // Kalshi demo returns { balance: <cents int>, portfolio_value: <cents int>, ... }
    // Production may use available_balance_cents or nested balance object
    const balCents =
      balData?.balance                              ??  // demo: top-level cents int
      balData?.available_balance_cents              ??  // production nested
      balData?.balance_obj?.available_balance_cents ??
      null;
    const display = balCents !== null ? `$${(balCents / 100).toFixed(2)}` : '(balance unavailable)';
    console.log(`  ✅ Kalshi ${envLabel} connected | Available balance: ${display}`);
    client._balanceDisplay = display;
    client._envLabel       = envLabel;
    return client;
  } catch (e) {
    const msg = `Kalshi auth check failed: ${e.message}`;
    if (required) {
      console.error(`\n❌ ${msg}`);
      const keyVar = demo ? 'KALSHI_DEMO_API_KEY_ID' : 'KALSHI_API_KEY_ID';
      console.error(`   Check ${keyVar} and private key in /root/PastaOS/.env`);
      process.exit(1);
    }
    console.log(`  ⚠️  ${msg} — orders will be skipped for this session`);
    return null;
  }
}

// ─── EV+ Mode ─────────────────────────────────────────────────────────────────
async function runEVMode(paper, kalshiClient) {
  const envTag = paper
    ? (kalshiClient ? ` [${kalshiClient._envLabel} orders]` : ' [local log only — no demo keys]')
    : '';

  console.log(`\n🎯 EV+ Mode — ${paper ? 'Paper Trade' : 'Scan'}${envTag}`);
  console.log(`   Signal:  /v3/value-bets?bookmaker=Kalshi (only actionable exchange)`);
  console.log(`   Minimum: EV > ${(config.minEV * 100).toFixed(0)}%  |  Unit: $${config.unitSize}`);
  console.log('─'.repeat(60));

  // 1. Fetch Kalshi value bets + Kalshi×BookMaker.eu arb
  const { valueBets, arbBets } = await scanValueBets();

  // 2. Raw count
  console.log(`\n📡 Kalshi value bets fetched: ${valueBets.length}`);
  if (VERBOSE || MODE_ALL) displayRawSummary(valueBets);

  // 3. Arb (Kalshi × BookMaker.eu)
  if (arbBets.length > 0) {
    console.log(`\n⚡ Arbitrage opportunities (Kalshi × BookMaker.eu): ${arbBets.length}`);
    arbBets.forEach(a => {
      const ev  = a.event;
      const game = ev ? `${ev.away} @ ${ev.home}` : 'Unknown';
      const mkt = a.market || {};
      const profitPct = a.profitMargin ? a.profitMargin.toFixed(2) + '%' : '?';
      const legs = a.bets
        ? a.bets.map(b => `${b.bookmaker}: ${b.betSide} @ ${decimalToAmerican(b.odds)}`).join(' | ')
        : '';
      console.log(`  ⚡ ARB +${profitPct} | ${ev?.sport || '?'}: ${game} | ${mkt.name || ''} | ${legs}`);
    });
  } else {
    console.log(`\n⚡ Arbitrage: none found (Kalshi vs BookMaker.eu)`);
  }

  // 4. Filter to NBA/NHL/NFL + EV threshold
  const opportunities = filterValueBets(valueBets);
  console.log(`\n🔍 EV+ opportunities (NBA/NHL/NFL, >${(config.minEV * 100).toFixed(0)}% EV): ${opportunities.length}`);

  if (opportunities.length === 0) {
    console.log('   No qualifying Kalshi EV+ bets for NBA/NFL/NHL right now.');
    console.log('   Kalshi pricing is in line with market consensus.');
    if (!MODE_ALL) console.log('   Run with --all to see all sports (reference only).');
  }

  // 5. Below-threshold context
  const allTargetBets = valueBets.filter(b => b.sportLabel);
  if (allTargetBets.length > opportunities.length) {
    console.log(`\n📊 All NBA/NHL/NFL Kalshi lines (below ${(config.minEV * 100).toFixed(0)}% threshold):`);
    allTargetBets.forEach(b => {
      const flag = b.ev >= config.minEV ? '🟢' : '⚪';
      console.log(`  ${flag} ${b.sportLabel} | ${b.game} | ${b.market} ${b.betSide} @ ${decimalToAmerican(b.bookmakerOdds)} | EV: ${b.evPct}`);
    });
  }

  // 6. Process qualifying opportunities
  //
  // ── KALSHI-ONLY TRADE PIPELINE ─────────────────────────────────────────────
  // CRITICAL: No trade is logged unless a Kalshi API order was actually submitted.
  // Order placement happens FIRST. Logging only happens after confirmed submission.
  // Any non-Kalshi bookmaker is rejected before reaching this point.
  // ── SAME-GAME GUARD ─────────────────────────────────────────────────────
  // Deduplicate within this run: only one bet per eventId.
  // On Kalshi, each team in a game is a separate ticker (e.g., -BOS and -PHX).
  // If the API returns EV+ for BOTH teams, betting both = guaranteed loss.
  // We take the highest-EV side and skip the rest.
  // (opportunities are already sorted by EV descending from filterValueBets)
  const seenEventIds = new Set();

  let found = 0;
  for (const opp of opportunities) {
    // ── Same-game dedup (within this run) ────────────────────────────────
    if (seenEventIds.has(opp.eventId)) {
      console.log(`  ⚠️  Same-game skip: ${opp.game} ${opp.betSide} (already betting other side, EV: ${opp.evPct})`);
      continue;
    }

    displayOpportunity(opp);
    found++;

    if (paper) {
      // ── Gate 1: Kalshi bookmaker hard check ──────────────────────────────
      // The value-bets API is queried with ?bookmaker=Kalshi, but be defensive.
      // If somehow a non-Kalshi bet slips through the engine filter, reject it here.
      if (!opp.bookmaker || opp.bookmaker.toLowerCase() !== 'kalshi') {
        console.log(`  ⛔ BLOCKED [not Kalshi]: ${opp.game} — bookmaker="${opp.bookmaker}". Cannot place order. Trade NOT logged.`);
        continue;
      }

      // ── Gate 2: Require Kalshi client ────────────────────────────────────
      // Without a client we cannot submit an order, so we CANNOT log the trade.
      // Rule: no Kalshi order = no log entry. Period.
      if (!kalshiClient) {
        console.log(`  ⚠️  No Kalshi client — cannot submit order. Trade NOT logged.`);
        console.log(`     (Paper log requires a confirmed Kalshi API order submission.)`);
        continue;
      }

      // ── Gate 3: Place Kalshi order FIRST ─────────────────────────────────
      // CRITICAL FIX: Previously logTrade() ran before placeKalshiDemoOrder(),
      // which caused trades to be logged even when the Kalshi order failed or
      // was never attempted. Now order placement happens FIRST, log happens AFTER.
      console.log(`  📤 Submitting Kalshi order for: ${opp.game} | ${opp.betSide} | EV: ${opp.evPct}`);
      const demoResult = await placeKalshiDemoOrder(opp, kalshiClient);

      if (!demoResult.ok) {
        console.log(`  ⛔ Kalshi order rejected (${demoResult.error || 'unknown error'}) — trade NOT logged.`);
        continue;
      }

      // ── Gate 4 passed — mark game as bet, then log ──────────────────────
      seenEventIds.add(opp.eventId);

      const trade = logTrade(opp);
      if (trade) {
        updateTradeWithDemoOrder(trade.id, {
          placedAt:   new Date().toISOString(),
          ok:         true,
          orderId:    demoResult.orderId   || null,
          fillStatus: demoResult.status    || null,
          ticker:     demoResult.ticker    || null,
          yesPrice:   demoResult.yesPrice  || null,
          count:      demoResult.count     || null,
          error:      null,
        });
        await sendAlert(opp, trade);
      }
    }
  }

  if (paper) {
    console.log('\n' + '─'.repeat(60));
    displayFileSummary(config.evTradesFile, 'EV+ Trades');
  }

  return found > 0 ? 2 : 0;
}

// ─── Low-Hold Mode ────────────────────────────────────────────────────────────
/**
 * Run the low-hold scanner.
 *
 * KALSHI-ONLY PIPELINE:
 *   - All pairs must have Kalshi as Side B (enforced by config.lowholdBooks = ['Kalshi'])
 *   - In paper mode: attempt to place a Kalshi demo order for Side B BEFORE logging
 *   - No trade is logged unless the Kalshi API order was actually submitted
 *
 * @param {boolean} paper         — true = paper trade mode; false = scan only
 * @param {KalshiClient|null} kalshiClient — Kalshi client for order placement (paper mode)
 */
async function runLowholdMode(paper, kalshiClient) {
  console.log(`\n🔄 Low-Hold Mode — BookMaker.eu × Kalshi Rollover Helper`);
  console.log(`   Side A: BookMaker.eu (rollover anchor — manual bet)`);
  console.log(`   Side B: Kalshi ONLY (automated via Kalshi API)`);
  console.log(`   Policy: Kalshi order must be submitted before any trade is logged`);
  console.log(`   Threshold: combined hold < ${(config.holdThreshold * 100).toFixed(0)}%  |  Unit: $${config.unitSize}/side`);
  console.log('─'.repeat(60));

  // Rollover status header
  const rollover = loadRollover();
  console.log(rolloverProgressLine(rollover) || `   🏦 Rollover: $${rollover.remaining} of $${rollover.total} remaining`);
  console.log('');

  const pairs = await scanLowhold();

  if (pairs.length === 0) {
    console.log('\n📭 No qualifying BookMaker.eu × Kalshi pairs right now.');
    console.log('   All available lines have combined hold above threshold.');
    console.log('   Try again pre-game when lines typically tighten.');
    return 0;
  }

  const arbCount     = pairs.filter(p => p.isArb).length;
  const lhCount      = pairs.filter(p => !p.isArb).length;
  console.log(`\n📊 Found ${pairs.length} qualifying pair(s):`);
  if (arbCount > 0) console.log(`   🔵 True arb (guaranteed profit): ${arbCount}`);
  if (lhCount  > 0) console.log(`   🟡 Low-hold (< ${(config.holdThreshold * 100).toFixed(0)}% combined): ${lhCount}`);

  for (const pair of pairs) {
    displayPair(pair);

    if (paper) {
      // ── Gate 1: Kalshi side hard check ─────────────────────────────────
      // Side B must always be Kalshi (enforced by config.lowholdBooks = ['Kalshi']).
      // This is a defensive check against config drift or unexpected API shapes.
      const sideAIsKalshi = ((pair.sideA && pair.sideA.book) || '').toLowerCase().includes('kalshi');
      const sideBIsKalshi = ((pair.sideB && pair.sideB.book) || '').toLowerCase().includes('kalshi');
      if (!sideAIsKalshi && !sideBIsKalshi) {
        console.log(`  ⛔ BLOCKED [not Kalshi]: ${pair.game}`);
        console.log(`     Side A: ${pair.sideA && pair.sideA.book} | Side B: ${pair.sideB && pair.sideB.book}`);
        console.log(`     BookMaker.eu ↔ BetOnline.ag and similar pairs are irrelevant. Trade NOT logged.`);
        continue;
      }

      // ── Gate 2: Require Kalshi client ──────────────────────────────────
      if (!kalshiClient) {
        console.log(`  ⚠️  No Kalshi client — cannot submit Side B order. Trade NOT logged.`);
        continue;
      }

      // ── Gate 3: Build Kalshi ticker for Side B order ────────────────────
      // Parse home/away from game string ("Away @ Home" format)
      const gameParts = (pair.game || '').split(' @ ');
      const awayTeam  = (gameParts[0] || '').trim();
      const homeTeam  = gameParts.slice(1).join(' @ ').trim();
      const bettingOnTeam = pair.sideB && pair.sideB.team;

      const kalshiTicker = buildKalshiGameTicker(
        homeTeam, awayTeam, bettingOnTeam, pair.sport, pair.commenceTime
      );

      if (!kalshiTicker) {
        console.log(`  ⚠️  Cannot build Kalshi ticker for ${pair.game}`);
        console.log(`     (Unknown team abbreviation for "${bettingOnTeam}", "${homeTeam}", or "${awayTeam}")`);
        console.log(`     Trade NOT logged — Kalshi order required per policy.`);
        continue;
      }

      // ── Gate 4: Place Kalshi Side B order FIRST ─────────────────────────
      // CRITICAL: No trade is logged unless the Kalshi API order is confirmed.
      const sideBOdds  = pair.sideB && pair.sideB.decimalOdds;
      const yesPrice   = lowholdOddsToYesPrice(sideBOdds);
      const orderCount = Math.max(1, Math.floor(config.unitSize));

      console.log(`  📤 Kalshi Side B order → ticker: ${kalshiTicker} | yes_price: ${yesPrice}¢ | count: ${orderCount}`);
      const kalshiOrder = await kalshiClient.placeOrder({
        ticker:    kalshiTicker,
        action:    'buy',
        side:      'yes',
        type:      'limit',
        count:     orderCount,
        yes_price: yesPrice,
      });

      if (!kalshiOrder.ok) {
        const errMsg = typeof kalshiOrder.error === 'object'
          ? JSON.stringify(kalshiOrder.error)
          : (kalshiOrder.error || `HTTP ${kalshiOrder.status || '?'}`);
        console.log(`  ⛔ Kalshi Side B order failed (${errMsg}) — trade NOT logged.`);
        continue;
      }

      // ── Gate 4 passed — log the trade with confirmed Kalshi order ────────
      const orderData   = kalshiOrder.data && kalshiOrder.data.order || {};
      const kalshiMeta  = {
        placedAt:  new Date().toISOString(),
        ok:        true,
        ticker:    kalshiTicker,
        orderId:   orderData.order_id || orderData.id || null,
        status:    orderData.status   || 'submitted',
        yesPrice,
        count:     orderCount,
      };

      const trade = logLowholdTrade(pair);
      if (trade) {
        updateLowholdTradeWithKalshiOrder(trade.id, kalshiMeta);
        console.log(`  ✅ Kalshi order confirmed (${kalshiMeta.orderId || 'id pending'}) — trade logged.`);
      }
    }
  }

  if (paper) {
    console.log('\n' + '─'.repeat(60));
    displayFileSummary(config.lowholdTradesFile, 'Low-Hold Trades');
    console.log('');
    const updated = loadRollover();
    console.log(rolloverProgressLine(updated) || '');
    if (updated.cleared) console.log('🎉 Rollover cleared!');
  }

  return pairs.length > 0 ? 2 : 0;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // ── STRATEGY LOCK: EV+ only — Low-hold engine disabled ────────────────────
  // Per Mario's directive (2026-03-16): Only EV+ strategy runs on Kalshi.
  // Low-hold pairs, rollover clearing, and BookMaker.eu arb are suspended.
  // Code is preserved below for future use — just make sure it's never called.
  if (MODE_LOWHOLD) {
    console.log('\n⛔  Low-hold engine is DISABLED.');
    console.log('    Only EV+ strategy is active. No BookMaker.eu arb, no rollover clearing.');
    console.log('    Pass --paper or --scan without --lowhold to run EV+.');
    process.exit(0);
  }

  const modeStr = 'EV+';
  const actStr  = MODE_LIVE ? 'LIVE' : MODE_PAPER ? 'Paper Trade' : 'Scan';
  console.log(`\n🎲 OddsTool V2 — ${modeStr} | ${actStr}`);
  console.log(`⏰ ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', timeZoneName: 'short' })}`);

  let exitCode     = 0;
  let kalshiClient = null;

  try {
    if (MODE_LIVE && !MODE_LOWHOLD) {
      // ── LIVE mode ──────────────────────────────────────────────────────────
      console.log('\n⚠️  LIVE TRADING — real money on the line. Proceeding...');
      kalshiClient = await initKalshiClient(/* demo= */ false, /* required= */ true);
      exitCode = await runEVMode(/* paper= */ true, kalshiClient);

    } else if (MODE_PAPER && !MODE_LOWHOLD) {
      // ── Paper mode (EV+): connect to Kalshi demo, gracefully degrade if unavailable ──
      kalshiClient = await initKalshiClient(/* demo= */ true, /* required= */ false);
      exitCode = await runEVMode(/* paper= */ true, kalshiClient);

    } else if (MODE_LOWHOLD) {
      // ── Low-hold mode (scan or paper) ─────────────────────────────────────
      // For paper mode, initialize Kalshi demo client for Side B order placement.
      // No trade is logged unless Kalshi Side B order is confirmed.
      let lowholdKalshiClient = null;
      if (MODE_PAPER) {
        lowholdKalshiClient = await initKalshiClient(/* demo= */ true, /* required= */ false);
      }
      exitCode = await runLowholdMode(MODE_PAPER, lowholdKalshiClient);

    } else {
      // ── Scan-only (EV+) ───────────────────────────────────────────────────
      exitCode = await runEVMode(/* paper= */ false, null);
    }

  } catch (e) {
    console.error('\n❌ Fatal error:', e.message);
    if (VERBOSE) console.error(e.stack);
    process.exit(1);
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`✅ Done. Exit code: ${exitCode}`);
  process.exit(exitCode);
}

main();
