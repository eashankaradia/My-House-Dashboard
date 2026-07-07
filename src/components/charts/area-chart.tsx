"use client";

import {
  Area,
  AreaChart as ReAreaChart,
  CartesianGrid,
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

export function AreaChart({
  data,
  currency = true,
  height = 280,
}: {
  data: Datum[];
  currency?: boolean;
  height?: number;
}) {
  const { masked } = useMaskFinance();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReAreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.35} />
            <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => (masked ? MASKED_AMOUNT : currency ? formatCompactCurrency(v) : String(v))}
          width={48}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => (masked ? MASKED_AMOUNT : currency ? formatCurrency(v) : String(v))} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={CHART_COLORS[0]}
          strokeWidth={2.5}
          fill="url(#areaFill)"
        />
      </ReAreaChart>
    </ResponsiveContainer>
  );
}
