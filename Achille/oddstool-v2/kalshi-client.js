/**
 * kalshi-client.js — Kalshi API Client (Demo + Live)
 *
 * --paper mode: connects to demo-api.kalshi.co (mock funds, real order flow)
 * --live  mode: connects to api.elections.kalshi.com (REAL money — requires explicit unlock)
 *
 * Auth flow (same for both envs):
 *   Message  = {timestamp_ms}{HTTP_METHOD}{full_path_with_prefix}
 *   Signature = RSA-PSS SHA256(message), base64-encoded
 *   Headers:
 *     KALSHI-ACCESS-KEY        = API Key ID
 *     KALSHI-ACCESS-TIMESTAMP  = timestamp in ms
 *     KALSHI-ACCESS-SIGNATURE  = base64 signature
 *
 * Env vars:
 *   Demo:  KALSHI_DEMO_API_KEY_ID  +  KALSHI_DEMO_PRIVATE_KEY
 *   Live:  KALSHI_API_KEY_ID       +  KALSHI_PRIVATE_KEY
 *          KALSHI_LIVE_ENABLED=true  (explicit safety gate — must be set to use live)
 */

'use strict';

const crypto = require('crypto');
const fetch  = require('node-fetch');
require('dotenv').config({ path: '/root/PastaOS/.env' });

const DEMO_BASE_URL   = 'https://demo-api.kalshi.co/trade-api/v2';
const LIVE_BASE_URL   = 'https://api.elections.kalshi.com/trade-api/v2';
const API_PATH_PREFIX = '/trade-api/v2'; // Included in signature message

