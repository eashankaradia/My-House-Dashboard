"use client";

import { Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MEMBER_COLOR_TEXT } from "@/lib/constants";
import { formatCurrency, formatDate, initialsFromName } from "@/lib/utils";
import type { MemberMap } from "@/lib/household";
import type { HouseholdContribution, HouseholdMember } from "@/lib/database.types";
import { HouseholdContributionForm } from "./household-contribution-form";

function isActive(c: HouseholdContribution, today: string): boolean {
  if (c.start_date && c.start_date > today) return false;
  if (c.end_date && c.end_date < today) return false;
  return true;
}

export function HouseholdContributions({
  monthlyTotal,
  contributions,
  members,
  memberMap,
}: {
  monthlyTotal: number;
  contributions: HouseholdContribution[];
  members: HouseholdMember[];
  memberMap: MemberMap;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const active = contributions.filter((c) => isActive(c, todayStr));
  const fixed = active.filter((c) => c.amount != null);
  const remainder = active.filter((c) => c.amount == null);
  const fixedTotal = fixed.reduce((s, c) => s + Number(c.amount), 0);
  const remainderEach = remainder.length > 0 ? Math.max(0, monthlyTotal - fixedTotal) / remainder.length : 0;

  if (members.length <= 1) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" /> Household contributions
        </CardTitle>
        <HouseholdContributionForm members={members} />
      </CardHeader>
      <CardContent className="space-y-2">
        {contributions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No split set — add who puts in what toward the household&apos;s {formatCurrency(monthlyTotal)}/mo bills.
          </p>
        ) : (
          <div className="space-y-1.5">
            {contributions.map((c) => {
              const name = memberMap[c.member_id] ?? "Unknown";
              const color = members.find((m) => m.user_id === c.member_id)?.color;
              const effective = c.amount != null ? Number(c.amount) : remainderEach;
              const live = isActive(c, todayStr);
              return (
                <HouseholdContributionForm
                  key={c.id}
                  members={members}
                  contribution={c}
                  trigger={
                    <button className="flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="text-xs">{initialsFromName(name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${color ? MEMBER_COLOR_TEXT[color] ?? "" : ""}`}>{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.start_date ? `From ${formatDate(c.start_date)}` : "Always"}
                          {c.end_date ? ` to ${formatDate(c.end_date)}` : ""}
                          {!live ? " · not active" : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        {c.amount != null ? (
                          <p className="font-semibold">{formatCurrency(Number(c.amount))}</p>
                        ) : (
                          <Badge variant="secondary">Pays the rest</Badge>
                        )}
                        {live && c.amount == null && remainderEach > 0 && (
                          <p className="text-xs text-muted-foreground">≈ {formatCurrency(effective)}</p>
                        )}
                      </div>
                    </button>
                  }
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
