import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/route';
import { ensureSchema, sql } from '../../../lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id || session.user.email;
  await ensureSchema();

  const { rows } = await sql`SELECT id, date, market, category, layer, side, ev_pct, kelly_amount, outcome, pnl, created_at
                            FROM trades
                            WHERE user_id = ${userId}
                            ORDER BY created_at DESC
                            LIMIT 100`;
  return NextResponse.json({ trades: rows });
}
