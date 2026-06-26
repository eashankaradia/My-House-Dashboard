import type { BadgeProps } from "@/components/ui/badge";

/** Map a Low/Medium/High priority to a Badge variant. */
export function priorityVariant(priority: string): BadgeProps["variant"] {
  switch (priority) {
    case "High":
      return "destructive";
    case "Medium":
      return "warning";
    default:
      return "secondary";
  }
}

/** Left-border accent colour for a Low/Medium/High priority. */
export const PRIORITY_ACCENT: Record<string, string> = {
  High: "border-l-rose-500",
  Medium: "border-l-amber-500",
  Low: "border-l-slate-300 dark:border-l-slate-600",
};

/** Tailwind text/border accent for a project/purchase/inspiration status. */
export const STATUS_ACCENT: Record<string, string> = {
  Idea: "bg-slate-400",
  Planning: "bg-sky-500",
  Quoting: "bg-violet-500",
  Scheduled: "bg-amber-500",
  "In Progress": "bg-blue-500",
  Completed: "bg-emerald-500",
  Interesting: "bg-slate-400",
  Considering: "bg-slate-400",
  Shortlisted: "bg-sky-500",
  "Ready To Buy": "bg-amber-500",
  Purchased: "bg-emerald-500",
  Saved: "bg-slate-400",
  Planned: "bg-amber-500",
  Implemented: "bg-emerald-500",
};
