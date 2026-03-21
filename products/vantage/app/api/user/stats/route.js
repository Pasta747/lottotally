import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/route';
import { ensureSchema, sql } from '../../../lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id || session.user.email;
  await ensureSchema();

  const { rows } = await sql`SELECT
      COALESCE(SUM(pnl), 0) AS total_pnl,
      COUNT(*) AS total_trades,
      COALESCE(SUM(CASE WHEN outcome = 'win' THEN 1 ELSE 0 END), 0) AS wins,
      COALESCE(SUM(kelly_amount), 0) AS total_wagered
    FROM trades WHERE user_id = ${userId}`;

  const s = rows[0] || { total_pnl: 0, total_trades: 0, wins: 0, total_wagered: 0 };
  const totalTrades = Number(s.total_trades || 0);
  const wins = Number(s.wins || 0);
  const totalWagered = Number(s.total_wagered || 0);
  const totalPnl = Number(s.total_pnl || 0);
  const winRate = totalTrades ? (wins / totalTrades) * 100 : 0;
  const roi = totalWagered ? (totalPnl / totalWagered) * 100 : 0;

  return NextResponse.json({
    pnl: totalPnl,
    totalTrades,
    winRate,
    roi,
    totalWagered,
  });
}
