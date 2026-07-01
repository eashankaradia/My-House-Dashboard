"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CalendarRange } from "lucide-react";
import type { Review } from "@/lib/database.types";
import { weekLabel as formatWeekLabel, monthLabel as formatMonthLabel } from "@/lib/review-periods";
import { ReviewForm } from "./review-form";

export function ReviewsView({
  weekLabel,
  monthLabel,
  thisWeekStart,
  thisMonthStart,
  currentWeekly,
  currentMonthly,
  weeklyReviews,
  monthlyReviews,
  weeklyStats,
  monthlyStats,
}: {
  weekLabel: string;
  monthLabel: string;
  thisWeekStart: string;
  thisMonthStart: string;
  currentWeekly?: Review;
  currentMonthly?: Review;
  weeklyReviews: Review[];
  monthlyReviews: Review[];
  weeklyStats: React.ReactNode;
  monthlyStats: React.ReactNode;
}) {
  return (
    <Tabs defaultValue="weekly" className="space-y-4">
      <TabsList>
        <TabsTrigger value="weekly" className="gap-1.5">
          <CalendarDays className="h-4 w-4" /> Weekly
        </TabsTrigger>
        <TabsTrigger value="monthly" className="gap-1.5">
          <CalendarRange className="h-4 w-4" /> Monthly
        </TabsTrigger>
      </TabsList>

      <TabsContent value="weekly" className="space-y-4">
        {weeklyStats}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">This week · {weekLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewForm periodType="weekly" periodStart={thisWeekStart} existing={currentWeekly} />
          </CardContent>
        </Card>
        <PastReviews reviews={weeklyReviews.filter((r) => r.period_start !== thisWeekStart)} format={formatWeekLabel} />
      </TabsContent>

      <TabsContent value="monthly" className="space-y-4">
        {monthlyStats}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">This month · {monthLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewForm periodType="monthly" periodStart={thisMonthStart} existing={currentMonthly} />
          </CardContent>
        </Card>
        <PastReviews reviews={monthlyReviews.filter((r) => r.period_start !== thisMonthStart)} format={formatMonthLabel} />
      </TabsContent>
    </Tabs>
  );
}

function PastReviews({ reviews, format }: { reviews: Review[]; format: (periodStart: string) => string }) {
  if (reviews.length === 0) return null;
  return (
    <div className="space-y-2">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Past reviews</h2>
      <div className="space-y-2">
        {reviews.map((r) => (
          <details key={r.id} className="rounded-lg border px-4 py-2.5">
            <summary className="cursor-pointer text-sm font-medium">{format(r.period_start)}</summary>
            <div className="mt-2 space-y-2 text-sm text-muted-foreground">
              {r.went_well ? <p><span className="font-medium text-foreground">Went well: </span>{r.went_well}</p> : null}
              {r.stuck ? <p><span className="font-medium text-foreground">Stuck: </span>{r.stuck}</p> : null}
              {r.stop_doing ? <p><span className="font-medium text-foreground">Stop doing: </span>{r.stop_doing}</p> : null}
              {r.priorities ? <p><span className="font-medium text-foreground">Priorities: </span>{r.priorities}</p> : null}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
