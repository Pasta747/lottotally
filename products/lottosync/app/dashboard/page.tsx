import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
}

export default async function DashboardPage() {
  const session = await getSession();
  const userId = Number(session?.user?.id);
  const today = new Date().toISOString().split("T")[0];

  // New user with no data yet
  if (!userId || isNaN(userId)) {
    return (
      <main>
        <h1 className="mb-6 text-3xl font-semibold">Dashboard Overview</h1>
        <div className="card">
          <p className="text-slate-400">Welcome! Complete your first daily entry to see your dashboard metrics.</p>
        </div>
      </main>
    );
  }

  // Fetch today's sales
  const todaySalesResult = await sql`
    SELECT COALESCE(SUM(terminal_sales + scratch_sales), 0) as total 
    FROM daily_entries 
    WHERE user_id = ${userId} AND date = ${today}
  `;
  const todaySales = todaySalesResult[0] as { total: number };

  // Fetch user commission rate
  const userResult = await sql`SELECT commission_rate FROM lt_users WHERE id = ${userId}`;
  const user = userResult[0] as { commission_rate: number };

  // Fetch active scratch-off books count
  const activeBooksResult = await sql`
    SELECT COUNT(*) as count 
    FROM scratch_books 
    WHERE user_id = ${userId} AND status = 'active'
  `;
  const activeBooks = activeBooksResult[0] as { count: number };

  // Fetch shrinkage alerts
  const shrinkageAlertsResult = await sql`
    SELECT COUNT(*) as count
    FROM scratch_books sb
    LEFT JOIN (
      SELECT book_id, SUM(tickets_sold) as sold
      FROM scratch_sales
      GROUP BY book_id
    ) ss ON sb.id = ss.book_id
    WHERE sb.user_id = ${userId} AND COALESCE(ss.sold, 0) > sb.total_tickets
  `;
  const shrinkageAlerts = shrinkageAlertsResult[0] as { count: number };

  const commissionEarned = (todaySales.total * (user?.commission_rate ?? 5.5)) / 100;

  const cards = [
    { label: "Today's Lottery Sales", value: formatCurrency(todaySales.total) },
    { label: "Commission Earned", value: formatCurrency(commissionEarned) },
    { label: "Active Scratch-off Books", value: String(activeBooks.count) },
    { label: "Shrinkage Alerts", value: String(shrinkageAlerts.count) },
  ];

  return (
    <main>
      <h1 className="mb-6 text-3xl font-semibold">Dashboard Overview</h1>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div className="card" key={card.label}>
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold">{card.value}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
