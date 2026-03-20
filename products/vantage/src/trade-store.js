const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'data', 'users');

function ensureUserFiles(userId) {
  const dir = path.join(ROOT, userId);
  fs.mkdirSync(dir, { recursive: true });
  const trades = path.join(dir, 'trades.json');
  const signals = path.join(dir, 'signals.jsonl');
  if (!fs.existsSync(trades)) fs.writeFileSync(trades, '[]\n');
  if (!fs.existsSync(signals)) fs.writeFileSync(signals, '');
  return { dir, trades, signals };
}

function logSignal(userId, signal) {
  const { signals } = ensureUserFiles(userId);
  fs.appendFileSync(signals, `${JSON.stringify(signal)}\n`);
}

function logTrade(userId, trade) {
  const { trades } = ensureUserFiles(userId);
  const arr = JSON.parse(fs.readFileSync(trades, 'utf8'));
  arr.push({ ...trade, timestamp: new Date().toISOString() });
  fs.writeFileSync(trades, `${JSON.stringify(arr, null, 2)}\n`);
}

function readTrades(userId) {
  const { trades } = ensureUserFiles(userId);
  return JSON.parse(fs.readFileSync(trades, 'utf8'));
}

module.exports = { ensureUserFiles, logSignal, logTrade, readTrades };
