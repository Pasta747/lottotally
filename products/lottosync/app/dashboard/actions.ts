"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireUserId() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return Number(session.user.id);
}

export async function createDailyEntry(formData: FormData) {
  const userId = await requireUserId();
  db.prepare(
    `INSERT INTO daily_entries (user_id, date, terminal_sales, scratch_sales, terminal_report_num)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    userId,
    String(formData.get("date")),
    Number(formData.get("terminal_sales")),
    Number(formData.get("scratch_sales")),
    String(formData.get("terminal_report_num"))
  );
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/daily");
  revalidatePath("/dashboard/reports");
}

export async function createScratchBook(formData: FormData) {
  const userId = await requireUserId();
  db.prepare(
    `INSERT INTO scratch_books (user_id, game_name, book_number, total_tickets, face_value, activated_at, status)
     VALUES (?, ?, ?, ?, ?, ?, 'active')`
  ).run(
    userId,
    String(formData.get("game_name")),
    String(formData.get("book_number")),
    Number(formData.get("total_tickets")),
    Number(formData.get("face_value")),
    String(formData.get("activated_at"))
  );
  revalidatePath("/dashboard/scratch-offs");
}

export async function markTicketsSold(formData: FormData) {
  const bookId = Number(formData.get("book_id"));
  db.prepare(`INSERT INTO scratch_sales (book_id, tickets_sold, date) VALUES (?, ?, ?)`)
    .run(bookId, Number(formData.get("tickets_sold")), String(formData.get("date")));
  revalidatePath("/dashboard/scratch-offs");
  revalidatePath("/dashboard/reports");
}

export async function createSettlement(formData: FormData) {
  const userId = await requireUserId();
  const amount = Number(formData.get("amount"));
  const date = String(formData.get("date"));

  const settings = db
    .prepare("SELECT commission_rate FROM users WHERE id = ?")
    .get(userId) as { commission_rate: number };

  const sales = db
    .prepare("SELECT COALESCE(SUM(terminal_sales + scratch_sales), 0) as total FROM daily_entries WHERE user_id = ?")
    .get(userId) as { total: number };

  const expected = Number(((sales.total * (settings?.commission_rate ?? 5.5)) / 100).toFixed(2));
  const discrepancy = Number((amount - expected).toFixed(2));

  db.prepare(
    `INSERT INTO settlements (user_id, amount, date, expected_amount, discrepancy)
     VALUES (?, ?, ?, ?, ?)`
  ).run(userId, amount, date, expected, discrepancy);

  revalidatePath("/dashboard/commissions");
  revalidatePath("/dashboard/reports");
}

export async function updateSettings(formData: FormData) {
  const userId = await requireUserId();

  db.prepare(
    `UPDATE users
      SET store_name = ?,
          state = ?,
          commission_rate = ?,
          lottery_terminal_id = ?
      WHERE id = ?`
  ).run(
    String(formData.get("store_name")),
    String(formData.get("state")),
    Number(formData.get("commission_rate")),
    String(formData.get("lottery_terminal_id")),
    userId
  );

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
}
