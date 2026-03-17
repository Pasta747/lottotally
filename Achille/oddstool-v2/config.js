/**
 * config.js - OddsTool V2 Configuration
 *
 * CRITICAL CONSTRAINT: All bets MUST be placed on Kalshi.
 * FanDuel, DraftKings, BetOnline, etc. are NOT actionable.
 * For EV+: query value-bets with ?bookmaker=Kalshi ONLY.
 * For low-hold: BookMaker.eu (Side A, rollover) + Kalshi (Side B) ONLY.
 */
require('dotenv').config({ path: '/root/PastaOS/.env' });

const config = {
  // ── API ───────────────────────────────────────────────────────────────────
  oddsApiIoKey: process.env.ODDS_API_IO_KEY,

  // ── EV+ mode ──────────────────────────────────────────────────────────────
  // KALSHI ONLY — the only exchange where we can place orders.
  // /v3/value-bets uses 250+ books to calculate consensus true probability,
  // so we get sharp EV estimates without querying other books ourselves.
  bookmakers: ['Kalshi'],

  // Sharp reference books used ONLY for odds validation (never for placing bets)
  sharpReferenceBooks: ['Pinnacle', 'BookMaker.eu', 'Circa'],

  // Books used for arb scan (Kalshi vs BookMaker.eu — the two we actively use)
  arbBooks: ['Kalshi', 'BookMaker.eu'],

  // Minimum EV to flag (0.03 = 3%)
  // API returns expectedValue as (trueProb × bookmakerOdds × 100):
  //   100 = break-even, 103 = +3% EV → normalized to 0.03
  minEV: parseFloat(process.env.MIN_EV || '0.03'),

  // ── Low-hold mode ─────────────────────────────────────────────────────────
  // BookMaker.eu is Side A anchor (Mario has rollover to clear there).
  // Kalshi is Side B — the ONLY other book we can automate.
  // BookMaker.eu + Kalshi pairs ONLY. Not FanDuel. Not BetOnline.
  lowholdAnchor: 'BookMaker.eu',
  lowholdBooks:  ['Kalshi'],

  // Sports to scan for low-hold opportunities (NFL off-season: limited events)
  lowholdSports: ['american-football', 'ice-hockey', 'basketball'],
  lowholdSportLabels: {
    'american-football': 'NFL',
    'ice-hockey':        'NHL',
    'basketball':        'NBA',
  },

  // Max combined hold to flag (0.03 = 3%)
  holdThreshold: parseFloat(process.env.HOLD_THRESHOLD || '0.03'),

  // ── Rollover tracker (BookMaker.eu) ───────────────────────────────────────
  // Starting rollover balance. Each Side A trade ($unitSize) deducts from remaining.
  rolloverTotal:             parseFloat(process.env.BOOKMAKER_ROLLOVER_REMAINING || '350'),
  bookmakeRolloverRemaining: parseFloat(process.env.BOOKMAKER_ROLLOVER_REMAINING || '350'), // compat alias

  // ── Paper trading ─────────────────────────────────────────────────────────
  unitSize:         parseFloat(process.env.UNIT_SIZE   || '0.01'), // 1 contract ($0.01) for demo testing; $5 for live
  maxDailyExposure: parseFloat(process.env.MAX_DAILY   || '200'),  // $ per day cap

  // ── Cache TTLs ────────────────────────────────────────────────────────────
  valueBetsCacheTtl: 5 * 60 * 1000,   // 5 min
  eventsCacheTtl:    5 * 60 * 1000,   // 5 min
  oddsCacheTtl:      45 * 1000,        // 45 sec

  // ── File paths ────────────────────────────────────────────────────────────
  evTradesFile:      '/root/PastaOS/Achille/oddstool-v2/data/ev-trades.json',
  lowholdTradesFile: '/root/PastaOS/Achille/oddstool-v2/data/lowhold-trades.json',
  rolloverStateFile: '/root/PastaOS/Achille/oddstool-v2/data/rollover-state.json',
  rolloverFile:      '/root/PastaOS/Achille/oddstool-v2/data/rollover-state.json', // compat alias for paper-trader.js
  paperTradesFile:   '/root/PastaOS/Achille/oddstool-v2/data/ev-trades.json',  // compat alias
  alertsFile:        '/root/PastaOS/Achille/oddstool-v2/data/alerts.json',

  // ── Alerts ────────────────────────────────────────────────────────────────
  alertMethod: process.env.ALERT_METHOD || 'file',
};

if (!config.oddsApiIoKey) {
  console.error('❌ ODDS_API_IO_KEY not set. Check /root/PastaOS/.env');
  process.exit(1);
}

module.exports = config;
