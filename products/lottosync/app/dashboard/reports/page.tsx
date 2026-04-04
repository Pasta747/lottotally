import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ReportChart } from "@/components/report-chart";
import { SalesBarChart } from "@/components/sales-bar-chart";
import { WeeklyBarChart } from "@/components/weekly-bar-chart";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
}

export default async function ReportsPage() {
  const session = await getSession();
  const userId = Number(session?.user?.id);

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

  // Fetch last 30 days of daily entries
  let dailyRows: Array<{
    date: string;
    terminal_sales: number;
    scratch_sales: number;
    total_sales: number;
    commission_estimate: number;
  }> = [];
  try {
    const result = await sql`
      SELECT
        date::text as date,
        COALESCE(terminal_sales, 0) as terminal_sales,
        COALESCE(scratch_sales, 0) as scratch_sales,
        COALESCE(terminal_sales, 0) + COALESCE(scratch_sales, 0) as total_sales,
        (COALESCE(terminal_sales, 0) + COALESCE(scratch_sales, 0)) * 0.055 as commission_estimate
      FROM daily_entries
      WHERE user_id = ${userId}
      ORDER BY date DESC
      LIMIT 30
    `;
    dailyRows = result as typeof dailyRows;
  } catch (err) {
    console.error("DB error (dailyRows):", err);
  }

  // Week-over-week comparison using simple date math
  let thisWeekTotal = 0;
  let lastWeekTotal = 0;
  let thisWeekDays = 0;
  let lastWeekDays = 0;
  try {
    const tw = await sql`
      SELECT
        COALESCE(SUM(COALESCE(terminal_sales, 0) + COALESCE(scratch_sales, 0)), 0) as total,
        COUNT(*) as days
      FROM daily_entries
      WHERE user_id = ${userId}
        AND date >= (CURRENT_DATE - INTERVAL '7 days')
    `;
    if (tw[0]) {
      thisWeekTotal = Number(tw[0].total ?? 0);
      thisWeekDays = Number(tw[0].days ?? 0);
    }
  } catch (err) {
    console.error("DB error (thisWeek):", err);
  }

  try {
    const lw = await sql`
      SELECT
        COALESCE(SUM(COALESCE(terminal_sales, 0) + COALESCE(scratch_sales, 0)), 0) as total,
        COUNT(*) as days
      FROM daily_entries
      WHERE user_id = ${userId}
        AND date >= (CURRENT_DATE - INTERVAL '14 days')
        AND date < (CURRENT_DATE - INTERVAL '7 days')
    `;
    if (lw[0]) {
      lastWeekTotal = Number(lw[0].total ?? 0);
      lastWeekDays = Number(lw[0].days ?? 0);
    }
  } catch (err) {
    console.error("DB error (lastWeek):", err);
  }

  // Monthly totals
  let monthlyTotal = 0;
  let monthlyCommission = 0;
  try {
    const result = await sql`
      SELECT
        COALESCE(SUM(COALESCE(terminal_sales, 0) + COALESCE(scratch_sales, 0)), 0) as total,
        COALESCE(SUM((COALESCE(terminal_sales, 0) + COALESCE(scratch_sales, 0)) * 0.055), 0) as commission
      FROM daily_entries
      WHERE user_id = ${userId}
        AND date >= (CURRENT_DATE - INTERVAL '30 days')
    `;
    if (result[0]) {
      monthlyTotal = Number(result[0].total ?? 0);
      monthlyCommission = Number(result[0].commission ?? 0);
    }
  } catch (err) {
    console.error("DB error (monthly):", err);
  }

  // Avg daily sales
  const avgDaily = dailyRows.length > 0
    ? dailyRows.reduce((sum, r) => sum + Number(r.total_sales), 0) / dailyRows.length
    : 0;

  // Best day
  const bestDay = dailyRows.length > 0
    ? dailyRows.reduce((best, r) => Number(r.total_sales) > Number(best.total_sales) ? r : best, dailyRows[0])
    : null;

  // WoW change
  const wowChange = lastWeekTotal > 0
    ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
    : 0;

  // Chart data — last 14 days reversed (oldest first)
  const chartData = [...dailyRows].slice(0, 14).reverse().map((row) => ({
    date: String(row.date).slice(5).replace("-", "/"),
    terminal: Number(row.terminal_sales),
    scratch: Number(row.scratch_sales),
    total: Number(row.total_sales),
    commission: Number(row.commission_estimate),
  }));

  // Weekly bar chart data — last 8 weeks
  let weeklyData: Array<{ week: string; total: number; commission: number }> = [];
  try {
    const result = await sql`
      SELECT
        TO_CHAR(MIN(date), 'MM/DD') as week,
        SUM(COALESCE(terminal_sales, 0) + COALESCE(scratch_sales, 0)) as total,
        SUM((COALESCE(terminal_sales, 0) + COALESCE(scratch_sales, 0)) * 0.055) as commission
      FROM daily_entries
      WHERE user_id = ${userId}
        AND date >= (CURRENT_DATE - INTERVAL '56 days')
      GROUP BY DATE_TRUNC('week', date)::date
      ORDER BY DATE_TRUNC('week', date) ASC
      LIMIT 8
    `;
    weeklyData = result as typeof weeklyData;
  } catch (err) {
    console.error("DB error (weeklyData):", err);
  }

  const hasData = dailyRows.length > 0;

  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-semibold">Reports</h1>

      {!hasData ? (
        <div className="card">
          <p className="text-slate-400">No data yet. Add daily entries to see your reports.</p>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card">
              <p className="text-sm text-slate-500">This Week</p>
              <p className="mt-1 text-2xl font-semibold">{formatCurrency(thisWeekTotal)}</p>
              <p className={`text-xs ${wowChange >= 0 ? "text-green-600" : "text-red-500"}`}>
                {wowChange >= 0 ? "▲" : "▼"} {Math.abs(wowChange).toFixed(1)}% vs last week
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500">30-Day Sales</p>
              <p className="mt-1 text-2xl font-semibold">{formatCurrency(monthlyTotal)}</p>
              <p className="text-xs text-slate-400">Est. commission: {formatCurrency(monthlyCommission)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500">Avg Daily Sales</p>
              <p className="mt-1 text-2xl font-semibold">{formatCurrency(avgDaily)}</p>
              <p className="text-xs text-slate-400">{dailyRows.length} days tracked</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500">Best Day</p>
              <p className="mt-1 text-2xl font-semibold">{bestDay ? formatCurrency(Number(bestDay.total_sales)) : "—"}</p>
              <p className="text-xs text-slate-400">{bestDay?.date ?? ""}</p>
            </div>
          </section>

          {/* Daily sales bar chart */}
          {chartData.length > 0 && (
            <section className="card">
              <h2 className="mb-3 text-xl font-semibold">Daily Sales — Last 14 Days</h2>
              <SalesBarChart data={chartData} />
            </section>
          )}

          {/* Commission trend line */}
          {chartData.length > 0 && (
            <section className="card">
              <h2 className="mb-3 text-xl font-semibold">Commission Estimate — Last 14 Days</h2>
              <ReportChart data={chartData.map((d) => ({ ...d, commissionAccuracy: Number(d.commission.toFixed(2)) }))} />
            </section>
          )}

          {/* Weekly comparison */}
          {weeklyData.length > 1 && (
            <section className="card">
              <h2 className="mb-3 text-xl font-semibold">Weekly Sales — Last 8 Weeks</h2>
              <WeeklyBarChart data={weeklyData} />
            </section>
          )}
        </>
      )}
    </main>
  );
}
