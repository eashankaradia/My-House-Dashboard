import Link from "next/link";
import { ArrowRight, BarChart3, CreditCard as CreditCardIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { getHouseholdMap } from "@/lib/household";
import { CollapsibleSection } from "@/app/(app)/dashboard/collapsible-section";
import type {
  Bill,
  CreditCard,
  CreditCardStatement,
  FinanceInspiration,
  FinanceSettings,
  Goal,
  IncomeMonth,
  SavingsAccount,
  SavingsContribution,
  SavingsPot,
  Share,
} from "@/lib/database.types";
import { monthStr, effectiveIncomeForMonth } from "@/lib/income";
import { getPrices } from "@/lib/price-providers";
import { IncomeSection } from "./income-section";
import { FinanceScope } from "./finance-scope";
import { CreditCardsSection } from "./credit-cards-section";
import { CreditCardForm } from "./credit-card-form";
import { IncomeHeaderActions } from "./income-header-actions";
import { SharesSection } from "./shares-section";
import { ShareForm } from "./share-form";
import { FinanceInspirationList } from "./finance-inspiration-list";
import { FinanceInspirationForm } from "./finance-inspiration-form";

export const metadata = { title: "Finance" };

export default async function FinancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [billsRes, settingsRes, potsRes, accountsRes, contribRes, goalsRes, cardsRes, statementsRes, incomeRes, sharesRes, inspirationRes, memberMap] =
    await Promise.all([
      supabase.from("bills").select("*"),
      supabase.from("finance_settings").select("*").limit(1).maybeSingle(),
      supabase.from("savings_pots").select("*").order("created_at"),
      supabase.from("savings_accounts").select("*"),
      supabase.from("savings_contributions").select("*"),
      supabase.from("goals").select("*").eq("status", "Active").eq("category", "Financial"),
      supabase.from("credit_cards").select("*").order("name"),
      supabase.from("credit_card_statements").select("*").order("statement_month", { ascending: false }),
      supabase.from("income_months").select("*").order("month", { ascending: false }),
      supabase.from("shares").select("*").order("ticker"),
      supabase.from("finance_inspiration").select("*").order("created_at", { ascending: false }),
      getHouseholdMap(),
    ]);

  const bills = (billsRes.data ?? []) as Bill[];
  const settings = settingsRes.data as FinanceSettings | null;
  const pots = (potsRes.data ?? []) as SavingsPot[];
  const accounts = (accountsRes.data ?? []) as SavingsAccount[];
  const contributions = (contribRes.data ?? []) as SavingsContribution[];
  const financialGoals = (goalsRes.data ?? []) as Goal[];
  const creditCards = (cardsRes.data ?? []) as CreditCard[];
  const cardStatements = (statementsRes.data ?? []) as CreditCardStatement[];
  const incomeMonths = (incomeRes.data ?? []) as IncomeMonth[];
  const shares = (sharesRes.data ?? []) as Share[];
  const inspiration = (inspirationRes.data ?? []) as FinanceInspiration[];
  const sharePrices = await getPrices(shares.map((s) => s.ticker));
  const currentUserId = user?.id ?? "";
  const showFilter = Object.keys(memberMap).length > 1;

  const thisMonth = monthStr();
  const monthlyCardStatements = cardStatements
    .filter((s) => s.statement_month === thisMonth)
    .reduce((sum, s) => sum + Number(s.amount), 0);

  const income = effectiveIncomeForMonth(incomeMonths, thisMonth);
  const monthlyIncome = income.source !== "none" ? income.net + income.bonus : null;
  const totalSharesValue = shares.reduce(
    (s, sh) => s + Number(sh.quantity) * (sharePrices[sh.ticker] ?? Number(sh.purchase_price)),
    0,
  );

  // Rolling 12 months, including the current one.
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  const rollingCutoff = `${twelveMonthsAgo.getFullYear()}-${String(twelveMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`;
  const last12MonthsIncome = incomeMonths
    .filter((m) => m.month >= rollingCutoff)
    .reduce((s, m) => s + Number(m.net_income) + Number(m.bonus), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Your personal financial overview."
        info="Log your monthly net income below to calculate your net position and savings rate."
      />

      <FinanceScope
        bills={bills}
        pots={pots}
        accounts={accounts}
        contributions={contributions}
        shares={shares}
        sharePrices={sharePrices}
        monthlyCardStatements={monthlyCardStatements}
        monthlyIncome={monthlyIncome}
        last12MonthsIncome={last12MonthsIncome}
        incomeSource={income.source}
        currentUserId={currentUserId}
        showFilter={showFilter}
      />

      {/* Income */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Income</CardTitle>
          <IncomeHeaderActions incomeMonths={incomeMonths} creditCards={creditCards} statements={cardStatements} />
        </CardHeader>
        <CardContent>
          <IncomeSection settings={settings} months={incomeMonths} />
        </CardContent>
      </Card>

      {/* Credit cards */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" /> Credit cards
          </CardTitle>
          <CreditCardForm />
        </CardHeader>
        <CardContent>
          {creditCards.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Add your credit cards to log each month&apos;s statement as an expense.
            </p>
          ) : (
            <CreditCardsSection cards={creditCards} statements={cardStatements} />
          )}
        </CardContent>
      </Card>

      {/* Shares — collapsed by default, not everyday content */}
      <CollapsibleSection title="Shares" href="/finance" count={shares.length}>
        <div className="flex items-center justify-between pb-1">
          <p className="text-sm text-muted-foreground">
            {shares.length > 0 ? `Total value: ${formatCurrency(totalSharesValue)}` : "Ticker, quantity and purchase price, with live prices where available."}
          </p>
          <ShareForm trigger={<button className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"><BarChart3 className="h-3.5 w-3.5" /> Add</button>} />
        </div>
        {shares.length > 0 ? <SharesSection shares={shares} prices={sharePrices} /> : null}
      </CollapsibleSection>

      {/* Inspiration — collapsed by default */}
      <CollapsibleSection title="Inspiration & guides" href="/finance" count={inspiration.length}>
        <div className="flex items-center justify-between pb-1">
          <p className="text-sm text-muted-foreground">Reels and guides on budgeting, investing, or anything money-related.</p>
          <FinanceInspirationForm trigger={<button className="text-sm font-medium text-primary hover:underline">Add</button>} />
        </div>
        {inspiration.length > 0 ? <FinanceInspirationList items={inspiration} /> : null}
      </CollapsibleSection>

      {/* Financial goals — collapsed by default */}
      {financialGoals.length > 0 && (
        <CollapsibleSection title="Financial goals" href="/goals" count={financialGoals.length}>
          <div className="divide-y">
            {financialGoals.map((goal) => {
              const pct =
                goal.target_value && goal.current_value
                  ? Math.min(100, Math.round((Number(goal.current_value) / Number(goal.target_value)) * 100))
                  : null;
              return (
                <div key={goal.id} className="space-y-1.5 py-2.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate font-medium">{goal.title}</span>
                    {pct !== null ? (
                      <span className="shrink-0 text-xs text-muted-foreground">{pct}%</span>
                    ) : null}
                  </div>
                  {pct !== null && <Progress value={pct} className="h-1.5" />}
                  {goal.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{goal.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/bills", label: "Bills & Expenses", sub: "Manage recurring costs" },
          { href: "/savings", label: "Savings Pots", sub: "Track your saving goals" },
          { href: "/analytics", label: "Analytics", sub: "Charts & spending trends" },
        ].map(({ href, label, sub }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-accent"
          >
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
