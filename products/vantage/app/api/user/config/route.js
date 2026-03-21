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
    
    // Get user config
    const result = await sql`
      SELECT bankroll, risk_level, whatsapp, auto_execute,
             max_wager_dollars, max_orders_per_day, max_daily_spend, kalshi_mode
      FROM users
      WHERE id = ${userId}
    `;
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      config: result.rows[0]
    });
    
  } catch (error) {
    console.error('Config GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { bankroll, risk_level, whatsapp, auto_execute,
            max_wager_dollars, max_orders_per_day, max_daily_spend, kalshi_mode } = await request.json();
    const userId = session.user.id || session.user.email;

    // Update user config
    const result = await sql`
      UPDATE users 
      SET 
        bankroll = COALESCE(${bankroll ?? null}, bankroll),
        risk_level = COALESCE(${risk_level ?? null}, risk_level),
        whatsapp = COALESCE(${whatsapp ?? null}, whatsapp),
        auto_execute = COALESCE(${auto_execute ?? null}, auto_execute),
        max_wager_dollars = COALESCE(${max_wager_dollars ?? null}, max_wager_dollars),
        max_orders_per_day = COALESCE(${max_orders_per_day ?? null}, max_orders_per_day),
        max_daily_spend = COALESCE(${max_daily_spend ?? null}, max_daily_spend),
        kalshi_mode = COALESCE(${kalshi_mode ?? null}, kalshi_mode)
      WHERE id = ${userId}
      RETURNING bankroll, risk_level, whatsapp, auto_execute,
                max_wager_dollars, max_orders_per_day, max_daily_spend, kalshi_mode
    `;
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true,
      config: result.rows[0]
    });
    
  } catch (error) {
    console.error('Config POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}