"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

function formatCurrency(v: number) {
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function SalesBarChart({
  data,
}: {
  data: Array<{ date: string; terminal: number; scratch: number; total: number; commission: number }>;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatCurrency(value), name === "terminal" ? "Terminal Sales" : "Scratch-off Sales"]}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
            cursor={{ fill: "#f8fafc" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
            formatter={(value) => (value === "terminal" ? "Terminal Sales" : "Scratch-off Sales")}
          />
          <Bar dataKey="terminal" fill="#6366f1" radius={[4, 4, 0, 0]} name="terminal" />
          <Bar dataKey="scratch" fill="#f59e0b" radius={[4, 4, 0, 0]} name="scratch" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
