import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

const ADMIN_EMAIL = 'mario@yourvantage.ai';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const sport = searchParams.get('sport');

    let sportFilter = sport ? `AND sport = '${sport}'` : '';

    // Total signals
    const totalResult = await sql`
      SELECT COUNT(*) as total FROM signals
      WHERE created_at >= NOW() - INTERVAL '${sql.raw(days + ' days')}'
      ${sql.unsafe(sportFilter ? `AND sport = ${sport}` : '')}
    `;
    const totalSignals = parseInt(totalResult.rows[0]?.total || 0);

    // Win rate (settled signals only)
    const winRateResult = await sql`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN outcome = 'win' THEN 1 ELSE 0 END) as wins
      FROM signals
      WHERE created_at >= NOW() - INTERVAL '${sql.raw(days + ' days')}'
        AND outcome IN ('win', 'loss', 'push')
        ${sport ? sql`AND sport = ${sport}` : sql``}
    `;
    const settled = parseInt(winRateResult.rows[0]?.total || 0);
    const wins = parseInt(winRateResult.rows[0]?.wins || 0);
    const winRate = settled > 0 ? ((wins / settled) * 100).toFixed(1) : '0.0';

    // Average EV%
    const evResult = await sql`
      SELECT AVG(ev_percent) as avg_ev FROM signals
      WHERE created_at >= NOW() - INTERVAL '${sql.raw(days + ' days')}'
      ${sport ? sql`AND sport = ${sport}` : sql``}
    `;
    const avgEv = parseFloat(evResult.rows[0]?.avg_ev || 0).toFixed(2);

    // Total P&L
    const pnlResult = await sql`
      SELECT SUM(profit_loss_usd) as total_pnl FROM signals
      WHERE created_at >= NOW() - INTERVAL '${sql.raw(days + ' days')}'
      ${sport ? sql`AND sport = ${sport}` : sql``}
    `;
    const totalPnl = parseFloat(pnlResult.rows[0]?.total_pnl || 0).toFixed(2);

    // Signals by day (last N days)
    const dailyResult = await sql`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count,
        SUM(CASE WHEN outcome = 'win' THEN 1 ELSE 0 END) as wins,
        AVG(ev_percent) as avg_ev
      FROM signals
      WHERE created_at >= NOW() - INTERVAL '${sql.raw(days + ' days')}'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    // Signals by sport
    const sportResult = await sql`
      SELECT
        sport,
        COUNT(*) as count,
        ROUND(AVG(ev_percent)::numeric, 2) as avg_ev,
        SUM(CASE WHEN outcome = 'win' THEN 1 ELSE 0 END)::float /
          NULLIF(SUM(CASE WHEN outcome IN ('win','loss') THEN 1 ELSE 0 END), 0) * 100 as win_rate
      FROM signals
      WHERE created_at >= NOW() - INTERVAL '${sql.raw(days + ' days')}'
      GROUP BY sport
      ORDER BY count DESC
    `;

    // Did we bet vs didn't bet breakdown
    const betBreakdown = await sql`
      SELECT
        did_we_bet,
        COUNT(*) as count,
        SUM(CASE WHEN outcome = 'win' THEN 1 ELSE 0 END)::float /
          NULLIF(SUM(CASE WHEN outcome IN ('win','loss') THEN 1 ELSE 0 END), 0) * 100 as win_rate
      FROM signals
      WHERE created_at >= NOW() - INTERVAL '${sql.raw(days + ' days')}'
        AND outcome IN ('win', 'loss')
      GROUP BY did_we_bet
    `;

    return NextResponse.json({
      stats: {
        totalSignals,
        winRate,
        avgEv,
        totalPnl,
        settled,
        wins,
      },
      daily: dailyResult.rows,
      bySport: sportResult.rows,
      betBreakdown: betBreakdown.rows,
    });
  } catch (error) {
    console.error('Admin overview stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
