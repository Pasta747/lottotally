/**
 * POST /api/kalshi/sync
 * Pulls the user's real Kalshi order history and syncs it into the trades DB.
 * Called from the dashboard to backfill history.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { sql } from '@vercel/postgres';
import { decrypt } from '../../../utils/encryption';
import crypto from 'crypto';
import { randomUUID } from 'crypto';

const KALSHI_BASES = {
  demo: 'https://demo-api.kalshi.co/trade-api/v2',
  live: 'https://trading-api.kalshi.com/trade-api/v2',
};
const API_PREFIX = '/trade-api/v2';

function kalshiSign(privateKeyPem, method, path, timestampMs) {
  const cleanPath = path.split('?')[0];
  const message = `${timestampMs}${method.toUpperCase()}${API_PREFIX}${cleanPath}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  sign.end();
  return sign.sign({ key: privateKeyPem, padding: crypto.constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 }, 'base64');
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

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id || session.user.email;

    const keyRow = await sql`SELECT kalshi_key_id, kalshi_secret_encrypted, kalshi_mode FROM user_api_keys WHERE user_id = ${userId}`;
    if (!keyRow.rows.length) return NextResponse.json({ error: 'No keys' }, { status: 400 });

    let { kalshi_key_id: keyId, kalshi_secret_encrypted: encSecret, kalshi_mode: mode } = keyRow.rows[0];
    if (keyId?.includes(':')) keyId = keyId.split(':')[0].trim();
    try {
      const d = Buffer.from(keyId, 'base64').toString('utf-8');
      if (d.match(/^[0-9a-f-]{36}/i)) keyId = d.split(':')[0].trim();
    } catch (_) {}

    const pem = decrypt(encSecret);
    const base = KALSHI_BASES[mode] || KALSHI_BASES.demo;

    // Fetch last 50 orders from Kalshi
    const data = await kalshiFetch(base, keyId, pem, '/portfolio/orders?limit=50');
    const orders = data?.orders || [];

    let synced = 0;
    for (const o of orders) {
      if (o.status !== 'executed' && o.status !== 'filled') continue;

      // Check if already in DB
      const existing = await sql`SELECT id FROM trades WHERE kalshi_order_id = ${o.order_id} AND user_id = ${userId}`;
      if (existing.rows.length) continue;

      const side = o.side || 'yes';
      const price = parseFloat(o.yes_price_dollars ?? o.no_price_dollars ?? 0);
      const qty = parseFloat(o.fill_count_fp ?? o.initial_count_fp ?? 1);
      const cost = price * qty;
      const today = (o.created_time || new Date().toISOString()).slice(0, 10);

      // Look up market title
      let marketTitle = o.ticker;
      try {
        const mkt = await kalshiFetch(base, keyId, pem, `/markets/${o.ticker}`);
        marketTitle = mkt?.market?.title || o.ticker;
      } catch (_) {}
      const ticker = o.ticker; // always store the raw ticker for settlement lookup

      // Determine category from ticker
      const t = o.ticker?.toLowerCase() || '';
      const category = t.includes('nba') || t.includes('nhl') || t.includes('mlb') || t.includes('atp') ? 'sports'
        : t.includes('btc') || t.includes('crypto') ? 'crypto'
        : t.includes('quick') ? 'test'
        : 'kalshi';

      // Determine outcome
      const outcome = o.status === 'executed' ? 'pending' : 'pending';

      await sql`
        INSERT INTO trades (id, user_id, date, market, category, layer, side, ev_pct, kelly_amount, outcome, pnl, kalshi_order_id, execution_price, source, signal_strength)
        VALUES (${randomUUID()}, ${userId}, ${today}, ${ticker}, ${category}, ${'kalshi'}, ${side}, ${0}, ${cost}, ${outcome}, ${0}, ${o.order_id}, ${price}, ${'kalshi_sync'}, ${0})
        ON CONFLICT (user_id, kalshi_order_id) DO NOTHING
      `;
      synced++;
    }

    return NextResponse.json({ success: true, synced, total: orders.length });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
