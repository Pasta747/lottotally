const path = require('path');
const fs = require('fs');

const SP500_FILE = path.join(__dirname, 'sp500.json');
const SP500_UNIVERSE = fs.existsSync(SP500_FILE)
  ? JSON.parse(fs.readFileSync(SP500_FILE, 'utf8'))
  : [];

module.exports = {
  PAPER_ACCOUNT_ID: 'DUP472682',
  IBKR_HOST: process.env.IBKR_HOST || '127.0.0.1',
  IBKR_PORT: Number(process.env.IBKR_PORT || 4002),
  IBKR_CLIENT_ID: Number(process.env.IBKR_CLIENT_ID || 31),

  OPENBB_BASE_URL: process.env.OPENBB_BASE_URL || 'http://127.0.0.1:6901',
  OPENBB_PROVIDER: process.env.OPENBB_PROVIDER || 'yfinance',

  MAX_POSITION_SIZE: Number(process.env.MAX_POSITION_SIZE || 5000),
  MAX_POSITIONS: 50,
  STOP_LOSS_PCT: Number(process.env.STOP_LOSS_PCT || 2),
  TAKE_PROFIT_PCT: Number(process.env.TAKE_PROFIT_PCT || 5),

  // Full S&P 500 universe loaded from sp500.json (503 tickers)
  UNIVERSE: SP500_UNIVERSE.length ? SP500_UNIVERSE : [
    'AAPL','MSFT','AMZN','NVDA','META','TSLA','GOOGL','GOOG','AMD','INTC',
    'BAC','JPM','WFC','GS','MS','XOM','CVX','COP','SLB','PFE'
  ],

  SECTOR_ETFS: ['XLK','XLF','XLE','XLV','XLY','XLP','XLI','XLU','XLRE','XLC','XLB'],

  PAIRS: [
    ['AAPL', 'MSFT'],
    ['JPM', 'BAC'],
    ['XOM', 'CVX'],
    ['GOOG', 'META'],
    ['HD', 'LOW'],
  ],

  STRATEGIES_ENABLED: [
    'momentum','mean-reversion','earnings-play','gap-fill','vwap-bounce','breakout','pullback-buy',
    'sector-rotation','pairs-trading','golden-cross','rsi-divergence','macd-crossover','bollinger-squeeze',
    'high-short-interest','insider-buying','dividend-capture','opening-range-breakout','relative-strength',
    'volume-spike','support-resistance',
  ],

  DATA_DIR: path.join(__dirname, 'data'),
  TRADES_FILE: path.join(__dirname, 'data', 'equity-trades.json'),
  POSITIONS_FILE: path.join(__dirname, 'data', 'paper-positions.json'),
  CLOSED_TRADES_FILE: path.join(__dirname, 'data', 'closed-trades.json'),
  SIGNALS_LOG_FILE: path.join(__dirname, 'data', 'signals-log.jsonl'),
};

// Lowercase aliases for strategy compatibility
module.exports.universe = module.exports.UNIVERSE;
module.exports.sectorEtfs = module.exports.SECTOR_ETFS;
module.exports.pairs = module.exports.PAIRS;
module.exports.strategiesEnabled = module.exports.STRATEGIES_ENABLED;
