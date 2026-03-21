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

    // Default to live stats only — demo trades are noise in the hero
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'live';

    const statsResult = mode === 'all'
      ? await sql`
          SELECT COUNT(*) as total_trades,
                 SUM(CASE WHEN outcome = 'win' THEN 1 ELSE 0 END) as winning_trades,
                 SUM(pnl) as total_pnl,
                 SUM(ABS(COALESCE(execution_price, kelly_amount, 0))) as total_wagered
          FROM trades WHERE user_id = ${userId}
        `
      : await sql`
          SELECT COUNT(*) as total_trades,
                 SUM(CASE WHEN outcome = 'win' THEN 1 ELSE 0 END) as winning_trades,
                 SUM(pnl) as total_pnl,
                 SUM(ABS(COALESCE(execution_price, kelly_amount, 0))) as total_wagered
          FROM trades
          WHERE user_id = ${userId}
            AND (account_mode = ${mode} OR (${mode} = 'demo' AND account_mode IS NULL))
        `;

    const stats = statsResult.rows[0];
    const total = parseInt(stats.total_trades) || 0;
    const wins = parseInt(stats.winning_trades) || 0;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const totalPnl = parseFloat(stats.total_pnl || 0);
    const wagered = parseFloat(stats.total_wagered || 0);
    const roi = wagered > 0 ? (totalPnl / wagered) * 100 : 0;

    return NextResponse.json({
      stats: {
        pnl: totalPnl.toFixed(2),
        winRate: winRate.toFixed(2),
        roi: roi.toFixed(2),
        wagered: wagered.toFixed(2),
        total_trades: total,
        mode,
      }
    });
  } catch (error) {
    console.error('Stats GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
