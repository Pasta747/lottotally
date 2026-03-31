const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');

dotenv.config({ path: '/root/PastaOS/products/lottosync/.env.vercel-production', override: true });
const sql = neon(process.env.POSTGRES_URL);

async function migrate() {
  // Check current columns
  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'lt_users' ORDER BY ordinal_position`;
  console.log('Current lt_users columns:', cols.map(c => c.column_name));

  // Add each column separately
  await sql`ALTER TABLE lt_users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`;
  console.log('✅ stripe_customer_id');

  await sql`ALTER TABLE lt_users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`;
  console.log('✅ stripe_subscription_id');

  await sql`ALTER TABLE lt_users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free'`;
  console.log('✅ plan');

  // Verify
  const updated = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'lt_users' ORDER BY ordinal_position`;
  console.log('Updated lt_users columns:', updated.map(c => c.column_name));
}

migrate().then(() => console.log('Done')).catch(e => console.error('FATAL:', e.message));
