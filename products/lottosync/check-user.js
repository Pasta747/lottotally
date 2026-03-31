const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');

dotenv.config({ path: '/root/PastaOS/products/lottosync/.env.vercel-production', override: true });
const sql = neon(process.env.POSTGRES_URL);

async function check() {
  // Check all users
  const users = await sql`SELECT id, email, store_name, plan, created_at FROM lt_users ORDER BY id`;
  console.log('All users:', JSON.stringify(users, null, 2));

  // Check Mario specifically
  const mario = await sql`SELECT id, email, password_hash, store_name FROM lt_users WHERE email = 'mario.piergallini@gmail.com'`;
  console.log('\nMario account:', mario.length > 0 ? mario[0] : 'NOT FOUND');
}

check().catch(e => console.error('ERROR:', e.message));
