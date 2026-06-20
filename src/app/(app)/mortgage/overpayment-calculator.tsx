"use client";

import * as React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CHART_COLORS, tooltipStyle } from "@/components/charts/chart-theme";
import { amortise, monthsToYearsLabel, payoffMonths } from "@/lib/finance";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

type Props = {
  balance: number;
  rate: number;
  monthlyPayment: number;
};

export function OverpaymentCalculator({ balance, rate, monthlyPayment }: Props) {
  const [extra, setExtra] = React.useState(100);

  const base = React.useMemo(() => amortise(balance, rate, monthlyPayment, 0), [balance, rate, monthlyPayment]);
  const withExtra = React.useMemo(
    () => amortise(balance, rate, monthlyPayment, extra),
    [balance, rate, monthlyPayment, extra],
  );

  const baseMonths = payoffMonths(balance, rate, monthlyPayment, 0);
  const newMonths = payoffMonths(balance, rate, monthlyPayment, extra);
  const monthsSaved = Math.max(0, baseMonths - newMonths);

  const baseInterest = base.length ? base[base.length - 1].interestPaid : 0;
  const newInterest = withExtra.length ? withExtra[withExtra.length - 1].interestPaid : 0;
  const interestSaved = Math.max(0, baseInterest - newInterest);

  // Merge the two balance curves by year for the chart.
  const maxYears = Math.max(base.at(-1)?.year ?? 0, withExtra.at(-1)?.year ?? 0);
  const chartData = Array.from({ length: maxYears }, (_, i) => {
    const year = i + 1;
    return {
      name: `Y${year}`,
      Current: base.find((p) => p.year === year)?.balance ?? 0,
      Overpaying: withExtra.find((p) => p.year === year)?.balance ?? 0,
    };
  });

  const canModel = monthlyPayment > 0 && balance > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overpayment calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="extra">Extra per month (£)</Label>
            <Input
              id="extra"
              type="number"
              min={0}
              step={25}
              value={extra}
              onChange={(e) => setExtra(Math.max(0, Number(e.target.value)))}
            />
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Time saved</p>
            <p className="text-lg font-semibold text-primary">
              {canModel ? monthsToYearsLabel(monthsSaved) : "—"}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Interest saved</p>
            <p className="text-lg font-semibold text-primary">
              {canModel ? formatCurrency(interestSaved) : "—"}
            </p>
          </div>
        </div>

        {canModel ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCompactCurrency(v)}
                width={48}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Current" stroke={CHART_COLORS[1]} strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="Overpaying" stroke={CHART_COLORS[0]} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground">
            Add a balance, interest rate and monthly payment to model overpayments.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
