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
    
    const email = session.user.email;
    
    // Get user ID
    const userResult = await sql`
      SELECT id, email, name, provider FROM users WHERE email = ${email}
    `;
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = userResult.rows[0];
    
    // Get user config (bankroll, risk level, etc. - to be implemented)
    const config = {
      bankroll: 1000, // Default value
      riskLevel: 'moderate', // Default value
      notifications: {
        email: true,
        sms: false,
        slack: false,
        discord: false
      }
    };
    
    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider
      },
      config
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
    
    const { bankroll, riskLevel, notifications } = await request.json();
    
    // In a real implementation, we would save these to a user_config table
    // For now, we'll just return success
    
    return NextResponse.json({ 
      success: true,
      message: 'Configuration saved'
    });
    
  } catch (error) {
    console.error('Config POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}