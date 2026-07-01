"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { CreditCard, CreditCardStatement, IncomeMonth } from "@/lib/database.types";
import { bulkUpsertCreditCardStatements, bulkUpsertIncomeMonths } from "./actions";

type Row = { net_income: string; bonus: string; cards: Record<string, string> };

/** Every month from Jan of last year through Dec of this year, oldest first. */
function monthRange(): string[] {
  const year = new Date().getFullYear();
  const months: string[] = [];
  for (let y = year - 1; y <= year; y++) {
    for (let m = 1; m <= 12; m++) months.push(`${y}-${String(m).padStart(2, "0")}-01`);
  }
  return months;
}

function monthLabel(month: string): string {
  return new Date(`${month}T00:00:00`).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export function MonthlyValuesEditor({
  incomeMonths,
  creditCards,
  statements,
  trigger,
}: {
  incomeMonths: IncomeMonth[];
  creditCards: CreditCard[];
  statements: CreditCardStatement[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const months = React.useMemo(() => monthRange(), []);

  const buildRows = React.useCallback((): Record<string, Row> => {
    const byMonth = new Map(incomeMonths.map((m) => [m.month, m]));
    const rows: Record<string, Row> = {};
    for (const month of months) {
      const income = byMonth.get(month);
      const cards: Record<string, string> = {};
      for (const card of creditCards) {
        const s = statements.find((st) => st.card_id === card.id && st.statement_month === month);
        cards[card.id] = s ? String(s.amount) : "";
      }
      rows[month] = {
        net_income: income ? String(income.net_income) : "",
        bonus: income && Number(income.bonus) > 0 ? String(income.bonus) : "",
        cards,
      };
    }
    return rows;
  }, [months, incomeMonths, creditCards, statements]);

  const [rows, setRows] = React.useState<Record<string, Row>>(buildRows);

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v) setRows(buildRows());
  }

  function setCell(month: string, field: "net_income" | "bonus", value: string) {
    setRows((prev) => ({ ...prev, [month]: { ...prev[month], [field]: value } }));
  }

  function setCardCell(month: string, cardId: string, value: string) {
    setRows((prev) => ({ ...prev, [month]: { ...prev[month], cards: { ...prev[month].cards, [cardId]: value } } }));
  }

  function save() {
    const incomeRows = months
      .filter((m) => rows[m].net_income.trim())
      .map((m) => ({ month: m, net_income: Number(rows[m].net_income), bonus: rows[m].bonus ? Number(rows[m].bonus) : 0 }));

    const statementRows = months.flatMap((m) =>
      creditCards
        .filter((c) => rows[m].cards[c.id]?.trim())
        .map((c) => ({ card_id: c.id, statement_month: m, amount: Number(rows[m].cards[c.id]) })),
    );

    startTransition(async () => {
      const [incomeRes, statementsRes] = await Promise.all([
        bulkUpsertIncomeMonths(incomeRows),
        bulkUpsertCreditCardStatements(statementRows),
      ]);
      if (incomeRes?.error || statementsRes?.error) {
        toast({ variant: "destructive", title: "Couldn't save", description: incomeRes?.error ?? statementsRes?.error });
        return;
      }
      toast({ title: "Monthly values saved" });
      setOpen(false);
    });
  }

  return (
    <>
      <span onClick={() => handleOpen(true)}>{trigger}</span>
      {open ? (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-base font-semibold">Monthly values</h2>
            <p className="text-xs text-muted-foreground">Fill in net income, bonus, and each card&apos;s statement — one row per month.</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full min-w-max border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 bg-background">
              <tr>
                <th className="border-b px-2 py-2 text-left font-medium text-muted-foreground">Month</th>
                <th className="border-b px-2 py-2 text-left font-medium text-muted-foreground">Net income</th>
                <th className="border-b px-2 py-2 text-left font-medium text-muted-foreground">Bonus</th>
                {creditCards.map((c) => (
                  <th key={c.id} className="border-b px-2 py-2 text-left font-medium text-muted-foreground">{c.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m}>
                  <td className="whitespace-nowrap border-b px-2 py-1 text-muted-foreground">{monthLabel(m)}</td>
                  <td className="border-b px-2 py-1">
                    <Input
                      type="number"
                      step="0.01"
                      value={rows[m].net_income}
                      onChange={(e) => setCell(m, "net_income", e.target.value)}
                      className="h-8 w-28 text-sm"
                    />
                  </td>
                  <td className="border-b px-2 py-1">
                    <Input
                      type="number"
                      step="0.01"
                      value={rows[m].bonus}
                      onChange={(e) => setCell(m, "bonus", e.target.value)}
                      className="h-8 w-24 text-sm"
                    />
                  </td>
                  {creditCards.map((c) => (
                    <td key={c.id} className="border-b px-2 py-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={rows[m].cards[c.id] ?? ""}
                        onChange={(e) => setCardCell(m, c.id, e.target.value)}
                        className="h-8 w-24 text-sm"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">Blank cells are left as-is — only filled-in cells are saved.</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" onClick={save} disabled={pending}>
              {pending ? "Saving…" : "Save all"}
            </Button>
          </div>
        </div>
      </div>
      ) : null}
    </>
  );
}
