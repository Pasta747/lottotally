'use strict';

/**
 * MLB Game Model — L2 probability estimator
 *
 * Inputs per market:
 *   - Kalshi MLB market (game winner, spread, total)
 *   - ESPN scoreboard: team records, home/away splits, probable pitchers w/ ERA, live scores
 *
 * Model approach:
 *   1. Parse Kalshi ticker to extract teams, market type, and line value
 *   2. Fetch ESPN MLB scoreboard for matching game data
 *   3. Estimate true probability using:
 *      a. Team win rate differential → baseline probability (log5 method)
 *      b. Home field advantage adjustment (+3.5% historical MLB average)
 *      c. Starting pitcher ERA differential → pitching edge signal
 *      d. Run line cover rates by spread magnitude (historical calibration)
 *      e. Live game adjustment (score, inning, outs)
 *   4. Compare to Kalshi ask price → edge = estimatedProb - marketPrice
 *
 * Data sources:
 *   - ESPN public API (no key needed) — scoreboard, team records, probable pitchers
 *   - Kalshi market data (already in scanner)
 *
 * Key MLB betting insights:
 *   - Home teams win ~54% historically (stronger than NBA/NHL home advantage)
 *   - Starting pitching is the #1 predictive factor for individual games
 *   - Run line (-1.5): favorites cover ~58% when winning, ~38% overall
 *   - Totals: public tends to bet overs, creating value on unders
 *   - Spring training records are noise — use prior season + pitcher ERA
 */

const fetch = (...args) => import('node-fetch').then(m => m.default(...args));

const ESPN_MLB = 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb';

// ─── ESPN Data Layer ──────────────────────────────────────────────────────────

let _espnCache = null;
let _espnCacheTs = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

async function fetchESPNScoreboard() {
  const now = Date.now();
  if (_espnCache && now - _espnCacheTs < CACHE_TTL) return _espnCache;

  try {
    const res = await fetch(`${ESPN_MLB}/scoreboard`);
    if (!res.ok) return _espnCache || [];
    const d = await res.json();
    _espnCache = d?.events || [];
    _espnCacheTs = now;
    return _espnCache;
  } catch (_) {
    return _espnCache || [];
  }
}

// ─── Kalshi Ticker Parsing ────────────────────────────────────────────────────

/**
 * Parse Kalshi MLB tickers:
 *   KXMLBGAME-26MAR262210CLESEA-SEA     → { type: 'game', teams: ['CLE','SEA'], target: 'SEA' }
 *   KXMLBSPREAD-26MAR262210CLESEA-SEA2  → { type: 'spread', teams: ['CLE','SEA'], target: 'SEA', spread: 2 }
 *   KXMLBTOTAL-26MAR262210CLESEA-9      → { type: 'total', teams: ['CLE','SEA'], line: 9 }
 */
function parseMLBTicker(ticker, title) {
  ticker = (ticker || '').toUpperCase();
  title = title || '';

  // Game winner: KXMLBGAME-{date}{TEAM1}{TEAM2}-{WINNER}
  const gameMatch = ticker.match(/^KXMLBGAME-\d+\w*?([A-Z]{2,4})([A-Z]{2,4})-([A-Z]{2,4})$/);
  if (gameMatch) {
    return {
      type: 'game',
      team1: gameMatch[1],
      team2: gameMatch[2],
      target: gameMatch[3],
    };
  }

  // Spread: KXMLBSPREAD-{date}{TEAM1}{TEAM2}-{TEAM}{SPREAD}
  const spreadMatch = ticker.match(/^KXMLBSPREAD-\d+\w*?([A-Z]{2,4})([A-Z]{2,4})-([A-Z]{2,4})(\d+(?:\.\d+)?)$/);
  if (spreadMatch) {
    return {
      type: 'spread',
      team1: spreadMatch[1],
      team2: spreadMatch[2],
      target: spreadMatch[3],
      spread: parseFloat(spreadMatch[4]),
    };
  }

  // Total: KXMLBTOTAL-{date}{TEAM1}{TEAM2}-{LINE}
  const totalMatch = ticker.match(/^KXMLBTOTAL-\d+\w*?([A-Z]{2,4})([A-Z]{2,4})-(\d+(?:\.\d+)?)$/);
  if (totalMatch) {
    return {
      type: 'total',
      team1: totalMatch[1],
      team2: totalMatch[2],
      line: parseFloat(totalMatch[3]),
    };
  }

  // Title fallback for games: "Cleveland vs Seattle Winner?"
  const titleGame = title.match(/(.+?)\s+vs\s+(.+?)\s+Winner/i);
  if (titleGame) {
    return { type: 'game', teamName1: titleGame[1].trim(), teamName2: titleGame[2].trim() };
  }

  // Title fallback for spread: "Seattle wins by over 3.5 runs?"
  const titleSpread = title.match(/(.+?)\s+wins by\s+(over|under)\s+([\d.]+)\s*runs/i);
  if (titleSpread) {
    return {
      type: 'spread',
      targetName: titleSpread[1].trim(),
      direction: titleSpread[2].toLowerCase(),
      spread: parseFloat(titleSpread[3]),
    };
  }

  // Title fallback for total: "Total Runs?"
  const titleTotal = title.match(/Total Runs.*?(\d+(?:\.\d+)?)/i);
  if (titleTotal) {
    return { type: 'total', line: parseFloat(titleTotal[1]) };
  }

  return null;
}

