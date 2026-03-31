const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: '/root/PastaOS/products/lottosync/.env.vercel-production', override: true });

const sql = neon(process.env.POSTGRES_URL);

async function bypassPassword() {
  const email = 'mario.piergallini@gmail.com';
  const newPassword = 'MarioPassword123!'; // New password for Mario

  try {
    // Verify user exists
    const userResult = await sql`SELECT id FROM lt_users WHERE email = ${email}`;
    if (userResult.length === 0) {
      console.log(`User ${email} not found, cannot bypass password.`);
      return;
    }
    const userId = userResult[0].id;

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password and clear the reset token fields
    await sql`
      UPDATE lt_users
      SET
        password_hash = ${hashedPassword},
        reset_token = NULL,
        reset_token_expires = NULL
      WHERE id = ${userId}
    `;
    console.log(`Password for ${email} successfully reset.`);
  } catch (e) {
    console.error('ERROR bypassing password:', e.message);
  }
}

bypassPassword();
