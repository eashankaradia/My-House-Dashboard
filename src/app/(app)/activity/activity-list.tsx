"use client";

import * as React from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import type { MemberMap } from "@/lib/household";
import type { ActivityLog } from "@/lib/database.types";
import { ACTION_VERB, activityHref, ENTITY_LABEL, ENTITY_TAG } from "./activity-meta";
import { deleteActivities } from "./actions";

export function ActivityList({
  activity,
  memberMap,
}: {
  activity: ActivityLog[];
  memberMap: MemberMap;
}) {
  const [userId, setUserId] = React.useState("all");
  const [entityType, setEntityType] = React.useState("all");
  const [selecting, setSelecting] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const users = Array.from(new Set(activity.map((item) => item.user_id).filter(Boolean))) as string[];
  const entityTypes = Array.from(new Set(activity.map((item) => item.entity_type))).sort();
  const filtered = activity.filter(
    (item) =>
      (userId === "all" || item.user_id === userId) &&
      (entityType === "all" || item.entity_type === entityType),
  );

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelecting() {
    setSelecting(false);
    setSelected(new Set());
  }

  function confirmDelete() {
    const ids = Array.from(selected);
    startTransition(async () => {
      const res = await deleteActivities(ids);
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't delete", description: res.error });
        return;
      }
      toast({ title: "Deleted", description: `${ids.length} entr${ids.length === 1 ? "y" : "ies"} removed.` });
      setConfirmOpen(false);
      exitSelecting();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect value={userId} onChange={(event) => setUserId(event.target.value)} className="h-9 w-auto">
          <option value="all">All users</option>
          {users.map((id) => (
            <option key={id} value={id}>{memberMap[id] ?? "Unknown user"}</option>
          ))}
        </NativeSelect>
        <NativeSelect value={entityType} onChange={(event) => setEntityType(event.target.value)} className="h-9 w-auto">
          <option value="all">All tabs</option>
          {entityTypes.map((type) => (
            <option key={type} value={type}>{ENTITY_LABEL[type] ?? type}</option>
          ))}
        </NativeSelect>
        <span className="self-center text-sm text-muted-foreground">{filtered.length} updates</span>

        <div className="ml-auto flex items-center gap-2">
          {selecting ? (
            <>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                disabled={selected.size === 0 || pending}
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="h-4 w-4" /> Delete{selected.size ? ` (${selected.size})` : ""}
              </Button>
              <Button variant="outline" size="sm" onClick={exitSelecting} disabled={pending}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSelecting(true)}>
              <Trash2 className="h-4 w-4" /> Delete entries
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="divide-y p-0">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No updates match these filters.</p>
          ) : (
            filtered.map((item) => {
              const href = activityHref(item);
              const checked = selected.has(item.id);
              const content = (
                <>
                  <span className="min-w-0">
                    {ENTITY_TAG[item.entity_type] ? (
                      <span className={`mr-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ENTITY_TAG[item.entity_type].className}`}>
                        {ENTITY_TAG[item.entity_type].label}
                      </span>
                    ) : null}
                    <span className="font-medium">{(item.user_id && memberMap[item.user_id]) || "Someone"}</span>{" "}
                    {ACTION_VERB[item.action] ?? item.action} {ENTITY_LABEL[item.entity_type] ?? item.entity_type}
                    {item.entity_label ? <span className="text-muted-foreground"> “{item.entity_label}”</span> : null}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
                </>
              );
              const className = "flex items-center justify-between gap-3 px-4 py-3 text-sm";

              if (selecting) {
                return (
                  <label key={item.id} className={`${className} cursor-pointer hover:bg-accent`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(item.id)}
                      className="h-4 w-4 shrink-0 accent-primary"
                    />
                    {content}
                  </label>
                );
              }

              return href ? (
                <Link key={item.id} href={href} className={`${className} transition-colors hover:bg-accent active:bg-accent`}>
                  {content}
                </Link>
              ) : (
                <div key={item.id} className={className}>{content}</div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {selected.size} change-log entr{selected.size === 1 ? "y" : "ies"}?</DialogTitle>
            <DialogDescription>
              This permanently removes {selected.size === 1 ? "this entry" : "these entries"} from the database. It
              can&apos;t be undone — the items they refer to are not affected, only the log record.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={pending}>
              {pending ? "Deleting…" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
