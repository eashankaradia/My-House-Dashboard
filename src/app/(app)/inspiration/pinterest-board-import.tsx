"use client";

import * as React from "react";
import { PanelTop, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { importPinterestBoard } from "./actions";

export function PinterestBoardImport({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await importPinterestBoard({ name, url });
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't import board", description: res.error });
        return;
      }
      toast({ title: "Pinterest board saved", description: "A collection and board link were added." });
      setName("");
      setUrl("");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-2">
            <PanelTop className="h-4 w-4" /> Pinterest board
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Pinterest mood board</DialogTitle>
          <DialogDescription>Paste a board link to save it as a collection you can keep building around.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Board name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kitchen mood board" />
          </Field>
          <Field label="Pinterest board URL" required>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.pinterest.co.uk/..." />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="gap-1.5">
              <Plus className="h-4 w-4" /> {pending ? "Saving..." : "Save board"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
