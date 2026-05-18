"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Leave {
  label: string;
  count: number;
  bitmask: number;
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

export default function LeaveBreakdown({ leaves }: { leaves: Leave[] }) {
  if (!leaves?.length) {
    return <p className="text-slate-400 text-sm text-center py-8">No leave data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={leaves} layout="vertical" margin={{ left: 80 }}>
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 12 }}
          width={80}
        />
        <Tooltip formatter={(v: number) => [`${v} times`, "Left standing"]} />
        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
          {leaves.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
