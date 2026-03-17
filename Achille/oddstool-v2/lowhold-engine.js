/**
 * lowhold-engine.js - Low-Hold Cross-Book Scanner
 *
 * Finds tight cross-book pairs where BookMaker.eu is Side A (anchor for rollover).
 * Combined hold = (1/oddsA + 1/oddsB) - 1
 * Qualifies if combined hold < holdThreshold (default 3%).
 *
 * Flow:
 *   1. Fetch BookMaker.eu value bets → extract active event IDs
 *   2. For each event, fetch full odds from BookMaker.eu + Kalshi + BetOnline.ag
 *   3. For each market, compute all (BookMaker.eu sideA, OtherBook sideB) pairs
 *   4. Return pairs below threshold, sorted by hold ascending (tightest first)
 */
const fetch = require('node-fetch');
const config = require('./config');

// ─── Cache (shared TTL with engine) ──────────────────────────────────────────
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

// ─── Hold math ────────────────────────────────────────────────────────────────
/**
 * Combined hold for a two-leg cross-book bet.
 * oddsA = decimal odds at BookMaker.eu (Side A)
 * oddsB = decimal odds at other book (Side B)
 * Returns hold as decimal: 0.02 = 2%
 */
function calcHold(oddsA, oddsB) {
  if (!oddsA || !oddsB || oddsA <= 1 || oddsB <= 1) return Infinity;
  return (1 / oddsA + 1 / oddsB) - 1;
}

/**
 * Convert decimal odds to American display string
 */
function decimalToAmerican(dec) {
  if (!dec || dec <= 1) return 'N/A';
  if (dec >= 2) return `+${Math.round((dec - 1) * 100)}`;
  return `${Math.round(-100 / (dec - 1))}`;
}

// ─── Fetch event odds from /v3/odds endpoint ──────────────────────────────────
/**
 * Fetch full odds for an event from BookMaker.eu + Side B books.
 * API: GET /v3/odds?apiKey=...&eventId={id}&bookmakers=BookMaker.eu,Kalshi,BetOnline.ag
 *
 * Returns normalized structure:
 * {
 *   eventId, home, away, sport, league,
 *   books: {
 *     'BookMaker.eu': { h2h: { home: 2.1, away: 1.75 }, spreads: {...}, totals: {...} },
 *     'Kalshi':       { h2h: { home: 2.0, away: 1.85 } },
 *     ...
 *   }
 * }
 */
async function fetchEventOdds(eventId, eventMeta) {
  const cacheKey = `lh:odds:${eventId}`;
  const cached = getCached(cacheKey, config.oddsCacheTtl);
  if (cached) return cached;

  const books = [config.lowholdAnchor, ...config.lowholdBooks].join(',');
  const url = `https://api.odds-api.io/v3/odds?apiKey=${encodeURIComponent(config.oddsApiIoKey)}&eventId=${encodeURIComponent(eventId)}&bookmakers=${encodeURIComponent(books)}`;

  const raw = await apiFetch(url, `lh-odds/${eventId}`);
  if (!raw) return null;

  // Parse flexible API response format
  const result = parseOddsResponse(raw, eventId, eventMeta);
  if (result) setCached(cacheKey, result);
  return result;
}

/**
 * Parse the /v3/odds API response into our normalized structure.
 * Handles multiple possible response shapes from odds-api.io.
 */
