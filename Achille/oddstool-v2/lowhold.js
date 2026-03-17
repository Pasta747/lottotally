/**
 * lowhold.js - Cross-Book Low-Hold Finder
 *
 * Finds pairs where BookMaker.eu (Side A, anchor) + another book (Side B)
 * have a combined hold below the threshold — useful for clearing rollovers.
 *
 * This is NOT an EV+ engine. Low hold ≠ positive EV.
 * But when combined hold is negative, it becomes true arbitrage.
 *
 * Flow:
 *   1. Fetch upcoming events for each sport from /v3/events
 *   2. Fetch odds for those events from /v3/odds/multi (BookMaker.eu + Side B books)
 *   3. For each game, test all cross-book combinations
 *   4. Return pairs where combinedHold < holdThreshold
 */

const fetch = require('node-fetch');
const config = require('./config');

const _cache = {};
function getCached(key, ttl) {
  const e = _cache[key];
  if (e && Date.now() - e.ts < ttl) return e.data;
  return null;
}
function setCached(key, data) { _cache[key] = { ts: Date.now(), data }; }

async function apiFetch(url, label) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      console.error(`  ❌ ${label} HTTP ${res.status}: ${text.substring(0, 200)}`);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error(`  ❌ ${label} error: ${e.message}`);
    return null;
  }
}

/**
 * Convert decimal odds to American for display
 */
function decimalToAmerican(dec) {
  const d = parseFloat(dec);
  if (!d || d <= 1) return 'N/A';
  if (d >= 2) return `+${Math.round((d - 1) * 100)}`;
  return `${Math.round(-100 / (d - 1))}`;
}

/**
 * Normalize bookmaker name to a simple lowercase key for matching
 */
