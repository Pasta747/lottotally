import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createSettlement } from "@/app/dashboard/actions";

export default async function CommissionsPage() {
  const session = await getSession();
  const userId = Number(session?.user?.id);

  if (!userId || isNaN(userId)) {
    return (
      <main>
        <h1 className="mb-6 text-3xl font-semibold">Commissions</h1>
        <div className="card">
          <p className="text-slate-400">Please log in to view your commission history.</p>
        </div>
      </main>
    );
  }

  // Fetch user commission rate
  const userResult = await sql`SELECT commission_rate FROM lt_users WHERE id = ${userId}`;
  const user = userResult[0] as { commission_rate: number };

  // Fetch settlement history
  const settlementsResult = await sql`SELECT * FROM settlements WHERE user_id = ${userId} ORDER BY date DESC`;
  const settlements = settlementsResult as Array<{
    id: number;
    amount: number;
    date: string;
    expected_amount: number;
    discrepancy: number;
  }>;

  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-semibold">Commission Tracker</h1>
      <p className="text-slate-600">Current commission rate: {user?.commission_rate ?? 5.5}%</p>

      <form action={createSettlement} className="card grid gap-3 md:grid-cols-2">
        <label>
          <p className="mb-1 text-sm text-slate-600">Settlement Date</p>
          <input className="input" type="date" name="date" required defaultValue={'2026-03-24'} />
        </label>
        <label>
          <p className="mb-1 text-sm text-slate-600">State Settlement Amount ($)</p>
          <input className="input" type="number" step="0.01" name="amount" required />
        </label>
        <button className="btn-primary md:col-span-2" type="submit">
          Save Settlement + Calculate Discrepancy
        </button>
      </form>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 text-xl font-semibold">Settlement History</h2>
        <table className="min-w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Date</th>
              <th className="py-2">Actual</th>
              <th className="py-2">Expected</th>
              <th className="py-2">Discrepancy</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((settlement) => (
              <tr key={settlement.id} className="border-t border-slate-100">
                <td className="py-2">{settlement.date}</td>
                <td className="py-2">${settlement.amount.toFixed(2)}</td>
                <td className="py-2">${settlement.expected_amount.toFixed(2)}</td>
                <td className={`py-2 ${settlement.discrepancy === 0 ? "text-slate-700" : "font-semibold text-amber-600"}`}>
                  ${settlement.discrepancy.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
