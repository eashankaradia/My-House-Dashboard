"use client";

import * as React from "react";
import Link from "next/link";
import { CheckSquare, ChevronDown, Hammer, Lightbulb, Link2, Plus, Receipt, ShoppingBag, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { useToast } from "@/hooks/use-toast";
import type { LinkType } from "@/lib/database.types";
import { createLink, deleteLink, getLinks, listLinkTargets, type LinkedItem } from "./actions";

const META: Record<LinkType, { label: string; route: string; param: string; icon: LucideIcon }> = {
  task: { label: "Task", route: "/projects", param: "task", icon: CheckSquare },
  project: { label: "Project", route: "/projects", param: "project", icon: Hammer },
  purchase: { label: "Purchase", route: "/purchases", param: "item", icon: ShoppingBag },
  bill: { label: "Bill", route: "/bills", param: "item", icon: Receipt },
  inspiration: { label: "Idea", route: "/inspiration", param: "item", icon: Lightbulb },
};

const ALL_TYPES: LinkType[] = ["task", "project", "purchase", "bill", "inspiration"];

/**
 * Shows the items linked to (type,id) and lets the user add or remove links.
 * Drop into any detail dialog: <LinkedItems type="task" id={task.id} />.
 */
export function LinkedItems({ type, id }: { type: LinkType; id: string }) {
  const [items, setItems] = React.useState<LinkedItem[]>([]);
  const [adding, setAdding] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const refresh = React.useCallback(() => {
    getLinks(type, id).then(setItems);
  }, [type, id]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  function remove(linkId: string) {
    startTransition(async () => {
      const res = await deleteLink(linkId);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't unlink", description: res.error });
      else refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          aria-expanded={open}
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90"}`} />
          <Link2 className="h-3.5 w-3.5" />
          Linked items{items.length > 0 ? ` (${items.length})` : ""}
        </button>
        {open && !adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Link
          </button>
        ) : null}
      </div>

      {open && items.length === 0 && !adding ? (
        <p className="text-xs text-muted-foreground">Nothing linked yet.</p>
      ) : null}

      {open && items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((it) => {
            const meta = META[it.type];
            const Icon = meta.icon;
            return (
              <span
                key={it.linkId}
                className="inline-flex items-center gap-1 rounded-full border bg-background py-0.5 pl-2 pr-1 text-xs"
              >
                <Link href={`${meta.route}?${meta.param}=${it.id}`} className="inline-flex items-center gap-1 hover:underline">
                  <Icon className="h-3 w-3 text-primary" />
                  <span className="max-w-[12rem] truncate">{it.label}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => remove(it.linkId)}
                  disabled={pending}
                  aria-label="Unlink"
                  className="rounded-full p-0.5 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      ) : null}

      {open && adding ? (
        <AddLink
          selfType={type}
          onCancel={() => setAdding(false)}
          onAdd={(targetType, targetId) =>
            startTransition(async () => {
              const res = await createLink(type, id, targetType, targetId);
              if (res?.error) {
                toast({ variant: "destructive", title: "Couldn't link", description: res.error });
                return;
              }
              setAdding(false);
              refresh();
            })
          }
        />
      ) : null}
    </div>
  );
}

function AddLink({
  selfType,
  onAdd,
  onCancel,
}: {
  selfType: LinkType;
  onAdd: (type: LinkType, id: string) => void;
  onCancel: () => void;
}) {
  const [targetType, setTargetType] = React.useState<LinkType>(
    ALL_TYPES.find((t) => t !== selfType) ?? "task",
  );
  const [targetId, setTargetId] = React.useState("");
  const [targets, setTargets] = React.useState<{ id: string; label: string }[]>([]);

  React.useEffect(() => {
    setTargetId("");
    listLinkTargets(targetType).then(setTargets);
  }, [targetType]);

  return (
    <div className="space-y-2 rounded-lg border bg-card/40 p-2">
      <div className="flex gap-2">
        <NativeSelect
          value={targetType}
          onChange={(e) => setTargetType(e.target.value as LinkType)}
          className="h-9 w-32 text-sm"
          aria-label="Type to link"
        >
          {ALL_TYPES.map((t) => (
            <option key={t} value={t}>{META[t].label}</option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          className="h-9 flex-1 text-sm"
          aria-label="Item to link"
        >
          <option value="">Choose…</option>
          {targets.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" disabled={!targetId} onClick={() => targetId && onAdd(targetType, targetId)}>
          Link
        </Button>
      </div>
    </div>
  );
}
