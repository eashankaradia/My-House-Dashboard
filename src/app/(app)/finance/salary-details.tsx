"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form-field";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import type { FinanceSettings } from "@/lib/database.types";
import { upsertSalaryDetails } from "./actions";

/** Fixed salary details — shown as a one-line summary, edited behind a dialog. */
export function SalaryDetails({ settings }: { settings: FinanceSettings | null }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();
  const [annualSalary, setAnnualSalary] = React.useState(settings?.annual_salary != null ? String(settings.annual_salary) : "");
  const [employer, setEmployer] = React.useState(settings?.employer ?? "");
  const [salaryNotes, setSalaryNotes] = React.useState(settings?.salary_notes ?? "");

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v) {
      setAnnualSalary(settings?.annual_salary != null ? String(settings.annual_salary) : "");
      setEmployer(settings?.employer ?? "");
      setSalaryNotes(settings?.salary_notes ?? "");
    }
  }

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
      setOpen(false);
    });
  }

  const summary = [
    settings?.annual_salary != null ? `${formatCurrency(settings.annual_salary)}/yr` : null,
    settings?.employer || null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className={summary ? "text-foreground" : "text-muted-foreground"}>{summary || "Salary details not set"}</span>
        <DialogTrigger asChild>
          <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        </DialogTrigger>
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salary details</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
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
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
