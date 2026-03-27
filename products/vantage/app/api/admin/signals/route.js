import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

const ADMIN_EMAILS = ['mario@yourvantage.ai', 'mario.piergallini@gmail.com'];

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
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

    if (sport) { where.push(`sport_label = $${paramIdx++}`); params.push(sport); }
    if (category) { where.push(`category = $${paramIdx++}`); params.push(category); }
    if (outcome) { where.push(`outcome = $${paramIdx++}`); params.push(outcome); }
    if (dateFrom) { where.push(`created_at >= $${paramIdx++}::date`); params.push(dateFrom); }
    if (dateTo) { where.push(`created_at <= $${paramIdx++}::date`); params.push(dateTo); }
    if (evMin) { where.push(`ev_pct >= $${paramIdx++}`); params.push(parseFloat(evMin)); }
    if (evMax) { where.push(`ev_pct <= $${paramIdx++}`); params.push(parseFloat(evMax)); }
    if (didWeBet !== null && didWeBet !== undefined && didWeBet !== '') {
      where.push(`did_we_bet = $${paramIdx++}`);
      params.push(didWeBet === 'true');
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    // Total count
    const countResult = await sql`
      SELECT COUNT(*) as total FROM signal_events ${sql.unsafe(whereClause)}
    `;
    const total = parseInt(countResult.rows[0]?.total || 0);

    // Data query
    const dataResult = await sql`
      SELECT
        id, created_at, sport_label, category, ticker, game,
        market_question, side, market_price, execution_price,
        estimated_prob, signal_strength, ev_pct, kelly_fraction,
        stake_usd, did_we_bet, bet_reason, min_ev_threshold,
        actual_result, final_score, outcome, profit_loss_usd,
        signal_age_hours, layer, source, raw_payload
      FROM signal_events
      ${sql.unsafe(whereClause)}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    console.log('Signals query result:', dataResult.rows.length, 'rows', '| filters:', { sport, category, outcome, dateFrom, dateTo, evMin, evMax, didWeBet });

    // Transform rows to match frontend expected field names
    const signals = dataResult.rows.map(row => ({
      signal_id: row.id,
      created_at: row.created_at,
      sport_label: row.sport_label,
      category: row.category,
      ticker: row.ticker,
      game: row.game,
      market_question: row.market_question,
      side: row.side,
      market_price: row.market_price,
      execution_price: row.execution_price,
      model_probability: row.estimated_prob,
      signal_strength: row.signal_strength,
      ev_percent: row.ev_pct,
      kelly_fraction: row.kelly_fraction,
      stake_usd: row.stake_usd,
      did_we_bet: row.did_we_bet,
      bet_reason: row.bet_reason,
      min_ev_threshold: row.min_ev_threshold,
      actual_result: row.actual_result,
      final_score: row.final_score,
      outcome: row.outcome,
      profit_loss_usd: row.profit_loss_usd,
      signal_age_hours: row.signal_age_hours,
      layer: row.layer,
      source: row.source,
      raw_payload: row.raw_payload,
    }));

    return NextResponse.json({
      signals,
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
