import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ReportChart } from "@/components/report-chart";

export default async function ReportsPage() {
  const session = await getSession();
  const userId = Number(session?.user?.id);

  // New user with no data yet
  if (!userId || isNaN(userId)) {
    return (
      <main className="space-y-6">
        <h1 className="text-3xl font-semibold">Reports</h1>
        <div className="card">
          <p className="text-slate-400">No account data yet. Complete your first daily entry to see reports.</p>
        </div>
      </main>
    );
  }

  // Fetch weekly sales volume
  const weeklyResult = await sql`
    SELECT COALESCE(SUM(terminal_sales + scratch_sales), 0) as total
    FROM daily_entries
    WHERE user_id = ${userId} AND date >= (CURRENT_DATE - INTERVAL '7 days')::date
  `;
  const weekly = weeklyResult[0] as { total: number };

  // Fetch monthly sales volume
  const monthlyResult = await sql`
    SELECT COALESCE(SUM(terminal_sales + scratch_sales), 0) as total
    FROM daily_entries
    WHERE user_id = ${userId} AND date >= (CURRENT_DATE - INTERVAL '30 days')::date
  `;
  const monthly = monthlyResult[0] as { total: number };

  // Fetch commission accuracy — fix: avoid nested aggregate (MAX inside AVG is invalid SQL)
  const commissionResult = await sql`
    SELECT
      COALESCE(
        (SELECT CASE WHEN COUNT(*) = 0 OR AVG(ABS(discrepancy)) = 0 THEN 100
                    ELSE GREATEST(0, 100 - AVG(ABS(discrepancy))) END
         FROM settlements WHERE user_id = ${userId}),
        100
      ) as accuracy
  `;
  const commission = commissionResult[0] as { accuracy: number };

  // Fetch trend data for the last 14 days
  const trendRowsResult = await sql`
    SELECT de.date,
      COALESCE((de.terminal_sales + de.scratch_sales) * 0.055, 0) as commission_estimate,
      COALESCE((SELECT SUM(ss.tickets_sold) FROM scratch_sales ss JOIN scratch_books sb ON sb.id = ss.book_id WHERE sb.user_id = ${userId} AND ss.date = de.date), 0) as sold_tickets
    FROM daily_entries de
    WHERE de.user_id = ${userId}
    ORDER BY de.date DESC
    LIMIT 14
  `;
  const trendRows = trendRowsResult[0] as Array<{ date: string; commission_estimate: number; sold_tickets: number }>;

  const chartData = trendRows.reverse().map((row) => ({
    date: row.date.slice(5), // Display month and day
    shrinkage: Math.max(0, row.sold_tickets - 100), // Example shrinkage calculation
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
