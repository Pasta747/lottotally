"use client";

import { useRef, useState } from "react";
import { createDailyEntry } from "@/app/dashboard/actions";
import { CSVImportForm } from "@/components/csv-import-form";
import { PhotoOCRForm } from "@/components/photo-ocr-form";

type Tab = "manual" | "csv" | "ocr";

export function DailyEntryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [tab, setTab] = useState<Tab>("manual");

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
    <div className="space-y-4">
      {/* Tab picker */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {[
          { id: "manual", label: "Manual Entry" },
          { id: "csv", label: "CSV Import" },
          { id: "ocr", label: "Photo OCR" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as Tab)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Manual entry */}
      {tab === "manual" && (
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
      )}

      {/* CSV import */}
      {tab === "csv" && <CSVImportForm />}

      {/* Photo OCR */}
      {tab === "ocr" && <PhotoOCRForm />}
    </div>
  );
}
