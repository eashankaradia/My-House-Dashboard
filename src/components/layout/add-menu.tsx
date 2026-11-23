"use client";

import * as React from "react";
import {
  BarChart3,
  BookUser,
  CheckSquare,
  CreditCard,
  FolderArchive,
  Hammer,
  Lightbulb,
  ListChecks,
  ListPlus,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  StickyNote,
  SunMoon,
  Utensils,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BillForm } from "@/app/(app)/bills/bill-form";
import { ProjectForm } from "@/app/(app)/projects/project-form";
import { TaskQuickForm } from "@/app/(app)/projects/task-quick-form";
import { PurchaseForm } from "@/app/(app)/purchases/purchase-form";
import { QuickOptionForm } from "@/app/(app)/purchases/quick-option-form";
import { InspirationForm } from "@/app/(app)/inspiration/inspiration-form";
import { DocumentForm } from "@/app/(app)/documents/document-form";
import { NoteForm } from "@/app/(app)/documents/note-form";
import { ContactForm } from "@/app/(app)/contacts/contact-form";
import { ShoppingItemDialog } from "@/app/(app)/shopping/shopping-item-dialog";
import { EssentialForm } from "@/app/(app)/essentials/essential-form";
import { RoutineItemForm } from "@/app/(app)/routine/routine-item-form";
import { RecipeForm } from "@/app/(app)/nutrition/recipe-form";
import { CreditCardForm } from "@/app/(app)/finance/credit-card-form";
import { ShareForm } from "@/app/(app)/finance/share-form";
import { IncomeMonthForm } from "@/app/(app)/finance/income-month-form";
import { monthStr } from "@/lib/income";

const isLife = process.env.NEXT_PUBLIC_APP === "life";

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
      <AddGroup label="Plan">
        {isLife ? <EssentialForm categories={[]} trigger={<Pill icon={ListChecks} label="Essential" />} /> : null}
        <PurchaseForm trigger={<Pill icon={ShoppingBag} label="Purchase" />} />
        <QuickOptionForm trigger={<Pill icon={ListPlus} label="Option" />} />
        <TaskQuickForm trigger={<Pill icon={CheckSquare} label="Task" />} />
        <ProjectForm trigger={<Pill icon={Hammer} label="Project" />} />
      </AddGroup>
      <AddGroup label="Money">
        {isLife ? <IncomeMonthForm month={monthStr()} trigger={<Pill icon={Wallet} label="Income" />} /> : null}
        <BillForm trigger={<Pill icon={Receipt} label="Expense" />} />
        <DocumentForm trigger={<Pill icon={FolderArchive} label="Document" />} />
        {isLife ? (
          <>
            <CreditCardForm trigger={<Pill icon={CreditCard} label="Card" />} />
            <ShareForm trigger={<Pill icon={BarChart3} label="Share" />} />
          </>
        ) : null}
      </AddGroup>
      <AddGroup label="Capture">
        {isLife ? null : <ShoppingItemDialog trigger={<Pill icon={ShoppingCart} label="Shopping" />} />}
        <InspirationForm collections={[]} trigger={<Pill icon={Lightbulb} label="Idea" />} />
        <NoteForm trigger={<Pill icon={StickyNote} label="Note" />} />
        <ContactForm trigger={<Pill icon={BookUser} label="Contact" />} />
      </AddGroup>
      {isLife ? (
        <AddGroup label="Daily">
          <RoutineItemForm trigger={<Pill icon={SunMoon} label="Routine" />} />
          <RecipeForm trigger={<Pill icon={Utensils} label="Recipe" />} />
        </AddGroup>
      ) : null}
    </div>
  );
}

function AddGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-stretch gap-1.5 lg:items-end">
      <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">{children}</div>
    </div>
  );
}
