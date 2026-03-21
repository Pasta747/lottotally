/**
 * GET /api/user/chart
 * Returns portfolio performance data for the chart.
 * Pulls from portfolio_snapshots table + today's live Kalshi balance.
 * Returns last 30 days of data points: { date, balance, pnl }
 */

import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id || session.user.email;

    // Get stored snapshots (last 30 days)
    const snapshots = await sql`
      SELECT snapshot_date, balance_cents, portfolio_value_cents, total_pnl, trade_count
      FROM portfolio_snapshots
      WHERE user_id = ${userId}
      ORDER BY snapshot_date ASC
      LIMIT 30
    `;

    // Get user's starting bankroll for baseline
    const userRow = await sql`SELECT bankroll, created_at FROM users WHERE id = ${userId}`;
    const bankroll = parseFloat(userRow.rows[0]?.bankroll || 1000);
    const createdAt = userRow.rows[0]?.created_at;

    const points = snapshots.rows.map(r => ({
      date: r.snapshot_date,
      balance: ((r.balance_cents + r.portfolio_value_cents) / 100),
      pnl: parseFloat(r.total_pnl),
      trades: r.trade_count,
    }));

    // If no snapshots yet, return empty — chart will show placeholder message
    // Do NOT seed with bankroll setting (misleading baseline)
    return NextResponse.json({ points, bankroll });

  } catch (error) {
    console.error('Chart GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — upsert today's snapshot (called by the Kalshi positions route after fetching balance)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id || session.user.email;
    const { balance_cents, portfolio_value_cents, total_pnl, trade_count } = await request.json();

    const today = new Date().toISOString().slice(0, 10);

    await sql`
      INSERT INTO portfolio_snapshots (user_id, snapshot_date, balance_cents, portfolio_value_cents, total_pnl, trade_count)
      VALUES (${userId}, ${today}, ${balance_cents || 0}, ${portfolio_value_cents || 0}, ${total_pnl || 0}, ${trade_count || 0})
      ON CONFLICT (user_id, snapshot_date) DO UPDATE SET
        balance_cents = EXCLUDED.balance_cents,
        portfolio_value_cents = EXCLUDED.portfolio_value_cents,
        total_pnl = EXCLUDED.total_pnl,
        trade_count = EXCLUDED.trade_count
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
