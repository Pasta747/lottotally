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
    
    const { email, name, provider } = session.user;
    
    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;
    
    let userId;
    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      // Update last login
      await sql`
        UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ${userId}
      `;
    } else {
      // Create new user
      const result = await sql`
        INSERT INTO users (email, name, provider, last_login)
        VALUES (${email}, ${name || email.split('@')[0]}, ${provider || 'credentials'}, CURRENT_TIMESTAMP)
        RETURNING id
      `;
      userId = result.rows[0].id;
    }
    
    return NextResponse.json({ 
      success: true, 
      userId,
      message: existingUser.rows.length > 0 ? 'User logged in' : 'User provisioned'
    });
    
  } catch (error) {
    console.error('Provision error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}