// ─── ESPN Game Matching ───────────────────────────────────────────────────────

/**
 * Match a parsed Kalshi ticker to an ESPN game event.
 * Returns { game, homeTeam, awayTeam } or null.
 */
function matchESPNGame(parsed, events) {
  if (!parsed || !events?.length) return null;

  for (const event of events) {
    const comps = event.competitions?.[0]?.competitors || [];
    if (comps.length < 2) continue;

    const abbrs = comps.map(c => (c.team?.abbreviation || '').toUpperCase());

    // Match by ticker abbreviations
    const teams = [parsed.team1, parsed.team2, parsed.target].filter(Boolean);
    const matchCount = teams.filter(t => abbrs.includes(t)).length;

    if (matchCount >= 2 || (matchCount >= 1 && teams.length === 1)) {
      const home = comps.find(c => c.homeAway === 'home');
      const away = comps.find(c => c.homeAway === 'away');
      return { event, home, away, comps };
    }

    // Match by team name (title fallback)
    if (parsed.teamName1 || parsed.teamName2) {
      const names = comps.map(c => (c.team?.displayName || '').toLowerCase());
      const search = [parsed.teamName1, parsed.teamName2, parsed.targetName].filter(Boolean).map(n => n.toLowerCase());
      if (search.some(s => names.some(n => n.includes(s)))) {
        const home = comps.find(c => c.homeAway === 'home');
        const away = comps.find(c => c.homeAway === 'away');
        return { event, home, away, comps };
      }
    }
  }
  return null;
}

// ─── Probability Models ───────────────────────────────────────────────────────

/**
 * Extract win percentage from ESPN record string.
 * Format: "10-17-2" → wins=10, losses=17, ties=2 → .370
 * Also handles season records without ties: "85-77" → .525
 */
function parseWinPct(recordStr) {
  if (!recordStr) return 0.5;
  const parts = recordStr.split('-').map(Number);
  const wins = parts[0] || 0;
  const losses = parts[1] || 0;
  const total = wins + losses;
  if (total < 5) return 0.5; // not enough data, use neutral
  return wins / total;
}

/**
 * Extract pitcher ERA from ESPN probablePitcher data.
 * Returns ERA as float, or null if unavailable.
 */
function extractPitcherERA(competitor) {
  const probables = competitor?.probablePitcher || competitor?.probables || [];
  const pitcher = Array.isArray(probables) ? probables[0] : probables;
  if (!pitcher) return null;

  const stats = pitcher.statistics || [];
  const eraEntry = stats.find(s => s.abbreviation === 'ERA');
  if (!eraEntry) return null;

  const era = parseFloat(eraEntry.displayValue);
  return Number.isFinite(era) ? era : null;
}

/**
 * Extract pitcher name for logging/attribution.
 */
function extractPitcherName(competitor) {
  const probables = competitor?.probablePitcher || competitor?.probables || [];
  const pitcher = Array.isArray(probables) ? probables[0] : probables;
  return pitcher?.athlete?.shortName || pitcher?.athlete?.fullName || null;
}

/**
 * Log5 method — the standard for head-to-head baseball probability.
 *
 * Given team A win% (pA) and team B win% (pB):
 *   P(A beats B) = (pA - pA*pB) / (pA + pB - 2*pA*pB)
 *
 * This is superior to simple record comparison because it accounts
 * for strength of opposition implicitly through win rates.
 */
function log5(pA, pB) {
  if (pA <= 0 || pB <= 0) return 0.5;
  if (pA >= 1 || pB >= 1) return 0.5;
  return (pA - pA * pB) / (pA + pB - 2 * pA * pB);
}

// Historical MLB home field advantage: ~54% win rate = +3.5% edge
const HOME_ADVANTAGE = 0.035;

/**
 * ERA differential adjustment.
 *
 * MLB average ERA is ~4.00. Each full ERA point below average
 * adds ~2-3% to team win probability. Capped at ±8%.
 *
 * Calibration source: historical correlation of starter ERA
 * differentials to game outcomes (FanGraphs research).
 */
