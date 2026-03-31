"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db"; // Use Vercel Postgres client
import { getSession } from "@/lib/auth";

async function requireUserId() {
  const session = await getSession();
  if (!session?.user?.email) throw new Error("Unauthorized: not logged in. Please log out and log in again.");

  const userResult = await sql`SELECT id FROM lt_users WHERE email = ${session.user.email.toLowerCase()} LIMIT 1`;
  if (userResult.length === 0) throw new Error("Unauthorized: account not found. Please log out and log in again.");
  return Number(userResult[0].id);
}

export type ActionState = { error: string | null; success: string | null };

export async function createDailyEntry(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return { error: "Not logged in. Please log out and log in again.", success: null };
    }

    const userResult = await sql`SELECT id FROM lt_users WHERE email = ${session.user.email.toLowerCase()} LIMIT 1`;
    if (userResult.length === 0) {
      return { error: "Account not found. Please log out and log in again.", success: null };
    }
    const userId = Number(userResult[0].id);

    const date = String(formData.get("date") ?? "");
    const terminal_sales = Number(formData.get("terminal_sales") ?? 0);
    const scratch_sales = Number(formData.get("scratch_sales") ?? 0);
    const terminal_report_num = String(formData.get("terminal_report_num") ?? "");

    if (!date || !terminal_sales) {
      return { error: "Missing date or terminal sales", success: null };
    }

    await sql`
      INSERT INTO daily_entries (user_id, date, terminal_sales, scratch_sales, terminal_report_num)
      VALUES (${userId}, ${date}, ${terminal_sales}, ${scratch_sales}, ${terminal_report_num})
    `;
    try {
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/daily");
      revalidatePath("/dashboard/reports");
    } catch (e) {
      console.error("revalidatePath error:", e);
    }
    return { error: null, success: "Daily entry saved!" };
  } catch (err) {
    console.error("createDailyEntry error:", err);
    return { error: "Failed to save daily entry. Please try again.", success: null };
  }
}

export async function insertDailyEntry(
  date: string,
  terminal_sales: number,
  scratch_sales: number,
  terminal_report_num: string
): Promise<{ success: boolean; error?: string; userId?: number }> {
  try {
    // Always look up user fresh from session email — don't trust cached/stale session userId
    const session = await getSession();
    if (!session?.user?.email) {
      return { success: false, error: "Not logged in. Please log out and log in again." };
    }
    const userResult = await sql`SELECT id FROM lt_users WHERE email = ${session.user.email.toLowerCase()} LIMIT 1`;
    if (userResult.length === 0) {
      return { success: false, error: "Account not found. Please log out and log in again." };
    }
    const userId = Number(userResult[0].id);

    await sql`
      INSERT INTO daily_entries (user_id, date, terminal_sales, scratch_sales, terminal_report_num)
      VALUES (${userId}, ${date}, ${terminal_sales}, ${scratch_sales}, ${terminal_report_num})
    `;
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/daily");
    revalidatePath("/dashboard/reports");
    return { success: true, userId };
  } catch (err) {
    console.error("insertDailyEntry ERROR:", err);
    return { success: false, error: String(err) };
  }
}

export async function createScratchBook(formData: FormData) {
  const userId = await requireUserId();
  await sql`
    INSERT INTO scratch_books (user_id, game_name, book_number, total_tickets, face_value, activated_at, status)
    VALUES (${userId}, ${String(formData.get("game_name")!)}, ${String(formData.get("book_number")!)}, ${Number(formData.get("total_tickets")!)}, ${Number(formData.get("face_value")!)}, ${String(formData.get("activated_at"))}, 'active')
  `;
  revalidatePath("/dashboard/scratch-offs");
}

export async function markTicketsSold(formData: FormData) {
  const bookId = Number(formData.get("book_id"));
  await sql`INSERT INTO scratch_sales (book_id, tickets_sold, date) VALUES (${bookId}, ${Number(formData.get("tickets_sold")!)}, ${String(formData.get("date"))})`;
  revalidatePath("/dashboard/scratch-offs");
  revalidatePath("/dashboard/reports");
}

export async function createSettlement(formData: FormData) {
  const userId = await requireUserId();
  const amount = Number(formData.get("amount"));
  const date = String(formData.get("date"));

  // Ensure expected_amount column exists (migration safety net)
  try {
    await sql`ALTER TABLE settlements ADD COLUMN IF NOT EXISTS expected_amount NUMERIC DEFAULT 0`;
  } catch {
    // Column may already exist — ignore
  }

  // Fetch user settings and daily entries using separate SQL queries
  const userResult = await sql`SELECT commission_rate FROM lt_users WHERE id = ${userId}`;
  const settings = userResult[0] as { commission_rate: number } | undefined;

  const salesResult = await sql`SELECT COALESCE(SUM(terminal_sales + scratch_sales), 0) as total FROM daily_entries WHERE user_id = ${userId}`;
  const sales = (salesResult[0] as { total: number } | undefined) ?? { total: 0 };

  const expected = Number(((sales.total * (settings?.commission_rate ?? 5.5)) / 100).toFixed(2));
  const discrepancy = Number((amount - expected).toFixed(2));

  await sql`
    INSERT INTO settlements (user_id, amount, date, expected_amount, discrepancy)
    VALUES (${userId}, ${amount}, ${date}, ${expected}, ${discrepancy})
  `;

  revalidatePath("/dashboard/commissions");
  revalidatePath("/dashboard/reports");
}

