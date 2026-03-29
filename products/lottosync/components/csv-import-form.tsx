"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { importDailyEntriesCSV } from "@/app/dashboard/actions";

type PreviewRow = { date: string; terminal_sales: number; scratch_sales: number; terminal_report_num: string };

type Result = {
  success: boolean;
  imported: number;
  preview?: { rows: PreviewRow[]; skipped: number; errors: string[] };
  error?: string;
};

export function CSVImportForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "preview" | "importing" | "done" | "error">("idle");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [imported, setImported] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("preview");
    setErrorMsg("");

    const result: Result = await importDailyEntriesCSV(file);
    if (result.success && result.preview) {
      setPreview(result.preview.rows);
      setSkipped(result.preview.skipped);
      setErrors(result.preview.errors);
      setImported(result.imported);
      setStatus("done");
    } else {
      setErrorMsg(result.error ?? "Import failed");
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setPreview([]);
    setSkipped(0);
    setErrors([]);
    setImported(0);
    setErrorMsg("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="card">
      <h2 className="mb-3 text-xl font-semibold">CSV Import</h2>
      <p className="mb-3 text-sm text-slate-600">
        Upload a CSV file from your lottery terminal. Expected columns: <code>date</code>, <code>terminal_sales</code>, <code>scratch_sales</code>, <code>report_num</code>.
        Column names are flexible — the system auto-detects common aliases.
      </p>

      {status === "idle" && (
        <label className="btn-secondary cursor-pointer">
          Choose CSV File
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
      )}

      {status === "preview" && (
        <p className="text-sm text-slate-500">Parsing file…</p>
      )}

      {status === "done" && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-base text-green-800 font-medium">
            ✅ <strong>{imported} entries saved!</strong> Go to Recent Entries or Reports to see your data.
          </div>
          {errors.length > 0 && (
            <details className="rounded bg-amber-50 p-3 text-sm text-amber-800">
              <summary className="cursor-pointer font-medium">Skipped rows ({errors.length})</summary>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                {errors.slice(0, 10).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {errors.length > 10 && <li>…and {errors.length - 10} more</li>}
              </ul>
            </details>
          )}
          {preview.length > 0 && (
            <details className="rounded border p-3 text-sm">
              <summary className="cursor-pointer font-medium">Preview imported rows ({preview.length})</summary>
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="pr-4">Date</th>
                      <th className="pr-4">Terminal Sales</th>
                      <th className="pr-4">Scratch Sales</th>
                      <th className="pr-4">Report #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 20).map((r, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="pr-4">{r.date}</td>
                        <td className="pr-4">${r.terminal_sales.toFixed(2)}</td>
                        <td className="pr-4">${r.scratch_sales.toFixed(2)}</td>
                        <td className="pr-4">{r.terminal_report_num}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 20 && <p className="mt-1 text-slate-400">…and {preview.length - 20} more rows</p>}
              </div>
            </details>
          )}
          <button className="btn-secondary" onClick={reset}>Import Another File</button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-2">
          <div className="rounded bg-red-50 p-3 text-sm text-red-800">❌ {errorMsg}</div>
          <button className="btn-secondary" onClick={reset}>Try Again</button>
        </div>
      )}
    </div>
  );
}
