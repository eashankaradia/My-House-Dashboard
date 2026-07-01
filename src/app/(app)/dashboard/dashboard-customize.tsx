"use client";

import * as React from "react";
import { Eye, EyeOff, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDashboardPrefs } from "@/hooks/use-dashboard-prefs";
import { cn } from "@/lib/utils";

/** The widgets a user can show/hide on their dashboard. */
export const DASHBOARD_WIDGETS: { id: string; label: string }[] = [
  { id: "pinned", label: "Pinned" },
  { id: "habitCheckIn", label: "Today's habits" },
  { id: "goalsProgress", label: "Goals progress" },
  { id: "cashFlow", label: "Cash flow" },
  { id: "finance", label: "Glance stats" },
  { id: "week", label: "Week ahead" },
  { id: "reminders", label: "Renewal reminders" },
  { id: "projects", label: "Open projects & tasks" },
  { id: "maintenance", label: "Upcoming maintenance" },
  { id: "inspiration", label: "Recent inspiration" },
  { id: "purchases", label: "Added to wishlist" },
  { id: "activity", label: "Activity by household" },
];

/** Hides its children when the user has switched this widget off. */
export function DashboardWidget({ id, children }: { id: string; children: React.ReactNode }) {
  const { hidden } = useDashboardPrefs();
  if (hidden.includes(id)) return null;
  return <>{children}</>;
}

/** Header button opening a dialog to choose which dashboard widgets show. */
export function EditDashboardButton() {
  const { hidden, toggle } = useDashboardPrefs();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Edit dashboard" title="Edit dashboard">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Customise your dashboard</DialogTitle>
          <DialogDescription>Choose which cards appear. Saved on this device.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {DASHBOARD_WIDGETS.map((w) => {
            const isHidden = hidden.includes(w.id);
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => toggle(w.id)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  isHidden ? "border-dashed text-muted-foreground hover:bg-accent" : "hover:bg-accent",
                )}
              >
                <span>{w.label}</span>
                {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