function parseOddsResponse(raw, eventId, eventMeta) {
  // Shape A: array of events (like odds-api.com)
  const event = Array.isArray(raw) ? raw[0] : raw;
  if (!event) return null;

  // Extract event metadata
  const home  = event.home_team  || event.home  || event.homeTeam  || eventMeta?.home  || 'Home';
  const away  = event.away_team  || event.away  || event.awayTeam  || eventMeta?.away  || 'Away';
  const sport = event.sport_key  || event.sport || eventMeta?.sport || '';
  const league= event.league     || eventMeta?.league || '';

  const books = {};

  // Shape A: event.bookmakers[] array
  const bookList = event.bookmakers || event.books || [];
  for (const bm of bookList) {
    const bmName = bm.title || bm.name || bm.key || '';
    if (!bmName) continue;
    books[bmName] = {};

    const markets = bm.markets || [];
    for (const mkt of markets) {
      const mktKey = mkt.key || mkt.name || '';
      const outcomes = mkt.outcomes || [];

      if (mktKey === 'h2h' || mktKey === 'moneyline' || /h2h|moneyline/i.test(mktKey)) {
        const parsed = {};
        for (const o of outcomes) {
          const name = (o.name || '').toLowerCase();
          const price = parseFloat(o.price || o.odds || o.decimal || 0);
          if (!price) continue;
          if (name === home.toLowerCase() || name === 'home' || name === '1') {
            parsed.home = price;
          } else if (name === away.toLowerCase() || name === 'away' || name === '2') {
            parsed.away = price;
          } else if (name === 'draw' || name === 'x') {
            parsed.draw = price;
          }
        }
        if (Object.keys(parsed).length) books[bmName].h2h = parsed;
      }

      if (mktKey === 'spreads' || /spread|handicap/i.test(mktKey)) {
        const parsed = {};
        for (const o of outcomes) {
          const name = (o.name || '').toLowerCase();
          const price = parseFloat(o.price || o.odds || 0);
          const point = parseFloat(o.point || o.handicap || 0);
          if (!price) continue;
          if (name === home.toLowerCase() || name === 'home') parsed.home = { price, point };
          else if (name === away.toLowerCase() || name === 'away') parsed.away = { price, point };
        }
        if (Object.keys(parsed).length) books[bmName].spreads = parsed;
      }

      if (mktKey === 'totals' || /total|over.under/i.test(mktKey)) {
        const parsed = {};
        for (const o of outcomes) {
          const name = (o.name || '').toLowerCase();
          const price = parseFloat(o.price || o.odds || 0);
          const point = parseFloat(o.point || o.total || 0);
          if (!price) continue;
          if (name === 'over') parsed.over = { price, point };
          else if (name === 'under') parsed.under = { price, point };
        }
        if (Object.keys(parsed).length) books[bmName].totals = parsed;
      }
    }
  }

  // Shape B: flat per-bookmaker fields (e.g. event.BookMaker?.h2h = {...})
  if (Object.keys(books).length === 0 && event.odds) {
    // Some APIs nest under event.odds[bookmakerName]
    for (const [bmName, bmData] of Object.entries(event.odds || {})) {
      books[bmName] = {};
      if (bmData.h2h || bmData.moneyline) {
        books[bmName].h2h = bmData.h2h || bmData.moneyline;
      }
    }
  }

  return { eventId, home, away, sport, league, books };
}

// ─── Find low-hold pairs for one event ────────────────────────────────────────
/**
 * Given normalized odds data for an event, find all qualifying low-hold pairs.
 * BookMaker.eu is always Side A.
 *
 * Returns array of pair objects:
 * {
 *   eventId, home, away, sport, league,
 *   marketKey, sideA, sideB,
 *   bookA: 'BookMaker.eu', bookB: 'Kalshi',
 *   oddsA, oddsB,       // decimal
 *   americanA, americanB,
 *   hold, holdPct,
 *   wager: config.unitSize
 * }
 */
function findLowholdPairs(oddsData) {
  const pairs = [];
  const { eventId, home, away, sport, league, books } = oddsData;

  const bmOdds = books[config.lowholdAnchor];
  if (!bmOdds) return pairs; // BookMaker.eu not in response

  for (const sideBookName of config.lowholdBooks) {
    const sbOdds = books[sideBookName];
    if (!sbOdds) continue;

    // ── Moneyline ────────────────────────────────────────────────────────────
    if (bmOdds.h2h && sbOdds.h2h) {
      // BookMaker.eu home  vs  SideBook away
      checkPair(pairs, {
        eventId, home, away, sport, league,
        marketKey: 'h2h',
        sideA: 'home', sideB: 'away',
        bookA: config.lowholdAnchor, bookB: sideBookName,
        oddsA: bmOdds.h2h.home,
        oddsB: sbOdds.h2h.away,
      });
      // BookMaker.eu away  vs  SideBook home
      checkPair(pairs, {
        eventId, home, away, sport, league,
        marketKey: 'h2h',
        sideA: 'away', sideB: 'home',
        bookA: config.lowholdAnchor, bookB: sideBookName,
        oddsA: bmOdds.h2h.away,
        oddsB: sbOdds.h2h.home,
      });
    }

    // ── Totals ───────────────────────────────────────────────────────────────
    if (bmOdds.totals && sbOdds.totals) {
      const bmO = bmOdds.totals.over;
      const bmU = bmOdds.totals.under;
      const sbO = sbOdds.totals.over;
      const sbU = sbOdds.totals.under;

      // Same total line only
      if (bmO && sbU && bmO.point === sbU.point) {
        checkPair(pairs, {
          eventId, home, away, sport, league,
          marketKey: `totals-${bmO.point}`,
          sideA: 'over', sideB: 'under',
          bookA: config.lowholdAnchor, bookB: sideBookName,
          oddsA: bmO.price, oddsB: sbU.price,
        });
      }
      if (bmU && sbO && bmU.point === sbO.point) {
        checkPair(pairs, {
          eventId, home, away, sport, league,
          marketKey: `totals-${bmU.point}`,
          sideA: 'under', sideB: 'over',
          bookA: config.lowholdAnchor, bookB: sideBookName,
          oddsA: bmU.price, oddsB: sbO.price,
        });
      }
    }
  }

  return pairs;
}

function checkPair(pairs, p) {
  const hold = calcHold(p.oddsA, p.oddsB);
  if (!isFinite(hold) || hold >= config.holdThreshold) return;
  pairs.push({
    ...p,
    hold,
    holdPct: (hold * 100).toFixed(2) + '%',
    americanA: decimalToAmerican(p.oddsA),
    americanB: decimalToAmerican(p.oddsB),
    wager: config.unitSize,
    timestamp: new Date().toISOString(),
  });
}

