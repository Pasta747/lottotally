import { NextResponse } from 'next/server';
import { initDB, migrateV2 } from '../../../lib/db';

export async function POST(request) {
  // Simple secret check to prevent public access
  const { secret } = await request.json().catch(() => ({}));
  if (secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await initDB();
    await migrateV2();
    return NextResponse.json({ success: true, message: 'Tables created/verified.' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
