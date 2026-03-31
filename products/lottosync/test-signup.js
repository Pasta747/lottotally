const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

const sql = neon(process.env.POSTGRES_URL);

async function testSignup() {
  try {
    const email = 'local-test@lottotally.com';
    
    // Step 1: Check existing user
    console.log('Step 1: Checking existing user...');
    const existing = await sql`SELECT id FROM lt_users WHERE email = ${email}`;
    console.log('Existing check result:', existing, 'Length:', existing.length);
    
    // Step 2: Hash password
    console.log('Step 2: Hashing password...');
    const hash = await bcrypt.hash('TestPass123!', 10);
    console.log('Hash generated:', hash.substring(0, 20) + '...');
    
    // Step 3: Insert
    console.log('Step 3: Inserting user...');
    await sql`INSERT INTO lt_users (email, password_hash, store_name, state, commission_rate) VALUES (${email}, ${hash}, ${'Test Store'}, ${'CA'}, 5.5)`;
    console.log('✅ Insert succeeded');
    
    // Step 4: Verify
    console.log('Step 4: Verifying...');
    const verify = await sql`SELECT id, email, store_name FROM lt_users WHERE email = ${email}`;
    console.log('Verification:', verify);
    
    // Cleanup
    await sql`DELETE FROM lt_users WHERE email = ${email}`;
    console.log('✅ Cleanup done');
    
  } catch (e) {
    console.error('❌ FAILED at step:', e.message);
    console.error('Full error:', e);
  }
}

testSignup();
