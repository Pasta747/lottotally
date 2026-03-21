import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id || session.user.email;

    // Optional mode filter: ?mode=live or ?mode=demo (default: all)
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode'); // 'live', 'demo', or null (all)

    const result = mode
      ? await sql`
          SELECT id, date, market, category, layer, side, ev_pct, kelly_amount, outcome, pnl, account_mode, created_at
          FROM trades
          WHERE user_id = ${userId} AND (account_mode = ${mode} OR (${mode} = 'demo' AND account_mode IS NULL))
          ORDER BY created_at DESC LIMIT 100
        `
      : await sql`
          SELECT id, date, market, category, layer, side, ev_pct, kelly_amount, outcome, pnl, account_mode, created_at
          FROM trades
          WHERE user_id = ${userId}
          ORDER BY created_at DESC LIMIT 100
        `;

    return NextResponse.json({ trades: result.rows });
  } catch (error) {
    console.error('Trades GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
