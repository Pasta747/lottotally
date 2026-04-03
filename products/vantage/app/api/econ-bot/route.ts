import { NextResponse } from 'next/server';

const KALSHI_BASE = 'https://api.kalshi.com/trade-api/v2';
const KALSHI_KEY = process.env.KALSHI_LIVE_API_KEY || process.env.KALSHI_API_KEY;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { signals, action } = body;
    
    if (action === 'place_bet' && signals?.length > 0) {
      const results = [];
      for (const sig of signals) {
        const result = await placeBet(sig);
        results.push(result);
      }
      return NextResponse.json({ success: true, results });
    }
    
    return NextResponse.json({ success: false, reason: 'No action or no signals' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

async function placeBet(signal: any) {
  const { ticker, market_id, side, price, stake_cents } = signal;
  
  try {
    const res = await fetch(`${KALSHI_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KALSHI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        market_ticker: market_id,
        side,
        type: 'limit',
        cost_cents: stake_cents,
        yes_cost_cents: side === 'yes' ? stake_cents : undefined,
        no_cost_cents: side === 'no' ? stake_cents : undefined,
        expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      return { success: true, order: data.order, signal };
    } else {
      const err = await res.text();
      return { success: false, ticker, error: `${res.status}: ${err}` };
    }
  } catch (e: any) {
    return { success: false, ticker, error: e.message };
  }
}

export async function GET() {
  // Health check + fetch Kalshi economics markets
  try {
    const res = await fetch(`${KALSHI_BASE}/markets?category=economy&limit=20`, {
      headers: { 'Authorization': `Bearer ${KALSHI_KEY}` }
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ 
        success: true, 
        markets_count: data.markets?.length || 0,
        markets: data.markets?.slice(0, 5).map((m: any) => ({
          ticker: m.ticker,
          question: m.question,
          yes_bid: m.yes_bid,
          yes_ask: m.yes_ask
        }))
      });
    }
    return NextResponse.json({ success: false, error: `Kalshi ${res.status}` });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
