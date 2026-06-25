import { PiggyBank, Target, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency } from "@/lib/utils";
import type { SavingsAccount, SavingsContribution, SavingsPot } from "@/lib/database.types";
import { PotForm } from "./pot-form";
import { PotCard } from "./pot-card";
import { SectionActivityLog } from "@/components/shared/section-activity-log";

export const metadata = { title: "Savings Pots" };

export default async function SavingsPage() {
  const supabase = await createClient();
  const [{ data }, { data: accountData }, { data: contribData }] = await Promise.all([
    supabase.from("savings_pots").select("*").order("created_at", { ascending: true }),
    supabase.from("savings_accounts").select("*").order("created_at", { ascending: true }),
    supabase.from("savings_contributions").select("*").order("occurred_on", { ascending: true }),
  ]);
  const pots = (data ?? []) as SavingsPot[];
  const accounts = (accountData ?? []) as SavingsAccount[];
  const contributions = (contribData ?? []) as SavingsContribution[];

  const totalSaved = pots.reduce((s, p) => s + Number(p.current_amount), 0);
  const totalTarget = pots.reduce((s, p) => s + Number(p.target_amount), 0);
  const totalMonthly = pots.reduce((s, p) => s + Number(p.monthly_contribution), 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Savings Pots" description="Virtual pots to fund your home goals." info="Create a pot per goal (e.g. Emergency Fund, New Kitchen) with a target and a monthly contribution. The progress bar and forecast completion date update as you save. Use the +/- buttons on a pot to quickly adjust its balance.">
        <PotForm />
      </PageHeader>

      {pots.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No savings pots yet"
          description="Create pots like Emergency Fund, Home Improvements or Holidays and track progress towards each target."
        >
          <PotForm />
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total saved" value={formatCurrency(totalSaved)} hint={`${overallPct}% of all targets`} icon={PiggyBank} />
            <StatCard label="Combined target" value={formatCurrency(totalTarget)} icon={Target} accent="muted" />
            <StatCard label="Monthly contributions" value={formatCurrency(totalMonthly)} icon={TrendingUp} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pots.map((pot) => (
              <PotCard
                key={pot.id}
                pot={pot}
                accounts={accounts.filter((a) => a.pot_id === pot.id)}
                contributions={contributions.filter((c) => c.pot_id === pot.id)}
              />
            ))}
          </div>
        </>
      )}
      <SectionActivityLog entityTypes={["savings_pots", "savings_accounts", "savings_contributions"]} />
    </div>
  );
}
