import { readFileSync, writeFileSync } from 'fs';
import { NextResponse } from 'next/server';

const DATA_FILE = `${process.cwd()}/data/sprint.json`;

function readSprint() {
  try {
    const raw = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { last_updated: new Date().toISOString(), items: [] };
  }
}

export async function GET() {
  const data = readSprint();
  // Auto-calculate age_hours for each item
  const itemsWithAge = data.items.map(item => {
    const updated = item.last_updated ? new Date(item.last_updated) : new Date();
    const ageMs = Date.now() - updated.getTime();
    const ageHours = Math.round(ageMs / (1000 * 60 * 60) * 10) / 10;
    // Auto-escalation: 48h+ without progress
    let escalation = item.escalation || '';
    if (ageHours >= 48 && item.status !== 'done') escalation = '🔴';
    else if (ageHours >= 24 && item.status !== 'done') escalation = '⚠️';
    return { ...item, age_hours: ageHours, escalation };
  });
  return NextResponse.json({ ...data, items: itemsWithAge });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = readSprint();
    const idx = data.items.findIndex(i => i.id === body.id);
    if (idx >= 0) {
      data.items[idx] = { ...data.items[idx], ...body, last_updated: new Date().toISOString() };
    } else {
      data.items.push({ ...body, last_updated: new Date().toISOString() });
    }
    data.last_updated = new Date().toISOString();
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
