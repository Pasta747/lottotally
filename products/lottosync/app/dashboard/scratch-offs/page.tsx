import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createScratchBook, markTicketsSold } from "@/app/dashboard/actions";

export default async function ScratchOffsPage() {
  const session = await getSession();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  // Guard: if no valid userId, show empty state instead of crashing
  if (!userId || isNaN(userId)) {
    return (
      <main className="space-y-6">
        <h1 className="text-3xl font-semibold">Scratch-off Tracker</h1>
        <p className="text-slate-600">Session error. Please log out and log in again.</p>
      </main>
    );
  }

  let books: Array<{
    id: number;
    game_name: string;
    book_number: string;
    total_tickets: number;
    face_value: number;
    status: string;
    sold: number;
  }> = [];
  try {
    const booksResult = await sql`
      SELECT sb.*, COALESCE(SUM(ss.tickets_sold), 0) as sold
      FROM scratch_books sb
      LEFT JOIN scratch_sales ss ON sb.id = ss.book_id
      WHERE sb.user_id = ${userId}
      GROUP BY sb.id
      ORDER BY sb.created_at DESC
    `;
    books = booksResult as typeof books;
  } catch (err) {
    console.error("Failed to load scratch books:", err);
    // Render with empty books rather than crashing the whole page
  }

  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-semibold">Scratch-off Tracker</h1>

      <form action={createScratchBook} className="card grid gap-3 md:grid-cols-2">
        <label>
          <p className="mb-1 text-sm text-slate-600">Game Name</p>
          <input className="input" name="game_name" required />
        </label>
        <label>
          <p className="mb-1 text-sm text-slate-600">Book Number</p>
          <input className="input" name="book_number" required />
        </label>
        <label>
          <p className="mb-1 text-sm text-slate-600">Total Tickets</p>
          <input className="input" name="total_tickets" type="number" required />
        </label>
        <label>
          <p className="mb-1 text-sm text-slate-600">Face Value ($)</p>
          <input className="input" name="face_value" type="number" step="0.01" required />
        </label>
        <label>
          <p className="mb-1 text-sm text-slate-600">Activated Date</p>
          <input className="input" name="activated_at" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
        </label>
        <button className="btn-primary md:col-span-2" type="submit">
          Add / Activate Book
        </button>
      </form>

      <div className="space-y-3">
        {books.map((book) => {
          const remaining = book.total_tickets - book.sold;
          const missing = remaining < 0;

          return (
            <div key={book.id} className="card">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{book.game_name}</h3>
                  <p className="text-sm text-slate-500">Book #{book.book_number}</p>
                </div>
                <div className="text-right text-sm">
                  <p>
                    Sold: <strong>{book.sold}</strong> / {book.total_tickets}
                  </p>
                  <p className={missing ? "font-semibold text-red-600" : "text-slate-600"}>
                    Remaining: {remaining}
                  </p>
                  {missing ? <p className="font-semibold text-red-600">Missing tickets flagged</p> : null}
                </div>
              </div>
              <form action={markTicketsSold} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="book_id" value={book.id} />
                <label>
                  <p className="mb-1 text-sm text-slate-600">Tickets Sold</p>
                  <input className="input" type="number" name="tickets_sold" required />
                </label>
                <label>
                  <p className="mb-1 text-sm text-slate-600">Date</p>
                  <input
                    className="input"
                    type="date"
                    name="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                  />
                </label>
                <button className="btn-secondary" type="submit">
                  Mark Sold
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </main>
  );
}
