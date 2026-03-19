const fs = require('fs');
const config = require('./config');

function ensureDataFiles() {
  fs.mkdirSync(config.DATA_DIR, { recursive: true });
  if (!fs.existsSync(config.TRADES_FILE)) fs.writeFileSync(config.TRADES_FILE, '[]\n');
  if (!fs.existsSync(config.POSITIONS_FILE)) fs.writeFileSync(config.POSITIONS_FILE, '{}\n');
  if (!fs.existsSync(config.CLOSED_TRADES_FILE)) fs.writeFileSync(config.CLOSED_TRADES_FILE, '[]\n');
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function msToHuman(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${h}h ${m}m`;
}

class PaperTrader {
  constructor() {
    ensureDataFiles();
    this.backfillClosedTradesFromTradeLog();
  }

  getTrades() {
    return readJson(config.TRADES_FILE, []);
  }

  getClosedTrades() {
    return readJson(config.CLOSED_TRADES_FILE, []);
  }

  getOpenPositions() {
    return readJson(config.POSITIONS_FILE, {});
  }

  positionCount() {
    return Object.keys(this.getOpenPositions()).length;
  }

  canOpenPosition(price) {
    if (this.positionCount() >= config.MAX_POSITIONS) return false;
    return price > 0;
  }

  computeQty(price) {
    return Math.max(1, Math.floor(config.MAX_POSITION_SIZE / price));
  }

  recordTrade({ strategy, symbol, side, qty, price }) {
    const trades = this.getTrades();
    const positions = this.getOpenPositions();
    const closed = this.getClosedTrades();

    const trade = {
      timestamp: new Date().toISOString(),
      strategy,
      symbol,
      side,
      qty,
      price,
      notional: Number((qty * price).toFixed(2)),
    };
    trades.push(trade);

    if (side === 'BUY') {
      positions[symbol] = {
        symbol,
        qty,
        entryPrice: price,
        strategy,
        openedAt: trade.timestamp,
      };
    } else if (side === 'SELL' && positions[symbol]) {
      const pos = positions[symbol];
      const pnl = Number(((price - pos.entryPrice) * qty).toFixed(2));
      const holdMs = new Date(trade.timestamp).getTime() - new Date(pos.openedAt).getTime();
      closed.push({
        symbol,
        strategy: pos.strategy,
        entry_price: pos.entryPrice,
        exit_price: price,
        qty,
        pnl,
        pnl_pct: Number((((price - pos.entryPrice) / pos.entryPrice) * 100).toFixed(2)),
        hold_time: msToHuman(holdMs),
        hold_time_ms: holdMs,
        timestamp: trade.timestamp,
        opened_at: pos.openedAt,
        exit_strategy: strategy,
      });
      delete positions[symbol];
    }

    writeJson(config.TRADES_FILE, trades);
    writeJson(config.POSITIONS_FILE, positions);
    writeJson(config.CLOSED_TRADES_FILE, closed);

    return trade;
  }

  backfillClosedTradesFromTradeLog() {
    const existing = this.getClosedTrades();
    if (existing.length > 0) return;

    const trades = this.getTrades();
    const openBySymbol = {};
    const closed = [];

    for (const t of trades) {
      const symbol = t.symbol;
      if (!symbol) continue;

      if (t.side === 'BUY') {
        openBySymbol[symbol] = {
          strategy: t.strategy || 'unknown',
          entryPrice: Number(t.price),
          qty: Number(t.qty),
          timestamp: t.timestamp,
        };
      }

      if (t.side === 'SELL' && openBySymbol[symbol]) {
        const entry = openBySymbol[symbol];
        const qty = Number(t.qty || entry.qty || 0);
        const exitPrice = Number(t.price || 0);
        const entryPrice = Number(entry.entryPrice || 0);
        const pnl = Number(((exitPrice - entryPrice) * qty).toFixed(2));
        const holdMs = new Date(t.timestamp).getTime() - new Date(entry.timestamp).getTime();

        closed.push({
          symbol,
          strategy: entry.strategy,
          entry_price: entryPrice,
          exit_price: exitPrice,
          qty,
          pnl,
          pnl_pct: entryPrice > 0 ? Number((((exitPrice - entryPrice) / entryPrice) * 100).toFixed(2)) : 0,
          hold_time: msToHuman(holdMs),
          hold_time_ms: holdMs,
          timestamp: t.timestamp,
          opened_at: entry.timestamp,
          exit_strategy: t.strategy || 'unknown',
        });

        delete openBySymbol[symbol];
      }
    }

    writeJson(config.CLOSED_TRADES_FILE, closed);
  }

  evaluatePositions(lastPriceBySymbol = {}) {
    const positions = this.getOpenPositions();
    return Object.values(positions).map((p) => {
      const last = lastPriceBySymbol[p.symbol] ?? p.entryPrice;
      const pnl = (last - p.entryPrice) * p.qty;
      const pnlPct = ((last - p.entryPrice) / p.entryPrice) * 100;
      return {
        ...p,
        lastPrice: Number(last.toFixed(4)),
        pnl: Number(pnl.toFixed(2)),
        pnlPct: Number(pnlPct.toFixed(2)),
      };
    });
  }

  strategyPerformanceReport(lastPriceBySymbol = {}) {
    const closed = this.getClosedTrades();
    const open = this.evaluatePositions(lastPriceBySymbol);
    const byStrategy = {};

    for (const t of closed) {
      const k = t.strategy || 'unknown';
      byStrategy[k] = byStrategy[k] || {
        strategy: k,
        closedTrades: 0,
        wins: 0,
        losses: 0,
        realizedPnl: 0,
        avgWin: 0,
        avgLoss: 0,
        sharpeLike: 0,
        _winVals: [],
        _lossVals: [],
        _returns: [],
        openTrades: 0,
        unrealizedPnl: 0,
      };
      const row = byStrategy[k];
      row.closedTrades += 1;
      row.realizedPnl += Number(t.pnl || 0);
      row._returns.push(Number(t.pnl_pct || 0));
      if (t.pnl > 0) {
        row.wins += 1;
        row._winVals.push(Number(t.pnl));
      } else {
        row.losses += 1;
        row._lossVals.push(Number(t.pnl));
      }
    }

    for (const p of open) {
      const k = p.strategy || 'unknown';
      byStrategy[k] = byStrategy[k] || {
        strategy: k,
        closedTrades: 0,
        wins: 0,
        losses: 0,
        realizedPnl: 0,
        avgWin: 0,
        avgLoss: 0,
        sharpeLike: 0,
        _winVals: [],
        _lossVals: [],
        _returns: [],
        openTrades: 0,
        unrealizedPnl: 0,
      };
      byStrategy[k].openTrades += 1;
      byStrategy[k].unrealizedPnl += Number(p.pnl || 0);
    }

    return Object.values(byStrategy).map((row) => {
      const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
      const meanRet = avg(row._returns);
      const variance = row._returns.length
        ? row._returns.reduce((s, r) => s + Math.pow(r - meanRet, 2), 0) / row._returns.length
        : 0;
      const std = Math.sqrt(variance);
      const sharpeLike = std > 0 ? meanRet / std : 0;

      return {
        strategy: row.strategy,
        closedTrades: row.closedTrades,
        winRate: row.closedTrades ? Number(((row.wins / row.closedTrades) * 100).toFixed(2)) : 0,
        realizedPnl: Number(row.realizedPnl.toFixed(2)),
        avgWin: Number(avg(row._winVals).toFixed(2)),
        avgLoss: Number(avg(row._lossVals).toFixed(2)),
        sharpeLike: Number(sharpeLike.toFixed(3)),
        openTrades: row.openTrades,
        unrealizedPnl: Number(row.unrealizedPnl.toFixed(2)),
      };
    }).sort((a, b) => b.realizedPnl - a.realizedPnl);
  }

  dailySummary(dateStr = new Date().toISOString().slice(0, 10)) {
    const trades = this.getTrades().filter((t) => t.timestamp.startsWith(dateStr));
    const buys = trades.filter((t) => t.side === 'BUY');
    const sells = trades.filter((t) => t.side === 'SELL');
    return {
      date: dateStr,
      tradeCount: trades.length,
      buyNotional: Number(buys.reduce((s, t) => s + t.notional, 0).toFixed(2)),
      sellNotional: Number(sells.reduce((s, t) => s + t.notional, 0).toFixed(2)),
      symbols: [...new Set(trades.map((t) => t.symbol))],
    };
  }
}

module.exports = { PaperTrader, ensureDataFiles };
