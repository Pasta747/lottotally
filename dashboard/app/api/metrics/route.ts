import { readFileSync, writeFileSync } from 'fs';
import { NextResponse } from 'next/server';

const DATA_FILE = `${process.cwd()}/data/metrics.json`;

interface MetricEntry {
  product: string;
  arr: number;
  mrr: number;
  burn: number;
  pipeline: number;
  [key: string]: unknown;
}

interface MetricsData {
  last_updated: string;
  products: MetricEntry[];
}

function readMetrics(): MetricsData {
  try {
    const raw = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { last_updated: new Date().toISOString(), products: [] };
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
    const idx = data.products.findIndex(p => p.product === body.product);
    if (idx >= 0) {
      data.products[idx] = { ...data.products[idx], ...body };
    } else {
      data.products.push(body);
    }
    data.last_updated = new Date().toISOString();
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
