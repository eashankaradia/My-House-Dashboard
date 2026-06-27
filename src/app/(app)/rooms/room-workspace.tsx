"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, Layers, Lightbulb, ListChecks, Palette, Plus, ShoppingBag, SlidersHorizontal, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/shared/form-field";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Inspiration, Project, Purchase, Room, RoomColourPalette, RoomColourSwatch, RoomDesignVersion } from "@/lib/database.types";
import { createTask } from "@/app/(app)/projects/actions";
import { ColourStudio } from "./colour-studio";
import {
  createDesignVersion,
  deleteDesignVersion,
  duplicateDesignVersion,
  markDesignVersionFinal,
  updateDesignVersion,
  updateRoomDetails,
} from "./actions";

const STATUS_VARIANT: Record<string, "secondary" | "warning" | "success" | "outline"> = {
  draft: "secondary",
  comparing: "warning",
  chosen: "success",
  archived: "outline",
};

export function RoomWorkspace({
  room,
  versions,
  purchases,
  inspiration,
  projects,
  palettes,
  swatches,
}: {
  room: Room;
  versions: RoomDesignVersion[];
  purchases: Purchase[];
  inspiration: Inspiration[];
  projects: Pick<Project, "id" | "name">[];
  palettes: RoomColourPalette[];
  swatches: RoomColourSwatch[];
}) {
  const activeVersions = versions.filter((v) => v.status !== "archived");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{room.name}</h1>

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="w-max">
            <TabsTrigger value="overview" className="gap-1.5"><SlidersHorizontal className="h-4 w-4" /> Overview</TabsTrigger>
            <TabsTrigger value="design" className="gap-1.5"><Layers className="h-4 w-4" /> Design{activeVersions.length ? ` (${activeVersions.length})` : ""}</TabsTrigger>
            <TabsTrigger value="colours" className="gap-1.5"><Palette className="h-4 w-4" /> Colours{palettes.length ? ` (${palettes.length})` : ""}</TabsTrigger>
            <TabsTrigger value="purchases" className="gap-1.5"><ShoppingBag className="h-4 w-4" /> Items{purchases.length ? ` (${purchases.length})` : ""}</TabsTrigger>
            <TabsTrigger value="inspiration" className="gap-1.5"><Lightbulb className="h-4 w-4" /> Ideas{inspiration.length ? ` (${inspiration.length})` : ""}</TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1.5"><ListChecks className="h-4 w-4" /> Tasks</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview"><OverviewTab room={room} projects={projects} versions={versions} purchases={purchases} /></TabsContent>
        <TabsContent value="design"><DesignTab room={room} versions={versions} /></TabsContent>
        <TabsContent value="colours"><ColourStudio roomId={room.id} palettes={palettes} swatches={swatches} /></TabsContent>
        <TabsContent value="purchases"><PurchasesTab room={room} purchases={purchases} /></TabsContent>
        <TabsContent value="inspiration"><InspirationTab room={room} inspiration={inspiration} /></TabsContent>
        <TabsContent value="tasks"><TasksTab room={room} /></TabsContent>
      </Tabs>
    </div>
  );
}

// --- Overview: dimensions, colours, notes (autosaves) ----------------------

