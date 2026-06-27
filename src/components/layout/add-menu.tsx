"use client";

import * as React from "react";
import { Camera, CheckSquare, FileText, FolderArchive, Hammer, Lightbulb, Receipt, ShoppingBag, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { QuickPhotoDialog } from "@/app/(app)/photos/quick-photo-dialog";
import { DraftDialog } from "@/app/(app)/drafts/draft-dialog";
import { BillForm } from "@/app/(app)/bills/bill-form";
import { ProjectForm } from "@/app/(app)/projects/project-form";
import { TaskQuickForm } from "@/app/(app)/projects/task-quick-form";
import { PurchaseForm } from "@/app/(app)/purchases/purchase-form";
import { InspirationForm } from "@/app/(app)/inspiration/inspiration-form";
import { MaintenanceForm } from "@/app/(app)/maintenance/maintenance-form";
import { DocumentForm } from "@/app/(app)/documents/document-form";

export const Pill = React.forwardRef<
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

/**
 * The set of "add" options shared by the desktop floating button and the mobile
 * centre tab. Each pill is a form's trigger; the form's dialog opens on tap. We
 * never unmount these on tap (that was the old "options do nothing" bug).
 */
export function AddPills({ className }: { className?: string }) {
  return (
    <div className={className}>
      <QuickPhotoDialog trigger={<Pill icon={Camera} label="Photo" />} />
      <DraftDialog trigger={<Pill icon={FileText} label="Draft" />} />
      <TaskQuickForm trigger={<Pill icon={CheckSquare} label="Task" />} />
      <BillForm trigger={<Pill icon={Receipt} label="Expense" />} />
      <ProjectForm trigger={<Pill icon={Hammer} label="Project" />} />
      <PurchaseForm trigger={<Pill icon={ShoppingBag} label="Purchase" />} />
      <InspirationForm collections={[]} trigger={<Pill icon={Lightbulb} label="Idea" />} />
      <MaintenanceForm trigger={<Pill icon={Wrench} label="Maintenance" />} />
      <DocumentForm trigger={<Pill icon={FolderArchive} label="Document" />} />
    </div>
  );
}
