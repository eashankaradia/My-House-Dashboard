"use client";

import {
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, tooltipStyle } from "./chart-theme";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { useMaskFinance } from "@/hooks/use-mask-finance";
import { MASKED_AMOUNT } from "@/lib/mask-money-text";

type Datum = { name: string; value: number };

export function BarChart({
  data,
  currency = true,
  height = 280,
  multicolor = false,
}: {
  data: Datum[];
  currency?: boolean;
  height?: number;
  multicolor?: boolean;
}) {
  const { masked } = useMaskFinance();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReBarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => (masked ? MASKED_AMOUNT : currency ? formatCompactCurrency(v) : String(v))}
          width={48}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--accent))", opacity: 0.4 }}
          contentStyle={tooltipStyle}
          formatter={(v: number) => (masked ? MASKED_AMOUNT : currency ? formatCurrency(v) : String(v))}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={CHART_COLORS[0]}>
          {multicolor
            ? data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)
            : null}
        </Bar>
      </ReBarChart>
    </ResponsiveContainer>
  );
}
