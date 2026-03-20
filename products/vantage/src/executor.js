const fs = require('fs');
const path = require('path');
const { KalshiClient } = require('/root/PastaOS/Plutus/oddstool-v2/kalshi-client');

const TRADES_FILE = path.join(__dirname, '..', 'data', 'vantage-trades.json');

function ensure() {
  fs.mkdirSync(path.dirname(TRADES_FILE), { recursive: true });
  if (!fs.existsSync(TRADES_FILE)) fs.writeFileSync(TRADES_FILE, '[]\n');
}

function logTrade(t) {
  ensure();
  const rows = JSON.parse(fs.readFileSync(TRADES_FILE, 'utf8'));
  rows.push({ ...t, loggedAt: new Date().toISOString() });
  fs.writeFileSync(TRADES_FILE, `${JSON.stringify(rows, null, 2)}\n`);
}

async function executeSignal(signal, { paper = true } = {}) {
  // Beta default: paper mode only.
  if (paper) {
    logTrade({
      layer: signal.layer,
      category: signal.category,
      source: signal.source || null,
      signalStrength: signal.signalStrength,
      ticker: signal.ticker,
      side: signal.side,
      executionPrice: signal.executionPrice,
      settlementResult: null,
      mode: 'paper',
      status: 'EXECUTED_PAPER',
    });
    return { ok: true, paper: true };
  }

  const client = new KalshiClient({ demo: false });
  const order = await client.placeOrder(signal.order);
  logTrade({
    layer: signal.layer,
    category: signal.category,
    source: signal.source || null,
    signalStrength: signal.signalStrength,
    ticker: signal.ticker,
    side: signal.side,
    executionPrice: signal.executionPrice,
    settlementResult: null,
    mode: 'live',
    status: order.ok ? 'SUBMITTED' : `FAILED:${order.error}`,
    orderResponse: order,
  });
  return order;
}

module.exports = { executeSignal, logTrade };
