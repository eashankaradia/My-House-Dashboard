"use client";

import * as React from "react";
import { Pencil, Table2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CreditCard, CreditCardStatement, FinanceSettings, IncomeMonth } from "@/lib/database.types";
import { MonthlyValuesEditor } from "./monthly-values-editor";
import { SalaryDetailsForm } from "./salary-details";

/** Every fixed/setup income option lives behind this one Edit toggle. */
export function IncomeHeaderActions({
  settings,
  incomeMonths,
  creditCards,
  statements,
}: {
  settings: FinanceSettings | null;
  incomeMonths: IncomeMonth[];
  creditCards: CreditCard[];
  statements: CreditCardStatement[];
}) {
  const [editMode, setEditMode] = React.useState(false);

  return (
    <div className="flex items-center gap-2">
      {editMode ? (
        <>
          <SalaryDetailsForm
            settings={settings}
            trigger={
              <button className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <Wallet className="h-3.5 w-3.5" /> Salary details
              </button>
            }
          />
          <MonthlyValuesEditor
            incomeMonths={incomeMonths}
            creditCards={creditCards}
            statements={statements}
            trigger={
              <button className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <Table2 className="h-3.5 w-3.5" /> Bulk edit months
              </button>
            }
          />
        </>
      ) : null}
      <button
        type="button"
        onClick={() => setEditMode((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground",
          editMode && "bg-accent text-foreground",
        )}
      >
        <Pencil className="h-3.5 w-3.5" /> {editMode ? "Done" : "Edit"}
      </button>
    </div>
  );
}
