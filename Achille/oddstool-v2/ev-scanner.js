/**
 * ev-scanner.js - EV+ Scanner (Primary Signal)
 *
 * Uses /v3/value-bets?bookmaker=Kalshi — the real EV+ endpoint.
 * This is NOT a low-hold finder. It finds bets where Kalshi's odds diverge
 * from market consensus (250+ books), meaning Kalshi has MISPRICED an outcome.
 *
 * Flow:
 *   1. Pull /v3/value-bets?bookmaker=Kalshi
 *   2. Filter: NBA/NFL/NHL + EV ≥ minEV threshold
 *   3. Validate against sharp books (BookMaker.eu + Betfair Exchange)
 *   4. Return standardized EV+ opportunity objects
 *
 * expectedValue encoding from odds-api.io:
 *   The API returns (trueProbability × bookmakerOdds × 100).
 *   Values > 100 = positive EV. 103 = 3% EV. 110 = 10% EV.
 *   To get EV%: (expectedValue - 100)
 */

const fetch = require('node-fetch');
const config = require('./config');

// Sport/league filters for NBA, NFL, NHL
// The API returns human-readable sport names (not slugs)
const TARGET_SPORTS = ['basketball', 'ice hockey', 'american football'];
const TARGET_LEAGUES = ['nba', 'nfl', 'nhl'];

// Sharp books available on our plan (best proxies for true probability)
const SHARP_BOOKS = ['BookMaker.eu', 'Betfair Exchange'];

/**
 * Detect if a value bet is for a target sport/league
 */
function isTargetSport(vb) {
  const sport = (vb.event?.sport || '').toLowerCase();
  const league = (vb.event?.league || '').toLowerCase();
  return (
    TARGET_SPORTS.some(s => sport.includes(s)) ||
    TARGET_LEAGUES.some(l => league.includes(l))
  );
}

/**
 * Get EV as a human-readable percentage
 * API returns prob * odds * 100, so >100 = positive EV
 */
function evPercent(expectedValue) {
  // Handle both API encoding styles (0.0523 vs 106.68)
  if (expectedValue > 10) {
    return expectedValue - 100; // e.g. 106.68 → 6.68%
  }
  return expectedValue * 100; // e.g. 0.0523 → 5.23%
}

/**
 * Determine if a value bet meets our EV threshold
 */
function meetsEvThreshold(vb, minEvPct) {
  return evPercent(vb.expectedValue) >= minEvPct;
}

/**
 * Fetch all Kalshi value bets from the API
 */
async function fetchValueBets() {
  const url = `https://api.odds-api.io/v3/value-bets?bookmaker=Kalshi&apiKey=${encodeURIComponent(config.oddsApiIoKey)}&includeEventDetails=true`;
  console.log('  🌐 Fetching Kalshi value bets...');

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      console.error(`  ❌ value-bets HTTP ${res.status}: ${text.substring(0, 200)}`);
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error('  ❌ Unexpected value-bets response format:', JSON.stringify(data).substring(0, 200));
      return [];
    }
    console.log(`  ✅ Got ${data.length} value bet(s) from Kalshi`);
    return data;
  } catch (e) {
    console.error(`  ❌ value-bets fetch error: ${e.message}`);
    return [];
  }
}

/**
 * Fetch sharp book odds for an event (BookMaker.eu + Betfair Exchange)
 * Returns { [bookName]: { home, away, draw } } or null on failure
 */
async function fetchSharpOdds(eventId) {
  const books = SHARP_BOOKS.join(',');
  const url = `https://api.odds-api.io/v3/odds/multi?apiKey=${encodeURIComponent(config.oddsApiIoKey)}&eventIds=${eventId}&bookmakers=${encodeURIComponent(books)}&mkt=h2h`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const event = data[0];
    if (!event?.bookmakers) return null;

    const sharpLines = {};
    Object.entries(event.bookmakers).forEach(([bookName, markets]) => {
      if (!Array.isArray(markets)) return;
      const ml = markets.find(m => {
        const n = String(m.name || m.key || '').toLowerCase();
        return n === 'h2h' || n === 'ml' || n === 'moneyline';
      });
      if (!ml?.odds?.[0]) return;
      const o = ml.odds[0];
      sharpLines[bookName] = {
        home: parseFloat(o.home) || null,
        away: parseFloat(o.away) || null,
        draw: parseFloat(o.draw) || null
      };
    });

    return Object.keys(sharpLines).length > 0 ? sharpLines : null;
  } catch (e) {
    return null; // Sharp validation optional — don't hard-fail
  }
}

