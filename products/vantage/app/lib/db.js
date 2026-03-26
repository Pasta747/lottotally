import { sql } from '@vercel/postgres';

export { sql };

export async function initDB() {
  await sql`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    bankroll DECIMAL(10,2) DEFAULT 1000,
    risk_level TEXT DEFAULT 'moderate',
    whatsapp TEXT,
    auto_execute BOOLEAN DEFAULT FALSE,
    max_wager_dollars DECIMAL(10,2) DEFAULT 1.00,
    max_orders_per_day INTEGER DEFAULT 10,
    max_daily_spend DECIMAL(10,2) DEFAULT 10.00,
    kalshi_mode TEXT DEFAULT 'demo'
  )`;

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS max_wager_dollars DECIMAL(10,2) DEFAULT 1.00`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS max_orders_per_day INTEGER DEFAULT 10`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS max_daily_spend DECIMAL(10,2) DEFAULT 10.00`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS kalshi_mode TEXT DEFAULT 'demo'`;

  await sql`CREATE TABLE IF NOT EXISTS user_api_keys (user_id TEXT PRIMARY KEY REFERENCES users(id), kalshi_key_id TEXT, kalshi_secret_encrypted TEXT, kalshi_mode TEXT DEFAULT 'demo', kalshi_live_key_id TEXT, kalshi_live_secret_encrypted TEXT, updated_at TIMESTAMPTZ DEFAULT NOW())`;
  await sql`ALTER TABLE user_api_keys ADD COLUMN IF NOT EXISTS kalshi_live_key_id TEXT`;
  await sql`ALTER TABLE user_api_keys ADD COLUMN IF NOT EXISTS kalshi_live_secret_encrypted TEXT`;

  await sql`CREATE TABLE IF NOT EXISTS trades (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), date DATE NOT NULL, market TEXT NOT NULL, category TEXT NOT NULL, layer TEXT NOT NULL, side TEXT NOT NULL, ev_pct DECIMAL(6,4), kelly_amount DECIMAL(10,2), execution_price DECIMAL(6,4), contracts INTEGER, source TEXT, outcome TEXT DEFAULT 'pending', pnl DECIMAL(10,2) DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW())`;

  await sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS execution_price DECIMAL(6,4)`;
  await sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS contracts INTEGER`;
  await sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS source TEXT`;

  // Daily portfolio snapshots for the performance chart
  await sql`CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    snapshot_date DATE NOT NULL,
    balance_cents INTEGER NOT NULL,
    portfolio_value_cents INTEGER DEFAULT 0,
    total_pnl DECIMAL(10,2) DEFAULT 0,
    trade_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, snapshot_date)
  )`;
}
export async function migrateV3() {
  // is_admin flag on users
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE`;
  // Set Mario as admin
  await sql`UPDATE users SET is_admin = TRUE WHERE email = ${'mario@yourvantage.ai'}`;

  // Signals table — Plutus's schema (canonical for admin dashboard)
  await sql`
    CREATE TABLE IF NOT EXISTS signals (
      signal_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sport              TEXT NOT NULL,
      league             TEXT NOT NULL,
      game_id            TEXT NOT NULL,
      game_date          DATE NOT NULL,
      home_team          TEXT NOT NULL,
      away_team          TEXT NOT NULL,
      market_type        TEXT NOT NULL,
      selection          TEXT NOT NULL,
      sportsbook         TEXT NOT NULL DEFAULT 'draftkings',
      model_probability  FLOAT NOT NULL,
      fair_probability   FLOAT NOT NULL,
      ev_percent         FLOAT NOT NULL,
      kelly_fraction     FLOAT NOT NULL DEFAULT 0.25,
      stake_usd          FLOAT,
      did_we_bet         BOOLEAN NOT NULL DEFAULT FALSE,
      bet_reason         TEXT,
      min_ev_threshold   FLOAT,
      market_odds        FLOAT NOT NULL,
      american_odds      INTEGER,
      actual_result      TEXT,
      final_score        TEXT,
      outcome            TEXT DEFAULT 'pending',
      profit_loss_usd    FLOAT DEFAULT 0,
      signal_age_hours   FLOAT
    )
  `;

  // Indexes for admin queries
  await sql`CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_signals_sport ON signals (sport)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_signals_outcome ON signals (outcome)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_signals_ev_percent ON signals (ev_percent)`;
}

export async function migrateV2() {
  await sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'vantage'`;
  await sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS kalshi_order_id TEXT`;
  await sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS execution_price DECIMAL(10,4)`;
  await sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS signal_strength DECIMAL(6,4)`;
  await sql`ALTER TABLE trades ADD COLUMN IF NOT EXISTS account_mode TEXT DEFAULT 'demo'`;
  // Tag existing synced trades as demo
  await sql`UPDATE trades SET account_mode = 'demo' WHERE source = 'kalshi_sync' AND account_mode IS NULL`;

  // Remove duplicate trades (same order_id + user_id), keep the one with latest outcome
  await sql`
    DELETE FROM trades
    WHERE id IN (
      SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY user_id, kalshi_order_id
                 ORDER BY CASE WHEN outcome != 'pending' THEN 0 ELSE 1 END, created_at DESC
               ) AS rn
        FROM trades
        WHERE kalshi_order_id IS NOT NULL
      ) t WHERE rn > 1
    )
  `;

  // Add unique constraint to prevent future dupes
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS trades_user_order_uniq
    ON trades(user_id, kalshi_order_id)
    WHERE kalshi_order_id IS NOT NULL
  `;
}
