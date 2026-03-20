#!/usr/bin/env node
process.chdir(__dirname);

const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const config = require('./config');
const { IbkrClient } = require('./ibkr-client');
const { PaperTrader, ensureDataFiles } = require('./paper-trader');
const { fetchOBB, normalizeBars, logSignals } = require('./strategies/utils');

ensureDataFiles();

const ibkr = new IbkrClient();
const paper = new PaperTrader();

function loadStrategies() {
  const dir = path.join(__dirname, 'strategies');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'utils.js');
  const loaded = [];
  for (const file of files) {
    try {
      const mod = require(path.join(dir, file));
      if (mod && mod.name && typeof mod.scan === 'function') loaded.push(mod);
    } catch (err) {
      console.error(`Failed to load strategy ${file}:`, err.message);
    }
  }
  loaded.sort((a, b) => a.name.localeCompare(b.name));
  return loaded;
}

const ALL_STRATEGIES = loadStrategies();
const STRATEGY_MAP = Object.fromEntries(ALL_STRATEGIES.map((s) => [s.name, s]));

async function fetchLastPrices(symbols) {
  const out = {};
  for (const symbol of symbols) {
    try {
      const raw = await fetchOBB([{ url: '/api/v1/equity/price/historical', params: { symbol, provider: config.OPENBB_PROVIDER, interval: '1d', limit: 2 } }]);
      const bars = normalizeBars(raw);
      if (bars.length) out[symbol] = bars[bars.length - 1].close;
    } catch (_) {}
  }
  return out;
}

function normalizeSignal(sig) {
  const side = sig?.side || sig?.signal;
  if (!['BUY', 'SELL'].includes(side)) return null;
  const price = Number(sig?.price);
  if (!Number.isFinite(price) || price <= 0) return null;
  return {
    symbol: String(sig.symbol || '').toUpperCase(),
    side,
    strategy: sig.strategy || 'unknown',
    reason: sig.reason || '',
    price,
    qty: Number(sig.qty || 0),
  };
}

async function executeSignals(signals) {
  const openPositions = paper.getOpenPositions();
  const actions = [];

  for (const rawSig of signals) {
    const sig = normalizeSignal(rawSig);
    if (!sig || !sig.symbol) continue;

    const hasPos = !!openPositions[sig.symbol];
    if (sig.side === 'BUY') {
      if (hasPos) continue;
      if (paper.positionCount() >= config.MAX_POSITIONS) {
        actions.push({ ...sig, skipped: true, skipReason: 'MAX_POSITIONS reached' });
        continue;
      }
      const qty = Math.max(1, sig.qty || paper.computeQty(sig.price));
      const notional = qty * sig.price;
      if (notional > config.MAX_POSITION_SIZE * 1.01) {
        actions.push({ ...sig, skipped: true, skipReason: 'MAX_POSITION_SIZE exceeded' });
        continue;
      }

      const order = await ibkr.placeOrder(sig.symbol, 'BUY', qty, 'MKT');
      const trade = paper.recordTrade({ strategy: sig.strategy, symbol: sig.symbol, side: 'BUY', qty, price: sig.price });
      openPositions[sig.symbol] = { symbol: sig.symbol, qty, entryPrice: sig.price, strategy: sig.strategy };
      actions.push({ ...sig, executed: true, order, trade });
    }

    if (sig.side === 'SELL') {
      if (!hasPos) continue;
      const qty = openPositions[sig.symbol].qty;
      const order = await ibkr.placeOrder(sig.symbol, 'SELL', qty, 'MKT');
      const trade = paper.recordTrade({ strategy: sig.strategy, symbol: sig.symbol, side: 'SELL', qty, price: sig.price });
      delete openPositions[sig.symbol];
      actions.push({ ...sig, executed: true, order, trade });
    }
  }

  return actions;
}

async function runStrategy(strategy) {
  try {
    return await strategy.scan(config.UNIVERSE, config, paper);
  } catch (err) {
    return [{ symbol: '-', side: 'SELL', strategy: strategy.name, reason: `strategy error: ${err.message}`, price: 0 }];
  }
}

