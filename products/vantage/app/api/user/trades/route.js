import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID
    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `;
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = userResult.rows[0].id;
    
    // Get user trades
    const tradesResult = await sql`
      SELECT id, layer, category, ticker, side, market_price, estimated_prob, signal_strength, execution_price, close_time, status, created_at
      FROM trades
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    return NextResponse.json({ 
      trades: tradesResult.rows
    });
    
  } catch (error) {
    console.error('Trades GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}