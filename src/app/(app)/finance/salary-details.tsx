"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/form-field";
import { useToast } from "@/hooks/use-toast";
import type { FinanceSettings } from "@/lib/database.types";
import { upsertSalaryDetails } from "./actions";

export function SalaryDetails({ settings }: { settings: FinanceSettings | null }) {
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();
  const [annualSalary, setAnnualSalary] = React.useState(settings?.annual_salary != null ? String(settings.annual_salary) : "");
  const [employer, setEmployer] = React.useState(settings?.employer ?? "");
  const [salaryNotes, setSalaryNotes] = React.useState(settings?.salary_notes ?? "");

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await upsertSalaryDetails({
        annualSalary: annualSalary ? Number(annualSalary) : null,
        employer,
        salaryNotes,
      });
      if (result?.error) {
        toast({ variant: "destructive", title: "Couldn't save", description: result.error });
        return;
      }
      toast({ title: "Saved" });
    });
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Annual salary (£)">
          <Input type="number" min="0" step="100" value={annualSalary} onChange={(e) => setAnnualSalary(e.target.value)} placeholder="e.g. 55000" />
        </Field>
        <Field label="Employer">
          <Input value={employer} onChange={(e) => setEmployer(e.target.value)} placeholder="e.g. Acme Ltd" />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea value={salaryNotes} onChange={(e) => setSalaryNotes(e.target.value)} rows={2} placeholder="Pay rise dates, pension %, anything worth remembering..." />
      </Field>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
