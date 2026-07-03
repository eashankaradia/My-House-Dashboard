"use client";

import * as React from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { FormDeleteButton } from "@/components/shared/form-delete-button";
import { useToast } from "@/hooks/use-toast";
import { useEditDialogOpen } from "@/hooks/use-open-from-url";
import { ROUTINE_SECTIONS, ROUTINE_SECTION_LABELS } from "@/lib/constants";
import type { RoutineItem } from "@/lib/database.types";
import { createRoutineItem, updateRoutineItem, deleteRoutineItem } from "./actions";

type Props = { defaultSection?: string; item?: RoutineItem; trigger?: React.ReactNode };

export function RoutineItemForm({ defaultSection, item, trigger }: Props) {
  const { open, onOpenChange: setOpen } = useEditDialogOpen(item?.id, "routine");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(item);

  const [section, setSection] = React.useState(item?.section ?? defaultSection ?? ROUTINE_SECTIONS[0]);
  const [name, setName] = React.useState(item?.name ?? "");

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v && item) {
      setSection(item.section);
      setName(item.name);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const result = editing
        ? await updateRoutineItem(item!.id, { section, name: name.trim() })
        : await createRoutineItem({ section, name: name.trim() });
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: editing ? "Updated" : "Added" });
      setOpen(false);
      if (!editing) setName("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5">
            {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "Edit" : "Add step"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit routine step" : "New routine step"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Section">
            <NativeSelect value={section} onChange={(e) => setSection(e.target.value)}>
              {ROUTINE_SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {ROUTINE_SECTION_LABELS[s]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Step" required>
            <Input placeholder="e.g. 5 glasses of water" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </Field>
          <DialogFooter className={editing ? "sm:justify-between" : undefined}>
            {editing && (
              <FormDeleteButton
                label="Delete step"
                onDelete={async () => {
                  const r = await deleteRoutineItem(item!.id);
                  if (!r?.error) {
                    toast({ title: "Step deleted" });
                    setOpen(false);
                  }
                  return r;
                }}
              />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {editing ? "Save changes" : "Add step"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
