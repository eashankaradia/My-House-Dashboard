"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Camera, Palette, Plus, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { extractPalette, sampleColour } from "@/lib/colour";
import type { RoomColourPalette, RoomColourSwatch } from "@/lib/database.types";
import { addSwatches, createPalette, deletePalette, deleteSwatch } from "./actions";

export function ColourStudio({
  roomId,
  palettes,
  swatches,
}: {
  roomId: string;
  palettes: RoomColourPalette[];
  swatches: RoomColourSwatch[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function newPalette(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createPalette(roomId, name || "Palette");
      if (res?.error) toast({ variant: "destructive", title: "Couldn't create", description: res.error });
      else {
        setName("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Build colour schemes — pick by hand or pull them straight from a photo.</p>

      <Card>
        <CardContent className="p-3">
          <form onSubmit={newPalette} className="flex items-center gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New palette… (e.g. Warm neutrals)" className="h-10" />
            <Button type="submit" disabled={pending} className="h-10 gap-1.5"><Plus className="h-4 w-4" /> Add</Button>
          </form>
        </CardContent>
      </Card>

      {palettes.length === 0 ? (
        <EmptyState icon={Palette} title="No palettes yet" description="Create a palette, then add colours by hand or extract them from an inspiration photo." />
      ) : (
        <div className="space-y-3">
          {palettes.map((p) => (
            <PaletteCard key={p.id} palette={p} swatches={swatches.filter((s) => s.palette_id === p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PaletteCard({ palette, swatches }: { palette: RoomColourPalette; swatches: RoomColourSwatch[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [hex, setHex] = React.useState("#cccccc");
  const [pending, startTransition] = React.useTransition();

  function addManual() {
    startTransition(async () => {
      const res = await addSwatches(palette.id, [hex]);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't add", description: res.error });
      else router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium">{palette.name}</p>
          <ConfirmDelete itemLabel="palette" action={deletePalette.bind(null, palette.id)} />
        </div>

        {swatches.length === 0 ? (
          <p className="text-xs text-muted-foreground">No colours yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {swatches.map((s) => (
              <div key={s.id} className="group relative">
                <div className="h-14 w-14 rounded-lg border" style={{ backgroundColor: s.hex }} />
                <p className="mt-0.5 text-center text-[10px] uppercase text-muted-foreground">{s.hex}</p>
                <button
                  onClick={() => startTransition(async () => { await deleteSwatch(s.id); router.refresh(); })}
                  aria-label="Remove colour"
                  className="absolute -right-1 -top-1 rounded-full bg-background p-0.5 text-muted-foreground opacity-0 shadow transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="h-9 w-10 shrink-0 cursor-pointer rounded border bg-transparent" aria-label="Pick a colour" />
          <Button variant="outline" size="sm" disabled={pending} onClick={addManual}>Add {hex.toUpperCase()}</Button>
          <PhotoSampler paletteId={palette.id} />
        </div>
      </CardContent>
    </Card>
  );
}

function PhotoSampler({ paletteId }: { paletteId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [src, setSrc] = React.useState<string | null>(null);
  const [extracted, setExtracted] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [pending, startTransition] = React.useTransition();
  const imgRef = React.useRef<HTMLImageElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  function onImgLoad() {
    if (imgRef.current) setExtracted(extractPalette(imgRef.current, 8));
  }

  function toggle(c: string) {
    setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  function onImageTap(e: React.MouseEvent<HTMLImageElement>) {
    const img = imgRef.current;
    if (!img) return;
    const r = img.getBoundingClientRect();
    const c = sampleColour(img, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    if (c && !selected.includes(c)) setSelected((prev) => [...prev, c]);
  }

  function reset() {
    setSrc(null);
    setExtracted([]);
    setSelected([]);
  }

  function save() {
    if (!selected.length) return;
    startTransition(async () => {
      const res = await addSwatches(paletteId, selected);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't add", description: res.error });
      else {
        toast({ title: `${selected.length} colour${selected.length === 1 ? "" : "s"} added` });
        setOpen(false);
        reset();
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5"><Camera className="h-4 w-4" /> From photo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Extract colours from a photo</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {!src ? (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-sm text-muted-foreground hover:bg-accent">
              <Camera className="h-6 w-6" />
              Take a photo or choose an image
              <input type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
            </label>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={src}
                alt="Source"
                onLoad={onImgLoad}
                onClick={onImageTap}
                className="max-h-60 w-full cursor-crosshair rounded-lg object-contain"
              />
              <p className="text-xs text-muted-foreground">Tap the image to sample any colour, or pick from the suggestions.</p>
              {extracted.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {extracted.map((c) => (
                    <button key={c} onClick={() => toggle(c)} className={cn("h-9 w-9 rounded-lg border-2", selected.includes(c) ? "border-foreground" : "border-transparent")} style={{ backgroundColor: c }} aria-label={c} />
                  ))}
                </div>
              ) : null}
              {selected.length > 0 ? (
                <div>
                  <p className="mb-1 text-xs font-medium">Selected ({selected.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.map((c) => (
                      <span key={c} className="flex items-center gap-1 rounded-full border py-0.5 pl-1 pr-2 text-xs">
                        <span className="h-4 w-4 rounded-full" style={{ backgroundColor: c }} />
                        {c.toUpperCase()}
                        <button onClick={() => toggle(c)} aria-label="Remove"><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <button onClick={reset} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <Trash2 className="h-3.5 w-3.5" /> Use a different photo
              </button>
            </>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }} disabled={pending}>Cancel</Button>
          <Button type="button" onClick={save} disabled={pending || selected.length === 0}>
            {pending ? "Adding…" : `Add ${selected.length || ""} to palette`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
