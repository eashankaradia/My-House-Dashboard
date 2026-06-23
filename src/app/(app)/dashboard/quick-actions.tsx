"use client";

import * as React from "react";
import { ChevronDown, Receipt, Hammer, ShoppingBag, Lightbulb, Wrench, FolderArchive } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { BillForm } from "@/app/(app)/bills/bill-form";
import { ProjectForm } from "@/app/(app)/projects/project-form";
import { PurchaseForm } from "@/app/(app)/purchases/purchase-form";
import { InspirationForm } from "@/app/(app)/inspiration/inspiration-form";
import { MaintenanceForm } from "@/app/(app)/maintenance/maintenance-form";
import { DocumentForm } from "@/app/(app)/documents/document-form";
import type { Collection } from "@/lib/database.types";

// forwardRef + prop spread so it can be used as a Radix `asChild` trigger.
const ActionTile = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string }
>(({ icon: Icon, label, ...props }, ref) => (
  <button
    ref={ref}
    {...props}
    className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border bg-card p-4 text-center transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon className="h-5 w-5" />
    </span>
    <span className="text-xs font-medium leading-tight">{label}</span>
  </button>
));
ActionTile.displayName = "ActionTile";

export function QuickActions({ collections }: { collections: Collection[] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        Quick add
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
          <BillForm trigger={<ActionTile icon={Receipt} label="Add expense" />} />
          <ProjectForm trigger={<ActionTile icon={Hammer} label="Add project" />} />
          <PurchaseForm trigger={<ActionTile icon={ShoppingBag} label="Add purchase" />} />
          <InspirationForm collections={collections} trigger={<ActionTile icon={Lightbulb} label="Save idea" />} />
          <MaintenanceForm trigger={<ActionTile icon={Wrench} label="Add maintenance" />} />
          <DocumentForm trigger={<ActionTile icon={FolderArchive} label="Add document" />} />
        </div>
      ) : null}
    </div>
  );
}
