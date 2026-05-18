"use client";

import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  summary: {
    strike_rate: number;
    spare_conversion_rate: number;
  };
}

export default function StrikeSpareChart({ summary }: Props) {
  const data = [
    { name: "Strike Rate", value: summary.strike_rate, fill: "#16a34a" },
    { name: "Spare Conv.", value: summary.spare_conversion_rate, fill: "#2563eb" },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="30%"
        outerRadius="90%"
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "#f1f5f9" }} />
        <Legend iconSize={10} />
        <Tooltip formatter={(v: number) => `${v}%`} />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