/**
 * Check if sharp books confirm the EV+ signal.
 * Confirmation = sharp books' implied prob for the bet side
 * is ≥ market consensus implied prob (i.e., sharps think it's at least as likely).
 *
 * Kalshi being mispriced means Kalshi offers HIGHER odds than consensus.
 * Sharp confirmation = sharps agree the outcome is MORE likely than Kalshi implies.
 * Technically: sharpOdds for betSide ≤ bookmakerOdds (sharps have tighter/shorter price).
 */
function checkSharpConfirmation(vb, sharpLines) {
  if (!sharpLines || Object.keys(sharpLines).length === 0) {
    return { confirmed: false, reason: 'No sharp data available', sharpLines: {} };
  }

  const betSide = vb.betSide; // 'home', 'away', 'draw'
  const kalshiOdds = parseFloat(vb.bookmakerOdds?.[betSide]);
  if (!kalshiOdds) {
    return { confirmed: false, reason: 'Cannot parse Kalshi odds for bet side', sharpLines };
  }

  let confirmCount = 0;
  let checkCount = 0;
  const sharpSummary = {};

  Object.entries(sharpLines).forEach(([bookName, odds]) => {
    const sharpOdds = odds[betSide];
    if (!sharpOdds) return;

    checkCount++;
    const sharpImplied = (1 / sharpOdds * 100).toFixed(1) + '%';
    const kalshiImplied = (1 / kalshiOdds * 100).toFixed(1) + '%';

    // Sharp confirms if their odds are shorter (tighter) = they think outcome is more likely
    // OR within 10% of Kalshi (ambiguous market = still lean toward taking the value)
    const confirmed = sharpOdds <= kalshiOdds * 1.10; // sharp within 10% of Kalshi = directional confirmation
    if (confirmed) confirmCount++;

    sharpSummary[bookName] = {
      odds: sharpOdds,
      impliedProb: sharpImplied,
      kalshiOdds,
      kalshiImplied,
      confirms: confirmed
    };
  });

  const confirmed = checkCount > 0 && confirmCount > 0;
  const reason = confirmed
    ? `${confirmCount}/${checkCount} sharp book(s) confirm`
    : checkCount > 0
    ? `${confirmCount}/${checkCount} sharp book(s) confirm — sharps disagree`
    : 'No overlapping book data';

  return { confirmed, reason, sharpLines: sharpSummary };
}

/**
 * Convert decimal odds to American format for display
 */
function decimalToAmerican(decimal) {
  const d = parseFloat(decimal);
  if (!d || d <= 1) return 'N/A';
  if (d >= 2) return `+${Math.round((d - 1) * 100)}`;
  return `${Math.round(-100 / (d - 1))}`;
}

/**
 * Main EV+ scan:
 * 1. Fetch value bets from Kalshi
 * 2. Filter by sport and EV threshold
 * 3. Validate with sharp books
 * 4. Return standardized opportunities
 */
