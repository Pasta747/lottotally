import { readFileSync } from 'fs';
import { NextResponse } from 'next/server';

interface Section {
  name: string;
  last_updated: string;
  status: 'green' | 'yellow' | 'red';
}

function readJson(file: string): { last_updated: string } {
  try {
    const raw = readFileSync(`${process.cwd()}/${file}`, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { last_updated: new Date().toISOString() };
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
  const agents = readJson('data/agents.json');
  const sprint = readJson('data/sprint.json');
  const metrics = readJson('data/metrics.json');
  const blockers = readJson('data/blockers.json');

  const sections: Section[] = [
    { name: 'agents', last_updated: agents.last_updated, status: getStaleness(agents.last_updated) },
    { name: 'sprint', last_updated: sprint.last_updated, status: getStaleness(sprint.last_updated) },
    { name: 'metrics', last_updated: metrics.last_updated, status: getStaleness(metrics.last_updated) },
    { name: 'blockers', last_updated: blockers.last_updated, status: getStaleness(blockers.last_updated) },
  ];

  const hasRed = sections.some(s => s.status === 'red');
  const hasYellow = sections.some(s => s.status === 'yellow');

  return NextResponse.json({
    overall: hasRed ? 'red' : hasYellow ? 'yellow' : 'green',
    badge: hasRed ? '🔴' : hasYellow ? '🟡' : '🟢',
    has_p0: false,
    sections,
    timestamp: new Date().toISOString(),
  });
}
