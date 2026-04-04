"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function ReportChart({
  data,
}: {
  data: Array<{ date: string; commissionAccuracy?: number; commission?: number }>;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            tickFormatter={(v) => `$${v.toFixed(0)}`}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          <Tooltip
            formatter={(value: number) => [`$${value.toFixed(2)}`, "Est. Commission"]}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
          />
          <Line
            type="monotone"
            dataKey="commission"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ fill: "#10b981", r: 3 }}
            activeDot={{ r: 5 }}
            name="Est. Commission"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
