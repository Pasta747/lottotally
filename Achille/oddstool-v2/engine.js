/**
 * engine.js - Odds Engine V2
 * Primary signal: odds-api.io /v3/value-bets (API-calculated EV)
 * Secondary: /v3/arbitrage-bets
 * Fallback: /v3/odds cross-book scan
 */
const fetch = require('node-fetch');
const config = require('./config');

// Simple in-memory cache
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

// ─── Sport detection ────────────────────────────────────────────────────────
// odds-api.io uses "Basketball", "Ice Hockey", "American Football" for sport
// and league strings like "USA - NBA", "USA - NHL", "USA - NFL"
const TARGET_SPORT_PATTERNS = [
  { sport: 'Basketball',        leaguePattern: /NBA/i,               label: 'NBA' },
  { sport: 'Ice Hockey',        leaguePattern: /NHL/i,               label: 'NHL' },
  { sport: 'American Football', leaguePattern: /NFL/i,               label: 'NFL' },
];

function detectTargetSport(event) {
  if (!event) return null;
  for (const s of TARGET_SPORT_PATTERNS) {
    if (event.sport === s.sport && s.leaguePattern.test(event.league || '')) return s.label;
  }
  return null;
}

// ─── EV normalization ────────────────────────────────────────────────────────
// API returns expectedValue as (trueProb × bookmakerOdds) × 100
//   100 = break-even, 103 = 3% EV, 138 = 38% EV
// We normalize to plain decimal: 0.03 = 3%, 0.38 = 38%
function normalizeEV(raw) {
  if (raw === null || raw === undefined) return null;
  if (raw > 1) return (raw / 100) - 1; // API's 100-base format
  return raw;                           // Already decimal (docs example format)
}

// ─── Value Bets endpoint ──────────────────────────────────────────────────────
/**
 * Fetch value bets for a specific bookmaker.
 * Returns normalized bets filtered to target sports.
 */
async function fetchValueBets(bookmaker) {
  const cacheKey = `vb:${bookmaker}`;
  const cached = getCached(cacheKey, config.valueBetsCacheTtl);
  if (cached) {
    console.log(`  📦 Value-bets cache hit for ${bookmaker} (${cached.length} bets)`);
    return cached;
  }

  const url = `https://api.odds-api.io/v3/value-bets?apiKey=${encodeURIComponent(config.oddsApiIoKey)}&bookmaker=${encodeURIComponent(bookmaker)}&includeEventDetails=true`;
  console.log(`  🌐 Fetching value-bets for ${bookmaker}...`);

  const data = await apiFetch(url, `value-bets/${bookmaker}`);
  if (!data || !Array.isArray(data)) return [];

  console.log(`  ✅ Got ${data.length} raw value bets (total) for ${bookmaker}`);

  // BUG FIX: The API may return bets from other bookmakers even when bookmaker=Kalshi.
  // Hard-filter to only bets where bet.bookmaker matches the requested bookmaker.
  const filtered = data.filter(bet => {
    if (!bet.bookmaker) return true; // keep if field missing
    return bet.bookmaker.toLowerCase() === bookmaker.toLowerCase();
  });

  if (filtered.length < data.length) {
    console.log(`  🔍 Filtered to ${filtered.length} ${bookmaker}-only bets (dropped ${data.length - filtered.length} from other books)`);
  }

  const bets = filtered
    .map(bet => {
      const sportLabel = detectTargetSport(bet.event);
      const evRaw = bet.expectedValue;
      const ev = normalizeEV(evRaw);

      // Parse bookmaker odds for the bet side
      const sideOdds = bet.bookmakerOdds?.[bet.betSide];
      const marketOdds = bet.market?.[bet.betSide];

      return {
        id: bet.id,
        eventId: bet.eventId,
        bookmaker,
        sportLabel,                        // null if not target sport
        sport: bet.event?.sport,
        league: bet.event?.league,
        game: `${bet.event?.away} @ ${bet.event?.home}`,
        homeTeam: bet.event?.home,
        awayTeam: bet.event?.away,
        commenceTime: bet.event?.date,
        market: bet.market?.name,
        betSide: bet.betSide,              // 'home', 'away', 'over', 'under'
        evRaw,                             // Raw API value (100-based)
        ev,                                // Normalized (0.03 = 3%)
        evPct: ev !== null ? (ev * 100).toFixed(2) + '%' : 'N/A',
        bookmakerOdds: sideOdds ? parseFloat(sideOdds) : null,
        consensusOdds: marketOdds ? parseFloat(marketOdds) : null,
        consensusProb: marketOdds ? (1 / parseFloat(marketOdds) * 100).toFixed(1) + '%' : 'N/A',
        href: bet.bookmakerOdds?.href,
        updatedAt: bet.expectedValueUpdatedAt,
      };
    })
    .filter(b => b.ev !== null);

  setCached(cacheKey, bets);
  return bets;
}

// ─── Arbitrage Bets endpoint ──────────────────────────────────────────────────
async function fetchArbitrageBets(bookmakers) {
  const key = bookmakers.join(',');
  const cacheKey = `arb:${key}`;
  const cached = getCached(cacheKey, config.valueBetsCacheTtl);
  if (cached) {
    console.log(`  📦 Arb cache hit (${cached.length} bets)`);
    return cached;
  }

  const url = `https://api.odds-api.io/v3/arbitrage-bets?apiKey=${encodeURIComponent(config.oddsApiIoKey)}&bookmakers=${encodeURIComponent(key)}&includeEventDetails=true`;
  console.log(`  🌐 Fetching arbitrage-bets for [${key}]...`);

  const data = await apiFetch(url, `arbitrage-bets`);
  if (!data || !Array.isArray(data)) return [];

  console.log(`  ✅ Got ${data.length} arb bets`);
  setCached(cacheKey, data);
  return data;
}

// ─── Sharp odds for validation ────────────────────────────────────────────────
async function fetchSharpOdds(eventId) {
  const cacheKey = `sharp:${eventId}`;
  const cached = getCached(cacheKey, config.oddsCacheTtl);
  if (cached) return cached;

  const sharpBooks = ['Pinnacle', 'BookMaker.eu', 'Circa'].join(',');
  const url = `https://api.odds-api.io/v3/odds/multi?apiKey=${encodeURIComponent(config.oddsApiIoKey)}&eventIds=${eventId}&bookmakers=${encodeURIComponent(sharpBooks)}&region=us&mkt=h2h&oddsFormat=american`;

  const data = await apiFetch(url, `sharp-odds/${eventId}`);
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  setCached(cacheKey, data[0]);
  return data[0];
}

// ─── Main scan ────────────────────────────────────────────────────────────────
async function scanValueBets() {
  const results = {
    valueBets: [],
    arbBets: [],
    scannedBookmakers: config.bookmakers,
  };

  // 1. Value bets — Kalshi ONLY (the only book where we can place orders)
  console.log('\n🎯 Scanning value-bets endpoint (Kalshi only)...');
  const kalshiBets = await fetchValueBets('Kalshi');
  results.valueBets = kalshiBets;

  // 2. Arbitrage bets — Kalshi vs BookMaker.eu (the two actionable books)
  //    Using arbBooks here, NOT bookmakers — arb needs at least 2 distinct books.
  console.log('\n⚡ Scanning arbitrage-bets endpoint (Kalshi vs BookMaker.eu)...');
  const arbBets = await fetchArbitrageBets(config.arbBooks);
  results.arbBets = arbBets;

  return results;
}

module.exports = { scanValueBets, fetchValueBets, fetchArbitrageBets, fetchSharpOdds, normalizeEV, detectTargetSport };
