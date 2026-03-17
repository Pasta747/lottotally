#!/usr/bin/env node
/**
 * check-settlements.js — OddsTool v2 Settlement Checker
 *
 * Checks whether Kalshi markets for tracked trades have settled and updates
 * P&L accordingly. Also checks the demo portfolio for settled positions.
 *
 * Usage:
 *   node check-settlements.js             # check all open trades
 *   node check-settlements.js --verbose   # verbose API output
 *   node check-settlements.js --live      # check live env (requires KALSHI_LIVE_ENABLED=true)
 *
 * Files updated:
 *   data/ev-trades.json      — EV+ scanner trades
 *   data/paper-trades.json   — Paper trades (mirrors ev-trades for now)
 *   data/lowhold-trades.json — Low-hold engine trades
 */

'use strict';

require('dotenv').config({ path: '/root/PastaOS/.env' });
const fs   = require('fs');
const path = require('path');
const { KalshiClient } = require('./kalshi-client');

// ── CLI args ─────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');
const isLive  = args.includes('--live');

// ── Config ───────────────────────────────────────────────────────────────────
const DATA_DIR   = path.join(__dirname, 'data');
const TRADE_FILES = [
  path.join(DATA_DIR, 'kalshi-live-trades.json'),  // ← real Kalshi orders (with kalshiTicker)
  path.join(DATA_DIR, 'ev-trades.json'),
  path.join(DATA_DIR, 'paper-trades.json'),
  path.join(DATA_DIR, 'lowhold-trades.json'),
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function log(...args) { console.log('[settlements]', ...args); }
function vlog(...args) { if (verbose) console.log('[settlements:v]', ...args); }

function loadTradeFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    log(`WARN: Failed to parse ${filePath}:`, e.message);
    return null;
  }
}

function saveTradeFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Compute P&L for a settled trade.
 * On Kalshi:
 *   - YES contract bought at price P cents: pays $1.00 if YES wins, $0 if NO wins
 *   - P&L = (1 - P/100) * contracts  if YES wins
 *   - P&L = -(P/100) * contracts     if NO wins
 *
 * For paper trades without Kalshi ticker info, we use the betSide logic.
 */
