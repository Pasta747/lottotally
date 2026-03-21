/**
 * /api/internal/trades
 * GET  -> list pending trades for settlement polling
 * POST -> record executed trades from scan engine
 *
 * Protected by INTERNAL_API_SECRET via x-internal-secret header.
 */

import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

function checkSecret(request) {
  return request.headers.get('x-internal-secret') === process.env.INTERNAL_API_SECRET;
}

export async function GET(request) {
  if (!checkSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sql`
      SELECT id, user_id, market, category, layer, source, side, outcome, pnl, kelly_amount, execution_price, contracts, kalshi_order_id, created_at
      FROM trades
      WHERE outcome = 'pending'
      ORDER BY created_at ASC
    `;

    return NextResponse.json({ trades: result.rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (!checkSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId, ticker, title, category, layer, source, side, ev_pct, kelly_amount, execution_price, contracts, outcome, pnl } = await request.json();

    if (!userId || !ticker || !side) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = randomUUID();
    const today = new Date().toISOString().slice(0, 10);

    await sql`
      INSERT INTO trades (id, user_id, date, market, category, layer, source, side, ev_pct, kelly_amount, execution_price, contracts, outcome, pnl)
      VALUES (
        ${id},
        ${userId},
        ${today},
        ${ticker},
        ${category || 'kalshi'},
        ${layer || 'kalshi_native'},
        ${source || null},
        ${side},
        ${ev_pct || 0},
        ${kelly_amount || 0},
        ${execution_price ?? null},
        ${contracts ?? null},
        ${outcome || 'pending'},
        ${pnl || 0}
      )
    `;

    return NextResponse.json({ success: true, tradeId: id, market: ticker, title: title || null });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
