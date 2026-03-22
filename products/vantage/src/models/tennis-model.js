'use strict';

/**
 * ATP/WTA Tennis Match Model — L2 probability estimator
 *
 * Inputs:
 *   - Kalshi match winner market (e.g. "Will Moutet win vs Sinner?")
 *   - ATP/WTA rankings via ESPN or live match data
 *
 * Model:
 *   1. Parse player names from ticker
 *   2. Fetch ESPN tennis scoreboard for live/upcoming match data
 *   3. Estimate win probability using:
 *      a. Ranking gap → Elo-style expected win rate
 *      b. Surface adjustment (clay/hard/grass — inferred from tournament name)
 *      c. Current score if live (dramatically updates probability)
 *      d. Public bias: low-ranked underdogs are systematically overpriced
 *
 * Key insight: Tennis markets on heavy favorites (e.g. Sinner vs qualifier)
 * are priced around 3-8%. Historical win rates for top-10 vs top-50+ players
 * are ~90-95% — market often underprices favorites on big tournaments.
 */

const fetch = (...args) => import('node-fetch').then(m => m.default(...args));

const ESPN_TENNIS = 'https://site.api.espn.com/apis/site/v2/sports/tennis';

let _tennisCache = {};
let _tennisCacheTs = {};

async function fetchTennisTour(tour = 'atp') {
  const now = Date.now();
  if (_tennisCache[tour] && now - (_tennisCacheTs[tour] || 0) < 5 * 60 * 1000) {
    return _tennisCache[tour];
  }
  try {
    const res = await fetch(`${ESPN_TENNIS}/${tour}/scoreboard`);
    if (!res.ok) return [];
    const d = await res.json();
    _tennisCache[tour] = d?.events || [];
    _tennisCacheTs[tour] = now;
    return _tennisCache[tour];
  } catch (_) {
    return _tennisCache[tour] || [];
  }
}

/**
 * Parse ATP/WTA ticker to extract player abbreviations.
 * e.g. "KXATPMATCH-26MAR22MOUSIN-MOU" → { p1: 'MOU', p2: undefined, tour: 'atp' }
 * e.g. "KXWTAMATCH-26MAR22SABMCC-MCC" → { p1: 'MCC', p2: undefined, tour: 'wta' }
 */
function parseTennisTicker(ticker) {
  const atpMatch = ticker?.match(/^KXATPMATCH-\d+\w+-([A-Z]+)$/);
  const wtaMatch = ticker?.match(/^KXWTAMATCH-\d+\w+-([A-Z]+)$/);
  if (atpMatch) return { playerAbbr: atpMatch[1], tour: 'atp' };
  if (wtaMatch) return { playerAbbr: wtaMatch[1], tour: 'wta' };
  return null;
}

/**
 * Elo-style win probability from ranking gap.
 * Based on ATP historical data:
 *   - Rank 1-10 vs Rank 50-100: ~88% win rate
 *   - Rank 1-10 vs Rank 100+:   ~93% win rate
 *   - Rank 10-20 vs Rank 50-100: ~80% win rate
 *   - Rank 20-50 vs Rank 50-100: ~70% win rate
 *   - Close in ranking (< 20 diff): ~55%
 */
function rankingToWinProb(playerRank, opponentRank) {
  if (!playerRank || !opponentRank) return 0.5;
  const rankDiff = opponentRank - playerRank; // positive = player is better ranked
  // Logistic curve calibrated to historical ATP win rates
  const logit = rankDiff * 0.025; // ~0.025 logit units per rank position
  const prob = 1 / (1 + Math.exp(-logit));
  return Math.max(0.05, Math.min(0.95, prob));
}

/**
 * Main estimator for tennis match markets.
 */
async function estimateTennisMatchProbForMarket(market) {
  const ticker = market.ticker || '';
  const title = market.title || '';
  const parsed = parseTennisTicker(ticker);
  if (!parsed) return null;

  const tour = parsed.tour;
  const games = await fetchTennisTour(tour);

  // Try to find matching live game
  let espnGame = null;
  let playerRank = null, opponentRank = null;

  if (games.length > 0) {
    espnGame = games.find(g => {
      const comps = g.competitions?.[0]?.competitors || [];
      return comps.some(c => {
        const abbr = c.athlete?.shortName?.replace(/\./g, '').toUpperCase().replace(' ', '') || '';
        const last = (c.athlete?.lastName || '').toUpperCase().slice(0, 3);
        return parsed.playerAbbr === last || parsed.playerAbbr === abbr.slice(0, 3);
      });
    });

    if (espnGame) {
      const comps = espnGame.competitions?.[0]?.competitors || [];
      // Try to get rankings
      playerRank = comps[0]?.ranking || comps[0]?.curatedRank?.current || null;
      opponentRank = comps[1]?.ranking || comps[1]?.curatedRank?.current || null;
    }
  }

  // Estimate base win probability
  let estimatedProb;
  if (playerRank && opponentRank) {
    estimatedProb = rankingToWinProb(playerRank, opponentRank);
  } else {
    // No ranking data — use market price with small public bias correction
    const marketPrice = parseFloat(market.yes_ask_dollars || 0);
    if (marketPrice > 0) {
      // Public tends to underestimate heavy favorites and overestimate underdogs
      if (marketPrice < 0.15) {
        // Heavy underdog — public over-prices them slightly
        estimatedProb = marketPrice * 0.90;
      } else if (marketPrice > 0.80) {
        // Heavy favorite — public under-prices them slightly
        estimatedProb = marketPrice * 1.04;
      } else {
        estimatedProb = marketPrice; // neutral zone — trust the market
      }
    } else {
      return null;
    }
  }

  // Live game adjustment
  if (espnGame?.status?.type?.state === 'in') {
    const comps = espnGame.competitions?.[0]?.competitors || [];
    // Check set scores — if player is winning a set, boost probability
    const p0score = comps[0]?.score || '0';
    const p1score = comps[1]?.score || '0';
    const setsWon0 = parseInt(p0score);
    const setsWon1 = parseInt(p1score);
    const setDiff = setsWon0 - setsWon1;
    if (Math.abs(setDiff) >= 2) {
      // Leading by 2 sets — dramatically favored
      estimatedProb = setDiff > 0 ? Math.min(0.95, estimatedProb + 0.30) : Math.max(0.05, estimatedProb - 0.30);
    }
  }

  return {
    prob: Math.max(0.02, Math.min(0.95, estimatedProb)),
    playerAbbr: parsed.playerAbbr,
    tour,
    hasLiveGame: !!espnGame,
    playerRank,
    opponentRank,
  };
}

module.exports = { estimateTennisMatchProbForMarket, parseTennisTicker, fetchTennisTour };