async function runScan(selectedNames = null) {
  const enabledSet = new Set(config.STRATEGIES_ENABLED);
  const selected = selectedNames?.length
    ? selectedNames.map((n) => STRATEGY_MAP[n]).filter(Boolean)
    : ALL_STRATEGIES.filter((s) => enabledSet.has(s.name));

  const allSignals = [];
  for (const strategy of selected) {
    const res = await runStrategy(strategy);
    allSignals.push(...(Array.isArray(res) ? res : []));
  }

  const signals = allSignals.map(normalizeSignal).filter(Boolean);
  logSignals(signals);
  const actions = await executeSignals(signals);

  console.log('=== Signals ===');
  if (!signals.length) console.log('No signals generated.');
  for (const s of signals) {
    console.log(`${s.strategy.padEnd(22)} ${s.symbol.padEnd(6)} ${s.side.padEnd(4)} ${s.reason}`);
  }

  console.log('\n=== Executions ===');
  if (!actions.length) console.log('No orders placed.');
  for (const a of actions) {
    if (a.executed) console.log(`${a.strategy} ${a.side} ${a.symbol} qty=${a.trade.qty} @ ${a.trade.price}`);
    else console.log(`SKIP ${a.symbol} ${a.skipReason}`);
  }
}

async function showPositions() {
  const openPos = paper.getOpenPositions();
  const symbols = Object.keys(openPos);
  const prices = await fetchLastPrices(symbols);
  const rows = paper.evaluatePositions(prices);
  console.log('=== Open Positions ===');
  if (!rows.length) console.log('None');
  rows.forEach((r) => {
    console.log(`${r.symbol} qty=${r.qty} entry=${r.entryPrice} last=${r.lastPrice} pnl=${r.pnl} (${r.pnlPct}%) strategy=${r.strategy}`);
  });
  console.log('\n=== Daily Summary ===');
  console.log(paper.dailySummary());
}

async function showPnl() {
  const openPos = paper.getOpenPositions();
  const symbols = Object.keys(openPos);
  const prices = await fetchLastPrices(symbols);
  const rows = paper.strategyPerformanceReport(prices);

  console.log('=== Strategy P&L ===');
  if (!rows.length) {
    console.log('No closed trades yet.');
    return;
  }

  console.table(rows.map((r) => ({
    strategy: r.strategy,
    closed: r.closedTrades,
    winRate: `${r.winRate}%`,
    realized: r.realizedPnl,
    unrealized: r.unrealizedPnl,
    avgWin: r.avgWin,
    avgLoss: r.avgLoss,
    sharpeLike: r.sharpeLike,
  })));

  const totals = rows.reduce(
    (acc, r) => {
      acc.realized += r.realizedPnl;
      acc.unrealized += r.unrealizedPnl;
      acc.closed += r.closedTrades;
      return acc;
    },
    { realized: 0, unrealized: 0, closed: 0 }
  );

  console.log('\n=== Portfolio Summary ===');
  console.log(`Closed trades: ${totals.closed}`);
  console.log(`Realized P&L: ${totals.realized.toFixed(2)}`);
  console.log(`Unrealized P&L: ${totals.unrealized.toFixed(2)}`);
}

async function showAccount() {
  const summary = await ibkr.getAccountSummary();
  const mine = summary.filter((r) => r.account === config.PAPER_ACCOUNT_ID);
  console.log('=== IBKR Account Summary ===');
  if (!mine.length) {
    console.log('No rows for account', config.PAPER_ACCOUNT_ID);
  } else {
    mine.forEach((r) => console.log(`${r.tag}: ${r.value} ${r.currency}`));
  }

  const positions = await ibkr.getPositions();
  const myPos = positions.filter((p) => p.account === config.PAPER_ACCOUNT_ID);
  console.log('\n=== IBKR Positions ===');
  if (!myPos.length) console.log('None');
  myPos.forEach((p) => console.log(`${p.symbol} qty=${p.position} avgCost=${p.avgCost}`));
}

