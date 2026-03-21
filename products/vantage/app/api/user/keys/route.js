import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { encrypt } from '../../../utils/encryption';

function normalizeKeyId(keyId) {
  // Handle "keyId:secret" combined paste
  if (keyId?.includes(':') && /^[0-9a-f-]{36}:/i.test(keyId)) {
    return keyId.split(':')[0].trim();
  }
  // Handle base64-encoded combined key
  try {
    const decoded = Buffer.from(keyId, 'base64').toString('utf-8');
    if (decoded.match(/^[0-9a-f-]{36}/i)) return decoded.split(':')[0].trim();
  } catch (_) {}
  return keyId?.trim();
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mode = 'demo' } = body;  // 'demo' or 'live'
    let { kalshi_key_id, kalshi_secret } = body;

    if (!kalshi_key_id || !kalshi_secret) {
      return NextResponse.json({ error: 'Missing key ID or secret' }, { status: 400 });
    }

    kalshi_key_id = normalizeKeyId(kalshi_key_id);
    const encryptedSecret = encrypt(kalshi_secret);
    const userId = session.user.id || session.user.email;

    if (mode === 'live') {
      // Store live keys in separate columns, set mode to live
      await sql`
        INSERT INTO user_api_keys (user_id, kalshi_live_key_id, kalshi_live_secret_encrypted, kalshi_mode)
        VALUES (${userId}, ${kalshi_key_id}, ${encryptedSecret}, 'live')
        ON CONFLICT (user_id) DO UPDATE SET
          kalshi_live_key_id = EXCLUDED.kalshi_live_key_id,
          kalshi_live_secret_encrypted = EXCLUDED.kalshi_live_secret_encrypted,
          kalshi_mode = 'live',
          updated_at = NOW()
      `;
    } else {
      // Store demo keys
      await sql`
        INSERT INTO user_api_keys (user_id, kalshi_key_id, kalshi_secret_encrypted, kalshi_mode)
        VALUES (${userId}, ${kalshi_key_id}, ${encryptedSecret}, 'demo')
        ON CONFLICT (user_id) DO UPDATE SET
          kalshi_key_id = EXCLUDED.kalshi_key_id,
          kalshi_secret_encrypted = EXCLUDED.kalshi_secret_encrypted,
          kalshi_mode = 'demo',
          updated_at = NOW()
      `;
    }

    return NextResponse.json({ success: true, mode, keyId: kalshi_key_id });

  } catch (error) {
    console.error('API key save error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