function OverviewTab({
  room,
  projects,
  versions,
  purchases,
}: {
  room: Room;
  projects: Pick<Project, "id" | "name">[];
  versions: RoomDesignVersion[];
  purchases: Purchase[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved">("idle");

  const save = React.useCallback(
    (patch: Record<string, unknown>) => {
      setStatus("saving");
      updateRoomDetails(room.id, patch).then((res) => {
        if (res?.error) {
          toast({ variant: "destructive", title: "Couldn't save", description: res.error });
          setStatus("idle");
          return;
        }
        setStatus("saved");
        router.refresh();
        setTimeout(() => setStatus("idle"), 1500);
      });
    },
    [room.id, router, toast],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-sm text-muted-foreground">Capture the room to scale.</p>
        <span className="shrink-0"><SaveStatus status={status} /></span>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Shape">
              <NativeSelect defaultValue={room.shape} onChange={(e) => save({ shape: e.target.value })}>
                <option value="rectangle">Rectangle</option>
                <option value="square">Square</option>
                <option value="l-shape">L-shape</option>
                <option value="custom">Custom</option>
              </NativeSelect>
            </Field>
            <MetreField label="Width (m)" cm={room.width_cm} onSave={(cm) => save({ width_cm: cm })} />
            <MetreField label="Length (m)" cm={room.length_cm} onSave={(cm) => save({ length_cm: cm })} />
            <MetreField label="Height (m)" cm={room.height_cm} onSave={(cm) => save({ height_cm: cm })} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ColorField label="Walls" value={room.wall_color} onSave={(v) => save({ wall_color: v })} />
            <ColorField label="Ceiling" value={room.ceiling_color} onSave={(v) => save({ ceiling_color: v })} />
            <ColorField label="Floor" value={room.floor_color} onSave={(v) => save({ floor_color: v })} />
            <ColorField label="Trim" value={room.trim_color} onSave={(v) => save({ trim_color: v })} />
          </div>

          <Field label="Flooring">
            <Input defaultValue={room.flooring ?? ""} placeholder="e.g. Oak engineered, grey carpet…" onBlur={(e) => save({ flooring: e.target.value })} />
          </Field>

          <Field label="Project">
            <NativeSelect defaultValue={room.project_id ?? ""} onChange={(e) => save({ project_id: e.target.value })}>
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Notes">
            <Textarea defaultValue={room.notes ?? ""} rows={3} placeholder="Anything to remember about this room…" onBlur={(e) => save({ notes: e.target.value })} />
          </Field>
        </CardContent>
      </Card>

      <Timeline room={room} versions={versions} purchases={purchases} />
    </div>
  );
}

// --- Timeline: the room's journey -----------------------------------------

function Timeline({ room, versions, purchases }: { room: Room; versions: RoomDesignVersion[]; purchases: Purchase[] }) {
  type Ev = { date: string; label: string };
  const events: Ev[] = [];
  if (room.created_at) events.push({ date: room.created_at, label: "Room created" });
  for (const v of versions) events.push({ date: v.created_at, label: `Design “${v.name}” added` });
  for (const p of purchases) {
    events.push({ date: p.created_at, label: `Planned “${p.name}”` });
    if (p.status === "Purchased" && p.purchased_at) events.push({ date: p.purchased_at, label: `Bought “${p.name}”` });
  }
  events.sort((a, b) => b.date.localeCompare(a.date));

  if (events.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <p className="mb-3 text-sm font-medium">Timeline</p>
        <ol className="space-y-2">
          {events.slice(0, 20).map((e, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary/60" />
              <span className="min-w-0 flex-1 truncate">{e.label}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDate(e.date)}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function SaveStatus({ status }: { status: "idle" | "saving" | "saved" }) {
  if (status === "idle") return <span className="text-xs text-muted-foreground">Autosaves</span>;
  if (status === "saving") return <span className="text-xs text-muted-foreground">Saving…</span>;
  return <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Saved</span>;
}

function MetreField({ label, cm, onSave }: { label: string; cm: number | null; onSave: (cm: number | null) => void }) {
  const initial = cm != null ? (cm / 100).toString() : "";
  return (
    <Field label={label}>
      <Input
        type="number"
        step="0.01"
        min="0"
        defaultValue={initial}
        placeholder="0.00"
        onBlur={(e) => onSave(e.target.value === "" ? null : Math.round(Number(e.target.value) * 100))}
      />
    </Field>
  );
}

function ColorField({ label, value, onSave }: { label: string; value: string | null; onSave: (v: string) => void }) {
  const [hex, setHex] = React.useState(value ?? "#cccccc");
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          onBlur={() => onSave(hex)}
          className="h-9 w-10 shrink-0 cursor-pointer rounded border bg-transparent"
          aria-label={label}
        />
        <span className="text-xs text-muted-foreground">{value ? hex.toUpperCase() : "—"}</span>
      </div>
    </div>
  );
}

// --- Design versions -------------------------------------------------------

function DesignTab({ room, versions }: { room: Room; versions: RoomDesignVersion[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function add(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createDesignVersion(room.id, name || "New version");
      if (res?.error) toast({ variant: "destructive", title: "Couldn't create", description: res.error });
      else {
        setName("");
        router.refresh();
      }
    });
  }

  function run(fn: () => Promise<{ error?: string } | void>) {
    startTransition(async () => {
      const res = await fn();
      if (res?.error) toast({ variant: "destructive", title: "Something went wrong", description: res.error });
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Try multiple ideas before committing — compare and pick a final.</p>
        {versions.filter((v) => v.status !== "archived").length >= 2 ? (
          <Link href={`/rooms/${room.id}/compare`} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent">
            <Layers className="h-3.5 w-3.5" /> Compare
          </Link>
        ) : null}
      </div>

      <Card>
        <CardContent className="p-3">
          <form onSubmit={add} className="flex items-center gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New design version… (e.g. Cosy, Budget)" className="h-10" />
            <Button type="submit" disabled={pending} className="h-10 gap-1.5"><Plus className="h-4 w-4" /> Add</Button>
          </form>
        </CardContent>
      </Card>

      {versions.length === 0 ? (
        <EmptyState icon={Layers} title="No design versions yet" description="Add a version to start planning this room's layout, colours and budget." />
      ) : (
        <div className="space-y-3">
          {versions.map((v) => (
            <Card key={v.id} className={cn(v.is_final && "border-emerald-500/40")}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium">
                      {v.name}
                      {v.is_final ? <Badge variant="success" className="gap-1"><Star className="h-3 w-3" /> Final</Badge> : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <Badge variant={STATUS_VARIANT[v.status] ?? "secondary"}>{v.status}</Badge>
                      {v.cost_estimate != null ? <span className="ml-2">{formatCurrency(v.cost_estimate)} est.</span> : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!v.is_final ? (
                      <button onClick={() => run(() => markDesignVersionFinal(v.id))} disabled={pending} title="Mark as final" aria-label="Mark as final" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                        <Star className="h-4 w-4" />
                      </button>
                    ) : null}
                    <button onClick={() => run(() => duplicateDesignVersion(v.id))} disabled={pending} title="Duplicate" aria-label="Duplicate" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                      <Copy className="h-4 w-4" />
                    </button>
                    <VersionEditDialog version={v} />
                    <ConfirmDelete itemLabel="version" action={deleteDesignVersion.bind(null, v.id)} />
                  </div>
                </div>
                {v.description ? <p className="text-sm text-muted-foreground">{v.description}</p> : null}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {[v.wall_color, v.floor_color, v.trim_color, v.ceiling_color].filter(Boolean).map((c, i) => (
                      <span key={i} className="h-5 w-5 rounded border" style={{ backgroundColor: c as string }} title={c as string} />
                    ))}
                  </div>
                  <Link
                    href={`/rooms/${room.id}/design/${v.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" /> Plan layout
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function VersionEditDialog({ version }: { version: RoomDesignVersion }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [form, setForm] = React.useState({
    name: version.name,
    description: version.description ?? "",
    status: version.status,
    cost_estimate: version.cost_estimate != null ? String(version.cost_estimate) : "",
    notes: version.notes ?? "",
  });

  function set<K extends keyof typeof form>(k: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: val }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateDesignVersion(version.id, form);
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't save", description: res.error });
        return;
      }
      toast({ title: "Version updated" });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button title="Edit" aria-label="Edit version" className="rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
          Edit
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit design version</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <NativeSelect value={form.status} onChange={(e) => set("status", e.target.value as typeof form.status)}>
                <option value="draft">Draft</option>
                <option value="comparing">Comparing</option>
                <option value="chosen">Chosen</option>
                <option value="archived">Archived</option>
              </NativeSelect>
            </Field>
            <Field label="Cost estimate (£)">
              <Input type="number" step="0.01" value={form.cost_estimate} onChange={(e) => set("cost_estimate", e.target.value)} />
            </Field>
          </div>
          <Field label="Description">
            <Input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Short summary of this idea" />
          </Field>
          <Field label="Notes">
            <Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Items (purchases tagged to this room) ---------------------------------

function PurchasesTab({ room, purchases }: { room: Room; purchases: Purchase[] }) {
  const planned = purchases.filter((p) => p.status !== "Purchased");
  const bought = purchases.filter((p) => p.status === "Purchased");
  const plannedCost = planned.reduce((s, p) => s + Number(p.price), 0);
  const spent = bought.reduce((s, p) => s + Number(p.purchased_price ?? p.price), 0);

  // Per-category budget rollup (planned vs spent).
  const byCategory = new Map<string, { planned: number; spent: number }>();
  for (const p of purchases) {
    const cat = p.category || "Other";
    const row = byCategory.get(cat) ?? { planned: 0, spent: 0 };
    if (p.status === "Purchased") row.spent += Number(p.purchased_price ?? p.price);
    else row.planned += Number(p.price);
    byCategory.set(cat, row);
  }
  const categoryRows = Array.from(byCategory.entries()).sort((a, b) => (b[1].planned + b[1].spent) - (a[1].planned + a[1].spent));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Planned</p><p className="text-xl font-semibold">{formatCurrency(plannedCost)}</p><p className="text-xs text-muted-foreground">{planned.length} item{planned.length === 1 ? "" : "s"}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Spent</p><p className="text-xl font-semibold">{formatCurrency(spent)}</p><p className="text-xs text-muted-foreground">{bought.length} bought</p></CardContent></Card>
      </div>

      {categoryRows.length > 0 ? (
        <Card>
          <CardContent className="p-4">
            <p className="mb-2 text-sm font-medium">Budget by category</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="pb-1 font-medium">Category</th>
                  <th className="pb-1 text-right font-medium">Planned</th>
                  <th className="pb-1 text-right font-medium">Spent</th>
                </tr>
              </thead>
              <tbody>
                {categoryRows.map(([cat, r]) => (
                  <tr key={cat} className="border-t">
                    <td className="py-1.5">{cat}</td>
                    <td className="py-1.5 text-right text-muted-foreground">{formatCurrency(r.planned)}</td>
                    <td className="py-1.5 text-right font-medium">{formatCurrency(r.spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {purchases.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No items for this room yet" description={`Tag a purchase's room as "${room.name}" to see it here.`}>
          <Link href="/purchases" className="text-sm font-medium text-primary hover:underline">Go to Purchases →</Link>
        </EmptyState>
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {purchases.map((p) => (
              <Link key={p.id} href={`/purchases?item=${p.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-accent">
                <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                <Badge variant={p.status === "Purchased" ? "success" : "secondary"}>{p.status}</Badge>
                <span className="shrink-0 font-medium">{formatCurrency(p.purchased_price ?? p.price)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Ideas (inspiration tagged to this room) -------------------------------

function InspirationTab({ room, inspiration }: { room: Room; inspiration: Inspiration[] }) {
  return (
    <div className="space-y-4">
      {inspiration.length === 0 ? (
        <EmptyState icon={Lightbulb} title="No ideas for this room yet" description={`Tag an idea's room as "${room.name}" to gather inspiration here.`}>
          <Link href="/inspiration" className="text-sm font-medium text-primary hover:underline">Go to Inspiration →</Link>
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {inspiration.map((i) => (
            <Link key={i.id} href={`/inspiration?item=${i.id}`} className="overflow-hidden rounded-lg border transition-shadow hover:shadow-md">
              {i.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.image_url} alt={i.title} className="h-32 w-full object-cover" />
              ) : null}
              <div className="p-3">
                <p className="truncate text-sm font-medium">{i.title}</p>
                <p className="truncate text-xs text-muted-foreground">{[i.source, i.category].filter(Boolean).join(" · ")}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Tasks (create a task for this room) -----------------------------------

function TasksTab({ room }: { room: Room }) {
  const { toast } = useToast();
  const [title, setTitle] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const SUGGESTIONS = [`Measure ${room.name}`, `Paint ${room.name}`, `Order flooring for ${room.name}`, `Plan ${room.name} layout`];

  function create(t: string) {
    if (!t.trim()) return;
    startTransition(async () => {
      const res = await createTask({ title: t, project_id: room.project_id ?? null, due_date: null, assigned_to: null });
      if (res?.error) toast({ variant: "destructive", title: "Couldn't add task", description: res.error });
      else {
        toast({ title: "Task added", description: room.project_id ? "Added to the room's project." : "Added to your tasks." });
        setTitle("");
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Turn design decisions into to-dos{room.project_id ? " on this room's project" : ""}.</p>
      <Card>
        <CardContent className="space-y-3 p-4">
          <form onSubmit={(e) => { e.preventDefault(); create(title); }} className="flex items-center gap-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task for this room…" className="h-10" />
            <Button type="submit" disabled={pending || !title.trim()} className="h-10 gap-1.5"><Plus className="h-4 w-4" /> Add</Button>
          </form>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" disabled={pending} onClick={() => create(s)} className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                + {s}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground">
        Manage and tick off tasks on the <Link href="/projects" className="text-primary hover:underline">Projects &amp; Tasks</Link> page.
      </p>
    </div>
  );
}
