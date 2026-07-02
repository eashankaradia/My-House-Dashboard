"use client";

import * as React from "react";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
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
import { addPrivatePhoto } from "./actions";

/** Snap or pick a photo and save it privately — never visible to other household members. */
export function PrivatePhotoDialog({ trigger }: { trigger: React.ReactNode }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [caption, setCaption] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const cameraRef = React.useRef<HTMLInputElement>(null);
  const galleryRef = React.useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setCaption("");
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Photo too large", description: "Max 10MB." });
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function save() {
    if (!file) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("caption", caption);
      const res = await addPrivatePhoto(formData);
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't save", description: res.error });
        return;
      }
      toast({ title: "Photo saved privately" });
      setOpen(false);
      reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Private photo</DialogTitle>
          <DialogDescription>Only you can see this — it&apos;s never shared with the household.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {previewUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="" className="max-h-64 w-full rounded-lg border object-cover" />
              <button
                type="button"
                onClick={reset}
                className="absolute -right-1.5 -top-1.5 rounded-full border bg-background p-0.5 text-muted-foreground hover:text-destructive"
                aria-label="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                disabled={pending}
                className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground hover:bg-accent"
              >
                {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                Photo
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                disabled={pending}
                className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground hover:bg-accent"
              >
                <ImagePlus className="h-5 w-5" />
                Gallery
              </button>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} />
              <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
            </div>
          )}
          <Field label="Caption (optional)">
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="e.g. Passport photo page" />
          </Field>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }} disabled={pending}>Cancel</Button>
          <Button type="button" onClick={save} disabled={pending || !file}>{pending ? "Saving…" : "Save photo"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
