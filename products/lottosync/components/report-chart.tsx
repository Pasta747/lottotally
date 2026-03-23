"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function ReportChart({ data }: { data: Array<{ date: string; shrinkage: number; commissionAccuracy: number }> }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="shrinkage" stroke="#ef4444" strokeWidth={2} name="Shrinkage $" />
          <Line
            type="monotone"
            dataKey="commissionAccuracy"
            stroke="#6366f1"
            strokeWidth={2}
            name="Commission Accuracy %"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
