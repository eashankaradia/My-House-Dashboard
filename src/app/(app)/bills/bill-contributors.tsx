"use client";

import { Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MEMBER_COLOR_TEXT } from "@/lib/constants";
import { formatCurrency, formatDate, initialsFromName } from "@/lib/utils";
import type { MemberMap } from "@/lib/household";
import type { Bill, BillContributor, HouseholdMember } from "@/lib/database.types";
import { BillContributorForm } from "./bill-contributor-form";

function isActive(c: BillContributor, today: string): boolean {
  if (c.start_date && c.start_date > today) return false;
  if (c.end_date && c.end_date < today) return false;
  return true;
}

export function BillContributors({
  bill,
  contributors,
  members,
  memberMap,
}: {
  bill: Bill;
  contributors: BillContributor[];
  members: HouseholdMember[];
  memberMap: MemberMap;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const active = contributors.filter((c) => isActive(c, todayStr));
  const fixed = active.filter((c) => c.amount != null);
  const remainder = active.filter((c) => c.amount == null);
  const fixedTotal = fixed.reduce((s, c) => s + Number(c.amount), 0);
  const remainderEach = remainder.length > 0 ? Math.max(0, Number(bill.amount) - fixedTotal) / remainder.length : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Users className="h-3.5 w-3.5" /> Who pays
        </p>
        <BillContributorForm billId={bill.id} members={members} />
      </div>

      {contributors.length === 0 ? (
        <p className="text-sm text-muted-foreground">No split set — add who contributes what.</p>
      ) : (
        <div className="space-y-1.5">
          {contributors.map((c) => {
            const name = memberMap[c.member_id] ?? "Unknown";
            const color = members.find((m) => m.user_id === c.member_id)?.color;
            const effective = c.amount != null ? Number(c.amount) : remainderEach;
            const live = isActive(c, todayStr);
            return (
              <BillContributorForm
                key={c.id}
                billId={bill.id}
                members={members}
                contributor={c}
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

      {active.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Currently: {fixed.map((c) => `${memberMap[c.member_id] ?? "Unknown"} ${formatCurrency(Number(c.amount))}`).join(", ")}
          {fixed.length > 0 && remainder.length > 0 ? ", " : ""}
          {remainder.map((c) => `${memberMap[c.member_id] ?? "Unknown"} ${formatCurrency(remainderEach)} (rest)`).join(", ")}
        </p>
      )}
    </div>
  );
}