async function scanValueBets(opts = {}) {
  const minEvPct = opts.minEvPct ?? (config.minEvPct || 3);
  const targetSportsOnly = opts.targetSportsOnly ?? true;

  const rawBets = await fetchValueBets();
  if (rawBets.length === 0) return [];

  // Filter by sport first
  let bets = targetSportsOnly ? rawBets.filter(isTargetSport) : rawBets;

  if (targetSportsOnly && bets.length === 0) {
    console.log('  ℹ️  No Kalshi EV+ bets for NBA/NFL/NHL today.');
    // No fallback — only NBA/NFL/NHL Kalshi bets are actionable
  }

  // Filter to PRE-GAME only — no live/in-play markets
  const now = Date.now();
  const preFilter = bets.length;
  bets = bets.filter(vb => {
    const eventDate = vb.event?.date;
    if (!eventDate) return true; // keep if no date (can't determine)
    const commence = new Date(eventDate).getTime();
    return commence > now; // only games that haven't started yet
  });
  if (bets.length < preFilter) {
    console.log(`  ⏰ Filtered out ${preFilter - bets.length} live/in-play game(s) — pre-game only.`);
  }

  // Filter by EV threshold
  const qualifying = bets.filter(vb => meetsEvThreshold(vb, minEvPct));

  // Filter by probability floor — skip extreme longshots
  const MIN_PROB = 0.25; // 25% floor
  const probFiltered = qualifying.filter(vb => {
    const marketOdds = parseFloat(vb.market?.[vb.betSide]);
    if (!marketOdds) return true; // keep if can't determine
    const impliedProb = 1 / marketOdds;
    if (impliedProb < MIN_PROB) {
      console.log(`  ⛔ Skipping ${vb.event?.home || '?'} vs ${vb.event?.away || '?'} — ${vb.betSide} implied prob ${(impliedProb * 100).toFixed(1)}% < 25% floor`);
      return false;
    }
    return true;
  });

  console.log(`  📊 ${probFiltered.length} qualifying bet(s) with EV ≥ ${minEvPct}% and prob ≥ 25% (from ${bets.length} total)`);

  if (probFiltered.length === 0) return [];

  // Validate each with sharp books (logged for analysis, NOT a gate)
  const opportunities = [];
  for (const vb of probFiltered) {
    const ev = evPercent(vb.expectedValue);
    const event = vb.event || {};
    const betSide = vb.betSide;
    const kalshiOdds = parseFloat(vb.bookmakerOdds?.[betSide]);
    const marketConsensusOdds = parseFloat(vb.market?.[betSide]);
    const trueProbPct = marketConsensusOdds ? (1 / marketConsensusOdds * 100).toFixed(1) : '?';
    const betTeam = betSide === 'home' ? event.home : betSide === 'away' ? event.away : 'Draw';

    // Fetch sharp validation
    let sharpConfirmation = { confirmed: false, reason: 'Skipped', sharpLines: {} };
    if (vb.eventId) {
      await new Promise(r => setTimeout(r, 200)); // gentle rate limit
      const sharpLines = await fetchSharpOdds(vb.eventId);
      sharpConfirmation = checkSharpConfirmation(vb, sharpLines);
    }

    const opp = {
      type: 'value-bet',
      id: vb.id,
      eventId: vb.eventId,
      game: `${event.away || '?'} @ ${event.home || '?'}`,
      sport: event.sport || 'Unknown',
      league: event.league || 'Unknown',
      commenceTime: event.date || '',

      // The value bet
      betSide,
      betTeam,
      kalshiOdds,
      kalshiOddsAmerican: decimalToAmerican(kalshiOdds),
      kalshiHref: vb.bookmakerOdds?.href || '',

      // Market consensus (true probability)
      marketConsensusOdds,
      trueProbPct: trueProbPct + '%',

      // EV
      evPct: ev.toFixed(2) + '%',
      evRaw: ev,
      expectedValueRaw: vb.expectedValue,

      // Sharp confirmation
      sharpConfirmed: sharpConfirmation.confirmed,
      sharpReason: sharpConfirmation.reason,
      sharpLines: sharpConfirmation.sharpLines,

      // Paper trade sizing
      recommendedBet: config.unitSize,
      totalExposure: config.unitSize,
      expectedEV: ((ev / 100) * config.unitSize).toFixed(2),

      // Market info
      marketName: vb.market?.name || 'ML',
      marketOdds: vb.market,
      updatedAt: vb.expectedValueUpdatedAt,

      // Rating — sharp confirmation is INFORMATIONAL ONLY (not a trade gate)
      // We log it to analyze later whether sharp-confirmed trades perform better
      rating: '🟢 EV+ QUALIFYING',
      sharpNote: sharpConfirmation.confirmed ? 'Sharps agree' : 'Sharps disagree (logged for analysis)'
    };

    opportunities.push(opp);
  }

  // Sort by EV descending (best first)
  opportunities.sort((a, b) => b.evRaw - a.evRaw);
  return opportunities;
}

/**
 * Fetch arbitrage bets between BookMaker.eu and Kalshi (secondary scan)
 */
async function scanArbitrage() {
  const url = `https://api.odds-api.io/v3/arbitrage-bets?bookmakers=${encodeURIComponent('BookMaker.eu,Kalshi')}&apiKey=${encodeURIComponent(config.oddsApiIoKey)}`;
  console.log('  🌐 Fetching arbitrage bets (BookMaker.eu ↔ Kalshi)...');

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      console.error(`  ❌ arbitrage-bets HTTP ${res.status}: ${text.substring(0, 200)}`);
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error('  ❌ Unexpected arb response:', JSON.stringify(data).substring(0, 200));
      return [];
    }
    console.log(`  ✅ Got ${data.length} arbitrage opportunity(s)`);
    return data.map(arb => ({
      type: 'arbitrage',
      ...arb,
      recommendedBet: config.unitSize,
      totalExposure: config.unitSize * 2,
      rating: '🔵 ARB'
    }));
  } catch (e) {
    console.error(`  ❌ arbitrage-bets fetch error: ${e.message}`);
    return [];
  }
}

module.exports = { scanValueBets, scanArbitrage, evPercent, isTargetSport, decimalToAmerican };
