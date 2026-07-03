"use client";

import * as React from "react";
import { ExternalLink, Instagram, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form-field";
import { useToast } from "@/hooks/use-toast";
import { MUSCLE_GROUPS } from "@/lib/constants";
import type { MuscleLink } from "@/lib/database.types";
import { createMuscleLink, deleteMuscleLink } from "./actions";

/** Saved reference links (e.g. Instagram tutorials) for how to train each muscle. */
export function MuscleLinks({ links }: { links: MuscleLink[] }) {
  const byMuscle = React.useMemo(() => {
    const map = new Map<string, MuscleLink[]>();
    for (const l of links) {
      if (!map.has(l.muscle_group)) map.set(l.muscle_group, []);
      map.get(l.muscle_group)!.push(l);
    }
    return map;
  }, [links]);
  const musclesWithLinks = MUSCLE_GROUPS.filter((m) => byMuscle.has(m));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Muscle guides</p>
        <MuscleLinkForm
          trigger={
            <button className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
              <Plus className="h-3.5 w-3.5" /> Add link
            </button>
          }
        />
      </div>

      {musclesWithLinks.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
          Save Instagram or other links on how to grow a muscle — they&apos;ll show up here by muscle group.
        </p>
      ) : (
        <div className="space-y-2">
          {musclesWithLinks.map((m) => (
            <div key={m} className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{m}</p>
              <div className="space-y-1">
                {byMuscle.get(m)!.map((link) => (
                  <MuscleLinkRow key={link.id} link={link} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MuscleLinkRow({ link }: { link: MuscleLink }) {
  const [pending, startTransition] = React.useTransition();
  const isInstagram = /instagram\.com/i.test(link.url);
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
      {isInstagram ? (
        <Instagram className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : (
        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 truncate hover:underline"
      >
        {link.label || link.url}
      </a>
      <button
        onClick={() => startTransition(async () => void (await deleteMuscleLink(link.id)))}
        disabled={pending}
        className="shrink-0 text-muted-foreground hover:text-destructive"
        aria-label="Remove link"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function MuscleLinkForm({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [muscleGroup, setMuscleGroup] = React.useState<string>(MUSCLE_GROUPS[0]);
  const [url, setUrl] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    startTransition(async () => {
      const result = await createMuscleLink({ muscle_group: muscleGroup, url: url.trim(), label: label.trim() || undefined });
      if (result?.error) {
        toast({ variant: "destructive", title: "Couldn't save", description: result.error });
        return;
      }
      toast({ title: "Link saved" });
      setOpen(false);
      setUrl("");
      setLabel("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Save a muscle guide</DialogTitle>
          <DialogDescription>An Instagram post or any link on how to train this muscle.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Muscle group">
            <NativeSelect value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)}>
              {MUSCLE_GROUPS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Link" required>
            <Input
              type="url"
              autoFocus
              placeholder="https://instagram.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </Field>
          <Field label="Label (optional)">
            <Input placeholder="e.g. Chest drop-set technique" value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !url.trim()}>
              {pending ? "Saving…" : "Save link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
