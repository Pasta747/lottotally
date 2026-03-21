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
    
    const userId = session.user.id || session.user.email;
    
    // Get user trades
    const result = await sql`
      SELECT id, date, market, category, layer, side, ev_pct, kelly_amount, outcome, pnl, created_at
      FROM trades
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    return NextResponse.json({ 
      trades: result.rows
    });
    
  } catch (error) {
    console.error('Trades GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}