async function showPnl() {
  let closed = paper.getClosedTrades();
  if (!closed.length && paper.getTrades().length) {
    closed = paper.rebuildClosedTradesFromHistory();
  }

  const openPos = paper.getOpenPositions();
  const symbols = Object.keys(openPos);
  const prices = await fetchLastPrices(symbols);

  const strategyRows = paper.pnlByStrategy(prices);

  console.log('=== Strategy Performance (Realized + Unrealized) ===');
  if (!strategyRows.length) {
    console.log('No closed/open strategy data yet.');
  } else {
    console.table(
      strategyRows.map((r) => ({
        strategy: r.strategy,
        realized: r.realizedPnl,
        unrealized: r.unrealizedPnl,
        total: r.totalPnl,
        trades: r.trades,
        winRatePct: r.winRate,
        avgWin: r.avgWin,
        avgLoss: r.avgLoss,
        sharpe: r.sharpe,
      }))
    );
  }

  const openRows = paper.evaluatePositions(prices);
  const unrealizedTotal = openRows.reduce((sum, row) => sum + Number(row.pnl || 0), 0);

  console.log('\n=== Open Positions MTM ===');
  if (!openRows.length) console.log('None');
  else {
    openRows.forEach((r) => {
      console.log(`${r.symbol} qty=${r.qty} entry=${r.entryPrice} last=${r.lastPrice} unrealized=${r.pnl} (${r.pnlPct}%) strategy=${r.strategy}`);
    });
  }

  const realizedTotal = closed.reduce((sum, t) => sum + Number(t.pnl || 0), 0);

  console.log('\n=== Totals ===');
  console.log(`Closed trades: ${closed.length}`);
  console.log(`Realized P&L: ${Number(realizedTotal.toFixed(2))}`);
  console.log(`Unrealized P&L: ${Number(unrealizedTotal.toFixed(2))}`);
  console.log(`Net P&L: ${Number((realizedTotal + unrealizedTotal).toFixed(2))}`);
}

function showStrategyList() {
  const enabled = new Set(config.STRATEGIES_ENABLED || []);
  console.log('=== Available Strategies ===');
  for (const s of ALL_STRATEGIES) {
    console.log(`${s.name.padEnd(24)} ${enabled.has(s.name) ? 'ENABLED' : 'DISABLED'}`);
  }
  console.log(`\nTotal: ${ALL_STRATEGIES.length}`);
}

async function main() {
  let parser = yargs(hideBin(process.argv))
    .option('scan', { type: 'boolean', describe: 'Run enabled strategies scan' })
    .option('positions', { type: 'boolean' })
    .option('pnl', { type: 'boolean', describe: 'Show realized/unrealized P&L by strategy' })
    .option('account', { type: 'boolean' })
    .option('list', { type: 'boolean', describe: 'List all strategies and status' })
    .option('backtest', { type: 'string', describe: 'Backtest a strategy (placeholder)' });

  for (const s of ALL_STRATEGIES) {
    parser = parser.option(s.name, { type: 'boolean', describe: `Run only ${s.name}` });
  }

  const argv = parser.help().argv;

  try {
    if (argv.account) return await showAccount();
    if (argv.positions) return await showPositions();
    if (argv.pnl) return await showPnl();
    if (argv.list) return showStrategyList();
    if (argv.backtest) return console.log('backtest not yet implemented');

    const selected = ALL_STRATEGIES.filter((s) => !!argv[s.name]).map((s) => s.name);
    if (selected.length) return await runScan(selected);
    if (argv.scan) return await runScan();

    console.log('No command specified. Try --help');
  } finally {
    ibkr.disconnect();
  }
}

main()
  .then(() => {
    // Force exit: IBApi event listeners keep the Node event loop alive
    // indefinitely even after ibkr.disconnect(). Explicit exit required.
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal:', err.message);
    process.exit(1);
  });
