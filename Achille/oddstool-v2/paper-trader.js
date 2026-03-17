/**
 * paper-trader.js - Paper Trading Engine
 * Handles both EV+ trades (ev-trades.json) and low-hold trades (lowhold-trades.json).
 * In --paper mode, EV+ trades are ALSO placed on Kalshi's demo exchange.
 */
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { extractTickerFromHref, oddsToYesPrice } = require('./kalshi-client');

// ─── Generic file helpers ─────────────────────────────────────────────────────

function loadFromFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.error(`  ⚠️  Could not load ${filePath}:`, e.message);
  }
  return { trades: [], stats: { totalTrades: 0, openTrades: 0, settledTrades: 0, totalWagered: 0, totalPnL: 0 } };
}

function saveToFile(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getTodayExposureFromFile(filePath) {
  const data = loadFromFile(filePath);
  const today = new Date().toDateString();
  return data.trades
    .filter(t => new Date(t.timestamp).toDateString() === today && t.status !== 'cancelled')
    .reduce((sum, t) => sum + (t.wager || 0), 0);
}

// ─── Rollover tracker ────────────────────────────────────────────────────────

/**
 * Load rollover state from file.
 * Shape: { total, remaining, cleared, history: [{ tradeId, wager, remaining, ts }] }
 */
function loadRollover() {
  try {
    if (fs.existsSync(config.rolloverFile)) {
      return JSON.parse(fs.readFileSync(config.rolloverFile, 'utf8'));
    }
  } catch (e) { /* fall through */ }
  // First run — seed from config
  return {
    total: config.rolloverTotal,
    remaining: config.rolloverTotal,
    cleared: false,
    history: [],
  };
}

function saveRollover(state) {
  const dir = path.dirname(config.rolloverFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(config.rolloverFile, JSON.stringify(state, null, 2));
}

/**
 * Deduct a wager from the rollover balance.
 * Returns the updated state (with .remaining and .cleared).
 */
function deductRollover(tradeId, wager) {
  if (!config.rolloverTotal) return null; // tracker disabled
  const state = loadRollover();
  if (state.cleared) return state;        // already done

  const deduction = Math.min(wager, state.remaining);
  state.remaining = parseFloat(Math.max(0, state.remaining - deduction).toFixed(2));
  state.cleared   = state.remaining <= 0;
  state.history.push({ tradeId, wager: deduction, remaining: state.remaining, ts: new Date().toISOString() });
  saveRollover(state);
  return state;
}

/**
 * Return a one-line rollover progress string for display.
 */
function rolloverProgressLine(state) {
  if (!state || !config.rolloverTotal) return '';
  const pct  = (((state.total - state.remaining) / state.total) * 100).toFixed(1);
  const bar  = buildBar(state.total - state.remaining, state.total, 20);
  if (state.cleared) return `   🎉 Rollover CLEARED! ($${state.total} wagered at BookMaker.eu)`;
  return `   📋 Rollover: $${state.remaining.toFixed(2)} remaining of $${state.total} [${bar}] ${pct}%`;
}

function buildBar(done, total, width) {
  const filled = Math.round((done / total) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

// ─── Legacy helpers (used by loadTrades/saveTrades callers) ──────────────────

function loadTrades() {
  try {
    if (fs.existsSync(config.paperTradesFile)) {
      const raw = fs.readFileSync(config.paperTradesFile, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('  ⚠️  Could not load paper trades:', e.message);
  }
  return {
    trades: [],
    stats: { totalTrades: 0, openTrades: 0, settledTrades: 0, totalWagered: 0, totalPnL: 0 }
  };
}

function saveTrades(data) {
  const dir = path.dirname(config.paperTradesFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(config.paperTradesFile, JSON.stringify(data, null, 2));
}

function getTodayExposure(trades) {
  const today = new Date().toDateString();
  return trades
    .filter(t => new Date(t.timestamp).toDateString() === today && t.status !== 'cancelled')
    .reduce((sum, t) => sum + (t.wager || 0), 0);
}

/**
 * Dedup: skip if ANY bet on the same game (any side) seen in last 24 hours.
 * This prevents:
 *   1. Re-betting the same side across cron runs
 *   2. Betting BOTH sides of the same game (guaranteed loss on Kalshi)
 *
 * Changed from 1-hour same-side-only to 24-hour same-game check.
 */
function isDuplicate(trades, bet) {
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  return trades.some(t =>
    t.eventId === bet.eventId &&
    t.bookmaker === bet.bookmaker &&
    new Date(t.timestamp).getTime() > twentyFourHoursAgo
  );
}

/**
 * Log a paper trade for a value bet opportunity.
 * KALSHI-ONLY POLICY: Will reject any bet whose bookmaker is not Kalshi.
 * This is a hard safety gate — callers must place a Kalshi order first and
 * only call logTrade() after the order is confirmed.
 */
function logTrade(bet) {
  // ── KALSHI-ONLY HARD GATE ────────────────────────────────────────────────
  // No non-Kalshi trade should ever reach this function.
  // If it does, that's a bug in the caller — reject loudly.
  if (!bet.bookmaker || bet.bookmaker.toLowerCase() !== 'kalshi') {
    console.error(`  ⛔ logTrade BLOCKED: bookmaker="${bet.bookmaker}" is not Kalshi.`);
    console.error(`     Kalshi ONLY policy — non-Kalshi bets cannot be logged.`);
    console.error(`     This is a bug: callers must filter to Kalshi before calling logTrade().`);
    return null;
  }

  const data = loadTrades();

  // Check daily exposure
  const todayExp = getTodayExposure(data.trades);
  if (todayExp + config.unitSize > config.maxDailyExposure) {
    console.log(`  ⚠️  Daily exposure limit reached ($${todayExp.toFixed(2)} / $${config.maxDailyExposure}). Skipping.`);
    return null;
  }

  // Dedup
  if (isDuplicate(data.trades, bet)) {
    console.log(`  ℹ️  Duplicate skipped: ${bet.game} ${bet.market} ${bet.betSide}`);
    return null;
  }

  const trade = {
    id: `PT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    status: 'open',

    // Event info
    eventId: bet.eventId,
    sport: bet.sportLabel,
    league: bet.league,
    game: bet.game,
    homeTeam: bet.homeTeam,
    awayTeam: bet.awayTeam,
    commenceTime: bet.commenceTime,

    // Bet details
    bookmaker: bet.bookmaker,
    market: bet.market,
    betSide: bet.betSide,
    decimalOdds: bet.bookmakerOdds,
    americanOdds: require('./calculator').decimalToAmerican(bet.bookmakerOdds),
    consensusOdds: bet.consensusOdds,
    consensusProb: bet.consensusProb,
    ev: bet.ev,
    evPct: bet.evPct,
    wager: config.unitSize,
    href: bet.href || null,

    // Settlement (filled later)
    winner: null,
    settledAt: null,
    actualPnL: null,
  };

  data.trades.push(trade);
  data.stats.totalTrades++;
  data.stats.openTrades++;
  data.stats.totalWagered += config.unitSize;

  saveTrades(data);
  console.log(`  ✅ Paper trade logged: ${trade.id}`);
  return trade;
}

/**
 * Settle a trade
 * result: 'win' | 'loss' | 'push'
 */
function settleTrade(tradeId, result) {
  const data = loadTrades();
  const trade = data.trades.find(t => t.id === tradeId);
  if (!trade) { console.error(`  ❌ Trade not found: ${tradeId}`); return null; }
  if (trade.status !== 'open') { console.log(`  ℹ️  Already settled: ${tradeId}`); return trade; }

  trade.settledAt = new Date().toISOString();
  trade.status = 'settled';
  trade.winner = result;

  if (result === 'win') {
    trade.actualPnL = parseFloat(((trade.decimalOdds - 1) * trade.wager).toFixed(2));
  } else if (result === 'loss') {
    trade.actualPnL = -trade.wager;
  } else {
    trade.actualPnL = 0;
  }

  data.stats.openTrades = Math.max(0, data.stats.openTrades - 1);
  data.stats.settledTrades++;
  data.stats.totalPnL += trade.actualPnL;

  saveTrades(data);
  console.log(`  ✅ Settled ${tradeId}: ${result} | P&L: $${trade.actualPnL}`);
  return trade;
}

/**
 * Print summary to console
 */
function displaySummary() {
  const data = loadTrades();
  const { stats, trades } = data;

  console.log('\n📊 Paper Trading Summary:');
  console.log(`  Total trades: ${stats.totalTrades} | Open: ${stats.openTrades} | Settled: ${stats.settledTrades}`);
  console.log(`  Total wagered: $${(stats.totalWagered || 0).toFixed(2)} | P&L: $${(stats.totalPnL || 0).toFixed(2)}`);
  console.log(`  Today's exposure: $${getTodayExposure(trades).toFixed(2)} / $${config.maxDailyExposure}`);

  const recent = trades.slice(-5).reverse();
  if (recent.length) {
    console.log('\n  Recent trades:');
    recent.forEach(t => {
      const pnl = t.status === 'settled' ? `P&L: $${t.actualPnL}` : `exp. EV: ${t.evPct || 'N/A'}`;
      const { decimalToAmerican } = require('./calculator');
      console.log(`  [${t.id}] ${t.sport || t.league} | ${t.game} | ${t.betSide} @ ${decimalToAmerican(t.decimalOdds || t.kalshiOdds)} (${t.bookmaker || 'Kalshi'}) | EV: ${t.evPct || 'N/A'} | ${t.status} | ${pnl}`);
    });
  }
}

/**
 * Log a paper trade from an EV+ value-bet opportunity (new primary signal)
 */
function logEVTrade(opp) {
  const data = loadTrades();

  // Check daily exposure limit
  const todayExposure = getTodayExposure(data.trades);
  if (todayExposure + opp.totalExposure > config.maxDailyExposure) {
    console.log(`  ⚠️  Daily exposure limit reached ($${todayExposure.toFixed(2)} / $${config.maxDailyExposure}). Skipping.`);
    return null;
  }

  // Dedup: skip if same event + betSide within last hour
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const isDup = data.trades.some(t =>
    t.type === 'ev-bet' &&
    t.eventId === opp.eventId &&
    t.betSide === opp.betSide &&
    new Date(t.timestamp).getTime() > oneHourAgo
  );
  if (isDup) {
    console.log(`  ℹ️  Duplicate EV trade skipped: ${opp.game} ${opp.betSide}`);
    return null;
  }

  const trade = {
    id: `EV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type: 'ev-bet',
    timestamp: new Date().toISOString(),
    status: 'open',

    // Event info
    eventId: opp.eventId,
    game: opp.game,
    league: opp.league,
    sport: opp.sport,
    commenceTime: opp.commenceTime,

    // The bet
    betSide: opp.betSide,
    betTeam: opp.betTeam,
    marketName: opp.marketName,
    kalshiOdds: opp.kalshiOdds,
    kalshiOddsAmerican: opp.kalshiOddsAmerican,
    kalshiHref: opp.kalshiHref,

    // EV analysis
    trueProbPct: opp.trueProbPct,
    marketConsensusOdds: opp.marketConsensusOdds,
    evPct: opp.evPct,
    evRaw: opp.evRaw,

    // Sharp confirmation
    sharpConfirmed: opp.sharpConfirmed,
    sharpReason: opp.sharpReason,
    sharpLines: opp.sharpLines,

    // Sizing
    wager: opp.recommendedBet,
    totalExposure: opp.totalExposure,
    expectedEV: parseFloat(opp.expectedEV),

    // Rating
    rating: opp.rating,

    // Settlement fields
    winner: null,
    settledAt: null,
    actualPnL: null,
    notes: `EV+ ${opp.evPct} | ${opp.sharpReason}`
  };

  data.trades.push(trade);
  data.stats.totalTrades++;
  data.stats.openTrades++;
  data.stats.totalWagered += opp.totalExposure;

  saveTrades(data);
  console.log(`  ✅ EV+ paper trade logged: ${trade.id} | ${opp.game} | EV: ${opp.evPct} | Sharp: ${opp.sharpReason}`);
  return trade;
}

/**
 * Log a low-hold paper trade (BookMaker.eu × Kalshi rollover helper).
 * Stores to config.lowholdTradesFile.
 * KALSHI-ONLY POLICY: At least one side must be Kalshi. Will reject pairs
 * where neither side is Kalshi (e.g., BookMaker.eu ↔ BetOnline.ag).
 */
function logLowholdTrade(pair) {
  // ── KALSHI SIDE HARD GATE ────────────────────────────────────────────────
  // Low-hold pairs must have Kalshi as Side B (per config.lowholdBooks = ['Kalshi']).
  // This is a defensive hard check against config drift or incorrect callers.
  const sideAIsKalshi = ((pair.sideA && pair.sideA.book) || '').toLowerCase().includes('kalshi');
  const sideBIsKalshi = ((pair.sideB && pair.sideB.book) || '').toLowerCase().includes('kalshi');
  if (!sideAIsKalshi && !sideBIsKalshi) {
    console.error(`  ⛔ logLowholdTrade BLOCKED: neither side is Kalshi.`);
    console.error(`     Side A: ${pair.sideA && pair.sideA.book} | Side B: ${pair.sideB && pair.sideB.book}`);
    console.error(`     Kalshi ONLY policy — BookMaker.eu ↔ BetOnline.ag and similar pairs are NEVER logged.`);
    return null;
  }

  const filePath = config.lowholdTradesFile;
  const data = loadFromFile(filePath);

  // Daily exposure check (per-side × 2)
  const todayExp = getTodayExposureFromFile(filePath);
  if (todayExp + pair.totalExposure > config.maxDailyExposure) {
    console.log(`  ⚠️  Low-hold daily limit reached ($${todayExp.toFixed(2)} / $${config.maxDailyExposure}). Skipping.`);
    return null;
  }

  // Dedup: same game + sideA book + sideB book + sides within last hour
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const isDup = data.trades.some(t =>
    t.game === pair.game &&
    t.sideA?.book === pair.sideA.book &&
    t.sideB?.book === pair.sideB.book &&
    t.sideA?.team === pair.sideA.team &&
    new Date(t.timestamp).getTime() > oneHourAgo
  );
  if (isDup) {
    console.log(`  ℹ️  Duplicate low-hold skipped: ${pair.game}`);
    return null;
  }

  const trade = {
    id: `LH-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type: 'lowhold',
    timestamp: new Date().toISOString(),
    status: 'open',

    sport: pair.sport,
    game: pair.game,
    commenceTime: pair.commenceTime,

    sideA: { ...pair.sideA, wager: pair.recommendedBet },
    sideB: { ...pair.sideB, wager: pair.recommendedBet },

    combinedHold: pair.combinedHold,
    holdFormatted: pair.holdFormatted,
    isArb: pair.isArb,
    expectedEV: pair.expectedEV,
    totalExposure: pair.totalExposure,
    rating: pair.rating,

    // Settlement fields
    winner: null,
    settledAt: null,
    actualPnL: null,
    notes: pair.isArb ? 'True arbitrage' : `Low-hold pair (${pair.holdFormatted}) — BookMaker.eu rollover`,
  };

  data.trades.push(trade);
  data.stats.totalTrades++;
  data.stats.openTrades++;
  data.stats.totalWagered += pair.totalExposure;

  saveToFile(filePath, data);

  // Deduct Side A wager from rollover (BookMaker.eu is always Side A)
  const rollover = deductRollover(trade.id, pair.recommendedBet);
  const rolloverNote = rollover ? rolloverProgressLine(rollover) : '';

  console.log(`  ✅ Low-hold trade logged: ${trade.id} | ${pair.game} | Hold: ${pair.holdFormatted}${pair.isArb ? ' (ARB)' : ''}`);
  if (rolloverNote) console.log(rolloverNote);
  if (rollover?.cleared) console.log('  🎉 BookMaker.eu rollover CLEARED!');

  return trade;
}

/**
 * Display summary for a specific trade file
 */
function displayFileSummary(filePath, label) {
  const data = loadFromFile(filePath);
  const trades = data.trades || [];
  // Defensively default stats in case file was wiped/reset without stats object
  const stats = data.stats || { totalTrades: 0, openTrades: 0, settledTrades: 0, totalWagered: 0, totalPnL: 0 };
  const { decimalToAmerican } = require('./calculator');

  console.log(`\n📊 ${label} Summary:`);
  console.log(`  Total: ${stats.totalTrades} | Open: ${stats.openTrades} | Settled: ${stats.settledTrades}`);
  console.log(`  Wagered: $${(stats.totalWagered || 0).toFixed(2)} | P&L: $${(stats.totalPnL || 0).toFixed(2)}`);

  const today = new Date().toDateString();
  const todayExp = trades
    .filter(t => new Date(t.timestamp).toDateString() === today && t.status !== 'cancelled')
    .reduce((sum, t) => sum + (t.wager || t.totalExposure || 0), 0);
  console.log(`  Today's exposure: $${todayExp.toFixed(2)} / $${config.maxDailyExposure}`);

  // Rollover progress (low-hold mode only)
  if (filePath === config.lowholdTradesFile && config.rolloverTotal) {
    const rollover = loadRollover();
    console.log(rolloverProgressLine(rollover));
  }

  const recent = trades.slice(-5).reverse();
  if (recent.length) {
    console.log('\n  Recent trades:');
    recent.forEach(t => {
      const pnl = t.status === 'settled' ? `P&L: $${t.actualPnL}` : `exp. EV: ${t.evPct || '$' + t.expectedEV}`;
      if (t.type === 'lowhold') {
        console.log(`  [${t.id}] ${t.sport} | ${t.game} | ${t.sideA?.americanOdds}/${t.sideB?.americanOdds} | Hold: ${t.holdFormatted} | ${t.status} | ${pnl}`);
      } else {
        console.log(`  [${t.id}] ${t.sport || t.league} | ${t.game} | ${t.betSide} @ ${decimalToAmerican(t.decimalOdds || t.kalshiOdds)} (${t.bookmaker || 'N/A'}) | EV: ${t.evPct || 'N/A'} | ${t.status} | ${pnl}`);
      }
    });
  }
}

// ─── Kalshi Demo Order Integration ───────────────────────────────────────────

/**
 * Update a saved EV+ paper trade with the result of a Kalshi demo order.
 * Patches the trade in ev-trades.json by ID.
 */
function updateTradeWithDemoOrder(tradeId, demoResult) {
  const data  = loadTrades();
  const trade = data.trades.find(t => t.id === tradeId);
  if (!trade) return;

  trade.kalshiDemo = demoResult;
  saveTrades(data);
}

/**
 * Update a saved low-hold paper trade with the result of the Kalshi Side B order.
 * Patches the trade in lowhold-trades.json by ID.
 */
function updateLowholdTradeWithKalshiOrder(tradeId, kalshiOrderResult) {
  const filePath = config.lowholdTradesFile;
  const data = loadFromFile(filePath);
  const trade = data.trades.find(t => t.id === tradeId);
  if (!trade) return;

  trade.kalshiSideBOrder = kalshiOrderResult;
  saveToFile(filePath, data);
}

/**
 * Place a Kalshi demo order for an EV+ opportunity.
 * Gracefully handles missing tickers, auth failures, market-not-found, etc.
 *
 * @param {Object} opp          — EV+ opportunity object (from engine.js/filterValueBets)
 * @param {Object} kalshiClient — KalshiClient instance (demo)
 * @returns {Object} result — { ok, orderId, status, ticker, yesPrice, error }
 */
async function placeKalshiDemoOrder(opp, kalshiClient) {
  // Determine Kalshi market ticker from href or eventId
  const href   = opp.kalshiHref || opp.href || '';
  let   ticker = extractTickerFromHref(href);

  if (!ticker) {
    // Try building a search ticker from the eventId
    ticker = opp.eventId ? String(opp.eventId) : null;
  }

  if (!ticker) {
    return {
      ok:    false,
      error: 'Could not determine Kalshi ticker (no href/eventId in value-bet)',
      ticker: null,
    };
  }

  // Convert decimal odds to YES price in cents
  const decOdds  = opp.bookmakerOdds || opp.kalshiOdds;
  const yesPrice = oddsToYesPrice(decOdds);

  if (!yesPrice) {
    return {
      ok:     false,
      error:  `Cannot compute yes_price from odds ${decOdds}`,
      ticker,
    };
  }

  // Number of contracts = unit size in dollars (1 contract = $1 face value on Kalshi)
  const count = Math.max(1, Math.floor(config.unitSize));

  const orderParams = {
    ticker,
    action:    'buy',
    side:      'yes',
    type:      'limit',
    count,
    yes_price: yesPrice,
  };

  console.log(`  📤 Kalshi demo order → ticker: ${ticker} | yes_price: ${yesPrice}¢ | count: ${count}`);

  const result = await kalshiClient.placeOrder(orderParams);

  if (result.ok) {
    const order    = result.data?.order || result.data || {};
    const orderId  = order.order_id || order.id || '(unknown)';
    const status   = order.status   || 'submitted';
    console.log(`  ✅ Kalshi demo order placed: ${orderId} | status: ${status}`);
    return { ok: true, orderId, status, ticker, yesPrice, count };
  } else {
    console.log(`  ⚠️  Kalshi demo order failed: ${result.error} (HTTP ${result.status || '?'})`);
    return {
      ok:    false,
      error: result.error,
      status: result.status,
      ticker,
      yesPrice,
      count,
    };
  }
}

module.exports = {
  logTrade, logEVTrade, logLowholdTrade,
  settleTrade, displaySummary, displayFileSummary,
  loadTrades, saveToFile, loadFromFile, getTodayExposure,
  loadRollover, rolloverProgressLine,
  placeKalshiDemoOrder, updateTradeWithDemoOrder, updateLowholdTradeWithKalshiOrder,
};
