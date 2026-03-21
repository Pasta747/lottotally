const path = require('path');

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

  // S&P 100 starter universe (can expand to full 500 after perf validation)
  UNIVERSE: [
    'AAPL','ABBV','ABT','ACN','ADBE','AIG','AMD','AMGN','AMT','AMZN',
    'AVGO','AXP','BA','BAC','BK','BKNG','BLK','BMY','BRK.B','C','CAT',
    'CHTR','CL','CMCSA','COF','COP','COST','CRM','CSCO','CVS','CVX',
    'DD','DHR','DIS','DOW','DUK','EMR','F','FDX','GD','GE',
    'GILD','GM','GOOG','GOOGL','GS','HD','HON','IBM','INTC','INTU',
    'JNJ','JPM','KHC','KO','LIN','LLY','LMT','LOW','MA','MCD',
    'MDLZ','MDT','META','MMM','MO','MRK','MS','MSFT','NEE','NFLX',
    'NKE','NVDA','ORCL','PEP','PFE','PG','PM','PYPL','QCOM','RTX',
    'SBUX','SCHW','SO','SPG','T','TGT','TMO','TSLA','TXN','UNH',
    'UNP','UPS','USB','V','VZ','WBA','WFC','WMT','XOM','CME'
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