class KalshiClient {
  /**
   * @param {Object} opts
   * @param {boolean} [opts.demo=true]    — true = demo env, false = live (requires KALSHI_LIVE_ENABLED=true)
   * @param {boolean} [opts.verbose=false]
   */
  constructor({ demo = true, verbose = false } = {}) {
    this.verbose = verbose;
    this.isDemo  = demo;

    if (demo) {
      // ── Demo mode ────────────────────────────────────────────────────────
      this.baseUrl       = DEMO_BASE_URL;
      this.apiKeyId      = process.env.KALSHI_DEMO_API_KEY_ID;
      this.privateKeyPem = process.env.KALSHI_DEMO_PRIVATE_KEY;

      if (!this.apiKeyId || !this.privateKeyPem) {
        throw new Error(
          'KALSHI_DEMO_API_KEY_ID or KALSHI_DEMO_PRIVATE_KEY not set in /root/PastaOS/.env\n' +
          '  Mario: set up demo account at kalshi.com, then add keys to .env'
        );
      }
    } else {
      // ── Live mode ────────────────────────────────────────────────────────
      // Requires an explicit env-var safety gate in addition to --live flag.
      // This double-lock prevents accidental live orders.
      if (process.env.KALSHI_LIVE_ENABLED !== 'true') {
        throw new Error(
          'Live trading requires KALSHI_LIVE_ENABLED=true in /root/PastaOS/.env.\n' +
          '  This is a safety gate. Only set it after completing paper-trade validation.'
        );
      }

      this.baseUrl       = LIVE_BASE_URL;
      this.apiKeyId      = process.env.KALSHI_API_KEY_ID;
      this.privateKeyPem = process.env.KALSHI_PRIVATE_KEY;

      if (!this.apiKeyId || !this.privateKeyPem) {
        throw new Error(
          'KALSHI_API_KEY_ID or KALSHI_PRIVATE_KEY not set in /root/PastaOS/.env'
        );
      }
    }
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  /**
   * Sign a request using RSA-PSS SHA256.
   * Message = `{timestamp_ms}{METHOD}{full_path_without_query_params}`
   *
   * Per Kalshi docs, the path MUST include the /trade-api/v2 prefix.
   * e.g. timestamp=1703123456789, GET /portfolio/balance →
   *      message = "1703123456789GET/trade-api/v2/portfolio/balance"
   */
  _sign(timestampMs, method, path) {
    // path here is the endpoint-relative path like /portfolio/balance
    // Strip query params, then prepend the API prefix for the signature
    const endpointPath = path.split('?')[0];
    const fullSignPath = `${API_PATH_PREFIX}${endpointPath}`;
    const message      = `${timestampMs}${method.toUpperCase()}${fullSignPath}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(message, 'utf8');

    const sig = signer.sign({
      key:        this.privateKeyPem,
      padding:    crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
    });

    return sig.toString('base64');
  }

  /**
   * Build auth headers for any request.
   */
  _authHeaders(method, path) {
    const ts  = Date.now().toString();
    const sig = this._sign(ts, method, path);

    return {
      'KALSHI-ACCESS-KEY':       this.apiKeyId,
      'KALSHI-ACCESS-TIMESTAMP': ts,
      'KALSHI-ACCESS-SIGNATURE': sig,
      'Content-Type':            'application/json',
    };
  }

  // ─── Low-level request ─────────────────────────────────────────────────────

  /**
   * Make an authenticated request.
   * Returns { ok, status, data, error }
   */
  async _request(method, path, body = null) {
    const url     = `${this.baseUrl}${path}`;
    const headers = this._authHeaders(method, path);

    if (this.verbose) {
      console.log(`  [Kalshi] ${method} ${url}`);
    }

    const opts = { method: method.toUpperCase(), headers };
    if (body !== null) opts.body = JSON.stringify(body);

    try {
      const res  = await fetch(url, opts);
      let data;
      try {
        data = await res.json();
      } catch (_) {
        data = null;
      }

      if (!res.ok) {
        // Kalshi API returns error as an object: { code, message, service }
        // Normalize to a human-readable string
        const rawErr = data?.error || data?.message || data?.detail || res.statusText;
        const errMsg = rawErr && typeof rawErr === 'object'
          ? (rawErr.message || rawErr.code || JSON.stringify(rawErr))
          : (rawErr || res.statusText);
        return { ok: false, status: res.status, error: errMsg, data };
      }

      return { ok: true, status: res.status, data };
    } catch (e) {
      return { ok: false, status: 0, error: e.message, data: null };
    }
  }

  // ─── Public API methods ────────────────────────────────────────────────────

  /**
   * GET /portfolio/balance — account balance
   * Returns { balance: { available_balance_cents, portfolio_value_cents, ... } }
   */
  async getBalance() {
    const res = await this._request('GET', '/portfolio/balance');
    if (!res.ok) {
      throw new Error(`Kalshi getBalance failed (HTTP ${res.status}): ${res.error}`);
    }
    return res.data;
  }

  /**
   * GET /portfolio/positions — current open positions
   */
  async getPositions() {
    const res = await this._request('GET', '/portfolio/positions');
    if (!res.ok) {
      throw new Error(`Kalshi getPositions failed (HTTP ${res.status}): ${res.error}`);
    }
    return res.data;
  }

  /**
   * GET /markets — browse/search markets
   * @param {Object} params — query params: { status, limit, cursor, event_ticker, ... }
   */
  async getMarkets(params = {}) {
    const qs   = new URLSearchParams(params).toString();
    const path = `/markets${qs ? '?' + qs : ''}`;
    const res  = await this._request('GET', path);
    if (!res.ok) {
      throw new Error(`Kalshi getMarkets failed (HTTP ${res.status}): ${res.error}`);
    }
    return res.data;
  }

  /**
   * GET /events/{event_ticker} — event details + all child markets
   * @param {string} ticker — event ticker (e.g. "KXNBA-25-T1")
   */
  async getEvent(ticker) {
    const res = await this._request('GET', `/events/${encodeURIComponent(ticker)}`);
    if (!res.ok) {
      throw new Error(`Kalshi getEvent failed (HTTP ${res.status}): ${res.error}`);
    }
    return res.data;
  }

  /**
   * POST /portfolio/orders — place an order
   *
   * @param {Object} params
   * @param {string}  params.ticker     — market ticker (e.g. "KXNBA-25-T1_YES")
   * @param {string}  params.action     — "buy" | "sell"
   * @param {string}  params.side       — "yes" | "no"
   * @param {string}  params.type       — "limit" | "market"
   * @param {number}  params.count      — number of contracts (integer)
   * @param {number}  [params.yes_price]  — limit price in cents for YES (1-99)
   * @param {number}  [params.no_price]   — limit price in cents for NO  (1-99)
   *
   * Returns { ok, data: { order: { order_id, status, ... } }, error }
   * — Does NOT throw; returns { ok: false, error } on failure so caller can log gracefully.
   */
  async placeOrder(params) {
    const res = await this._request('POST', '/portfolio/orders', params);
    if (!res.ok) {
      return { ok: false, status: res.status, error: res.error, data: res.data };
    }
    return { ok: true, status: res.status, data: res.data };
  }

  /**
   * GET /portfolio/orders — order history
   * @param {Object} [params] — optional filters: { status, ticker, limit, cursor }
   */
  async getOrders(params = {}) {
    const qs   = new URLSearchParams(params).toString();
    const path = `/portfolio/orders${qs ? '?' + qs : ''}`;
    const res  = await this._request('GET', path);
    if (!res.ok) {
      throw new Error(`Kalshi getOrders failed (HTTP ${res.status}): ${res.error}`);
    }
    return res.data;
  }
}

// ─── Ticker extraction helper ─────────────────────────────────────────────────

/**
 * Try to extract a Kalshi market ticker from a Kalshi URL or href string.
 *
 * Kalshi URLs have the structure:
 *   /markets/{series_ticker}/{slug}/{contract_ticker}
 * e.g. /markets/kxnbagame/professional-basketball-game/kxnbagame-26mar16orlatl
 *
 * The CONTRACT ticker is always the LAST path segment.
 * (The first segment after /markets/ is the event series ticker — NOT what orders need.)
 *
 * Examples:
 *   "https://kalshi.com/markets/kxnbagame/professional-basketball-game/kxnbagame-26mar16orlatl"
 *     → "kxnbagame-26mar16orlatl"   ✅ contract ticker
 *   "https://kalshi.com/markets/KXNBA-25-T1_YES"
 *     → "KXNBA-25-T1_YES"           ✅
 *   "https://kalshi.com/markets/KXNBA-25-T1"
 *     → "KXNBA-25-T1"               ✅
 *
 * Returns null if extraction fails.
 */
function extractTickerFromHref(href) {
  if (!href) return null;
  try {
    const url  = new URL(href);
    const segs = url.pathname.split('/').filter(Boolean);
    // Always use the LAST segment — it's the specific contract ticker.
    // (segs[idx+1] after 'markets' would give the series ticker, which causes market_not_found)
    if (segs.length > 0) {
      return decodeURIComponent(segs[segs.length - 1]);
    }
    return null;
  } catch (_) {
    // Not a URL — might already be a ticker (allow lower and uppercase)
    return /^[A-Za-z0-9_\-]+$/.test(href) ? href : null;
  }
}

/**
 * Convert decimal odds to Kalshi YES price in cents (1-99).
 * decimalOdds = 2.0 → implied prob = 50% → yes_price = 50
 * decimalOdds = 1.5 → implied prob = 67% → yes_price = 67
 */
function oddsToYesPrice(decimalOdds) {
  if (!decimalOdds || decimalOdds <= 1) return null;
  const impliedProb = 1 / decimalOdds;
  const cents = Math.round(impliedProb * 100);
  return Math.min(99, Math.max(1, cents));
}

// ─── Sports market ticker construction ───────────────────────────────────────

/**
 * Standard team abbreviations for NBA, NHL, NFL.
 * Used to construct Kalshi game-winner market tickers programmatically.
 * Kalshi ticker format: {SERIES}-{YY}{MON}{DD}{AWAYABBR}{HOMEABBR}-{WINNERABBR}
 * Example: KXNBAGAME-26MAR15GSWNYK-NYK
 */
const TEAM_ABBREVS = {
  // ── NBA ───────────────────────────────────────────────────────────────────
  'Atlanta Hawks':           'ATL',
  'Boston Celtics':          'BOS',
  'Brooklyn Nets':           'BKN',
  'Charlotte Hornets':       'CHA',
  'Chicago Bulls':           'CHI',
  'Cleveland Cavaliers':     'CLE',
  'Dallas Mavericks':        'DAL',
  'Denver Nuggets':          'DEN',
  'Detroit Pistons':         'DET',
  'Golden State Warriors':   'GSW',
  'Houston Rockets':         'HOU',
  'Indiana Pacers':          'IND',
  'Los Angeles Clippers':    'LAC',
  'LA Clippers':             'LAC',
  'Los Angeles Lakers':      'LAL',
  'LA Lakers':               'LAL',
  'Memphis Grizzlies':       'MEM',
  'Miami Heat':              'MIA',
  'Milwaukee Bucks':         'MIL',
  'Minnesota Timberwolves':  'MIN',
  'New Orleans Pelicans':    'NOP',
  'New York Knicks':         'NYK',
  'Oklahoma City Thunder':   'OKC',
  'Orlando Magic':           'ORL',
  'Philadelphia 76ers':      'PHI',
  'Phoenix Suns':            'PHX',
  'Portland Trail Blazers':  'POR',
  'Sacramento Kings':        'SAC',
  'San Antonio Spurs':       'SAS',
  'Toronto Raptors':         'TOR',
  'Utah Jazz':               'UTA',
  'Washington Wizards':      'WAS',
  // ── NHL ───────────────────────────────────────────────────────────────────
  'Anaheim Ducks':           'ANA',
  'Buffalo Sabres':          'BUF',
  'Calgary Flames':          'CGY',
  'Carolina Hurricanes':     'CAR',
  'Chicago Blackhawks':      'CHI', // same as Bulls — sport context differentiates
  'Colorado Avalanche':      'COL',
  'Columbus Blue Jackets':   'CBJ',
  'Dallas Stars':            'DAL',
  'Detroit Red Wings':       'DET',
  'Edmonton Oilers':         'EDM',
  'Florida Panthers':        'FLA',
  'Los Angeles Kings':       'LAK',
  'Minnesota Wild':          'MIN',
  'Montreal Canadiens':      'MTL',
  'Nashville Predators':     'NSH',
  'New Jersey Devils':       'NJD',
  'New York Islanders':      'NYI',
  'New York Rangers':        'NYR',
  'Ottawa Senators':         'OTT',
  'Philadelphia Flyers':     'PHI',
  'Pittsburgh Penguins':     'PIT',
  'Seattle Kraken':          'SEA',
  'San Jose Sharks':         'SJS',
  'St. Louis Blues':         'STL',
  'Tampa Bay Lightning':     'TBL',
  'Toronto Maple Leafs':     'TOR',
  'Vancouver Canucks':       'VAN',
  'Vegas Golden Knights':    'VGK',
  'Washington Capitals':     'WSH',
  'Winnipeg Jets':           'WPG',
  'Utah Hockey Club':        'UTA',
  // ── NFL ───────────────────────────────────────────────────────────────────
  'Arizona Cardinals':       'ARI',
  'Atlanta Falcons':         'ATL',
  'Baltimore Ravens':        'BAL',
  'Buffalo Bills':           'BUF',
  'Carolina Panthers':       'CAR',
  'Chicago Bears':           'CHI',
  'Cincinnati Bengals':      'CIN',
  'Cleveland Browns':        'CLE',
  'Dallas Cowboys':          'DAL',
  'Denver Broncos':          'DEN',
  'Detroit Lions':           'DET',
  'Green Bay Packers':       'GB',
  'Houston Texans':          'HOU',
  'Indianapolis Colts':      'IND',
  'Jacksonville Jaguars':    'JAX',
  'Kansas City Chiefs':      'KC',
  'Las Vegas Raiders':       'LV',
  'Los Angeles Chargers':    'LAC',
  'Los Angeles Rams':        'LAR',
  'Miami Dolphins':          'MIA',
  'Minnesota Vikings':       'MIN',
  'New England Patriots':    'NE',
  'New Orleans Saints':      'NO',
  'New York Giants':         'NYG',
  'New York Jets':           'NYJ',
  'Philadelphia Eagles':     'PHI',
  'Pittsburgh Steelers':     'PIT',
  'San Francisco 49ers':     'SF',
  'Seattle Seahawks':        'SEA',
  'Tampa Bay Buccaneers':    'TB',
  'Tennessee Titans':        'TEN',
  'Washington Commanders':   'WSH',
};

/**
 * Map from sport label/key → Kalshi game-winner series ticker prefix.
 */
const SPORT_TO_KALSHI_SERIES = {
  'basketball':         'KXNBAGAME',
  'NBA':                'KXNBAGAME',
  'ice-hockey':         'KXNHLGAME',
  'NHL':                'KXNHLGAME',
  'american-football':  'KXNFLGAME',
  'NFL':                'KXNFLGAME',
};

/**
 * Build a Kalshi game-winner market ticker from game info.
 *
 * Format: {SERIES}-{YY}{MON}{DD}{AWAYABBR}{HOMEABBR}-{WINNERABBR}
 * Example for "Golden State Warriors @ New York Knicks" on 2026-03-15, betting NYK:
 *   → KXNBAGAME-26MAR15GSWNYK-NYK
 *
 * @param {string} homeTeam     — full home team name (e.g. "New York Knicks")
 * @param {string} awayTeam     — full away team name (e.g. "Golden State Warriors")
 * @param {string} bettingOnTeam — full name of team we're betting to WIN
 * @param {string} sport        — e.g. 'basketball', 'NBA', 'ice-hockey', 'NHL'
 * @param {string} commenceTime — ISO date string (e.g. "2026-03-15T19:30:00Z")
 * @returns {string|null}       — Kalshi ticker string, or null if any piece is unknown
 */
function buildKalshiGameTicker(homeTeam, awayTeam, bettingOnTeam, sport, commenceTime) {
  const series = SPORT_TO_KALSHI_SERIES[sport];
  if (!series) {
    return null; // Unknown sport
  }

  const homeAbbr   = TEAM_ABBREVS[homeTeam];
  const awayAbbr   = TEAM_ABBREVS[awayTeam];
  const winnerAbbr = TEAM_ABBREVS[bettingOnTeam];

  if (!homeAbbr || !awayAbbr || !winnerAbbr) {
    return null; // Unknown team(s) — can't construct ticker
  }

  // Format date component: YY + 3-letter-month + DD (e.g. "26MAR15")
  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const d     = new Date(commenceTime);
  const yy    = String(d.getUTCFullYear()).slice(2);       // "26"
  const mon   = MONTHS[d.getUTCMonth()];                   // "MAR"
  const dd    = String(d.getUTCDate()).padStart(2, '0');   // "15"
  const dateStr = `${yy}${mon}${dd}`;

  // Kalshi convention: away abbreviation first, then home
  return `${series}-${dateStr}${awayAbbr}${homeAbbr}-${winnerAbbr}`;
}

module.exports = { KalshiClient, extractTickerFromHref, oddsToYesPrice, buildKalshiGameTicker, TEAM_ABBREVS, SPORT_TO_KALSHI_SERIES };