function computePnL(trade, marketResult) {
  // If the trade has Kalshi order details
  if (trade.kalshiOrder) {
    const { side, yes_price_dollars, fill_count } = trade.kalshiOrder;
    const contracts = parseFloat(fill_count || '1');
    const pricePaid = parseFloat(yes_price_dollars || '0');

    if (side === 'yes') {
      // YES contract: win if market resolves YES
      if (marketResult === 'yes') {
        return +((1.0 - pricePaid) * contracts).toFixed(4);
      } else {
        return -(pricePaid * contracts).toFixed(4);
      }
    } else {
      // NO contract: win if market resolves NO
      const noPricePaid = 1.0 - pricePaid;
      if (marketResult === 'no') {
        return +((1.0 - noPricePaid) * contracts).toFixed(4);
      } else {
        return -(noPricePaid * contracts).toFixed(4);
      }
    }
  }

  // Paper trade without Kalshi order: use betSide + winner
  const wager = trade.wager || 0;
  const decimalOdds = trade.decimalOdds || 2.0;
  if (trade.winner === 'yes' || trade.winner === trade.betSide) {
    return +((decimalOdds - 1) * wager).toFixed(2);
  } else {
    return -(wager.toFixed(2));
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  log(`Running in ${isLive ? 'LIVE' : 'DEMO'} mode`);

  const client = new KalshiClient({ demo: !isLive, verbose });

  // ── 1. Check portfolio settlements via API ────────────────────────────────
  log('Checking portfolio settlements via Kalshi API...');
  let portfolioSettlements = [];
  try {
    const settleRes = await client._request('GET', '/portfolio/settlements?limit=50');
    if (settleRes.ok) {
      portfolioSettlements = settleRes.data?.settlements || [];
      log(`Found ${portfolioSettlements.length} portfolio settlement(s) in history`);
      if (portfolioSettlements.length > 0) {
        portfolioSettlements.forEach(s => {
          log(`  SETTLED: ${s.ticker} → ${s.yes_price >= 99 ? 'YES wins' : 'NO wins'} | revenue: $${s.revenue_dollars} | P&L: $${s.profit_loss_dollars}`);
        });
      }
    } else {
      log('WARN: Could not fetch portfolio settlements:', settleRes.error);
    }
  } catch (e) {
    log('WARN: Portfolio settlements error:', e.message);
  }

  // ── 2. Check current positions ────────────────────────────────────────────
  log('Checking current open positions...');
  try {
    const posRes = await client._request('GET', '/portfolio/positions?settlement_status=unsettled');
    if (posRes.ok) {
      const positions = posRes.data?.market_positions || [];
      const balance = (await client._request('GET', '/portfolio/balance')).data;
      log(`Open positions: ${positions.length}`);
      log(`Portfolio balance: $${(balance?.balance / 100).toFixed(2)} | Portfolio value: $${(balance?.portfolio_value / 100).toFixed(2)}`);
      positions.forEach(p => {
        log(`  OPEN: ${p.ticker} | position: ${p.position_fp} contracts | exposure: $${p.market_exposure_dollars} | realized P&L: $${p.realized_pnl_dollars}`);
      });
    }
  } catch (e) {
    log('WARN: Positions error:', e.message);
  }

  // ── 3. Update trade files with settlement data ────────────────────────────
  log('\nChecking trade files for open trades...');

  // Build a set of settled tickers from portfolio settlements
  const settledTickers = new Map(); // ticker → { result, pnl, settledAt }
  for (const s of portfolioSettlements) {
    const result = s.yes_price >= 99 ? 'yes' : 'no';
    settledTickers.set(s.ticker, {
      result,
      revenue_dollars: s.revenue_dollars,
      profit_loss_dollars: s.profit_loss_dollars,
      settledAt: s.settled_time || new Date().toISOString(),
    });
  }

  let totalUpdated = 0;

  for (const filePath of TRADE_FILES) {
    const fileData = loadTradeFile(filePath);
    if (!fileData || !fileData.trades) {
      vlog(`Skipping ${path.basename(filePath)} — not found or invalid`);
      continue;
    }

    const openTrades = fileData.trades.filter(t => t.status === 'open');
    log(`${path.basename(filePath)}: ${openTrades.length} open trade(s)`);

    let fileUpdated = false;

    for (const trade of fileData.trades) {
      if (trade.status !== 'open') continue;

      // Get the Kalshi ticker for this trade
      const kalshiTicker = trade.kalshiTicker || trade.kalshiOrder?.ticker;
      if (!kalshiTicker) {
        vlog(`  Trade ${trade.id}: no Kalshi ticker, skipping market check`);
        continue;
      }

      // Check if already in our settlement map
      if (settledTickers.has(kalshiTicker)) {
        const settled = settledTickers.get(kalshiTicker);
        log(`  Trade ${trade.id}: SETTLED via portfolio — result: ${settled.result} | P&L: $${settled.profit_loss_dollars}`);
        trade.status = 'settled';
        trade.winner = settled.result;
        trade.actualPnL = parseFloat(settled.profit_loss_dollars || 0);
        trade.settledAt = settled.settledAt;
        trade.kalshiRevenue = parseFloat(settled.revenue_dollars || 0);
        fileUpdated = true;
        totalUpdated++;
        continue;
      }

      // Fetch market status from API
      try {
        const mktRes = await client._request('GET', `/markets/${encodeURIComponent(kalshiTicker)}`);
        if (!mktRes.ok) {
          vlog(`  Trade ${trade.id}: market fetch error (${mktRes.status}): ${mktRes.error}`);
          continue;
        }
        const market = mktRes.data?.market;
        if (!market) continue;

        vlog(`  Trade ${trade.id}: ${kalshiTicker} status=${market.status} result="${market.result}"`);

        if (market.status === 'finalized' && market.result) {
          // Market has settled
          const result = market.result.toLowerCase(); // 'yes' or 'no'
          const pnl = computePnL(trade, result);

          log(`  Trade ${trade.id}: SETTLED — ${kalshiTicker} → ${result.toUpperCase()} | computed P&L: $${pnl}`);
          trade.status = 'settled';
          trade.winner = result;
          trade.actualPnL = pnl;
          trade.settledAt = market.settled_time || new Date().toISOString();
          fileUpdated = true;
          totalUpdated++;
        } else if (market.status === 'active') {
          log(`  Trade ${trade.id}: still OPEN — ${kalshiTicker} (status: active)`);
        } else {
          log(`  Trade ${trade.id}: ${kalshiTicker} — status: ${market.status}`);
        }
      } catch (e) {
        log(`  Trade ${trade.id}: error checking ${kalshiTicker}:`, e.message);
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 100));
    }

    if (fileUpdated) {
      saveTradeFile(filePath, fileData);
      log(`  ✅ Saved updates to ${path.basename(filePath)}`);
    }
  }

  log(`\nDone. Updated ${totalUpdated} trade(s).`);

  // ── 4. Summary ────────────────────────────────────────────────────────────
  if (portfolioSettlements.length > 0) {
    const totalPnL = portfolioSettlements.reduce((sum, s) => sum + parseFloat(s.profit_loss_dollars || 0), 0);
    log(`\n=== SETTLEMENT SUMMARY ===`);
    log(`Total settled trades: ${portfolioSettlements.length}`);
    log(`Total P&L: $${totalPnL.toFixed(4)}`);
  }
}

main().catch(err => {
  console.error('[settlements] Fatal error:', err);
  process.exit(1);
});
