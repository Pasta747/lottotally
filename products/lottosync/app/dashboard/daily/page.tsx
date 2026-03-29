import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createDailyEntry } from "@/app/dashboard/actions";
import { CSVImportForm } from "@/components/csv-import-form";
import { PhotoOCRForm } from "@/components/photo-ocr-form";

type DailyEntry = {
  id: number;
  date: string;
  terminal_sales: number;
  scratch_sales: number;
  terminal_report_num: string;
};

export default async function DailyEntryPage() {
  const session = await getSession();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  // Guard: if no valid userId, show empty state instead of crashing
  if (!userId || isNaN(userId)) {
    return (
      <main className="space-y-6">
        <h1 className="text-3xl font-semibold">Daily Entry</h1>
        <p className="text-slate-600">Session error. Please log out and log in again.</p>
      </main>
    );
  }

  let entries: DailyEntry[] = [];
  try {
    const entriesResult = await sql`SELECT * FROM daily_entries WHERE user_id = ${userId} ORDER BY date DESC LIMIT 30`;
    entries = entriesResult as DailyEntry[];
  } catch (err) {
    console.error("Failed to load daily entries:", err);
  }

  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-semibold">Daily Entry</h1>
      <form action={createDailyEntry} className="card grid gap-3 md:grid-cols-2">
        <label>
          <p className="mb-1 text-sm text-slate-600">Date</p>
          <input className="input" type="date" name="date" required defaultValue={'2026-03-24'} />
        </label>
        <label>
          <p className="mb-1 text-sm text-slate-600">Terminal Report #</p>
          <input className="input" name="terminal_report_num" required />
        </label>
        <label>
          <p className="mb-1 text-sm text-slate-600">Lottery Terminal Sales</p>
          <input className="input" type="number" step="0.01" name="terminal_sales" required />
        </label>
        <label>
          <p className="mb-1 text-sm text-slate-600">Scratch-off Sales</p>
          <input className="input" type="number" step="0.01" name="scratch_sales" required />
        </label>
        <button className="btn-primary md:col-span-2" type="submit">
          Save Daily Entry
        </button>
      </form>

      <CSVImportForm />
      <PhotoOCRForm />

      <div className="card overflow-x-auto">
        <h2 className="mb-3 text-xl font-semibold">Recent Entries</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No entries yet. Use the form or CSV import above.</p>
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
                  <td className="py-2">{entry.date}</td>
                  <td className="py-2">${entry.terminal_sales.toFixed(2)}</td>
                  <td className="py-2">${entry.scratch_sales.toFixed(2)}</td>
                  <td className="py-2">{entry.terminal_report_num}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
