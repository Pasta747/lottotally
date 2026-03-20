#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { loadUsers } = require('./config-loader');
const { readTrades } = require('./trade-store');
const { sendSignalMessage } = require('./notifier');

function todayPrefix() {
  return new Date().toISOString().slice(0, 10);
}

function calcPnl(trades) {
  return trades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
}

function loadTodaySignalCount(userId) {
  const file = path.join(__dirname, '..', 'data', 'users', userId, 'signals.jsonl');
  if (!fs.existsSync(file)) return 0;
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.includes(todayPrefix())).length;
}

async function main() {
  const users = loadUsers();
  for (const user of users) {
    const trades = readTrades(user.userId).filter((t) => String(t.timestamp || '').startsWith(todayPrefix()));
    const signals = loadTodaySignalCount(user.userId);
    const placed = trades.length;
    const pnl = calcPnl(trades);
    const bankroll = Number(user.bankroll || 0) + pnl;

    const msg = `📊 Sharpr Daily Summary\nSignals: ${signals}\nTrades: ${placed}\nP&L: $${pnl.toFixed(2)}\nBankroll: $${bankroll.toFixed(2)}`;
    sendSignalMessage(user, msg);
  }
}

main().catch((err) => {
  console.error('Daily summary failed:', err.message);
  process.exit(1);
});
