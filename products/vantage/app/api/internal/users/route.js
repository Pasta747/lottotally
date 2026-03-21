/**
 * GET /api/internal/users
 * Returns all active users with their risk settings for the scan engine.
 * Protected by INTERNAL_API_SECRET env var.
 *
 * POST /api/internal/trades
 * Records a trade result back into the DB from the scan engine.
 */

import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

function checkSecret(request) {
  const secret = request.headers.get('x-internal-secret');
  return secret === process.env.INTERNAL_API_SECRET;
}

export async function GET(request) {
  if (!checkSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sql`
      SELECT
        u.id, u.email, u.bankroll, u.risk_level, u.auto_execute, u.kalshi_mode,
        u.max_wager_dollars, u.max_orders_per_day, u.max_daily_spend,
        k.kalshi_key_id, k.kalshi_secret_encrypted, k.kalshi_mode AS key_mode
      FROM users u
      INNER JOIN user_api_keys k ON k.user_id = u.id
      WHERE k.kalshi_secret_encrypted IS NOT NULL
      ORDER BY u.created_at ASC
    `;

    return NextResponse.json({ users: result.rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
