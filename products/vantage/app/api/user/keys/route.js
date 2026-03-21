import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/route';
import { ensureSchema, sql } from '../../../lib/db';
import { encrypt } from '../../../utils/encryption';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id || session.user.email;
  await ensureSchema();

  const body = await req.json();
  const keyId = String(body?.kalshiKeyId || '');
  const secret = String(body?.kalshiSecret || '');
  const mode = String(body?.kalshiMode || 'demo');

  if (!keyId || !secret) return NextResponse.json({ error: 'Missing key data' }, { status: 400 });

  const encrypted = encrypt(secret);
  await sql`INSERT INTO user_api_keys (user_id, kalshi_key_id, kalshi_secret_encrypted, kalshi_mode, updated_at)
            VALUES (${userId}, ${keyId}, ${encrypted}, ${mode}, NOW())
            ON CONFLICT (user_id)
            DO UPDATE SET kalshi_key_id = EXCLUDED.kalshi_key_id,
                          kalshi_secret_encrypted = EXCLUDED.kalshi_secret_encrypted,
                          kalshi_mode = EXCLUDED.kalshi_mode,
                          updated_at = NOW()`;

  return NextResponse.json({ ok: true });
}