function eraAdjustment(homeERA, awayERA) {
  if (homeERA == null || awayERA == null) return 0;
  const leagueAvg = 4.00;
  // Normalize: lower ERA = better pitcher
  const homeEdge = (leagueAvg - homeERA) * 0.025;
  const awayEdge = (leagueAvg - awayERA) * 0.025;
  // Net adjustment for home team
  const adj = homeEdge - awayEdge;
  return Math.max(-0.08, Math.min(0.08, adj));
}

/**
 * Game winner probability model.
 *
 * Combines:
 *   1. Log5 from team win percentages (strongest signal)
 *   2. Home field advantage (+3.5%)
 *   3. Starting pitcher ERA differential (±8% max)
 *   4. Live game adjustment if in progress
 */
function estimateGameWinProb(parsed, match) {
  if (!match) return null;

  const { home, away, event } = match;
  const homeAbbr = (home?.team?.abbreviation || '').toUpperCase();
  const awayAbbr = (away?.team?.abbreviation || '').toUpperCase();

  // Get overall win percentages
  const homeRecord = home?.records?.find(r => r.type === 'total')?.summary;
  const awayRecord = away?.records?.find(r => r.type === 'total')?.summary;
  const homePct = parseWinPct(homeRecord);
  const awayPct = parseWinPct(awayRecord);

  // Log5 baseline
  let homeWinProb = log5(homePct, awayPct);

  // Home field advantage
  homeWinProb += HOME_ADVANTAGE;

  // Pitcher ERA adjustment
  const homeERA = extractPitcherERA(home);
  const awayERA = extractPitcherERA(away);
  homeWinProb += eraAdjustment(homeERA, awayERA);

  // Live game adjustment
  const gameState = event?.status?.type?.state;
  if (gameState === 'in') {
    const homeScore = parseInt(home?.score || 0);
    const awayScore = parseInt(away?.score || 0);
    const inning = event?.status?.period || 1;
    const scoreDiff = homeScore - awayScore;

    // Baseball win probability by inning and run differential
    // Source: historical WPA tables (retrosheet)
    // Rough approximation:
    //   Each run lead ≈ +10% in early innings, +15% in late innings
    //   By 7th+ inning, 3-run lead ≈ 90%+ probability
    const inningFactor = inning <= 3 ? 0.08 : inning <= 6 ? 0.10 : 0.15;
    const liveAdj = scoreDiff * inningFactor;
    homeWinProb += liveAdj;
  }

  // Clamp
  homeWinProb = Math.max(0.05, Math.min(0.95, homeWinProb));

  // Determine which team the market targets
  const target = parsed.target || parsed.targetName;
  const isTargetHome = target && (
    target.toUpperCase() === homeAbbr ||
    (home?.team?.displayName || '').toLowerCase().includes((target || '').toLowerCase())
  );

  const targetWinProb = isTargetHome ? homeWinProb : (1 - homeWinProb);

  return {
    prob: targetWinProb,
    homeWinProb,
    homeTeam: homeAbbr,
    awayTeam: awayAbbr,
    homePct,
    awayPct,
    homeERA,
    awayERA,
    homePitcher: extractPitcherName(home),
    awayPitcher: extractPitcherName(away),
    isTargetHome,
    gameState: gameState || 'pre',
  };
}

/**
 * Run line (spread) cover probability.
 *
 * MLB run lines are typically -1.5 (favorite must win by 2+).
 *
 * Historical cover rates (source: Sports Insights / Action Network):
 *   Spread 1.5 (standard): favorite covers ~56% when moneyline > 60%
 *   Spread 2.5: covers ~35-40%
 *   Spread 3.5+: covers ~20-25% (rare blowout territory)
 *
 * Model: start with moneyline probability, then discount based on
 * how many extra runs must be covered.
 */
function estimateSpreadProb(parsed, match) {
  const gameResult = estimateGameWinProb(parsed, match);
  if (!gameResult) return null;

  const baseWinProb = gameResult.prob;
  const spread = parsed.spread || 1.5;

  // Each half-run of spread reduces cover probability
  // Standard -1.5: if you're 60% to win, ~52% to cover 1.5
  // Empirical discount per 0.5 runs of spread
  let spreadDiscount;
  if (spread <= 1.5) {
    spreadDiscount = 0.12; // standard run line discount
  } else if (spread <= 2.5) {
    spreadDiscount = 0.22;
  } else if (spread <= 3.5) {
    spreadDiscount = 0.30;
  } else {
    spreadDiscount = 0.35 + (spread - 3.5) * 0.05;
  }

  let coverProb = baseWinProb - spreadDiscount;

  // Live adjustment — if already leading by more than spread, boost
  if (match?.event?.status?.type?.state === 'in') {
    const { home, away, event } = match;
    const homeScore = parseInt(home?.score || 0);
    const awayScore = parseInt(away?.score || 0);
    const currentMargin = gameResult.isTargetHome
      ? homeScore - awayScore
      : awayScore - homeScore;
    const inning = event?.status?.period || 1;

    if (currentMargin >= spread + 1) {
      // Already covering comfortably
      coverProb = Math.min(0.90, coverProb + 0.25);
    } else if (currentMargin <= -(spread + 2) && inning >= 7) {
      // Losing badly in late innings
      coverProb = Math.max(0.05, coverProb - 0.30);
    }
  }

  return {
    prob: Math.max(0.03, Math.min(0.92, coverProb)),
    spread,
    baseWinProb,
    ...gameResult,
  };
}

