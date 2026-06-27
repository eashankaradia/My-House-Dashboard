"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { ImageUpload } from "@/components/shared/image-upload";
import { useToast } from "@/hooks/use-toast";
import { addQuickPhoto } from "./actions";

/** Snap a photo now, label it (optionally) and save to the misc photo shoebox. */
export function QuickPhotoDialog({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState<string | null>(null);
  const [label, setLabel] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function reset() {
    setUrl(null);
    setLabel("");
  }

  function save() {
    if (!url) return;
    startTransition(async () => {
      const res = await addQuickPhoto(url, label);
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't save", description: res.error });
        return;
      }
      toast({ title: "Photo saved", description: "Find it under Photos to label later." });
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick photo</DialogTitle>
          <DialogDescription>Snap something to deal with later — you can label it now or in the Photos section.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <ImageUpload value={url} onChange={setUrl} />
          <Field label="Label (optional)">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Boiler serial number" />
          </Field>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }} disabled={pending}>Cancel</Button>
          <Button type="button" onClick={save} disabled={pending || !url}>{pending ? "Saving…" : "Save photo"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
