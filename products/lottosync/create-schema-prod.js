const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');

dotenv.config({ path: '/root/PastaOS/products/lottosync/.env.vercel-production', override: true });

const pgUrl = process.env.POSTGRES_URL;
console.log('PRODUCTION POSTGRES_URL prefix:', pgUrl ? pgUrl.substring(0, 50) + '...' : 'MISSING');

const sql = neon(pgUrl);

async function createSchema() {
  try {
    console.log('Attempting to create/update LottoTally schema...');
    await sql`CREATE TABLE IF NOT EXISTS lt_users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      store_name TEXT,
      state TEXT,
      commission_rate NUMERIC DEFAULT 0.055,
      lottery_terminal_id TEXT,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      plan TEXT DEFAULT 'free',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    console.log('✅ lt_users');

    // Add Stripe columns if they don't exist
    await sql`ALTER TABLE lt_users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
      ALTER TABLE lt_users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
      ALTER TABLE lt_users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';`;
    console.log('✅ Stripe columns added/verified.');

    await sql`CREATE TABLE IF NOT EXISTS daily_entries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES lt_users(id),
      date DATE NOT NULL,
      terminal_sales NUMERIC DEFAULT 0,
      scratch_sales NUMERIC DEFAULT 0,
      terminal_report_num TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    console.log('✅ daily_entries');

    await sql`CREATE TABLE IF NOT EXISTS scratch_books (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES lt_users(id),
      game_name TEXT NOT NULL,
      book_number TEXT NOT NULL,
      total_tickets INTEGER NOT NULL,
      face_value NUMERIC NOT NULL,
      status TEXT DEFAULT 'active',
      activated_at DATE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    console.log('✅ scratch_books');

    await sql`CREATE TABLE IF NOT EXISTS scratch_sales (
      id SERIAL PRIMARY KEY,
      book_id INTEGER REFERENCES scratch_books(id),
      tickets_sold INTEGER NOT NULL,
      date DATE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    console.log('✅ scratch_sales');

    await sql`CREATE TABLE IF NOT EXISTS settlements (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES lt_users(id),
      amount NUMERIC NOT NULL,
      date DATE NOT NULL,
      discrepancy NUMERIC DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    console.log('✅ settlements');

    const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
    console.log('\nAll public tables:', tables.map(t => t.tablename));

  } catch (e) {
    console.error('ERROR in createSchema:', e.message);
  }
}

createSchema()
  .then(() => console.log('\n🎉 PRODUCTION schema creation complete.'))
  .catch(e => console.error('FATAL ERROR:', e.message));
