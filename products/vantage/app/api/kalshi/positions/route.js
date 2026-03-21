/**
 * GET /api/kalshi/positions
 * Fetches the user's live Kalshi positions and balance using their stored API keys.
 * Calls Kalshi REST API directly (RSA-PSS signed) from the serverless edge.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { sql } from '@vercel/postgres';
import { decrypt } from '../../../utils/encryption';
import crypto from 'crypto';

const KALSHI_BASES = {
  demo: 'https://demo-api.kalshi.co/trade-api/v2',
  live: 'https://api.elections.kalshi.com/trade-api/v2',
};
const API_PREFIX = '/trade-api/v2';

function kalshiSign(privateKeyPem, method, path, timestampMs) {
  // Kalshi signature format: {timestampMs}{METHOD}{/trade-api/v2}{path_no_query}
  const cleanPath = path.split('?')[0];
  const message = `${timestampMs}${method.toUpperCase()}${API_PREFIX}${cleanPath}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  sign.end();
  return sign.sign({ key: privateKeyPem, padding: crypto.constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 }, 'base64');
}

function makeKalshiFetch(base, keyId, privateKeyPem) {
  return async (method, path, body = null) => {
    const ts = Date.now();
    const sig = kalshiSign(privateKeyPem, method, path, ts);
    const headers = {
      'KALSHI-ACCESS-KEY': keyId,
      'KALSHI-ACCESS-TIMESTAMP': String(ts),
      'KALSHI-ACCESS-SIGNATURE': sig,
      'Content-Type': 'application/json',
    };
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${base}${path}`, opts);
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id || session.user.email;

    // Load stored encrypted keys
    const keyRow = await sql`
      SELECT kalshi_key_id, kalshi_secret_encrypted, kalshi_mode,
             kalshi_live_key_id, kalshi_live_secret_encrypted
      FROM user_api_keys WHERE user_id = ${userId}
    `;
    if (!keyRow.rows.length) {
      return NextResponse.json({ error: 'No Kalshi API keys configured', noKeys: true }, { status: 200 });
    }

    const row = keyRow.rows[0];
    const mode = row.kalshi_mode || 'demo';

    // Pick live or demo keys based on mode
    let rawKeyId = mode === 'live' ? (row.kalshi_live_key_id || row.kalshi_key_id) : row.kalshi_key_id;
    let encSecret = mode === 'live' ? (row.kalshi_live_secret_encrypted || row.kalshi_secret_encrypted) : row.kalshi_secret_encrypted;

    if (!rawKeyId || !encSecret) {
      return NextResponse.json({ error: 'No Kalshi API keys configured', noKeys: true }, { status: 200 });
    }

    // Normalize key ID
    let keyId = rawKeyId;
    if (keyId && keyId.includes(':')) keyId = keyId.split(':')[0].trim();
    try {
      const decoded = Buffer.from(keyId, 'base64').toString('utf-8');
      if (decoded.match(/^[0-9a-f-]{36}/i)) keyId = decoded.split(':')[0].trim();
    } catch (_) {}

    // Decrypt the private key
    let privateKeyPem;
    try {
      privateKeyPem = decrypt(encSecret);
    } catch (e) {
      return NextResponse.json({ error: 'Failed to decrypt API key' }, { status: 500 });
    }

    // Determine base URL based on mode
    const base = KALSHI_BASES[mode] || KALSHI_BASES.demo;
    const fetchKalshi = makeKalshiFetch(base, keyId, privateKeyPem);

    // Fetch balance + positions in parallel
    const [balRes, posRes, ordersRes] = await Promise.all([
      fetchKalshi('GET', '/portfolio/balance'),
      fetchKalshi('GET', '/portfolio/positions?count=50&settlement_status=unsettled'),
      fetchKalshi('GET', '/portfolio/orders?limit=20&status=resting'),
    ]);

    const balance = balRes.ok ? balRes.data : null;
    const positions = posRes.ok ? (posRes.data?.market_positions || posRes.data?.positions || []) : [];
    const pendingOrders = ordersRes.ok ? (ordersRes.data?.orders || []) : [];

    // Enrich positions with market titles if needed
    const enriched = positions.map(p => {
      // Kalshi positions API uses position_fp (float) — positive = YES contracts, negative = NO contracts
      const qty = parseFloat(p.position_fp ?? p.position ?? p.yes_position ?? 0);
      const noQty = parseFloat(p.no_position_fp ?? p.no_position ?? 0);
      const isYes = qty > 0 || (qty === 0 && noQty === 0);
      const contracts = Math.abs(qty || noQty);
      return {
        ticker: p.ticker,
        market_title: p.market?.title || p.title || p.ticker,
        yes_contracts: isYes ? contracts : 0,
        no_contracts: isYes ? 0 : contracts,
        cost: parseFloat(p.market_exposure_dollars ?? p.cost_asked ?? p.average_price ?? 0),
        pnl: parseFloat(p.realized_pnl ?? p.realised_pnl ?? p.pnl ?? 0),
        unrealized_pnl: parseFloat(p.unrealized_pnl ?? p.unrealised_pnl ?? 0),
        close_time: p.market?.close_time || p.expiration_time || p.close_time || null,
        side: isYes ? 'yes' : 'no',
        contracts,
      };
    });

    // Snapshot today's balance for chart — write directly to DB
    const tradeCount = enriched.length;
    const today = new Date().toISOString().slice(0, 10);
    sql`
      INSERT INTO portfolio_snapshots (user_id, snapshot_date, balance_cents, portfolio_value_cents, total_pnl, trade_count)
      VALUES (${userId}, ${today}, ${balance?.balance ?? 0}, ${balance?.portfolio_value ?? 0}, ${0}, ${tradeCount})
      ON CONFLICT (user_id, snapshot_date) DO UPDATE SET
        balance_cents = EXCLUDED.balance_cents,
        portfolio_value_cents = EXCLUDED.portfolio_value_cents,
        trade_count = EXCLUDED.trade_count
    `.catch(() => {}); // non-blocking

    return NextResponse.json({
      balance: balance?.balance ?? null,           // in cents
      portfolio_value: balance?.portfolio_value ?? null,
      positions: enriched,
      pending_orders: pendingOrders.length,
      mode: mode || 'live',
      fetched_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Kalshi positions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