export async function updateSettings(formData: FormData) {
  const userId = await requireUserId();

  await sql`
    UPDATE lt_users
    SET store_name = ${String(formData.get("store_name"))},
        state = ${String(formData.get("state"))},
        commission_rate = ${Number(formData.get("commission_rate"))},
        lottery_terminal_id = ${String(formData.get("lottery_terminal_id"))}
    WHERE id = ${userId}
  `;

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
}

// ─── CSV Import ────────────────────────────────────────────────────────────────

type RawCSVRow = Record<string, string>;

function findCol(headers: string[], aliases: string[]): string | undefined {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const alias of aliases) {
    const idx = lower.indexOf(alias.toLowerCase().trim());
    if (idx !== -1) return headers[idx];
  }
  return undefined;
}

function parseCSVBody(body: string): { headers: string[]; rows: RawCSVRow[] } {
  const lines = body.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row");
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cols = parseCSVLine(line);
    const row: RawCSVRow = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ""; });
    return row;
  });
  return { headers, rows };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseVal(v: string): number {
  return Number(String(v).replace(/[$,]/g, "")) || 0;
}

export type CSVPreview = {
  rows: Array<{ date: string; terminal_sales: number; scratch_sales: number; terminal_report_num: string }>;
  skipped: number;
  errors: string[];
};

export async function importDailyEntriesCSV(
  file: File
): Promise<{ success: boolean; imported: number; preview?: CSVPreview; error?: string }> {
  const userId = await requireUserId();
  let text: string;
  try {
    text = await file.text();
  } catch {
    return { success: false, imported: 0, error: "Could not read file" };
  }

  let parsed: { headers: string[]; rows: RawCSVRow[] };
  try {
    parsed = parseCSVBody(text);
  } catch {
    return { success: false, imported: 0, error: "Invalid CSV format" };
  }

  const { headers, rows } = parsed;
  const dateCol = findCol(headers, ["date", "entry_date", "report_date", "transaction_date", "sales_date"]);
  const termCol = findCol(headers, ["terminal_sales", "lottery_sales", "total_lottery", "vltv", "lottery", "vlt"]);
  const scratchCol = findCol(headers, ["scratch_sales", "scratch_off_sales", "scratch", "instant", "instant_sales"]);
  const reportCol = findCol(headers, ["report_num", "terminal_report_num", "report_number", "batch_num", "terminal_report", "report"]);

  if (!dateCol || !termCol) {
    return {
      success: false,
      imported: 0,
      error: `Could not find required columns. Expected "date" and "terminal_sales" (or equivalent). Found: ${headers.join(", ")}`,
    };
  }

  const validRows: Array<{ date: string; terminal_sales: number; scratch_sales: number; terminal_report_num: string }> = [];
  const errors: string[] = [];
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const dateVal = row[dateCol]?.trim();
    const termVal = parseVal(row[termCol] ?? "");
    const scratchVal = parseVal(row[scratchCol ?? ""] ?? "");
    const reportVal = (reportCol ? row[reportCol]?.trim() : "") ?? "";

    if (!dateVal || !termVal) {
      errors.push(`Row ${i + 2}: missing date or terminal_sales — skipped`);
      skipped++;
      continue;
    }

    // Normalize date: try YYYY-MM-DD, MM/DD/YYYY, MM-DD-YYYY
    let normalizedDate = dateVal;
    const mdyMatch = dateVal.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const mdyDashMatch = dateVal.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (mdyMatch) {
      const [, m, d, y] = mdyMatch;
      normalizedDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    } else if (mdyDashMatch) {
      const [, m, d, y] = mdyDashMatch;
      normalizedDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    validRows.push({ date: normalizedDate, terminal_sales: termVal, scratch_sales: scratchVal, terminal_report_num: reportVal });
  }

  if (validRows.length === 0) {
    return { success: false, imported: 0, error: `No valid rows found. ${errors.join("; ")}` };
  }

  // Batch insert
  for (const row of validRows) {
    await sql`
      INSERT INTO daily_entries (user_id, date, terminal_sales, scratch_sales, terminal_report_num)
      VALUES (${userId}, ${row.date}, ${row.terminal_sales}, ${row.scratch_sales}, ${row.terminal_report_num})
    `;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/daily");
  revalidatePath("/dashboard/reports");

  return {
    success: true,
    imported: validRows.length,
    preview: { rows: validRows, skipped, errors },
  };
}