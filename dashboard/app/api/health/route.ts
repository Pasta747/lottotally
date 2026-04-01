import { readFileSync } from 'fs';
import { NextResponse } from 'next/server';

function readJson(file: string) {
  try {
    return JSON.parse(readFileSync(`${process.cwd()}/data/${file}`, 'utf-8'));
  } catch {
    return null;
  }
}

function getStaleness(lastUpdated: string): 'green' | 'yellow' | 'red' {
  if (!lastUpdated) return 'green';
  const ageMs = Date.now() - new Date(lastUpdated).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  if (ageHours >= 6) return 'red';
  if (ageHours >= 2) return 'yellow';
  return 'green';
}

export async function GET() {
  const agents = readJson('agents.json');
  const sprint = readJson('sprint.json');
  const metrics = readJson('metrics.json');
  const blockers = readJson('blockers.json');

  const sections = [
    { name: 'agents', last_updated: agents?.last_updated },
    { name: 'sprint', last_updated: sprint?.last_updated },
    { name: 'metrics', last_updated: metrics?.last_updated },
    { name: 'blockers', last_updated: blockers?.last_updated },
  ];

  const staleness = sections.map(s => ({
    ...s,
    status: getStaleness(s.last_updated),
  }));

  const hasP0 = (blockers?.p0s?.length ?? 0) > 0 || (agents?.agents?.some((a: any) => a.status === 'p0') ?? false);
  const anyRed = staleness.some(s => s.status === 'red');
  const anyYellow = staleness.some(s => s.status === 'yellow');

  let overallHealth: 'green' | 'yellow' | 'red' = 'green';
  if (hasP0 || anyRed) overallHealth = 'red';
  else if (anyYellow) overallHealth = 'yellow';

  return NextResponse.json({
    overall: overallHealth,
    badge: overallHealth === 'green' ? '🟢' : overallHealth === 'yellow' ? '🟡' : '🔴',
    has_p0: hasP0,
    sections: staleness,
    timestamp: new Date().toISOString(),
  });
}
