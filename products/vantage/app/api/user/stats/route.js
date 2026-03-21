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
    
    // Get user stats
    const statsResult = await sql`
      SELECT 
        COUNT(*) as total_trades,
        SUM(CASE WHEN status = 'win' THEN 1 ELSE 0 END) as winning_trades,
        AVG(signal_strength) as avg_signal_strength
      FROM trades
      WHERE user_id = ${userId}
    `;
    
    const stats = statsResult.rows[0];
    const winRate = stats.total_trades > 0 ? (parseInt(stats.winning_trades) / parseInt(stats.total_trades)) * 100 : 0;
    
    const formattedStats = {
      totalTrades: parseInt(stats.total_trades) || 0,
      winningTrades: parseInt(stats.winning_trades) || 0,
      winRate: winRate.toFixed(2),
      avgSignalStrength: stats.avg_signal_strength ? parseFloat(stats.avg_signal_strength).toFixed(2) : '0.00'
    };
    
    return NextResponse.json({ 
      stats: formattedStats
    });
    
  } catch (error) {
    console.error('Stats GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}