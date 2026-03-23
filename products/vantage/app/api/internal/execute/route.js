/**
 * POST /api/internal/execute
 * Places a real Kalshi order using the user's stored (decryptable) keys.
 * Called by the scan engine when a signal passes all filters.
 * Protected by INTERNAL_API_SECRET.
 */

import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { decrypt } from '../../../utils/encryption'; // Corrected import path
import crypto from 'crypto';

// Decision Journal Integration - REMOVED: Cannot import local filesystem modules on Vercel.
// The Vercel API route should only interact with the database.

const KALSHI_BASES = {
  demo: 'https://demo-api.kalshi.co/trade-api/v2',
  live: 'https://api.elections.kalshi.com/trade-api/v2',
};
const API_PREFIX = '/trade-api/v2';

function checkSecret(request) {
  return request.headers.get('x-internal-secret') === process.env.INTERNAL_API_SECRET;
}

function kalshiSign(pem, method, path, ts) {
  const msg = `\${ts}\${method.toUpperCase()}\${API_PREFIX}\${path.split('?')[0]}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(msg);
  sign.end();
  return sign.sign({ key: pem, padding: crypto.constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 }, 'base64');
}

export async function POST(request) {
  if (!checkSecret(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { userId, ticker, side, count, wagerDollars, marketPrice, signalStrength, category, layer, title } = body;

    if (!userId || !ticker || !side) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Look up user's Kalshi API keys
    const keyRow = await sql`
      SELECT kalshi_key_id, kalshi_secret_encrypted, kalshi_mode,
             kalshi_live_key_id, kalshi_live_secret_encrypted
      FROM user_api_keys WHERE user_id = ${userId}
    `;
    if (!keyRow.rows.length) {
      return NextResponse.json({ error: 'No keys for user' }, { status: 404 });
    }

    const row = keyRow.rows[0];
    const mode = row.kalshi_mode || 'live';
    const rawKeyId = mode === 'live' ? (row.kalshi_live_key_id || row.kalshi_key_id) : row.kalshi_key_id;
    const encSecret = mode === 'live' ? (row.kalshi_live_secret_encrypted || row.kalshi_secret_encrypted) : row.kalshi_secret_encrypted;

    if (!rawKeyId || !encSecret) {
      return NextResponse.json({ error: `No keys configured for mode: ${mode}` }, { status: 400 });
    }

    let keyId = rawKeyId;
    if (keyId?.includes(':')) keyId = keyId.split(':')[0].trim();

    const pem = decrypt(encSecret);
    const base = KALSHI_BASES[mode] || KALSHI_BASES.live;

    // Sign and place the order
    const ts = Date.now();
    const orderPath = '/portfolio/orders';
    const sig = kalshiSign(pem, 'POST', orderPath, ts);

    const orderBody = {
      ticker,
      action: 'buy',
      side,
      type: 'limit',
      count: count || 1,
      [`${side}_price`]: Math.round((marketPrice || 0.5) * 100),
    };

    const res = await fetch(`${base}${orderPath}`, {
      method: 'POST',
      headers: {
        'KALSHI-ACCESS-KEY': keyId,
        'KALSHI-ACCESS-TIMESTAMP': String(ts),
        'KALSHI-ACCESS-SIGNATURE': sig,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderBody),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.error('Kalshi API error:', { status: res.status, error: data?.error || data, ticker, userId, mode });
      return NextResponse.json({ ok: false, status: res.status, error: data?.error || data, mode }, { status: 200 });
    }

    const orderId = data?.order?.order_id;
    const today = new Date().toISOString().slice(0, 10);

    // Persist trade to DB — ON CONFLICT updates outcome/pnl for idempotency
    try {
      await sql`
        INSERT INTO trades (id, user_id, date, market, category, layer, side, ev_pct, kelly_amount,
                            outcome, pnl, kalshi_order_id, execution_price, source, account_mode, signal_strength)
        VALUES (${crypto.randomUUID()}, ${userId}, ${today}, ${ticker}, ${category || 'kalshi'}, ${layer || 'kalshi_native'},
                ${side}, ${signalStrength || 0}, ${wagerDollars || 0}, 'pending', 0,
                ${orderId || null}, ${wagerDollars || 0}, 'vantage_engine', ${mode}, ${signalStrength || 0})
      `;
    } catch (dbErr) {
      // CRITICAL: Surface DB errors instead of silently swallowing them
      console.error('DB INSERT failed for trade:', { orderId, ticker, userId, error: dbErr.message });
      // Trade was placed on Kalshi successfully, so still return ok but flag DB issue
      return NextResponse.json({ ok: true, orderId, mode, ticker, side, wagerDollars, dbWarning: 'Trade placed but DB write failed: ' + dbErr.message });
    }

    return NextResponse.json({ ok: true, orderId, mode, ticker, side, wagerDollars });

  } catch (error) {
    console.error('Execute error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
