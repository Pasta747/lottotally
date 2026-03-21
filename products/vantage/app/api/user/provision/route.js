import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/route';
import { ensureSchema, sql } from '../../../lib/db';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureSchema();
  const id = session.user.id || session.user.email;

  await sql`INSERT INTO users (id, email, name)
            VALUES (${id}, ${session.user.email}, ${session.user.name || null})
            ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = COALESCE(EXCLUDED.name, users.name)`;

  const { rows } = await sql`SELECT id, email, name, bankroll, risk_level, whatsapp, auto_execute FROM users WHERE id = ${id} LIMIT 1`;
  return NextResponse.json({ user: rows[0] });
}
