const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setup() {
  console.log('Creating Stripe products and prices for LottoTally...\n');

  // Create Starter product + price
  const starter = await stripe.products.create({
    name: 'LottoTally Starter',
    description: 'Single store. Core reconciliation + alerts.',
  });
  const starterPrice = await stripe.prices.create({
    product: starter.id,
    unit_amount: 4900,
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  console.log(`✅ Starter: product=${starter.id} price=${starterPrice.id}`);

  // Create Pro product + price
  const pro = await stripe.products.create({
    name: 'LottoTally Pro',
    description: 'Up to 5 stores. Team workflow + advanced reporting.',
  });
  const proPrice = await stripe.prices.create({
    product: pro.id,
    unit_amount: 7900,
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  console.log(`✅ Pro: product=${pro.id} price=${proPrice.id}`);

  // Create Multi product + price
  const multi = await stripe.products.create({
    name: 'LottoTally Multi',
    description: 'Up to 20 stores. Multi-location controls + priority support.',
  });
  const multiPrice = await stripe.prices.create({
    product: multi.id,
    unit_amount: 9900,
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  console.log(`✅ Multi: product=${multi.id} price=${multiPrice.id}`);

  console.log('\n--- VERCEL ENV VARS TO SET ---');
  console.log(`STRIPE_PRICE_STARTER=${starterPrice.id}`);
  console.log(`STRIPE_PRICE_PRO=${proPrice.id}`);
  console.log(`STRIPE_PRICE_MULTI=${multiPrice.id}`);
}

setup().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
