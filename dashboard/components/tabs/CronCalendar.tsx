"use client";
import { useState } from "react";
import { cronJobs } from "@/lib/data";

type ViewMode = "week" | "day";

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Operations: { bg: "bg-blue-950/30", border: "border-blue-500/40", text: "text-blue-400" },
  Trading: { bg: "bg-green-950/30", border: "border-green-500/40", text: "text-green-400" },
  Marketing: { bg: "bg-yellow-950/30", border: "border-yellow-500/40", text: "text-yellow-400" },
  Research: { bg: "bg-purple-950/30", border: "border-purple-500/40", text: "text-purple-400" },
};

const STATUS_COLORS: Record<string, string> = {
  "✅ ok": "text-green-400",
  "⚠️ warn": "text-yellow-400",
  "🔴 err": "text-red-400",
  "⏳ due": "text-orange-400",
};

export default function CronCalendarTab() {
  const [view, setView] = useState<ViewMode>("week");

  const categories = ["Operations", "Trading", "Marketing", "Research"] as const;

  // Week days
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Group jobs by category
  const jobsByCategory = categories.reduce((acc, cat) => {
    acc[cat] = cronJobs.filter((j) => j.category === cat);
    return acc;
  }, {} as Record<string, typeof cronJobs>);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🗓️</span>
        <div>
          <h1 className="text-xl font-bold text-white">Cron Calendar</h1>
          <p className="text-sm text-slate-500">Mission Control scheduling — {cronJobs.length} active jobs</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setView("week")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              view === "week"
                ? "bg-indigo-600 text-white"
                : "bg-[#111118] border border-[#1e1e2e] text-slate-400"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setView("day")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              view === "day"
                ? "bg-indigo-600 text-white"
                : "bg-[#111118] border border-[#1e1e2e] text-slate-400"
            }`}
          >
            Day
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const jobs = jobsByCategory[cat];
          const ok = jobs.filter((j) => j.status === "✅ ok").length;
          const warn = jobs.filter((j) => j.status === "⚠️ warn").length;
          const err = jobs.filter((j) => j.status === "🔴 err" || j.status === "⏳ due").length;
          const colors = CATEGORY_COLORS[cat];
          return (
            <div key={cat} className={`card border ${colors.border}`}>
              <p className={`text-xs font-medium uppercase tracking-wider ${colors.text} mb-2`}>{cat}</p>
              <p className="text-2xl font-bold text-white">{jobs.length}</p>
              <div className="flex gap-3 mt-1 text-xs">
                <span className="text-green-400">{ok} ok</span>
                {warn > 0 && <span className="text-yellow-400">{warn} warn</span>}
                {err > 0 && <span className="text-red-400">{err} err</span>}
              </div>
            </div>
          );
        })}
      </div>

      {view === "week" ? (
        <>
          {/* Week header */}
          <div className="card overflow-x-auto p-0">
            <div className="min-w-[700px]">
              {/* Header row */}
              <div className="flex border-b border-[#1e1e2e]">
                <div className="w-48 shrink-0 px-4 py-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Job</p>
                </div>
                {weekDays.map((day) => (
                  <div key={day} className="flex-1 text-center px-2 py-3 border-l border-[#1e1e2e]">
                    <p className="text-xs text-slate-400 font-medium">{day}</p>
                  </div>
                ))}
              </div>

              {/* Category sections */}
              {categories.map((cat) => {
                const jobs = jobsByCategory[cat];
                const colors = CATEGORY_COLORS[cat];
                return (
                  <div key={cat}>
                    {/* Category label */}
                    <div className={`flex items-center gap-2 px-4 py-2 border-b border-[#1e1e2e] ${colors.bg}`}>
                      <span className={`text-xs font-semibold ${colors.text}`}>{cat}</span>
                      <div className="h-px flex-1 bg-[#1e1e2e]" />
                    </div>
                    {/* Jobs */}
                    {jobs.map((job) => (
                      <div key={job.name} className="flex border-b border-[#1e1e2e]/50 hover:bg-white/[0.02]">
                        <div className="w-48 shrink-0 px-4 py-3">
                          <p className="text-sm text-slate-200 font-medium">{job.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{job.schedule}</p>
                        </div>
                        {weekDays.map((day) => (
                          <div key={day} className="flex-1 px-2 py-3 border-l border-[#1e1e2e]/50 text-center">
                            <span className={`pill text-xs ${colors.bg} ${colors.border} ${colors.text}`}>
                              {job.schedule.toLowerCase().includes(day.toLowerCase().slice(0, 3)) || job.schedule === "Every 15 min" || job.schedule === "Every 30 min" ? "●" : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Day view */}
          <div className="card overflow-x-auto p-0">
            <div className="min-w-[700px]">
              <div className="flex border-b border-[#1e1e2e]">
                <div className="w-48 shrink-0 px-4 py-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Time</p>
                </div>
                <div className="flex-1 px-4 py-3">
                  <p className="text-sm text-slate-200 font-medium">Today — Sat Mar 28, 2026</p>
                </div>
              </div>

              {categories.map((cat) => {
                const jobs = jobsByCategory[cat];
                const colors = CATEGORY_COLORS[cat];
                return (
                  <div key={cat}>
                    <div className={`flex items-center gap-2 px-4 py-2 border-b border-[#1e1e2e] ${colors.bg}`}>
                      <span className={`text-xs font-semibold ${colors.text}`}>{cat}</span>
                      <div className="h-px flex-1 bg-[#1e1e2e]" />
                    </div>
                    {jobs.map((job) => (
                      <div key={job.name} className="flex border-b border-[#1e1e2e]/50 hover:bg-white/[0.02]">
                        <div className="w-48 shrink-0 px-4 py-3">
                          <p className="text-xs text-slate-400">{job.schedule}</p>
                        </div>
                        <div className="flex-1 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <p className="text-sm text-slate-200 font-medium">{job.name}</p>
                            <span className={`pill text-xs ${colors.bg} ${colors.border} ${colors.text}`}>{cat}</span>
                            <span className={`pill text-xs ${job.status === "✅ ok" ? "bg-green-500/10 text-green-400 border border-green-500/20" : job.status === "⚠️ warn" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                              {job.status}
                            </span>
                          </div>
                          <div className="flex gap-4 mt-1">
                            <p className="text-xs text-slate-500">Last: {job.lastRun}</p>
                            <p className="text-xs text-slate-500">Next: {job.nextRun}</p>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{job.notes}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Job detail table */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">All Jobs</h2>
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="dash-table min-w-[900px]">
              <thead>
                <tr>
                  <th className="pl-5">Job</th>
                  <th>Category</th>
                  <th>Schedule</th>
                  <th>Last Run</th>
                  <th>Next Run</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {cronJobs.map((job) => {
                  const colors = CATEGORY_COLORS[job.category];
                  return (
                    <tr key={job.name}>
                      <td className="pl-5 py-2.5 text-sm text-white font-medium">{job.name}</td>
                      <td className="py-2.5">
                        <span className={`pill text-xs ${colors.bg} ${colors.border} ${colors.text}`}>{job.category}</span>
                      </td>
                      <td className="py-2.5 text-sm text-slate-400">{job.schedule}</td>
                      <td className="py-2.5 text-xs text-slate-400">{job.lastRun}</td>
                      <td className="py-2.5 text-xs text-slate-400">{job.nextRun}</td>
                      <td className="py-2.5">
                        <span className={`pill text-xs ${job.status === "✅ ok" ? "bg-green-500/10 text-green-400 border-green-500/20" : job.status === "⚠️ warn" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-slate-500 max-w-[240px]">{job.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
