import { readFileSync, writeFileSync } from 'fs';
import { NextResponse } from 'next/server';

const DATA_FILE = `${process.cwd()}/data/metrics.json`;

function readMetrics() {
  try {
    const raw = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { last_updated: new Date().toISOString(), products: {}, total_arr: 0, burn_monthly: 0, pipeline: 0 };
  }
}

export async function GET() {
  const data = readMetrics();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = readMetrics();
    // Merge update
    const updated = { ...data, ...body, last_updated: new Date().toISOString() };
    writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2));
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
