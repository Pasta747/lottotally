/**
 * place-demo-order.js
 * Places a test order using Mario's stored Vantage API keys (from DB).
 * No .env keys — everything comes from the user's Vantage settings.
 */

'use strict';

require('dotenv').config({ path: '/root/PastaOS/.env' });

const { loadActiveUsers } = require('../src/user-profile');
const { KalshiClient }    = require('/root/PastaOS/Plutus/oddstool-v2/kalshi-client');

async function main() {
  // Load user from Vantage DB
  const users = await loadActiveUsers();
  if (!users.length) {
    console.error('No users with API keys found in Vantage DB. Save your keys in Settings first.');
    process.exit(1);
  }

  const user = users[0];
  console.log(`Using keys for: ${user.email} (mode: ${user.kalshiMode})`);
  console.log(`Key ID: ${user.kalshiKeyId}`);

  // Decrypt stored key
  const { decrypt } = require('../app/utils/encryption.js');
  const privateKeyPem = decrypt(user.kalshiSecretEncrypted);

  const isDemo = user.kalshiMode !== 'live';
  const client = new KalshiClient({ demo: isDemo, verbose: true });
  client.apiKeyId      = user.kalshiKeyId;
  client.privateKeyPem = privateKeyPem;

  // Check balance
  const bal = await client.getBalance();
  console.log(`Balance: $${(bal.balance / 100).toFixed(2)} | Portfolio: $${(bal.portfolio_value / 100).toFixed(2)}`);

  // Find next open QuickSettle market
  const res = await client._request('GET', '/markets?limit=50');
  const qs = (res?.data?.markets || [])
    .filter(m => m.ticker?.includes('KXQUICKSETTLE') && m.ticker?.endsWith('-2') && new Date(m.close_time) > new Date())
    .sort((a, b) => new Date(a.close_time) - new Date(b.close_time));

  if (!qs.length) {
    console.log('No open QuickSettle markets found right now.');
    process.exit(0);
  }

  const target = qs[0];
  const ct = new Date(target.close_time);
  const pdt = ct.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit' });
  console.log(`\nTarget: ${target.ticker} (settles ${pdt} PDT)`);
  console.log(`Status: ${target.status}`);

  if (target.status !== 'active') {
    console.log('Market not yet active. Try again closer to open time.');
    process.exit(0);
  }

  const orderRes = await client.placeOrder({
    ticker: target.ticker,
    action: 'buy',
    side: 'yes',
    type: 'limit',
    count: 1,
    yes_price: 99,
  });

  if (orderRes.ok) {
    const order = orderRes?.data?.order;
    console.log('\n✅ Order placed!');
    console.log('  Order ID:', order?.order_id);
    console.log('  Price: $' + order?.yes_price_dollars);
    console.log('  Status:', order?.status);
  } else {
    console.error('❌ Order failed:', orderRes.error, JSON.stringify(orderRes.data));
  }
}

main().catch(e => console.error('Fatal:', e.message));
