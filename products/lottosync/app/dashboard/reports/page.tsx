import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ReportChart } from "@/components/report-chart";

export default async function ReportsPage() {
  const session = await getSession();
  const userId = Number(session?.user.id);

  const monthly = db
    .prepare(
      `SELECT COALESCE(SUM(terminal_sales + scratch_sales), 0) as total
       FROM daily_entries
       WHERE user_id = ? AND date >= date('now', '-30 day')`
    )
    .get(userId) as { total: number };

  const weekly = db
    .prepare(
      `SELECT COALESCE(SUM(terminal_sales + scratch_sales), 0) as total
       FROM daily_entries
       WHERE user_id = ? AND date >= date('now', '-7 day')`
    )
    .get(userId) as { total: number };

  const commission = db
    .prepare(
      `SELECT
        COALESCE(AVG(CASE WHEN discrepancy = 0 THEN 100 ELSE MAX(0, 100 - ABS(discrepancy)) END), 100) as accuracy
       FROM settlements
       WHERE user_id = ?`
    )
    .get(userId) as { accuracy: number };

  const trendRows = db
    .prepare(
      `SELECT de.date,
        COALESCE((de.terminal_sales + de.scratch_sales) * 0.055, 0) as commission_estimate,
        COALESCE((SELECT SUM(ss.tickets_sold) FROM scratch_sales ss JOIN scratch_books sb ON sb.id = ss.book_id WHERE sb.user_id = ? AND ss.date = de.date), 0) as sold_tickets
      FROM daily_entries de
      WHERE de.user_id = ?
      ORDER BY de.date DESC
      LIMIT 14`
    )
    .all(userId, userId) as Array<{ date: string; commission_estimate: number; sold_tickets: number }>;

  const chartData = trendRows.reverse().map((row) => ({
    date: row.date.slice(5),
    shrinkage: Math.max(0, row.sold_tickets - 100),
    commissionAccuracy: Number(commission.accuracy?.toFixed(1) ?? 100),
  }));

  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-semibold">Reports</h1>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <p className="text-sm text-slate-500">Weekly P&L (sales volume)</p>
          <p className="mt-2 text-3xl font-semibold">${weekly.total.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Monthly P&L (sales volume)</p>
          <p className="mt-2 text-3xl font-semibold">${monthly.total.toFixed(2)}</p>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-3 text-xl font-semibold">Shrinkage Trend + Commission Accuracy</h2>
        <ReportChart data={chartData} />
      </section>
    </main>
  );
}
