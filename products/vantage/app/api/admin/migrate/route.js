import { NextResponse } from 'next/server';
import { initDB, migrateV2, migrateV3 } from '../../../lib/db';
import { sql } from '@vercel/postgres';

export async function POST(request) {
  // Simple secret check to prevent public access
  const { secret } = await request.json().catch(() => ({}));
  if (secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await initDB();
    await migrateV2();
    await migrateV3();
    // Clear bad snapshots (balance_cents = 50000 = $500 from bankroll setting, not real balance)
    await sql`DELETE FROM portfolio_snapshots WHERE balance_cents = 50000`;
    return NextResponse.json({ success: true, message: 'Tables created/verified. Admin schema applied.' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
