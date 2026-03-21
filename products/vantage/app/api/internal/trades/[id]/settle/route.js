/**
 * POST /api/internal/trades/:id/settle
 * Body: { outcome: 'win'|'loss', pnl: number }
 * Protected by INTERNAL_API_SECRET via x-internal-secret header.
 */

import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

function checkSecret(request) {
  return request.headers.get('x-internal-secret') === process.env.INTERNAL_API_SECRET;
}

export async function POST(request, { params }) {
  if (!checkSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tradeId = params?.id;
  if (!tradeId) {
    return NextResponse.json({ error: 'Missing trade id' }, { status: 400 });
  }

  try {
    const { outcome, pnl } = await request.json();
    const normalizedOutcome = String(outcome || '').toLowerCase();

    if (!['win', 'loss'].includes(normalizedOutcome)) {
      return NextResponse.json({ error: 'Invalid outcome; expected win|loss' }, { status: 400 });
    }

    const pnlNumber = Number(pnl);
    if (!Number.isFinite(pnlNumber)) {
      return NextResponse.json({ error: 'Invalid pnl' }, { status: 400 });
    }

    const result = await sql`
      UPDATE trades
      SET outcome = ${normalizedOutcome}, pnl = ${pnlNumber}
      WHERE id = ${tradeId}
      RETURNING id, user_id, market, category, layer, source, side, outcome, pnl, kelly_amount, execution_price, contracts, created_at
    `;

    if (!result.rows?.length) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, trade: result.rows[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
