import { readFileSync, writeFileSync } from 'fs';
import { NextResponse } from 'next/server';

const DATA_FILE = `${process.cwd()}/data/blockers.json`;

function readBlockers() {
  try {
    const raw = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { last_updated: new Date().toISOString(), p0s: [], blockers: [] };
  }
}

export async function GET() {
  const data = readBlockers();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = readBlockers();
    if (body.p0s !== undefined) data.p0s = body.p0s;
    if (body.blockers !== undefined) data.blockers = body.blockers;
    data.last_updated = new Date().toISOString();
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
