import { sql } from '@vercel/postgres';

let schemaReady = false;

export async function ensureSchema() {
  if (schemaReady) return;
  await sql`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    bankroll DECIMAL(10,2) DEFAULT 1000,
    risk_level TEXT DEFAULT 'moderate',
    whatsapp TEXT,
    auto_execute BOOLEAN DEFAULT FALSE
  );`;

  await sql`CREATE TABLE IF NOT EXISTS user_api_keys (
    user_id TEXT PRIMARY KEY REFERENCES users(id),
    kalshi_key_id TEXT,
    kalshi_secret_encrypted TEXT,
    kalshi_mode TEXT DEFAULT 'demo',
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`;

  await sql`CREATE TABLE IF NOT EXISTS trades (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    date DATE NOT NULL,
    market TEXT NOT NULL,
    category TEXT NOT NULL,
    layer TEXT NOT NULL,
    side TEXT NOT NULL,
    ev_pct DECIMAL(6,4),
    kelly_amount DECIMAL(10,2),
    outcome TEXT,
    pnl DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`;

  schemaReady = true;
}

export { sql };
