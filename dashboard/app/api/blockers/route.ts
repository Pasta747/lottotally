import { readFileSync, writeFileSync } from 'fs';
import { NextResponse } from 'next/server';

const DATA_FILE = `${process.cwd()}/data/blockers.json`;

interface Blocker {
  id?: string;
  title: string;
  severity: string;
  owner?: string;
  [key: string]: unknown;
}

interface BlockersData {
  last_updated: string;
  blockers: Blocker[];
}

function readBlockers(): BlockersData {
  try {
    const raw = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { last_updated: new Date().toISOString(), blockers: [] };
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
    const idx = data.blockers.findIndex(b => b.id === body.id);
    if (idx >= 0) {
      data.blockers[idx] = { ...data.blockers[idx], ...body };
    } else {
      data.blockers.push(body);
    }
    data.last_updated = new Date().toISOString();
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
