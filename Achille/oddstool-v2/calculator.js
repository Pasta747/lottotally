/**
 * calculator.js - EV+ Filter & Ranker
 * The API does the hard math. We filter, rank, and format.
 */
const config = require('./config');

/**
 * Filter value bets to target sports + minimum EV threshold
 */
function filterValueBets(bets) {
  return bets
    .filter(b => {
      // Must be a target sport (NBA/NHL/NFL)
      if (!b.sportLabel) return false;
      // Must clear EV threshold
      if (b.ev < config.minEV) return false;
      // Accept all markets: ML, Spread, Totals, Player Props
      // EV+ can occur in any market — we want all of them
      return true;
    })
    .sort((a, b) => b.ev - a.ev); // Highest EV first
}

/**
 * Format decimal odds to American display
 */
function decimalToAmerican(dec) {
  if (!dec || dec <= 1) return 'N/A';
  if (dec >= 2) return `+${Math.round((dec - 1) * 100)}`;
  return `${Math.round(-100 / (dec - 1))}`;
}

/**
 * Display a summary of raw value bets (before filtering)
 * Groups by sport to show what the API found
 */
function displayRawSummary(bets) {
  if (bets.length === 0) {
    console.log('  (none)');
    return;
  }
  const bySport = {};
  bets.forEach(b => {
    const key = b.sportLabel || `${b.sport} / ${b.league}`;
    if (!bySport[key]) bySport[key] = [];
    bySport[key].push(b);
  });
  Object.entries(bySport).forEach(([sport, sportBets]) => {
    console.log(`  ${sport}: ${sportBets.length} bet(s)`);
    sportBets.slice(0, 3).forEach(b => {
      console.log(`    ${b.game} | ${b.market} ${b.betSide} @ ${decimalToAmerican(b.bookmakerOdds)} (${b.bookmaker}) | EV: ${b.evPct}`);
    });
  });
}

/**
 * Display a filtered opportunity in full
 */
function displayOpportunity(b) {
  const gameTime = b.commenceTime
    ? new Date(b.commenceTime).toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
      })
    : 'TBD';

  console.log(`\n🟢 EV+ | ${b.sportLabel}: ${b.game}`);
  console.log(`   📅 ${gameTime} | League: ${b.league}`);
  console.log(`   Bet: ${b.betSide.toUpperCase()} @ ${decimalToAmerican(b.bookmakerOdds)} (${b.bookmaker})`);
  console.log(`   Consensus odds: ${decimalToAmerican(b.consensusOdds)} | True prob: ${b.consensusProb}`);
  console.log(`   Expected Value: +${b.evPct} | Unit: $${config.unitSize}`);
  if (b.href) console.log(`   Link: ${b.href}`);
}

/**
 * Format arb bet display
 */
function displayArbBet(arb) {
  if (!arb.event) return;
  console.log(`\n⚡ ARB | ${arb.event.sport}: ${arb.event.away} @ ${arb.event.home}`);
  console.log(`   ${JSON.stringify(arb).substring(0, 200)}`);
}

module.exports = { filterValueBets, displayRawSummary, displayOpportunity, displayArbBet, decimalToAmerican };
