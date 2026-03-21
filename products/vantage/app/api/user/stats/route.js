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
    
    // Get user stats
    const statsResult = await sql`
      SELECT 
        COUNT(*) as total_trades,
        SUM(CASE WHEN outcome = 'win' THEN 1 ELSE 0 END) as winning_trades,
        SUM(pnl) as total_pnl,
        AVG(ev_pct) as avg_ev
      FROM trades
      WHERE user_id = ${userId}
    `;
    
    const stats = statsResult.rows[0];
    const winRate = stats.total_trades > 0 ? (parseInt(stats.winning_trades) / parseInt(stats.total_trades)) * 100 : 0;
    
    // Calculate wagered amount (simplified)
    const wagered = parseInt(stats.total_trades) * 10; // Assuming $10 per trade
    
    // Calculate ROI (simplified)
    const roi = wagered > 0 ? (parseFloat(stats.total_pnl) / wagered) * 100 : 0;
    
    return NextResponse.json({ 
      stats: {
        pnl: parseFloat(stats.total_pnl || 0).toFixed(2),
        winRate: winRate.toFixed(2),
        roi: roi.toFixed(2),
        wagered: wagered.toFixed(2),
        rank: '#2' // Placeholder
      }
    });
    
  } catch (error) {
    console.error('Stats GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}