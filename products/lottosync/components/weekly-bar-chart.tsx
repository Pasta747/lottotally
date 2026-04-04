"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

function formatCurrency(v: number) {
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function WeeklyBarChart({
  data,
}: {
  data: Array<{ week: string; total: number; commission: number }>;
}) {
  const avg = data.length > 0 ? data.reduce((s, w) => s + Number(w.total), 0) / data.length : 0;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), "Weekly Sales"]}
            labelFormatter={(label) => `Week: ${label}`}
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
            cursor={{ fill: "#f8fafc" }}
          />
          {avg > 0 && (
            <ReferenceLine
              y={avg}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              label={{ value: `Avg: ${formatCurrency(avg)}`, position: "insideTopRight", fontSize: 11, fill: "#94a3b8" }}
            />
          )}
          <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} name="Weekly Sales" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
