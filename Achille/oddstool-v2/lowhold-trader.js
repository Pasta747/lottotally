/**
 * lowhold-trader.js - Low-Hold Paper Trader + Rollover Tracker
 *
 * Manages:
 *   - Paper trade logging to data/lowhold-trades.json
 *   - BookMaker.eu rollover state in data/rollover-state.json
 *   - Deduplication (same pair, same event, within 1 hour)
 *   - Daily exposure cap (shared unitSize × maxDailyExposure)
 */
const fs   = require('fs');
const path = require('path');
const config = require('./config');

// ─── File helpers ────────────────────────────────────────────────────────────
function readJson(filePath, defaultVal) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.error(`  ⚠️  Could not read ${filePath}:`, e.message);
  }
  return defaultVal;
}

function writeJson(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ─── Rollover state ────────────────────────────────────────────────────────────
const ROLLOVER_DEFAULT = {
  remaining: config.bookmakeRolloverRemaining,
  totalCleared: 0,
  lastUpdated: new Date().toISOString(),
};

function loadRolloverState() {
  return readJson(config.rolloverStateFile, { ...ROLLOVER_DEFAULT });
}

function saveRolloverState(state) {
  state.lastUpdated = new Date().toISOString();
  writeJson(config.rolloverStateFile, state);
}

/**
 * Deduct wager from rollover remaining.
 * Returns updated state.
 */
function deductRollover(wager) {
  const state = loadRolloverState();
  state.remaining  = Math.max(0, state.remaining - wager);
  state.totalCleared += wager;
  saveRolloverState(state);
  return state;
}

/**
 * Display rollover status to console.
 */
function displayRolloverStatus() {
  const state = loadRolloverState();
  const pct = state.totalCleared > 0
    ? ((state.totalCleared / config.bookmakeRolloverRemaining) * 100).toFixed(1)
    : '0.0';

  if (state.remaining <= 0) {
    console.log('\n🎉 Rollover cleared!');
    console.log(`   Total cleared: $${state.totalCleared.toFixed(2)} | Started at: $${config.bookmakeRolloverRemaining}`);
  } else {
    console.log(`\n🏦 BookMaker.eu Rollover: $${state.remaining.toFixed(2)} remaining`);
    console.log(`   Cleared so far: $${state.totalCleared.toFixed(2)} (${pct}%) of $${config.bookmakeRolloverRemaining}`);
    const tradesLeft = Math.ceil(state.remaining / config.unitSize);
    console.log(`   ~${tradesLeft} more $${config.unitSize} trades to clear`);
  }
  return state;
}

// ─── Trade logging ────────────────────────────────────────────────────────────
const TRADES_DEFAULT = {
  trades: [],
  stats: { totalTrades: 0, totalWagered: 0, totalRolloverCleared: 0 },
};

function loadTrades() {
  return readJson(config.lowholdTradesFile, { ...TRADES_DEFAULT });
}

function saveTrades(data) {
  writeJson(config.lowholdTradesFile, data);
}

function getTodayExposure(trades) {
  const today = new Date().toDateString();
  return trades
    .filter(t => new Date(t.timestamp).toDateString() === today)
    .reduce((sum, t) => sum + (t.wagerA || 0) + (t.wagerB || 0), 0);
}

/**
 * Dedup: skip if same event+marketKey+sideA+bookB within last hour
 */
function isDuplicate(trades, pair) {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  return trades.some(t =>
    t.eventId   === pair.eventId &&
    t.marketKey === pair.marketKey &&
    t.sideA     === pair.sideA &&
    t.bookB     === pair.bookB &&
    new Date(t.timestamp).getTime() > oneHourAgo
  );
}

/**
 * Log a low-hold paper trade.
 * Deducts from rollover (wagerA = BookMaker.eu side).
 * Returns the trade object, or null if skipped.
 *
 * KALSHI-ONLY POLICY: At least one side must be Kalshi.
 * BookMaker.eu ↔ BetOnline.ag and similar pairs are NEVER logged.
 */
function logLowholdTrade(pair) {
  // ── KALSHI SIDE HARD GATE ────────────────────────────────────────────────
  const bookA = (pair.bookA || '').toLowerCase();
  const bookB = (pair.bookB || '').toLowerCase();
  if (!bookA.includes('kalshi') && !bookB.includes('kalshi')) {
    console.error(`  ⛔ logLowholdTrade BLOCKED: neither side is Kalshi.`);
    console.error(`     Book A: ${pair.bookA} | Book B: ${pair.bookB}`);
    console.error(`     Kalshi ONLY policy — only BookMaker.eu ↔ Kalshi pairs are valid.`);
    return null;
  }

  const data  = loadTrades();

  // Daily exposure check (both legs)
  const todayExp = getTodayExposure(data.trades);
  const legExposure = config.unitSize * 2; // Side A + Side B
  if (todayExp + legExposure > config.maxDailyExposure) {
    console.log(`  ⚠️  Daily exposure limit reached ($${todayExp.toFixed(2)} / $${config.maxDailyExposure}). Skipping.`);
    return null;
  }

  // Dedup
  if (isDuplicate(data.trades, pair)) {
    console.log(`  ℹ️  Duplicate skipped: ${pair.home} @ ${pair.away} | ${pair.marketKey} | ${pair.sideA} @ ${pair.bookA}`);
    return null;
  }

  const trade = {
    id: `LH-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type: 'lowhold',
    timestamp: new Date().toISOString(),

    // Event
    eventId:  pair.eventId,
    home:     pair.home,
    away:     pair.away,
    sport:    pair.sport,
    league:   pair.league,
    game:     `${pair.away} @ ${pair.home}`,

    // Market
    marketKey: pair.marketKey,

    // Side A (BookMaker.eu — rollover anchor)
    bookA:      pair.bookA,
    sideA:      pair.sideA,
    oddsA:      pair.oddsA,
    americanA:  pair.americanA,
    wagerA:     config.unitSize,

    // Side B (opposing book)
    bookB:      pair.bookB,
    sideB:      pair.sideB,
    oddsB:      pair.oddsB,
    americanB:  pair.americanB,
    wagerB:     config.unitSize,

    // Hold analysis
    hold:    pair.hold,
    holdPct: pair.holdPct,

    // Outcome (filled later)
    settledAt: null,
    winner:    null,
    actualPnL: null,
  };

  data.trades.push(trade);
  data.stats.totalTrades++;
  data.stats.totalWagered    += config.unitSize * 2;
  data.stats.totalRolloverCleared += config.unitSize;

  saveTrades(data);

  // Deduct rollover (Side A wager only — BookMaker.eu bet clears rollover)
  const rolloverState = deductRollover(config.unitSize);

  console.log(`  ✅ Low-hold trade logged: ${trade.id} | Hold: ${pair.holdPct}`);
  if (rolloverState.remaining <= 0) {
    console.log('  🎉 Rollover cleared!');
  } else {
    console.log(`  🏦 Rollover remaining: $${rolloverState.remaining.toFixed(2)}`);
  }

  return trade;
}

/**
 * Display low-hold trading summary
 */
function displayLowholdSummary() {
  const data = loadTrades();
  const { stats, trades } = data;

  console.log('\n📊 Low-Hold Trading Summary:');
  console.log(`  Total pairs logged: ${stats.totalTrades}`);
  console.log(`  Total wagered: $${(stats.totalWagered || 0).toFixed(2)}`);
  console.log(`  Total rollover cleared (Side A only): $${(stats.totalRolloverCleared || 0).toFixed(2)}`);

  const recent = trades.slice(-5).reverse();
  if (recent.length) {
    console.log('\n  Recent low-hold trades:');
    recent.forEach(t => {
      console.log(`  [${t.id}] ${t.game} | ${t.marketKey} | ${t.bookA}: ${t.sideA} @ ${t.americanA} vs ${t.bookB}: ${t.sideB} @ ${t.americanB} | Hold: ${t.holdPct}`);
    });
  }
}

module.exports = {
  logLowholdTrade,
  displayLowholdSummary,
  displayRolloverStatus,
  loadRolloverState,
  deductRollover,
};
