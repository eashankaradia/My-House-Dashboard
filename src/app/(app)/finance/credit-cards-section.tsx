"use client";

import * as React from "react";
import { CreditCard as CardIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { CreditCard, CreditCardStatement } from "@/lib/database.types";
import { CreditCardForm } from "./credit-card-form";
import { CreditCardStatementForm } from "./credit-card-statement-form";

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function CreditCardsSection({ cards, statements }: { cards: CreditCard[]; statements: CreditCardStatement[] }) {
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const thisMonth = currentMonth();

  return (
    <div className="space-y-2">
      {cards.map((card) => {
        const cardStatements = statements
          .filter((s) => s.card_id === card.id)
          .sort((a, b) => (a.statement_month < b.statement_month ? 1 : -1));
        const thisMonthStatement = cardStatements.find((s) => s.statement_month === thisMonth);
        const isOpen = expanded === card.id;

        return (
          <div key={card.id} className="rounded-xl border bg-card">
            <div className="flex items-center gap-3 px-4 py-3">
              <CardIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
              <button onClick={() => setExpanded(isOpen ? null : card.id)} className="min-w-0 flex-1 text-left">
                <p className="font-medium">
                  {card.name}
                  {card.last4 ? <span className="text-muted-foreground"> ····{card.last4}</span> : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {card.statement_day ? `Statement day ${card.statement_day}` : "No statement day set"}
                </p>
              </button>
              <div className="shrink-0 text-right">
                {thisMonthStatement ? (
                  <>
                    <p className="font-semibold">{formatCurrency(thisMonthStatement.amount)}</p>
                    {thisMonthStatement.is_paid ? (
                      <Badge variant="success" className="text-[10px]">
                        Paid
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Unpaid
                      </Badge>
                    )}
                  </>
                ) : (
                  <Badge variant="outline" className="text-[10px]">
                    Not logged
                  </Badge>
                )}
              </div>
              <button onClick={() => setExpanded(isOpen ? null : card.id)} className="shrink-0 text-muted-foreground">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>

            {isOpen && (
              <div className="space-y-2 border-t px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Statements</p>
                  <div className="flex gap-2">
                    <CreditCardStatementForm cardId={card.id} />
                    <CreditCardForm card={card} trigger={<button className="text-xs text-muted-foreground hover:text-foreground">Edit card</button>} />
                  </div>
                </div>
                {cardStatements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No statements logged yet.</p>
                ) : (
                  <div className="space-y-1">
                    {cardStatements.slice(0, 12).map((s) => (
                      <CreditCardStatementForm
                        key={s.id}
                        cardId={card.id}
                        statement={s}
                        trigger={
                          <button className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                            <span>
                              {new Date(s.statement_month + "T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="font-medium">{formatCurrency(s.amount)}</span>
                              {s.is_paid && (
                                <Badge variant="success" className="text-[10px]">
                                  Paid
                                </Badge>
                              )}
                            </span>
                          </button>
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
