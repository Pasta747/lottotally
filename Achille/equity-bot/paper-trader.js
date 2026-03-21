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

function millisToHuman(ms) {
  const sec = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

class PaperTrader {
  constructor() {
    ensureDataFiles();
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
    const minHoldMs = Number(process.env.EQUITY_MIN_HOLD_MS || 5 * 60 * 1000);
    const crossStrategyGuardMs = Number(process.env.EQUITY_CROSS_STRATEGY_EXIT_GUARD_MS || 5 * 60 * 1000);

    const ts = new Date().toISOString();
    const trade = {
      timestamp: ts,
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
        openedAt: ts,
      };
    } else if (side === 'SELL' && positions[symbol]) {
      const entry = positions[symbol];
      const holdMs = new Date(ts).getTime() - new Date(entry.openedAt).getTime();

      if (holdMs < minHoldMs) {
        return { ...trade, skipped: true, skipReason: 'MIN_HOLD_GUARD' };
      }

      if (entry.strategy && strategy !== entry.strategy && holdMs < crossStrategyGuardMs) {
        return { ...trade, skipped: true, skipReason: 'CROSS_STRATEGY_EXIT_GUARD' };
      }

      const pnl = Number(((price - entry.entryPrice) * qty).toFixed(2));
      const entryNotional = Math.abs(entry.entryPrice * qty) || 1;
      const pnlPct = Number(((pnl / entryNotional) * 100).toFixed(3));

      closed.push({
        symbol,
        strategy: entry.strategy,
        entry_price: Number(entry.entryPrice.toFixed(6)),
        exit_price: Number(price.toFixed(6)),
        qty,
        pnl,
        pnl_pct: pnlPct,
        hold_time: millisToHuman(holdMs),
        hold_time_ms: holdMs,
        timestamp: ts,
        opened_at: entry.openedAt,
        exit_strategy: strategy,
      });

      delete positions[symbol];
    }

    writeJson(config.TRADES_FILE, trades);
    writeJson(config.POSITIONS_FILE, positions);
    writeJson(config.CLOSED_TRADES_FILE, closed);

    return trade;
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

  rebuildClosedTradesFromHistory() {
    const trades = this.getTrades();
    const positions = {};
    const closed = [];

    for (const t of trades) {
      const symbol = t.symbol;
      if (!symbol) continue;

      if (t.side === 'BUY') {
        positions[symbol] = {
          symbol,
          qty: t.qty,
          entryPrice: t.price,
          strategy: t.strategy,
          openedAt: t.timestamp,
        };
      }

      if (t.side === 'SELL' && positions[symbol]) {
        const entry = positions[symbol];
        const pnl = Number(((t.price - entry.entryPrice) * t.qty).toFixed(2));
        const holdMs = new Date(t.timestamp).getTime() - new Date(entry.openedAt).getTime();

        const entryNotional = Math.abs(entry.entryPrice * t.qty) || 1;
        const pnlPct = Number(((pnl / entryNotional) * 100).toFixed(3));

        closed.push({
          symbol,
          strategy: entry.strategy,
          entry_price: Number(entry.entryPrice.toFixed(6)),
          exit_price: Number(t.price.toFixed(6)),
          qty: t.qty,
          pnl,
          pnl_pct: pnlPct,
          hold_time: millisToHuman(holdMs),
          hold_time_ms: holdMs,
          timestamp: t.timestamp,
          opened_at: entry.openedAt,
          exit_strategy: t.strategy,
        });
        delete positions[symbol];
      }
    }

    writeJson(config.CLOSED_TRADES_FILE, closed);
    return closed;
  }

  pnlByStrategy(lastPriceBySymbol = {}) {
    const closed = this.getClosedTrades();
    const open = this.evaluatePositions(lastPriceBySymbol);

    const agg = new Map();

    const add = (strategy, item) => {
      if (!agg.has(strategy)) {
        agg.set(strategy, {
          strategy,
          realizedPnl: 0,
          unrealizedPnl: 0,
          trades: 0,
          wins: 0,
          losses: 0,
          grossWin: 0,
          grossLoss: 0,
          returns: [],
        });
      }
      const row = agg.get(strategy);
      Object.assign(row, item(row));
    };

    for (const t of closed) {
      add(t.strategy || 'unknown', (row) => {
        const pnl = Number(t.pnl || 0);
        const entryNotional = Math.abs(Number(t.entry_price || 0) * Number(t.qty || 0)) || 1;
        const r = pnl / entryNotional;
        return {
          realizedPnl: row.realizedPnl + pnl,
          trades: row.trades + 1,
          wins: row.wins + (pnl > 0 ? 1 : 0),
          losses: row.losses + (pnl < 0 ? 1 : 0),
          grossWin: row.grossWin + (pnl > 0 ? pnl : 0),
          grossLoss: row.grossLoss + (pnl < 0 ? Math.abs(pnl) : 0),
          returns: [...row.returns, r],
        };
      });
    }

    for (const p of open) {
      add(p.strategy || 'unknown', (row) => ({
        unrealizedPnl: row.unrealizedPnl + Number(p.pnl || 0),
      }));
    }

    const out = [...agg.values()].map((row) => {
      const avgWin = row.wins ? row.grossWin / row.wins : 0;
      const avgLoss = row.losses ? row.grossLoss / row.losses : 0;
      const winRate = row.trades ? (row.wins / row.trades) * 100 : 0;

      const mean = row.returns.length ? row.returns.reduce((a, b) => a + b, 0) / row.returns.length : 0;
      const variance = row.returns.length
        ? row.returns.reduce((a, b) => a + (b - mean) ** 2, 0) / row.returns.length
        : 0;
      const std = Math.sqrt(variance);
      const sharpe = std > 0 ? (mean / std) * Math.sqrt(row.returns.length) : 0;

      return {
        strategy: row.strategy,
        realizedPnl: Number(row.realizedPnl.toFixed(2)),
        unrealizedPnl: Number(row.unrealizedPnl.toFixed(2)),
        totalPnl: Number((row.realizedPnl + row.unrealizedPnl).toFixed(2)),
        trades: row.trades,
        winRate: Number(winRate.toFixed(2)),
        avgWin: Number(avgWin.toFixed(2)),
        avgLoss: Number(avgLoss.toFixed(2)),
        sharpe: Number(sharpe.toFixed(3)),
      };
    });

    out.sort((a, b) => b.totalPnl - a.totalPnl);
    return out;
  }
}

module.exports = { PaperTrader, ensureDataFiles };
