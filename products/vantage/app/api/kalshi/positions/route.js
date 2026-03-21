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
  live: 'https://trading-api.kalshi.com/trade-api/v2',
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
      SELECT kalshi_key_id, kalshi_secret_encrypted, kalshi_mode
      FROM user_api_keys WHERE user_id = ${userId}
    `;
    if (!keyRow.rows.length || !keyRow.rows[0].kalshi_secret_encrypted) {
      return NextResponse.json({ error: 'No Kalshi API keys configured', noKeys: true }, { status: 200 });
    }

    let { kalshi_key_id: keyId, kalshi_secret_encrypted: encSecret, kalshi_mode: mode } = keyRow.rows[0];
    // Normalize key ID — strip anything after ':' (Kalshi copy-paste artifact)
    if (keyId && keyId.includes(':')) keyId = keyId.split(':')[0].trim();
    // Also handle base64-encoded combined key (copy-paste into wrong field)
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
    const enriched = positions.map(p => ({
      ticker: p.ticker,
      market_title: p.market?.title || p.title || p.ticker,
      yes_contracts: p.position || p.yes_contracts || 0,
      no_contracts: p.no_position || p.no_contracts || 0,
      cost: p.cost_asked || p.average_price || null,
      pnl: p.realised_pnl ?? p.pnl ?? null,
      unrealized_pnl: p.unrealised_pnl ?? null,
      close_time: p.market?.close_time || p.close_time || null,
      side: (p.position || 0) > 0 ? 'yes' : 'no',
    }));

    // Snapshot today's balance for chart (fire-and-forget)
    const tradeCount = enriched.length;
    fetch(`${process.env.NEXTAUTH_URL || 'https://app.yourvantage.ai'}/api/user/chart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': '' },
      body: JSON.stringify({
        balance_cents: balance?.balance ?? 0,
        portfolio_value_cents: balance?.portfolio_value ?? 0,
        total_pnl: 0,
        trade_count: tradeCount,
      }),
    }).catch(() => {}); // non-blocking

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
