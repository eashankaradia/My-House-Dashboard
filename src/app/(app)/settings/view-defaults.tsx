"use client";

import { cn } from "@/lib/utils";
import { useViewPref, type ViewMode } from "@/hooks/use-view-prefs";

const PURCHASE_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "detailed", label: "Detailed" },
  { value: "compact", label: "Compact" },
  { value: "table", label: "Table" },
];
const TASK_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "detailed", label: "List" },
  { value: "table", label: "Table" },
];

function Picker({ section, options }: { section: string; options: { value: ViewMode; label: string }[] }) {
  const [view, setView] = useViewPref(section);
  return (
    <div className="flex items-center rounded-lg border p-0.5 text-sm">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setView(o.value)}
          className={cn("rounded-md px-3 py-1", view === o.value && "bg-accent")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ViewDefaultsSettings() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">Purchases</span>
        <Picker section="purchases" options={PURCHASE_OPTIONS} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">Tasks</span>
        <Picker section="tasks" options={TASK_OPTIONS} />
      </div>
    </div>
  );
}
