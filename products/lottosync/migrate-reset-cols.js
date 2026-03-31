const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');

dotenv.config({ path: '/root/PastaOS/products/lottosync/.env.vercel-production', override: true });
const sql = neon(process.env.POSTGRES_URL);

async function migrate() {
  await sql`ALTER TABLE lt_users ADD COLUMN IF NOT EXISTS reset_token TEXT`;
  console.log('✅ reset_token');

  await sql`ALTER TABLE lt_users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ`;
  console.log('✅ reset_token_expires');

  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'lt_users' ORDER BY ordinal_position`;
  console.log('lt_users columns:', cols.map(c => c.column_name));
}

migrate().then(() => console.log('Done')).catch(e => console.error('FATAL:', e.message));
