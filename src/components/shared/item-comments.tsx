"use client";

import * as React from "react";
import { MessageCircle, Send, SmilePlus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn, formatDate } from "@/lib/utils";
import { useMemberColorClass } from "@/components/providers/household-colors";
import {
  addComment,
  deleteComment,
  loadThread,
  markThreadRead,
  toggleReaction,
  type ThreadData,
} from "@/app/(app)/comments/actions";

const QUICK_EMOJI = ["👍", "❤️", "😍", "🙌", "🔥", "😂"];

export function ItemComments({
  entityType,
  entityId,
  ownerId,
  href,
  label,
}: {
  entityType: string;
  entityId: string;
  ownerId?: string | null;
  href?: string;
  label?: string;
}) {
  const [data, setData] = React.useState<ThreadData | null>(null);
  const [open, setOpen] = React.useState(false);
  const [body, setBody] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const refresh = React.useCallback(() => {
    loadThread(entityType, entityId).then(setData);
  }, [entityType, entityId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  function expand() {
    setOpen((v) => {
      const next = !v;
      // Opening the thread marks it read.
      if (next && data && data.unread > 0) {
        startTransition(async () => {
          await markThreadRead(entityType, entityId);
          setData((d) => (d ? { ...d, unread: 0 } : d));
        });
      }
      return next;
    });
  }

  function react(emoji: string) {
    startTransition(async () => {
      const res = await toggleReaction(entityType, entityId, emoji);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't react", description: res.error });
      else refresh();
    });
  }

  function reactToComment(commentId: string, emoji: string) {
    startTransition(async () => {
      const res = await toggleReaction("comment", commentId, emoji);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't react", description: res.error });
      else refresh();
    });
  }

  function post(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      const res = await addComment(entityType, entityId, body, { ownerId, href, label });
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't comment", description: res.error });
        return;
      }
      setBody("");
      refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteComment(id);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't delete", description: res.error });
      else refresh();
    });
  }

  const count = data?.comments.length ?? 0;
  const unread = data?.unread ?? 0;

  return (
    <div className="space-y-2">
      {/* Reactions */}
      <div className="flex flex-wrap items-center gap-1.5">
        {data?.reactions.map((r) => (
          <button
            key={r.emoji}
            type="button"
            disabled={pending}
            onClick={() => react(r.emoji)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
              r.mine ? "border-primary bg-primary/10" : "hover:bg-accent",
            )}
          >
            <span>{r.emoji}</span>
            <span className="text-muted-foreground">{r.count}</span>
          </button>
        ))}
        <div className="flex items-center gap-0.5">
          {QUICK_EMOJI.filter((e) => !data?.reactions.some((r) => r.emoji === e)).slice(0, 4).map((e) => (
            <button
              key={e}
              type="button"
              disabled={pending}
              onClick={() => react(e)}
              aria-label={`React ${e}`}
              className="rounded-full px-1 text-sm opacity-60 transition-opacity hover:opacity-100"
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Comments toggle */}
      <button
        type="button"
        onClick={expand}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <MessageCircle className="h-4 w-4" />
        {count === 0 ? "Add a comment" : `${count} comment${count === 1 ? "" : "s"}`}
        {unread > 0 ? (
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unread} new
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="space-y-2 rounded-lg border bg-muted/20 p-2.5">
          {data?.comments.length ? (
            data.comments.map((c) => (
              <CommentRow
                key={c.id}
                comment={c}
                mine={c.user_id === data.currentUserId}
                onDelete={() => remove(c.id)}
                onReact={(emoji) => reactToComment(c.id, emoji)}
                disabled={pending}
              />
            ))
          ) : (
            <p className="px-1 py-1 text-xs text-muted-foreground">No comments yet. Start the conversation.</p>
          )}
          <form onSubmit={post} className="flex items-center gap-2 pt-1">
            <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a comment…" className="h-9" />
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={pending || !body.trim()} aria-label="Post comment">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function CommentRow({
  comment,
  mine,
  onDelete,
  onReact,
  disabled,
}: {
  comment: {
    name: string | null;
    body: string;
    created_at: string;
    reactions: { emoji: string; count: number; mine: boolean }[];
  };
  mine: boolean;
  onDelete: () => void;
  onReact: (emoji: string) => void;
  disabled: boolean;
}) {
  const colorClass = useMemberColorClass(comment.name);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  return (
    <div className="group flex items-start gap-2 rounded-md px-1 py-1 text-sm">
      <div className="min-w-0 flex-1">
        <span className={cn("mr-1.5 text-xs font-medium", colorClass || "text-muted-foreground")}>
          {comment.name ?? "Someone"}
        </span>
        <span className="text-[11px] text-muted-foreground">{formatDate(comment.created_at)}</span>
        <p className="whitespace-pre-wrap break-words">{comment.body}</p>
        {comment.reactions.length || pickerOpen ? (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {comment.reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                disabled={disabled}
                onClick={() => onReact(r.emoji)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] transition-colors",
                  r.mine ? "border-primary bg-primary/10" : "hover:bg-accent",
                )}
              >
                <span>{r.emoji}</span>
                <span className="text-muted-foreground">{r.count}</span>
              </button>
            ))}
            {pickerOpen
              ? QUICK_EMOJI.filter((e) => !comment.reactions.some((r) => r.emoji === e)).map((e) => (
                  <button
                    key={e}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onReact(e);
                      setPickerOpen(false);
                    }}
                    aria-label={`React ${e}`}
                    className="rounded-full px-1 text-sm opacity-70 transition-opacity hover:opacity-100"
                  >
                    {e}
                  </button>
                ))
              : null}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setPickerOpen((v) => !v)}
          aria-label="React to comment"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-transform hover:bg-accent hover:text-foreground active:scale-90"
        >
          <SmilePlus className="h-4 w-4" />
        </button>
        {mine ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onDelete}
            aria-label="Delete comment"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-transform hover:bg-accent hover:text-destructive active:scale-90"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
