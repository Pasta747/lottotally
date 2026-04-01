import { readFileSync, writeFileSync } from 'fs';
import { NextResponse } from 'next/server';

const DATA_FILE = `${process.cwd()}/data/agents.json`;

function readAgents() {
  try {
    const raw = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { last_updated: new Date().toISOString(), agents: [] };
  }
}

function getStaleness(lastUpdated: string): 'green' | 'yellow' | 'red' {
  const ageMs = Date.now() - new Date(lastUpdated).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  if (ageHours >= 6) return 'red';
  if (ageHours >= 2) return 'yellow';
  return 'green';
}

export async function GET() {
  const data = readAgents();
  const hasP0 = data.agents.some(a => a.status === 'p0');
  const allGreen = data.agents.every(a => getStaleness(a.last_updated) === 'green');
  const anyYellow = data.agents.some(a => getStaleness(a.last_updated) === 'yellow');
  const anyRed = data.agents.some(a => getStaleness(a.last_updated) === 'red');

  let health: 'green' | 'yellow' | 'red' = 'green';
  if (hasP0 || anyRed) health = 'red';
  else if (anyYellow) health = 'yellow';

  return NextResponse.json({
    ...data,
    health,
    has_p0: hasP0,
    all_fresh: allGreen,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = readAgents();
    const idx = data.agents.findIndex(a => a.id === body.id);
    if (idx >= 0) {
      data.agents[idx] = { ...data.agents[idx], ...body, last_updated: new Date().toISOString() };
    } else {
      data.agents.push({ ...body, last_updated: new Date().toISOString() });
    }
    data.last_updated = new Date().toISOString();
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
