import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/route';
import { ensureSchema, sql } from '../../../lib/db';

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return session.user.id || session.user.email;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureSchema();

  const { rows } = await sql`SELECT bankroll, risk_level, whatsapp, auto_execute FROM users WHERE id = ${userId} LIMIT 1`;
  return NextResponse.json(rows[0] || { bankroll: 1000, risk_level: 'moderate', whatsapp: null, auto_execute: false });
}

export async function POST(req) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureSchema();

  const body = await req.json();
  const bankroll = Number(body?.bankroll || 1000);
  const riskLevel = String(body?.riskLevel || 'moderate');
  const whatsapp = body?.whatsapp ? String(body.whatsapp) : null;
  const autoExecute = Boolean(body?.autoExecute);

  await sql`UPDATE users
            SET bankroll = ${bankroll}, risk_level = ${riskLevel}, whatsapp = ${whatsapp}, auto_execute = ${autoExecute}
            WHERE id = ${userId}`;

  return NextResponse.json({ ok: true });
}
