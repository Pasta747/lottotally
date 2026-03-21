const envNum = (key, fallback) => {
  const v = process.env[key];
  if (v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const envBool = (key, fallback) => {
  const v = process.env[key];
  if (v === undefined || v === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
};

const coins = ['BTC', 'ETH', 'SOL', 'AVAX', 'LINK'];
const coinProducts = {
  BTC: 'BTC-USD',
  ETH: 'ETH-USD',
  SOL: 'SOL-USD',
  AVAX: 'AVAX-USD',
  LINK: 'LINK-USD',
};
const coinGeckoIds = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
};

const config = {
  mode: {
    paperOnly: envBool('BTC_BOT_PAPER_MODE', true),
  },
  bankroll: envNum('BTC_BOT_BANKROLL', 1000),
  primaryCoin: 'BTC',
  coins,
  coinProducts,
  coinGeckoIds,
  product: process.env.BTC_PRODUCT || coinProducts.BTC,
  risk: {
    maxOpenPositions: envNum('BTC_MAX_OPEN_POSITIONS', 5),
    maxPositionUsd: envNum('BTC_MAX_POSITION_USD', 250),
    dailyLossLimitUsd: envNum('BTC_DAILY_LOSS_LIMIT_USD', 100),
    dedupWindowMs: envNum('BTC_SIGNAL_DEDUP_MS', 15 * 60 * 1000),
  },
  coinbase: {
    apiKey: process.env.COINBASE_API_KEY || '',
    apiSecret: process.env.COINBASE_API_SECRET || '',
    passphrase: process.env.COINBASE_PASSPHRASE || '',
    apiBase: process.env.COINBASE_API_BASE || 'https://api.coinbase.com',
  },
  robinhood: {
    username: process.env.ROBINHOOD_USERNAME || '',
    password: process.env.ROBINHOOD_PASSWORD || '',
    enabled: envBool('ROBINHOOD_ENABLED', false),
  },
  rsi: {
    period: envNum('RSI_PERIOD', 14),
    oversold: envNum('RSI_OVERSOLD', 30),
    overbought: envNum('RSI_OVERBOUGHT', 70),
    minSignalTimeframeMinutes: envNum('RSI_MIN_SIGNAL_TF_MIN', 60),
    volumeSpikeFactor: envNum('RSI_VOLUME_SPIKE_FACTOR', 1.2),
    stochPeriod: envNum('STOCH_PERIOD', 14),
    stochSignalOversold: envNum('STOCH_OVERSOLD', 20),
    stochSignalOverbought: envNum('STOCH_OVERBOUGHT', 80),
  },
  bollinger: {
    period: envNum('BOLL_PERIOD', 20),
    stdDev: envNum('BOLL_STDDEV', 2),
  },
  dca: {
    baseAmountUsd: envNum('DCA_BASE_AMOUNT_USD', 25),
    dropBoostPct: envNum('DCA_DROP_BOOST_PCT', 5),
    riseSkipPct: envNum('DCA_RISE_SKIP_PCT', 10),
    boostMultiplier: envNum('DCA_BOOST_MULTIPLIER', 2),
  },
  meanReversion: {
    period: envNum('MR_PERIOD', 20),
    stdDevThreshold: envNum('MR_STDDEV_THRESHOLD', 2),
    adxDisableThreshold: envNum('MR_ADX_DISABLE_THRESHOLD', 25),
  },
  arb: {
    spreadThresholdPct: envNum('ARB_SPREAD_THRESHOLD_PCT', 0.5),
  },
  sentiment: {
    fearBuyThreshold: envNum('FG_FEAR_BUY', 25),
    greedSellThreshold: envNum('FG_GREED_SELL', 75),
  },
  paths: {
    dataDir: './data',
    rsiTrades: './data/rsi-trades.json',
    dcaTrades: './data/dca-trades.json',
    reversionTrades: './data/reversion-trades.json',
    arbLog: './data/arb-log.json',
    sentimentTrades: './data/sentiment-trades.json',
    priceHistory: './data/price-history.json',
    state: './data/state.json',
    signalLog: './data/signals-log.json',
    priceLog: './data/price-log.json',
    dedup: './data/dedup.json',
  },
  timeframes: {
    m15: 15,
    h1: 60,
    h4: 240,
    d1: 1440,
  },
};

config.strategiesByCoin = {
  BTC: ['rsi', 'dca', 'reversion', 'arb', 'sentiment'],
  ETH: ['rsi', 'dca'],
  SOL: ['rsi', 'dca'],
  AVAX: ['rsi', 'dca'],
  LINK: ['rsi', 'dca'],
};

config.getCoinProduct = (coin = config.primaryCoin) => config.coinProducts[String(coin).toUpperCase()] || `${String(coin).toUpperCase()}-USD`;
config.getCoinGeckoId = (coin = config.primaryCoin) => config.coinGeckoIds[String(coin).toUpperCase()];
config.normalizeCoin = (coin) => String(coin || '').trim().toUpperCase();
config.resolveCoinFromProduct = (product = config.product) => String(product).split('-')[0].toUpperCase();
config.getCoinsForStrategy = (strategy, onlyCoin = null) => {
  const target = onlyCoin ? [config.normalizeCoin(onlyCoin)] : config.coins;
  return target.filter((coin) => {
    const enabled = config.strategiesByCoin[coin] || [];
    return enabled.includes(strategy);
  });
};

module.exports = config;
