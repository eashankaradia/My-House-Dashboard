"use client";

import * as React from "react";
import { FolderArchive, Hammer, Lightbulb, Plus, Receipt, ShoppingBag, Wrench, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BillForm } from "@/app/(app)/bills/bill-form";
import { ProjectForm } from "@/app/(app)/projects/project-form";
import { PurchaseForm } from "@/app/(app)/purchases/purchase-form";
import { InspirationForm } from "@/app/(app)/inspiration/inspiration-form";
import { MaintenanceForm } from "@/app/(app)/maintenance/maintenance-form";
import { DocumentForm } from "@/app/(app)/documents/document-form";

const Pill = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string }
>(({ icon: Icon, label, ...props }, ref) => (
  <button
    ref={ref}
    {...props}
    className="flex items-center gap-2 rounded-full border bg-background py-2 pl-3 pr-4 text-sm font-medium shadow-md transition-colors hover:bg-accent"
  >
    <Icon className="h-4 w-4 text-primary" />
    {label}
  </button>
));
Pill.displayName = "Pill";

export function FloatingAdd() {
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 lg:bottom-6 lg:right-6">
      {open ? (
        <div className="flex flex-col items-end gap-2">
          <BillForm trigger={<Pill icon={Receipt} label="Expense" onClick={close} />} />
          <ProjectForm trigger={<Pill icon={Hammer} label="Project" onClick={close} />} />
          <PurchaseForm trigger={<Pill icon={ShoppingBag} label="Purchase" onClick={close} />} />
          <InspirationForm collections={[]} trigger={<Pill icon={Lightbulb} label="Idea" onClick={close} />} />
          <MaintenanceForm trigger={<Pill icon={Wrench} label="Maintenance" onClick={close} />} />
          <DocumentForm trigger={<Pill icon={FolderArchive} label="Document" onClick={close} />} />
        </div>
      ) : null}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close add menu" : "Add new"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
}
