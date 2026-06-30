"use client";

import * as React from "react";
import { Plus, Activity, Pill, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
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
import { HEALTH_RECORD_TYPES, HEALTH_RECORD_LABELS } from "@/lib/constants";
import { logHealthRecord, createMedication, createAppointment } from "./actions";

// ---------------------------------------------------------------------------
// Log a health record (weight, BP, steps, etc.)
// ---------------------------------------------------------------------------

export function LogHealthRecordForm({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const [recordType, setRecordType] = React.useState("weight");
  const [value, setValue] = React.useState("");
  const [value2, setValue2] = React.useState("");
  const [unit, setUnit] = React.useState("kg");
  const [notes, setNotes] = React.useState("");

  const DEFAULT_UNITS: Record<string, string> = {
    weight: "kg", blood_pressure: "mmHg", body_fat: "%",
    steps: "steps", sleep: "h", heart_rate: "bpm", blood_glucose: "mmol/L", other: "",
  };

  function handleTypeChange(t: string) {
    setRecordType(t);
    setUnit(DEFAULT_UNITS[t] ?? "");
    setValue2("");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value) return;
    startTransition(async () => {
      const result = await logHealthRecord({
        record_type: recordType,
        value: Number(value),
        value2: value2 ? Number(value2) : undefined,
        unit: unit || undefined,
        notes: notes.trim() || undefined,
      });
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: "Record logged" });
      setOpen(false);
      setValue(""); setValue2(""); setNotes("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5">
            <Activity className="h-4 w-4" />
            Log record
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log health record</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Type">
            <NativeSelect value={recordType} onChange={(e) => handleTypeChange(e.target.value)}>
              {HEALTH_RECORD_TYPES.map((t) => (
                <option key={t} value={t}>{HEALTH_RECORD_LABELS[t]}</option>
              ))}
            </NativeSelect>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={recordType === "blood_pressure" ? "Systolic" : "Value"} required>
              <Input
                type="number"
                step="0.1"
                placeholder={recordType === "blood_pressure" ? "120" : ""}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                autoFocus
              />
            </Field>
            {recordType === "blood_pressure" ? (
              <Field label="Diastolic">
                <Input
                  type="number"
                  placeholder="80"
                  value={value2}
                  onChange={(e) => setValue2(e.target.value)}
                />
              </Field>
            ) : (
              <Field label="Unit">
                <Input placeholder="kg, bpm..." value={unit} onChange={(e) => setUnit(e.target.value)} />
              </Field>
            )}
          </div>
          <Field label="Notes">
            <Textarea
              placeholder="Optional context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>Log record</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Add a medication
// ---------------------------------------------------------------------------

export function AddMedicationForm({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const [name, setName] = React.useState("");
  const [dosage, setDosage] = React.useState("");
  const [frequency, setFrequency] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [notes, setNotes] = React.useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await createMedication({
        name: name.trim(),
        dosage: dosage.trim() || undefined,
        frequency: frequency.trim() || undefined,
        start_date: startDate || undefined,
        notes: notes.trim() || undefined,
      });
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: "Medication added" });
      setOpen(false);
      setName(""); setDosage(""); setFrequency(""); setStartDate(""); setNotes("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5">
            <Pill className="h-4 w-4" />
            Add medication
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add medication</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Name" required>
            <Input
              placeholder="e.g. Vitamin D"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dosage">
              <Input placeholder="e.g. 1000 IU" value={dosage} onChange={(e) => setDosage(e.target.value)} />
            </Field>
            <Field label="Frequency">
              <Input placeholder="e.g. Once daily" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
            </Field>
          </div>
          <Field label="Start date">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="Notes">
            <Textarea
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>Add medication</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Book an appointment
// ---------------------------------------------------------------------------

export function AddAppointmentForm({ trigger }: { trigger?: React.ReactNode }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const [title, setTitle] = React.useState("");
  const [provider, setProvider] = React.useState("");
  const [apptDate, setApptDate] = React.useState(todayStr);
  const [apptTime, setApptTime] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [notes, setNotes] = React.useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !apptDate) return;
    startTransition(async () => {
      const result = await createAppointment({
        title: title.trim(),
        provider: provider.trim() || undefined,
        appointment_date: apptDate,
        appointment_time: apptTime || undefined,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: "Appointment booked" });
      setOpen(false);
      setTitle(""); setProvider(""); setApptDate(todayStr);
      setApptTime(""); setLocation(""); setNotes("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5">
            <CalendarCheck className="h-4 w-4" />
            Book appointment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Title" required>
            <Input
              placeholder="e.g. GP check-up"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </Field>
          <Field label="Provider / Doctor">
            <Input placeholder="e.g. Dr Smith" value={provider} onChange={(e) => setProvider(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" required>
              <Input type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} required />
            </Field>
            <Field label="Time">
              <Input type="time" value={apptTime} onChange={(e) => setApptTime(e.target.value)} />
            </Field>
          </div>
          <Field label="Location">
            <Input placeholder="Clinic name or address" value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
          <Field label="Notes">
            <Textarea
              placeholder="What to discuss..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>Book appointment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Combined Add button (opens a menu selecting which form)
// ---------------------------------------------------------------------------

export function HealthAddMenu() {
  return (
    <div className="flex flex-wrap gap-2">
      <LogHealthRecordForm
        trigger={
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Log record
          </Button>
        }
      />
      <AddMedicationForm />
      <AddAppointmentForm />
    </div>
  );
}
