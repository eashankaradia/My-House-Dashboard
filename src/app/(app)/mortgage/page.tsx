import { Banknote, CalendarClock, Home, Percent, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate, formatPercent, daysUntil } from "@/lib/utils";
import { monthsToYearsLabel, payoffMonths } from "@/lib/finance";
import type { Mortgage } from "@/lib/database.types";
import { MortgageForm } from "./mortgage-form";
import { OverpaymentCalculator } from "./overpayment-calculator";
import { SectionActivityLog } from "@/components/shared/section-activity-log";

export const metadata = { title: "Mortgage" };

export default async function MortgagePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mortgages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1);
  const mortgage = (data?.[0] as Mortgage | undefined) ?? undefined;

  if (!mortgage) {
    return (
      <div className="space-y-6">
        <PageHeader title="Mortgage" description="Track equity, loan-to-value and payoff." info="Enter your property value, balance, rate and monthly payment. We calculate your equity, loan-to-value and remaining term, and the overpayment calculator shows how extra monthly payments shorten the term and save interest." />
        <EmptyState
          icon={Home}
          title="No mortgage added yet"
          description="Add your mortgage details to see your equity, loan-to-value ratio and an interactive payoff projection."
        >
          <MortgageForm />
        </EmptyState>
      </div>
    );
  }

  const equity = Number(mortgage.property_value) - Number(mortgage.mortgage_balance);
  const ltv =
    mortgage.property_value > 0 ? (mortgage.mortgage_balance / mortgage.property_value) * 100 : 0;
  const equityPct = mortgage.property_value > 0 ? (equity / mortgage.property_value) * 100 : 0;

  const months = payoffMonths(
    Number(mortgage.mortgage_balance),
    Number(mortgage.interest_rate),
    Number(mortgage.monthly_payment),
  );
  const remainingTerm = months || mortgage.term_months || 0;

  const remortgageDays = daysUntil(mortgage.fixed_term_end_date);

  return (
    <div className="space-y-6">
      <PageHeader title="Mortgage" description={mortgage.property_name} info="These figures drive your equity, loan-to-value and remaining term. Use the overpayment calculator to model how extra monthly payments shorten the term and cut total interest. Edit details any time with the button on the right.">
        <MortgageForm mortgage={mortgage} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Equity" value={formatCurrency(equity)} hint={`${Math.round(equityPct)}% of value`} icon={Wallet} />
        <StatCard label="Balance" value={formatCurrency(mortgage.mortgage_balance)} icon={Banknote} accent="muted" />
        <StatCard label="Loan-to-value" value={formatPercent(ltv)} hint={`${formatPercent(mortgage.interest_rate)} rate`} icon={Percent} />
        <StatCard
          label="Remaining term"
          value={monthsToYearsLabel(remainingTerm)}
          hint={`${formatCurrency(mortgage.monthly_payment)}/mo`}
          icon={CalendarClock}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Equity position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Equity</span>
                <span className="font-medium">{formatCurrency(equity)}</span>
              </div>
              <Progress value={equityPct} />
              <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>{Math.round(equityPct)}% owned</span>
                <span>Value {formatCurrency(mortgage.property_value)}</span>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4 text-sm">
              <Row label="Provider" value={mortgage.provider ?? "—"} />
              <Row label="Interest rate" value={formatPercent(mortgage.interest_rate)} />
              <Row label="Monthly payment" value={formatCurrency(mortgage.monthly_payment)} />
              <Row label="Fixed term ends" value={formatDate(mortgage.fixed_term_end_date)} />
            </div>

            {remortgageDays !== null ? (
              <div className="rounded-lg border bg-accent/40 p-3">
                <p className="text-xs text-muted-foreground">Remortgage countdown</p>
                <p className="font-semibold">
                  {remortgageDays > 0 ? (
                    <>
                      {remortgageDays} days{" "}
                      <Badge variant={remortgageDays < 120 ? "warning" : "secondary"}>
                        {monthsToYearsLabel(Math.round(remortgageDays / 30))} left
                      </Badge>
                    </>
                  ) : (
                    <Badge variant="destructive">Fixed term ended — time to remortgage</Badge>
                  )}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <OverpaymentCalculator
            balance={Number(mortgage.mortgage_balance)}
            rate={Number(mortgage.interest_rate)}
            monthlyPayment={Number(mortgage.monthly_payment)}
          />
        </div>
      </div>
      <SectionActivityLog entityTypes={["mortgages"]} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
