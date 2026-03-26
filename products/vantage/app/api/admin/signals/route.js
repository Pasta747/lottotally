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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Filters
    const sport = searchParams.get('sport');
    const category = searchParams.get('category');
    const outcome = searchParams.get('outcome');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const evMin = searchParams.get('evMin');
    const evMax = searchParams.get('evMax');
    const didWeBet = searchParams.get('didWeBet');

    let where = [];
    let params = [];
    let paramIdx = 1;

    if (sport) { where.push(`sport = $${paramIdx++}`); params.push(sport); }
    if (category) { where.push(`league = $${paramIdx++}`); params.push(category); }
    if (outcome) { where.push(`outcome = $${paramIdx++}`); params.push(outcome); }
    if (dateFrom) { where.push(`created_at >= $${paramIdx++}::date`); params.push(dateFrom); }
    if (dateTo) { where.push(`created_at <= $${paramIdx++}::date`); params.push(dateTo); }
    if (evMin) { where.push(`ev_percent >= $${paramIdx++}`); params.push(parseFloat(evMin)); }
    if (evMax) { where.push(`ev_percent <= $${paramIdx++}`); params.push(parseFloat(evMax)); }
    if (didWeBet !== null && didWeBet !== undefined && didWeBet !== '') {
      where.push(`did_we_bet = $${paramIdx++}`);
      params.push(didWeBet === 'true');
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    // Total count
    const countResult = await sql`
      SELECT COUNT(*) as total FROM signals ${sql.unsafe(whereClause)}
    `;
    const total = parseInt(countResult.rows[0]?.total || 0);

    // Data query
    const dataResult = await sql`
      SELECT
        signal_id, created_at, sport, league, game_id, game_date,
        home_team, away_team, market_type, selection, sportsbook,
        model_probability, fair_probability, ev_percent, kelly_fraction,
        stake_usd, did_we_bet, bet_reason, min_ev_threshold,
        market_odds, american_odds, actual_result, final_score,
        outcome, profit_loss_usd, signal_age_hours
      FROM signals
      ${sql.unsafe(whereClause)}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return NextResponse.json({
      signals: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Admin signals GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
