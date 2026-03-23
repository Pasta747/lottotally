import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { updateSettings } from "@/app/dashboard/actions";

export default async function SettingsPage() {
  const session = await getSession();
  const userId = Number(session?.user.id);

  const user = db
    .prepare("SELECT store_name, state, commission_rate, lottery_terminal_id FROM users WHERE id = ?")
    .get(userId) as {
    store_name: string | null;
    state: string | null;
    commission_rate: number;
    lottery_terminal_id: string | null;
  };

  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-semibold">Settings</h1>
      <form action={updateSettings} className="card grid gap-3 md:grid-cols-2">
        <label>
          <p className="mb-1 text-sm text-slate-600">Store Name</p>
          <input className="input" name="store_name" defaultValue={user?.store_name ?? ""} required />
        </label>
        <label>
          <p className="mb-1 text-sm text-slate-600">State</p>
          <input className="input" name="state" defaultValue={user?.state ?? ""} required />
        </label>
        <label>
          <p className="mb-1 text-sm text-slate-600">Commission Rate (%)</p>
          <input
            className="input"
            name="commission_rate"
            type="number"
            step="0.01"
            defaultValue={user?.commission_rate ?? 5.5}
            required
          />
        </label>
        <label>
          <p className="mb-1 text-sm text-slate-600">Lottery Terminal ID</p>
          <input className="input" name="lottery_terminal_id" defaultValue={user?.lottery_terminal_id ?? ""} />
        </label>
        <button className="btn-primary md:col-span-2" type="submit">
          Save Settings
        </button>
      </form>
    </main>
  );
}
