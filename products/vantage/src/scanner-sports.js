const { scanValueBets } = require('/root/PastaOS/Plutus/oddstool-v2/engine');
const { filterValueBets } = require('/root/PastaOS/Plutus/oddstool-v2/calculator');

async function scanSportsLayer() {
  const { valueBets } = await scanValueBets();
  const opportunities = filterValueBets(valueBets)
    .filter((o) => /NBA|NFL|NHL|MLB/i.test(o.sportLabel || ''))
    .map((o) => ({
      layer: 1,
      category: 'sports',
      source: 'odds-api',
      ticker: o.marketTicker || null,
      market: o.market,
      game: o.game,
      side: o.betSide,
      signalStrength: Number(String(o.evPct || '0').replace('%', '')) / 100,
      executionPrice: o.bookmakerOdds,
      raw: o,
    }));

  return opportunities;
}

module.exports = { scanSportsLayer };
