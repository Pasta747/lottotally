"use client";

import { useRef, useState } from "react";
import { createDailyEntry } from "@/app/dashboard/actions";

export function DailyEntryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setMessage(null);
    const result = await createDailyEntry(null as any, formData);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else if (result.success) {
      setMessage({ type: "success", text: "Daily entry saved!" });
      formRef.current?.reset();
    }
  }

  return (
    <>
      {message && (
        <div className={`rounded p-3 text-sm ${message.type === "error" ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
          {message.type === "error" ? "❌" : "✅"} {message.text}
        </div>
      )}
      <form ref={formRef} onSubmit={handleSubmit} className="card grid gap-3 md:grid-cols-2">
        <label>
          <p className="mb-1 text-sm text-slate-600">Date</p>
          <input className="input" type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} />
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
    </>
  );
}
