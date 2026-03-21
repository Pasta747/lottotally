import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { email, name, id } = session.user;
    const userId = id || email;
    
    // Create or update user
    const result = await sql`
      INSERT INTO users (id, email, name)
      VALUES (${userId}, ${email}, ${name || email.split('@')[0]})
      ON CONFLICT (email) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        created_at = COALESCE(users.created_at, NOW())
      RETURNING id, email, name, bankroll, risk_level, whatsapp, auto_execute
    `;
    
    return NextResponse.json({ 
      success: true, 
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Provision error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}