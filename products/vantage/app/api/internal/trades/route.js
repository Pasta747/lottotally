/**
 * POST /api/internal/trades
 * Called by the scan engine to record executed trades into the DB.
 * Protected by INTERNAL_API_SECRET.
 */

import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

function checkSecret(request) {
  return request.headers.get('x-internal-secret') === process.env.INTERNAL_API_SECRET;
}

export async function POST(request) {
  if (!checkSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId, ticker, title, category, side, ev_pct, kelly_amount, outcome, pnl, mode } = await request.json();

    if (!userId || !ticker || !side) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = randomUUID();
    const today = new Date().toISOString().slice(0, 10);

    await sql`
      INSERT INTO trades (id, user_id, date, market, category, layer, side, ev_pct, kelly_amount, outcome, pnl)
      VALUES (
        ${id},
        ${userId},
        ${today},
        ${title || ticker},
        ${category || 'kalshi'},
        ${'kalshi_native'},
        ${side},
        ${ev_pct || 0},
        ${kelly_amount || 0},
        ${outcome || 'pending'},
        ${pnl || 0}
      )
    `;

    return NextResponse.json({ success: true, tradeId: id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
