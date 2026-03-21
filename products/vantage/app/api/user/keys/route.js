import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { encrypt } from '../../../utils/encryption';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let { kalshi_key_id, kalshi_secret } = await request.json();
    
    if (!kalshi_key_id || !kalshi_secret) {
      return NextResponse.json({ error: 'Missing key ID or secret' }, { status: 400 });
    }

    // Kalshi's copy button sometimes pastes "keyId:secret" combined into the key ID field.
    // Detect and split it automatically.
    if (kalshi_key_id.includes(':') && !kalshi_secret.includes('-----BEGIN')) {
      const colonIdx = kalshi_key_id.indexOf(':');
      const possibleId = kalshi_key_id.slice(0, colonIdx);
      const possibleSecret = kalshi_key_id.slice(colonIdx + 1);
      // UUID format check: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      if (/^[0-9a-f-]{36}$/i.test(possibleId)) {
        kalshi_key_id = possibleId;
        kalshi_secret = possibleSecret + (kalshi_secret ? '\n' + kalshi_secret : '');
      }
    }

    const userId = session.user.id || session.user.email;
    
    // Encrypt the secret
    const encryptedSecret = encrypt(kalshi_secret);
    
    // Save encrypted key
    const result = await sql`
      INSERT INTO user_api_keys (user_id, kalshi_key_id, kalshi_secret_encrypted)
      VALUES (${userId}, ${kalshi_key_id}, ${encryptedSecret})
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        kalshi_key_id = EXCLUDED.kalshi_key_id,
        kalshi_secret_encrypted = EXCLUDED.kalshi_secret_encrypted,
        updated_at = NOW()
      RETURNING kalshi_key_id, updated_at
    `;
    
    return NextResponse.json({ 
      success: true,
      key: result.rows[0]
    });
    
  } catch (error) {
    console.error('API key save error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}