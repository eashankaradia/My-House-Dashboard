"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS, tooltipStyle } from "./chart-theme";
import { formatCurrency } from "@/lib/utils";

type Datum = { name: string; value: number };

export function DonutChart({
  data,
  currency = true,
  height = 280,
}: {
  data: Datum[];
  currency?: boolean;
  height?: number;
}) {
  const fmt = (v: number) => (currency ? formatCurrency(v) : String(v));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={64}
          outerRadius={100}
          paddingAngle={2}
          stroke="transparent"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