function normKey(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Fetch upcoming event IDs for a sport (anchored to BookMaker.eu)
 */
async function fetchEventIds(sport) {
  const cacheKey = `lh:events:${sport}`;
  const cached = getCached(cacheKey, config.eventsCacheTtl);
  if (cached) return cached;

  const url = `https://api.odds-api.io/v3/events?apiKey=${encodeURIComponent(config.oddsApiIoKey)}&sport=${encodeURIComponent(sport)}&bookmaker=${encodeURIComponent(config.lowholdAnchor)}&limit=100`;
  const data = await apiFetch(url, `events/${sport}`);
  if (!data || !Array.isArray(data)) return [];

  const now = Date.now();
  const next48h = now + 48 * 60 * 60 * 1000;
  const upcoming = data.filter(e => {
    const t = new Date(e.commence_time || e.date).getTime();
    return t >= now - 3 * 60 * 60 * 1000 && t <= next48h;
  });

  const ids = upcoming.map(e => e.id).filter(Boolean);
  console.log(`  ✅ ${ids.length} upcoming events for ${config.lowholdSportLabels[sport] || sport}`);
  setCached(cacheKey, ids);
  return ids;
}

/**
 * Fetch odds for a batch of event IDs across BookMaker.eu + Side B books
 * Returns normalized game objects: { id, gameName, homeTeam, awayTeam, sport, sportLabel, commenceTime, bookmakers: { [key]: { name, home, away } } }
 */
async function fetchOddsForEvents(eventIds, sport) {
  if (!eventIds.length) return [];

  const cacheKey = `lh:odds:${sport}:${eventIds.slice().sort().join(',')}`;
  const cached = getCached(cacheKey, config.oddsCacheTtl);
  if (cached) return cached;

  const allBooks = [config.lowholdAnchor, ...config.lowholdBooks].join(',');
  const batchSize = 10;
  const allGames = [];

  for (let i = 0; i < eventIds.length; i += batchSize) {
    const batch = eventIds.slice(i, i + batchSize);
    const url = `https://api.odds-api.io/v3/odds/multi?apiKey=${encodeURIComponent(config.oddsApiIoKey)}&eventIds=${batch.join(',')}&bookmakers=${encodeURIComponent(allBooks)}&mkt=h2h`;

    const data = await apiFetch(url, `odds/multi/${sport}`);
    if (!data || !Array.isArray(data)) continue;

    data.forEach(event => {
      const homeTeam = event.home_team || event.home;
      const awayTeam = event.away_team || event.away;
      if (!homeTeam || !awayTeam) return;

      const bookmakerOdds = {};

      if (event.bookmakers && typeof event.bookmakers === 'object' && !Array.isArray(event.bookmakers)) {
        Object.entries(event.bookmakers).forEach(([bookName, markets]) => {
          if (!Array.isArray(markets)) return;
          const ml = markets.find(m => {
            const n = String(m.name || m.key || '').toLowerCase();
            return n === 'h2h' || n === 'ml' || n === 'moneyline';
          });
          if (!ml?.odds?.[0]) return;
          const o = ml.odds[0];
          const home = parseFloat(o.home);
          const away = parseFloat(o.away);
          if (!home || !away || home <= 1 || away <= 1) return;
          bookmakerOdds[normKey(bookName)] = { name: bookName, home, away };
        });
      }

      if (Object.keys(bookmakerOdds).length >= 2) {
        allGames.push({
          id: event.id,
          gameName: `${awayTeam} @ ${homeTeam}`,
          homeTeam,
          awayTeam,
          sport,
          sportLabel: config.lowholdSportLabels[sport] || sport,
          commenceTime: event.commence_time || event.date || '',
          bookmakers: bookmakerOdds,
        });
      }
    });

    if (i + batchSize < eventIds.length) await new Promise(r => setTimeout(r, 400));
  }

  setCached(cacheKey, allGames);
  return allGames;
}

/**
 * Calculate cross-book hold for one side pairing:
 * impliedProb(sideA) + impliedProb(sideB) - 1
 * Negative = true arbitrage. Below threshold = low hold.
 */
function calcCrossHold(oddsA, oddsB) {
  return (1 / oddsA) + (1 / oddsB) - 1;
}

/**
 * Analyze a single game for low-hold pairs (BookMaker.eu as anchor)
 */
function analyzePairs(game) {
  const books = game.bookmakers;
  const anchorKey = normKey(config.lowholdAnchor);
  const anchor = books[anchorKey];
  if (!anchor) return []; // Need anchor book

  const pairs = [];

  config.lowholdBooks.forEach(sideBName => {
    const sideBKey = normKey(sideBName);
    const sideB = books[sideBKey];
    if (!sideB) return;

    // Test both directions:
    // 1. Anchor HOME + SideB AWAY
    // 2. Anchor AWAY + SideB HOME
    const combos = [
      {
        sideA: { book: anchor.name, team: game.homeTeam, odds: anchor.home, side: 'home' },
        sideB: { book: sideB.name,  team: game.awayTeam, odds: sideB.away,  side: 'away' },
      },
      {
        sideA: { book: anchor.name, team: game.awayTeam, odds: anchor.away, side: 'away' },
        sideB: { book: sideB.name,  team: game.homeTeam, odds: sideB.home,  side: 'home' },
      },
    ];

    combos.forEach(({ sideA, sideB: sb }) => {
      if (!sideA.odds || !sb.odds) return;

      const hold = calcCrossHold(sideA.odds, sb.odds);
      if (hold >= config.holdThreshold) return; // Not interesting

      const holdPct = hold * 100;
      const isArb = hold < 0;
      // EV from the hold: -hold × unitSize (negative hold = positive EV)
      const expectedEV = parseFloat((-hold * config.unitSize).toFixed(2));

      pairs.push({
        type: 'lowhold',
        game: game.gameName,
        sport: game.sportLabel,
        commenceTime: game.commenceTime,

        sideA: {
          book: sideA.book,
          team: sideA.team,
          side: sideA.side,
          decimalOdds: sideA.odds,
          americanOdds: decimalToAmerican(sideA.odds),
          impliedProb: (1 / sideA.odds * 100).toFixed(1) + '%',
        },
        sideB: {
          book: sb.book,
          team: sb.team,
          side: sb.side,
          decimalOdds: sb.odds,
          americanOdds: decimalToAmerican(sb.odds),
          impliedProb: (1 / sb.odds * 100).toFixed(1) + '%',
        },

        combinedHold: holdPct,
        holdFormatted: holdPct.toFixed(2) + '%',
        isArb,
        expectedEV,
        recommendedBet: config.unitSize,
        totalExposure: config.unitSize * 2,
        rating: isArb ? '🔵 ARB' : '🟡 Low Hold',
      });
    });
  });

  pairs.sort((a, b) => a.combinedHold - b.combinedHold);
  return pairs;
}

/**
 * Main low-hold scan across all target sports
 */
async function scanLowhold() {
  const allPairs = [];

  for (const sport of config.lowholdSports) {
    const label = config.lowholdSportLabels[sport] || sport;
    console.log(`\n📊 Low-hold scan: ${label}...`);

    const eventIds = await fetchEventIds(sport);
    if (!eventIds.length) {
      console.log(`  ℹ️  No upcoming ${label} events with BookMaker.eu odds`);
      continue;
    }

    const games = await fetchOddsForEvents(eventIds.slice(0, 50), sport);
    if (!games.length) {
      console.log(`  ⚠️  No games with multi-book odds`);
      continue;
    }

    let sportPairs = 0;
    games.forEach(game => {
      const pairs = analyzePairs(game);
      allPairs.push(...pairs);
      sportPairs += pairs.length;
    });

    console.log(`  ✅ ${games.length} games checked, ${sportPairs} low-hold pair(s) found`);
  }

  allPairs.sort((a, b) => a.combinedHold - b.combinedHold);
  return allPairs;
}

/**
 * Display a low-hold opportunity
 */
function displayPair(pair) {
  const gameTime = pair.commenceTime
    ? new Date(pair.commenceTime).toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
      })
    : 'TBD';

  console.log(`\n${pair.rating} | ${pair.sport}: ${pair.game}`);
  console.log(`   📅 ${gameTime}`);
  console.log(`   Side A: ${pair.sideA.team} @ ${pair.sideA.americanOdds} (${pair.sideA.book}) — implied ${pair.sideA.impliedProb}`);
  console.log(`   Side B: ${pair.sideB.team} @ ${pair.sideB.americanOdds} (${pair.sideB.book}) — implied ${pair.sideB.impliedProb}`);
  console.log(`   Combined hold: ${pair.holdFormatted}${pair.isArb ? ' ← TRUE ARB' : ''}`);
  console.log(`   Unit: $${pair.recommendedBet}/side ($${pair.totalExposure} total) | EV: $${pair.expectedEV}`);
  console.log(`   ⚠️  Low-hold pair — BookMaker.eu rollover helper`);
}

module.exports = { scanLowhold, displayPair, decimalToAmerican };