/**
 * Total runs (over/under) probability.
 *
 * Factors:
 *   1. Combined team run scoring rates (from ESPN stats)
 *   2. Pitcher ERA average (lower = fewer runs expected)
 *   3. Historical over/under distribution:
 *      - MLB average: ~8.5 runs/game
 *      - Public bias: overs are ~53% of bets but hit ~48% → value on unders
 *
 * Model: estimate expected total runs, then compute probability
 * of exceeding the line using Poisson-like distribution.
 */
function estimateTotalProb(parsed, match) {
  if (!match) return null;

  const { home, away, event } = match;
  const line = parsed.line;
  if (!line) return null;

  // Estimate expected runs per team
  const homeERA = extractPitcherERA(home);
  const awayERA = extractPitcherERA(away);
  const leagueAvgRunsPerTeam = 4.25; // ~8.5 total per game

  // If we have pitcher ERA, use it to adjust expected runs
  // Lower ERA pitcher → opponent scores fewer runs
  let homeExpectedRuns = leagueAvgRunsPerTeam;
  let awayExpectedRuns = leagueAvgRunsPerTeam;

  if (awayERA != null) {
    // Away pitcher faces home team — their ERA predicts home team's runs
    homeExpectedRuns = leagueAvgRunsPerTeam * (awayERA / 4.00);
  }
  if (homeERA != null) {
    // Home pitcher faces away team
    awayExpectedRuns = leagueAvgRunsPerTeam * (homeERA / 4.00);
  }

  let expectedTotal = homeExpectedRuns + awayExpectedRuns;

  // Home field: slight run environment boost (home teams score ~0.1 more)
  expectedTotal += 0.1;

  // Live game adjustment
  const gameState = event?.status?.type?.state;
  if (gameState === 'in') {
    const homeScore = parseInt(home?.score || 0);
    const awayScore = parseInt(away?.score || 0);
    const currentTotal = homeScore + awayScore;
    const inning = event?.status?.period || 1;
    const inningsLeft = Math.max(0, 9 - inning);
    const runsPerInning = expectedTotal / 9;
    expectedTotal = currentTotal + (runsPerInning * inningsLeft);
  }

  // Estimate probability of going OVER the line
  // Using normal approximation (MLB run totals have std dev ~3.2)
  const stdDev = 3.2;
  const z = (line - expectedTotal) / stdDev;

  // Standard normal CDF approximation
  // P(total > line) = 1 - Φ(z)
  const phi = normalCDF(z);
  let overProb = 1 - phi;

  // Public bias correction: slight value on unders
  // Public bets overs ~53% but overs hit ~48% historically
  overProb -= 0.015;

  return {
    prob: Math.max(0.05, Math.min(0.95, overProb)),
    line,
    expectedTotal: Math.round(expectedTotal * 10) / 10,
    homeExpectedRuns: Math.round(homeExpectedRuns * 10) / 10,
    awayExpectedRuns: Math.round(awayExpectedRuns * 10) / 10,
    homeERA,
    awayERA,
    homePitcher: extractPitcherName(home),
    awayPitcher: extractPitcherName(away),
    gameState: gameState || 'pre',
  };
}

/**
 * Standard normal CDF approximation (Abramowitz & Stegun).
 * Accurate to ~1.5×10⁻⁷.
 */
function normalCDF(x) {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Primary entry point — called by scanner-kalshi-native.js
 * Returns { prob, ...details } or null if no match.
 */
async function estimateMLBProbForMarket(market) {
  const ticker = market.ticker || '';
  const title = market.title || '';

  const parsed = parseMLBTicker(ticker, title);
  if (!parsed) return null;

  const events = await fetchESPNScoreboard();
  const match = matchESPNGame(parsed, events);

  // If no ESPN match found, return null (scanner will use heuristic fallback)
  if (!match) return null;

  switch (parsed.type) {
    case 'game':
      return estimateGameWinProb(parsed, match);
    case 'spread':
      return estimateSpreadProb(parsed, match);
    case 'total':
      return estimateTotalProb(parsed, match);
    default:
      return null;
  }
}

module.exports = {
  estimateMLBProbForMarket,
  parseMLBTicker,
  fetchESPNScoreboard,
  // Exported for testing
  log5,
  eraAdjustment,
  normalCDF,
};
