import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { encrypt, hashKey } from '../../../../src/utils/crypto';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { apiKey } = await request.json();
    
    if (!apiKey || !apiKey.startsWith('KALSHI_')) {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 });
    }
    
    // Get user ID
    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `;
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = userResult.rows[0].id;
    
    // Encrypt the API key
    const encryptionResult = encrypt(apiKey);
    const keyHash = hashKey(apiKey);
    
    // Save encrypted key to database
    await sql`
      INSERT INTO user_api_keys (user_id, encrypted_key, key_hash, iv, auth_tag)
      VALUES (${userId}, ${encryptionResult.encrypted}, ${keyHash}, ${encryptionResult.iv}, ${encryptionResult.tag})
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        encrypted_key = ${encryptionResult.encrypted},
        key_hash = ${keyHash},
        iv = ${encryptionResult.iv},
        auth_tag = ${encryptionResult.tag},
        created_at = CURRENT_TIMESTAMP
    `;
    
    return NextResponse.json({ 
      success: true,
      message: 'API key saved and encrypted successfully'
    });
    
  } catch (error) {
    console.error('API key save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}