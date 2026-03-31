const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.POSTGRES_URL);

async function checkDb() {
  try {
    console.log('Starting DB checks...');
    const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'lt_%'`;
    console.log('LottoTally tables:', tables.map(t => t.tablename));

    const columns = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'lt_users' ORDER BY ordinal_position`;
    console.log('lt_users columns:', columns.map(c => `${c.column_name} (${c.data_type})`));

    const count = await sql`SELECT COUNT(*) as cnt FROM lt_users`;
    console.log('lt_users row count:', count[0].cnt);

    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('TestPass123!', 10);
    console.log('Attempting to insert test user...');
    await sql`INSERT INTO lt_users (email, password_hash, store_name, state, commission_rate) VALUES ('db-test@lottotally.com', ${hash}, 'DB Test Store', 'CA', 5.5)`;
    console.log('✅ Test insert succeeded');
    console.log('Attempting to clean up test user...');
    await sql`DELETE FROM lt_users WHERE email = 'db-test@lottotally.com'`;
    console.log('✅ Test cleanup succeeded');
  } catch (e) {
    console.error('ERROR:', e.message);
  }
}

checkDb();
