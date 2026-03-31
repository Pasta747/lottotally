import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { DailyEntryForm } from "./DailyEntryForm";

type DailyEntry = {
  id: number;
  date: string;
  terminal_sales: number;
  scratch_sales: number;
  terminal_report_num: string;
};

export default async function DailyEntryPage() {
  let entries: DailyEntry[] = [];
  try {
    const result = await sql`SELECT * FROM daily_entries ORDER BY date DESC LIMIT 30`;
    entries = result as DailyEntry[];
  } catch (err) {
    console.error("Failed to load entries:", err);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Daily Entry</h1>
      <DailyEntryForm />
      <div className="card overflow-x-auto">
        <h2 className="mb-3 text-xl font-semibold">Recent Entries ({entries.length})</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No entries yet.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Terminal Sales</th>
                <th className="py-2">Scratch Sales</th>
                <th className="py-2">Report #</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-slate-100">
                  <td className="py-2">{String(entry.date).slice(0, 10)}</td>
                  <td className="py-2">${Number(entry.terminal_sales).toFixed(2)}</td>
                  <td className="py-2">${Number(entry.scratch_sales).toFixed(2)}</td>
                  <td className="py-2">{entry.terminal_report_num}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