// ─── Event discovery via /v3/events (per sport) ──────────────────────────────
/**
 * Fetch upcoming event IDs for a sport where BookMaker.eu has coverage.
 * Uses /v3/events endpoint (NOT value-bets — BookMaker.eu rarely has value bets,
 * that's precisely why we're doing rollover there).
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
    return t > now && t <= next48h; // PRE-GAME ONLY — no live/in-play
  });

  const ids = upcoming.map(e => ({
    id: e.id,
    home: e.home_team || e.home,
    away: e.away_team || e.away,
    sport,
    league: typeof e.league === 'string' ? e.league : (e.league?.name || e.league?.key || ''),
  })).filter(e => e.id);
  const label = config.lowholdSportLabels?.[sport] || sport;
  console.log(`  ✅ ${ids.length} upcoming ${label} events with ${config.lowholdAnchor} coverage`);
  setCached(cacheKey, ids);
  return ids;
}

// ─── Fetch odds for a batch using /v3/odds/multi ──────────────────────────────
/**
 * Fetch cross-book odds for a batch of events using the faster /v3/odds/multi endpoint.
 * More reliable and faster than per-event fetches.
 */
async function fetchBatchOdds(eventMetas) {
  if (!eventMetas.length) return [];

  const ids = eventMetas.map(e => e.id);
  const books = [config.lowholdAnchor, ...config.lowholdBooks].join(',');

  const cacheKey = `lh:batch:${ids.slice().sort().join(',')}`;
  const cached = getCached(cacheKey, config.oddsCacheTtl);
  if (cached) return cached;

  const batchSize = 10;
  const allOdds = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const url = `https://api.odds-api.io/v3/odds/multi?apiKey=${encodeURIComponent(config.oddsApiIoKey)}&eventIds=${batch.join(',')}&bookmakers=${encodeURIComponent(books)}&mkt=h2h`;
    const data = await apiFetch(url, `lh-batch-odds`);
    if (!data || !Array.isArray(data)) continue;
    allOdds.push(...data);
    if (i + batchSize < ids.length) await new Promise(r => setTimeout(r, 300));
  }

  // Normalize each event into our oddsData shape
  const results = allOdds.map(event => {
    const meta = eventMetas.find(m => m.id === event.id) || {};
    const home = event.home_team || event.home || meta.home || 'Home';
    const away = event.away_team || event.away || meta.away || 'Away';
    const books = {};

    if (event.bookmakers && typeof event.bookmakers === 'object' && !Array.isArray(event.bookmakers)) {
      Object.entries(event.bookmakers).forEach(([bookName, markets]) => {
        if (!Array.isArray(markets)) return;
        const ml = markets.find(m => /h2h|moneyline|ml/i.test(String(m.name || m.key || '')));
        if (!ml?.odds?.[0]) return;
        const o = ml.odds[0];
        const homeOdds = parseFloat(o.home);
        const awayOdds = parseFloat(o.away);
        if (homeOdds > 1 && awayOdds > 1) {
          books[bookName] = { h2h: { home: homeOdds, away: awayOdds } };
        }
      });
    }

    return { eventId: event.id, home, away, sport: meta.sport || '', league: meta.league || '', books };
  }).filter(e => Object.keys(e.books).length >= 2);

  setCached(cacheKey, results);
  return results;
}

// ─── Main low-hold scan ───────────────────────────────────────────────────────
/**
 * Full low-hold scan:
 * 1. Discover upcoming events per sport from /v3/events (BookMaker.eu anchor)
 * 2. Batch-fetch cross-book odds via /v3/odds/multi
 * 3. Find qualifying low-hold pairs
 * Returns sorted array of pairs (tightest hold first)
 */
async function scanLowhold() {
  const sports = config.lowholdSports || ['american-football', 'ice-hockey', 'basketball'];
  let allEventMetas = [];

  for (const sport of sports) {
    const metas = await fetchEventIds(sport);
    allEventMetas.push(...metas.slice(0, 50)); // cap per sport
  }

  if (allEventMetas.length === 0) {
    console.log(`  ⚠️  No upcoming events found for ${config.lowholdAnchor} — try again when lines are posted`);
    return [];
  }

  console.log(`\n  Fetching cross-book odds for ${allEventMetas.length} events...`);
  const oddsData = await fetchBatchOdds(allEventMetas);
  console.log(`  Got odds data for ${oddsData.length} events`);

  const allPairs = [];
  for (const odds of oddsData) {
    const pairs = findLowholdPairs(odds);
    allPairs.push(...pairs);
  }

  console.log(`  Found ${allPairs.length} qualifying pair(s) below ${(config.holdThreshold * 100).toFixed(0)}% hold`);

  // Sort tightest hold first (arb first, then lowest hold)
  allPairs.sort((a, b) => a.hold - b.hold);
  return allPairs;
}

module.exports = { scanLowhold, calcHold, decimalToAmerican, findLowholdPairs };
