#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: '/root/PastaOS/.env' });
require('dotenv').config({ path: '/root/PastaOS/products/vantage/.env.local' });

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const AUDIT_FILE = path.join(__dirname, '..', 'data', 'founder-audit.json');

async function main() {
  if (!process.env.POSTGRES_URL) {
    console.error('POSTGRES_URL not set. Cannot proceed.');
    process.exit(1);
  }
  console.log('POSTGRES_URL found, connecting...');

  const { sql } = await import('@vercel/postgres');

  // Check existing trades to avoid dupes
  const existing = await sql`SELECT kalshi_order_id FROM trades WHERE kalshi_order_id IS NOT NULL`;
  const existingIds = new Set(existing.rows.map(r => r.kalshi_order_id));
  console.log(`Existing trades with order IDs in DB: ${existingIds.size}`);

  const audit = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
  const placed = audit.filter(e =>
    e.result === 'PLACED' &&
    e.mode === 'live' &&
    e.orderId
  );

  // Dedupe by orderId (audit has duplicates from multiple scan cycles)
  const uniqueByOrder = new Map();
  for (const t of placed) {
    if (!uniqueByOrder.has(t.orderId)) uniqueByOrder.set(t.orderId, t);
  }
  const deduped = [...uniqueByOrder.values()];
  console.log(`Found ${placed.length} PLACED entries, ${deduped.length} unique by orderId`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const trade of deduped) {
    if (existingIds.has(trade.orderId)) {
      skipped++;
      continue;
    }

    const id = randomUUID();
    const date = trade.ts ? trade.ts.slice(0, 10) : '2026-03-22';
    const ticker = trade.ticker;
    const userId = trade.userId;
    const side = trade.side;
    const wagerDollars = trade.wagerDollars || 1;
    const orderId = trade.orderId;

    let category = 'kalshi';
    const layer = 'kalshi_native';
    if (ticker.startsWith('KXNCAA')) category = 'ncaa';
    else if (ticker.startsWith('KXNBA')) category = 'nba';
    else if (ticker.startsWith('KXMLB')) category = 'mlb';
    else if (ticker.startsWith('KXNHL')) category = 'nhl';
    else if (ticker.startsWith('KXATP') || ticker.startsWith('KXWTA')) category = 'tennis';
    else if (ticker.startsWith('KXEPL')) category = 'epl';
    else if (ticker.startsWith('KXBTC')) category = 'crypto';

    try {
      await sql`
        INSERT INTO trades (id, user_id, date, market, category, layer, side, ev_pct, kelly_amount,
                            outcome, pnl, kalshi_order_id, execution_price, source, account_mode, signal_strength)
        VALUES (${id}, ${userId}, ${date}, ${ticker}, ${category}, ${layer},
                ${side}, ${0}, ${wagerDollars}, ${'pending'}, ${0},
                ${orderId}, ${wagerDollars}, ${'vantage_engine'}, ${'live'}, ${0})
      `;
      inserted++;
    } catch (err) {
      errors++;
      console.error(`  ERR ${ticker} (${orderId.slice(0,8)}): ${err.message}`);
    }
  }

  console.log(`\nBackfill complete: ${inserted} inserted, ${skipped} skipped, ${errors} errors`);

  const pending = await sql`SELECT COUNT(*) as cnt FROM trades WHERE outcome = 'pending'`;
  console.log(`Pending trades in DB: ${pending.rows[0].cnt}`);
}

main().then(() => {
  console.log('\nNow triggering settlement via API...');
  const secret = process.env.INTERNAL_API_SECRET;
  const BASE_URL = 'https://app.yourvantage.ai';
  return fetch(`${BASE_URL}/api/internal/settle`, {
    method: 'POST',
    headers: { 'x-internal-secret': secret, 'Content-Type': 'application/json' },
  }).then(r => r.json());
}).then((summary) => {
  console.log('Settlement result:', JSON.stringify(summary, null, 2));
  process.exit(0);
}).catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
