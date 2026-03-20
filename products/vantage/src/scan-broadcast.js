#!/usr/bin/env node

const path = require('path');
const { loadUsers } = require('./config-loader');
const { sendSignalMessage } = require('./notifier');
const { logSignal, logTrade } = require('./trade-store');
const { calcKellyStake } = require('/root/PastaOS/Plutus/oddstool-v2/kelly');
const { scanValueBets } = require('/root/PastaOS/Plutus/oddstool-v2/engine');
const { filterValueBets } = require('/root/PastaOS/Plutus/oddstool-v2/calculator');

const riskFraction = {
  conservative: 0.1,
  moderate: 0.25,
  aggressive: 0.5,
};

function suggestedStake(user, opp) {
  const p = opp?.consensusOdds ? 1 / Number(opp.consensusOdds) : 0;
  const fraction = riskFraction[user.riskLevel] ?? 0.25;
  const k = calcKellyStake({
    decimalOdds: opp.bookmakerOdds,
    trueProb: p,
    bankroll: Number(user.bankroll || 0),
    fraction,
    maxBet: Math.max(5, Math.round(Number(user.bankroll || 0) * 0.05)),
    minBet: 1,
  });
  return k.stake;
}

async function main() {
  const users = loadUsers();
  if (!users.length) {
    console.log('No user configs found in configs/users/*.json');
    process.exit(0);
  }

  const { valueBets } = await scanValueBets();
  const opportunities = filterValueBets(valueBets).slice(0, 5);

  if (!opportunities.length) {
    console.log('No EV+ opportunities found this cycle.');
    return;
  }

  for (const opp of opportunities) {
    const signalId = `${opp.game}-${opp.market}-${opp.betSide}-${Date.now()}`;

    for (const user of users) {
      const stake = suggestedStake(user, opp);
      const msg = `🎯 Sharpr Signal\n${opp.game}\n${opp.market} — ${opp.betSide}\nEV: ${opp.evPct}\nSuggested: $${stake} (Kelly-sized to your $${user.bankroll})\nReply YES to execute or PASS.`;

      const signalPayload = {
        signalId,
        userId: user.userId,
        game: opp.game,
        market: opp.market,
        side: opp.betSide,
        evPct: opp.evPct,
        odds: opp.bookmakerOdds,
        suggestedStake: stake,
        autoExecute: !!user.autoExecute,
        status: user.autoExecute ? 'AUTO_EXECUTED' : 'PENDING_APPROVAL',
        createdAt: new Date().toISOString(),
      };

      logSignal(user.userId, signalPayload);
      sendSignalMessage(user, msg);

      if (user.autoExecute) {
        logTrade(user.userId, {
          signalId,
          mode: user.kalshiMode || 'paper',
          side: opp.betSide,
          game: opp.game,
          market: opp.market,
          odds: opp.bookmakerOdds,
          stake,
          status: 'EXECUTED',
        });
      }
    }
  }

  console.log(`Broadcast complete. Users=${users.length}, signals=${opportunities.length}`);
}

main().catch((err) => {
  console.error('Sharpr scan failed:', err.message);
  process.exit(1);
});
