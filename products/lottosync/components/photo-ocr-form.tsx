"use client";

import { useState, useRef } from "react";
import Tesseract from "tesseract.js";
import { insertDailyEntry } from "@/app/dashboard/actions";

type ParsedData = {
  date: string;
  terminal_sales: number;
  scratch_sales: number;
  terminal_report_num: string;
};

function normalizeDate(raw: string): string | null {
  // YYYY-MM-DD
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // MM/DD/YYYY or MM-DD-YYYY
  const mdy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2,"0")}-${mdy[2].padStart(2,"0")}`;
  // DD/MM/YYYY (common outside US)
  const dmy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}`;
  return null;
}

function parseVal(s: string): number {
  return Number(String(s).replace(/[$,\s]/g, "")) || 0;
}

function parseTerminalReport(text: string): ParsedData | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  // ── Approach 1: Table-structured text (CSV printout, spreadsheet photo) ──
  // Look for lines that have a date + dollar amounts in columns
  const dollarPattern = /\$?([\d,]+\.\d{2})/g;
  const datePattern = /(\d{4}-\d{2}-\d{2}|\d{2}[\/\-]\d{2}[\/\-]\d{4})/;

  for (const line of lines) {
    const dateMatch = line.match(datePattern);
    const amounts: number[] = [];
    let m;
    // Reset lastIndex by recreating the regex
    const dp = new RegExp(dollarPattern.source, 'g');
    while ((m = dp.exec(line)) !== null) {
      const v = parseVal(m[1]);
      if (v > 10) amounts.push(v); // filter tiny values
    }

    if (dateMatch && amounts.length >= 1) {
      const date = normalizeDate(dateMatch[1]);
      if (!date) continue;

      // Largest amount = terminal sales. Second largest = scratch sales (if present)
      amounts.sort((a, b) => b - a);
      const terminal_sales = amounts[0];
      const scratch_sales = amounts.length > 1 ? amounts[1] : 0;

      // Try to find a report number (5-12 digit number on same line)
      const reportMatch = line.match(/\b(\d{5,12})\b/);
      const terminal_report_num = reportMatch ? reportMatch[1] : "";

      if (terminal_sales > 0) {
        return { date, terminal_sales, scratch_sales, terminal_report_num };
      }
    }
  }

  // ── Approach 2: Keyword-based (printed terminal reports) ──
  const full = lines.join(" ");

  // Find date
  let date = "";
  for (const pat of [
    /(\d{4})-(\d{2})-(\d{2})/,
    /(\d{2})\/(\d{2})\/(\d{4})/,
    /(\d{2})-(\d{2})-(\d{4})/,
  ]) {
    const m = full.match(pat);
    if (m) {
      if (pat.source.startsWith("\\d{4}")) date = `${m[1]}-${m[2]}-${m[3]}`;
      else date = `${m[3]}-${m[1].padStart(2,"0")}-${m[2].padStart(2,"0")}`;
      break;
    }
  }

  // Find all dollar amounts — terminal sales is usually the largest
  const amounts: number[] = [];
  const dPat = new RegExp(dollarPattern.source, 'g');
  let dm;
  while ((dm = dPat.exec(full)) !== null) {
    const v = parseVal(dm[1]);
    if (v > 100) amounts.push(v); // lottery totals are rarely < $100
  }
  const terminal_sales = amounts.length > 0 ? Math.max(...amounts) : 0;

  // Scratch sales: find line with "scratch" / "instant"
  let scratch_sales = 0;
  for (const line of lines) {
    if (line.toLowerCase().includes("scratch") || line.toLowerCase().includes("instant")) {
      const nums = [...line.matchAll(new RegExp(dollarPattern.source, 'g'))];
      const vals = nums.map((n) => parseVal(n[1])).filter((v) => v > 0);
      if (vals.length > 0) scratch_sales = vals[vals.length - 1];
      break;
    }
  }

  // Report number
  let terminal_report_num = "";
  for (const pat of [
    /report[ #]*[:]?\s*([A-Z0-9-]+)/i,
    /batch[ #]*[:]?\s*([A-Z0-9-]+)/i,
    /terminal[ #]*[:]?\s*([A-Z0-9-]+)/i,
    /\b([0-9]{6,12})\b/,
  ]) {
    const match = full.match(pat);
    if (match) { terminal_report_num = match[1]; break; }
  }

  if (!date || !terminal_sales) return null;
  return { date, terminal_sales, scratch_sales, terminal_report_num };
}

export function PhotoOCRForm() {
  const [stage, setStage] = useState<"idle" | "scanning" | "preview" | "submitting" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [rawText, setRawText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStage("scanning");
    setProgress(0);
    setErrorMsg("");
    setImageUrl(URL.createObjectURL(file));

    const result = await Tesseract.recognize(file, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100));
      },
    });

    const text = result.data.text;
    setRawText(text);

    const data = parseTerminalReport(text);
    if (data) {
      setParsed(data);
      setStage("preview");
    } else {
      setErrorMsg("Could not read numbers from this photo. Tips: make sure the photo is flat, well-lit, and the numbers are clearly visible. Use CSV Import for spreadsheet files.");
      setStage("error");
    }
  }

  async function handleConfirm() {
    if (!parsed) return;
    setStage("submitting");
    const result = await insertDailyEntry(
      parsed.date,
      parsed.terminal_sales,
      parsed.scratch_sales,
      parsed.terminal_report_num
    );
    if (result.success) {
      setStage("done");
    } else {
      setErrorMsg(result.error ?? "Failed to save. Please try again.");
      setStage("error");
    }
  }

  function reset() {
    setStage("idle");
    setParsed(null);
    setRawText("");
    setErrorMsg("");
    setProgress(0);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="card">
      <h2 className="mb-3 text-xl font-semibold">Photo OCR</h2>
      <p className="mb-3 text-sm text-slate-600">
        Take a photo of your printed terminal report. Numbers will be auto-extracted and pre-filled.
      </p>

      {stage === "idle" && (
        <label className="btn-secondary cursor-pointer">
          📷 Take / Upload Photo
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
      )}

      {stage === "scanning" && (
        <div className="space-y-2">
          {imageUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={imageUrl} alt="Uploaded" className="max-h-48 rounded border" />
          )}
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded bg-slate-200">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-sm text-slate-500">{progress}%</span>
          </div>
          <p className="text-sm text-slate-500">Scanning image…</p>
        </div>
      )}

      {stage === "preview" && parsed && (
        <div className="space-y-3">
          <div className="rounded bg-blue-50 p-3">
            <p className="mb-2 text-sm font-medium text-blue-800">Extracted values — confirm before saving</p>
            <div className="grid gap-1 text-sm">
              <div><span className="text-slate-500">Date:</span> <strong>{parsed.date}</strong></div>
              <div><span className="text-slate-500">Terminal Sales:</span> <strong>${parsed.terminal_sales.toFixed(2)}</strong></div>
              <div><span className="text-slate-500">Scratch Sales:</span> <strong>{parsed.scratch_sales > 0 ? `$${parsed.scratch_sales.toFixed(2)}` : "(not found)"}</strong></div>
              <div><span className="text-slate-500">Report #:</span> <strong>{parsed.terminal_report_num || "(not found)"}</strong></div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={handleConfirm}>✅ Save Entry</button>
            <button className="btn-secondary" onClick={reset}>❌ Discard</button>
          </div>
          <details className="text-xs text-slate-400">
            <summary className="cursor-pointer">Raw OCR text</summary>
            <pre className="mt-1 whitespace-pre-wrap break-all rounded bg-slate-50 p-2">{rawText}</pre>
          </details>
        </div>
      )}

      {stage === "submitting" && (
        <p className="text-sm text-slate-500">Saving entry…</p>
      )}

      {stage === "done" && (
        <div className="space-y-2">
          <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-base text-green-800 font-medium">
            ✅ Entry saved! Check Recent Entries or Reports.
          </div>
          <button className="btn-secondary" onClick={reset}>Scan Another Photo</button>
        </div>
      )}

      {stage === "error" && (
        <div className="space-y-2">
          <div className="rounded bg-red-50 p-3 text-sm text-red-800">❌ {errorMsg}</div>
          {rawText && (
            <details className="text-xs text-slate-400">
              <summary className="cursor-pointer">Raw OCR text (for debugging)</summary>
              <pre className="mt-1 whitespace-pre-wrap break-all rounded bg-slate-50 p-2">{rawText}</pre>
            </details>
          )}
          <button className="btn-secondary" onClick={reset}>Try Again</button>
        </div>
      )}
    </div>
  );
}
