/**
 * POST /api/internal/settle
 * Runs the full settlement loop server-side (Vercel has ENCRYPTION_KEY).
 * Called by the settlement-tracker.js cron every 30 min.
 *
 * For each pending trade:
 *  1. Resolves Kalshi ticker (via order ID if needed — uses user's decrypted keys)
 *  2. Checks market result via public Kalshi API
 *  3. Updates trade outcome + P&L in DB
 *  4. Returns summary
 */

import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { decrypt } from '../../../utils/encryption';
import crypto from 'crypto';

const KALSHI_BASES = {
  demo: 'https://demo-api.kalshi.co/trade-api/v2',
  live: 'https://api.elections.kalshi.com/trade-api/v2',
};
const API_PREFIX = '/trade-api/v2';

function checkSecret(request) {
  return request.headers.get('x-internal-secret') === process.env.INTERNAL_API_SECRET;
}

function kalshiSign(pem, method, path, ts) {
  const msg = `${ts}${method.toUpperCase()}${API_PREFIX}${path.split('?')[0]}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(msg);
  sign.end();
  return sign.sign({ key: pem, padding: crypto.constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 }, 'base64');
}

async function kalshiFetch(base, keyId, pem, path) {
  const ts = Date.now();
  const sig = kalshiSign(pem, 'GET', path, ts);
  const res = await fetch(`${base}${path}`, {
    headers: {
      'KALSHI-ACCESS-KEY': keyId,
      'KALSHI-ACCESS-TIMESTAMP': String(ts),
      'KALSHI-ACCESS-SIGNATURE': sig,
    },
  });
  return res.json().catch(() => null);
}

async function publicMarketResult(ticker) {
  for (const base of Object.values(KALSHI_BASES)) {
    try {
      const res = await fetch(`${base}/markets/${ticker}`);
      if (!res.ok) continue;
      const d = await res.json();
      const result = d?.market?.result;
      if (result !== undefined) return { result, status: d?.market?.status };
    } catch (_) {}
  }
  return { result: null, status: null };
}

function computePnl({ side, executionPrice, settledResult }) {
  const px = Number(executionPrice) || 0.5;
  const isWin = String(side).toLowerCase() === String(settledResult).toLowerCase();
  const pnl = isWin ? (1 - px) : -px;
  return { outcome: isWin ? 'win' : 'loss', pnl: Math.round(pnl * 10000) / 10000 };
}

export async function POST(request) {
  if (!checkSecret(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Load all pending trades with their user keys
    const pendingResult = await sql`
      SELECT t.id, t.user_id, t.market, t.side, t.execution_price, t.kalshi_order_id, t.category, t.layer, t.source,
             k.kalshi_key_id, k.kalshi_secret_encrypted, k.kalshi_mode
      FROM trades t
      LEFT JOIN user_api_keys k ON k.user_id = t.user_id
      WHERE t.outcome = 'pending'
      ORDER BY t.created_at ASC
      LIMIT 100
    `;

    const trades = pendingResult.rows;
    const summary = { checked: trades.length, settled: 0, wins: 0, losses: 0, skipped: 0, errors: 0 };

    for (const trade of trades) {
      try {
        let ticker = trade.market;
        const looksLikeTicker = /^[A-Z0-9_-]+$/.test(ticker) && !ticker.includes(' ');

        // If market field has a title, resolve ticker via Kalshi order lookup
        if (!looksLikeTicker && trade.kalshi_order_id && trade.kalshi_key_id && trade.kalshi_secret_encrypted) {
          try {
            const pem = decrypt(trade.kalshi_secret_encrypted);
            const mode = trade.kalshi_mode || 'demo';
            const base = KALSHI_BASES[mode] || KALSHI_BASES.demo;
            let keyId = trade.kalshi_key_id;
            if (keyId.includes(':')) keyId = keyId.split(':')[0].trim();
            const orderData = await kalshiFetch(base, keyId, pem, `/portfolio/orders/${trade.kalshi_order_id}`);
            const orderTicker = orderData?.order?.ticker;
            if (orderTicker) ticker = orderTicker;
          } catch (_) {}
        }

        if (!ticker || ticker.includes(' ')) {
          summary.skipped++;
          continue;
        }

        const { result, status } = await publicMarketResult(ticker);

        // Only settle if market is finalized
        if (!result || !['yes', 'no'].includes(result.toLowerCase())) {
          summary.skipped++;
          continue;
        }

        const { outcome, pnl } = computePnl({
          side: trade.side,
          executionPrice: trade.execution_price,
          settledResult: result,
        });

        await sql`
          UPDATE trades SET outcome = ${outcome}, pnl = ${pnl}
          WHERE id = ${trade.id}
        `;

        summary.settled++;
        if (outcome === 'win') summary.wins++;
        else summary.losses++;

      } catch (err) {
        summary.errors++;
        console.error(`settle error trade ${trade.id}:`, err.message);
      }
    }

    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
