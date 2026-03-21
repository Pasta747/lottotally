/**
 * place-demo-order.js
 * Places a test order on KXQUICKSETTLE (demo env) to validate the full pipeline.
 * Market opens at 18:50 UTC (11:50 AM PDT), closes at 19:00 UTC (12:00 PM PDT).
 * "Will 1+1 = 2?" — guaranteed YES resolution.
 */

'use strict';

const { KalshiClient } = require('/root/PastaOS/Plutus/oddstool-v2/kalshi-client');

const TARGET_TICKER = 'KXQUICKSETTLE-26MAR21H1500-2';
const OPEN_TIME_UTC = new Date('2026-03-21T18:50:00Z');

async function main() {
  const client = new KalshiClient({ demo: true, verbose: true });

  // Check balance
  const bal = await client.getBalance();
  console.log(`Demo balance: $${(bal.balance / 100).toFixed(2)}`);

  // Wait for market to open if needed
  const now = new Date();
  const msUntilOpen = OPEN_TIME_UTC - now;
  if (msUntilOpen > 0) {
    const mins = Math.ceil(msUntilOpen / 60000);
    console.log(`Market opens in ~${mins} min (${OPEN_TIME_UTC.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' })} PDT). Waiting...`);
    await new Promise(r => setTimeout(r, msUntilOpen + 5000)); // 5s buffer
  }

  // Verify market is open
  const mktRes = await client._request('GET', `/markets/${TARGET_TICKER}`);
  const mkt = mktRes?.data?.market;
  if (!mkt) { console.error('Market not found'); process.exit(1); }
  console.log(`Market status: ${mkt.status} | yes_ask: $${mkt.yes_ask_dollars}`);

  if (mkt.status !== 'active' && mkt.status !== 'open') {
    console.log('Market not yet active, status:', mkt.status);
    process.exit(1);
  }

  // Place 1 contract YES order at market price
  console.log('\nPlacing order: BUY YES 1 contract on', TARGET_TICKER);
  const orderRes = await client.placeOrder({
    ticker: TARGET_TICKER,
    action: 'buy',
    side: 'yes',
    type: 'market',
    count: 1,
  });

  console.log('\nOrder result:', JSON.stringify(orderRes, null, 2));

  if (orderRes.ok) {
    const order = orderRes?.data?.order || orderRes?.data;
    console.log('\n✅ Demo order placed!');
    console.log('  Order ID:', order?.id || '(check Kalshi dashboard)');
    console.log('  Ticker:', TARGET_TICKER);
    console.log('  Side: YES');
    console.log('  Settles: 12:00 PM PDT (guaranteed YES = profit)');
    console.log('\nCheck your Kalshi demo account at demo.kalshi.com to see the position.');
  } else {
    console.error('❌ Order failed:', orderRes.error || JSON.stringify(orderRes));
  }
}

main().catch(e => console.error('Fatal:', e.message));
