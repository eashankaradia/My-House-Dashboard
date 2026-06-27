"use server";

import { revalidatePath } from "next/cache";
import { getActionContext, type ActionResult } from "@/lib/action-utils";
import { getHouseholdMap } from "@/lib/household";
import type { Comment, CommentRead, Reaction } from "@/lib/database.types";

export type ReactionView = { emoji: string; count: number; mine: boolean };
export type CommentView = {
  id: string;
  user_id: string;
  name: string | null;
  body: string;
  created_at: string;
  reactions: ReactionView[];
};

export type ThreadData = {
  comments: CommentView[];
  reactions: ReactionView[];
  unread: number;
  currentUserId: string;
};

/** Load a thread's comments, reaction tallies and this user's unread count. */
export async function loadThread(entityType: string, entityId: string): Promise<ThreadData> {
  const { supabase, user } = await getActionContext();
  const [{ data: commentRows }, { data: reactionRows }, { data: readRow }, memberMap] = await Promise.all([
    supabase.from("comments").select("*").eq("entity_type", entityType).eq("entity_id", entityId).order("created_at", { ascending: true }),
    supabase.from("reactions").select("*").eq("entity_type", entityType).eq("entity_id", entityId),
    supabase.from("comment_reads").select("*").eq("entity_type", entityType).eq("entity_id", entityId).eq("user_id", user.id).maybeSingle(),
    getHouseholdMap(),
  ]);

  const commentList = (commentRows ?? []) as Comment[];

  // Per-comment reactions (entity_type="comment", entity_id=comment id).
  const commentIds = commentList.map((c) => c.id);
  const { data: commentReactionRows } = commentIds.length
    ? await supabase.from("reactions").select("*").eq("entity_type", "comment").in("entity_id", commentIds)
    : { data: [] };
  const reactionsByComment = new Map<string, Map<string, { count: number; mine: boolean }>>();
  for (const r of (commentReactionRows ?? []) as Reaction[]) {
    const byEmoji = reactionsByComment.get(r.entity_id) ?? new Map();
    const cur = byEmoji.get(r.emoji) ?? { count: 0, mine: false };
    cur.count += 1;
    if (r.user_id === user.id) cur.mine = true;
    byEmoji.set(r.emoji, cur);
    reactionsByComment.set(r.entity_id, byEmoji);
  }

  const comments = commentList.map((c) => ({
    id: c.id,
    user_id: c.user_id,
    name: memberMap[c.user_id] ?? null,
    body: c.body,
    created_at: c.created_at,
    reactions: Array.from((reactionsByComment.get(c.id) ?? new Map()).entries()).map(
      ([emoji, v]) => ({ emoji, ...(v as { count: number; mine: boolean }) }),
    ),
  }));

  const lastRead = (readRow as CommentRead | null)?.last_read_at ?? null;
  const unread = comments.filter((c) => c.user_id !== user.id && (!lastRead || c.created_at > lastRead)).length;

  // Tally reactions by emoji.
  const tally = new Map<string, { count: number; mine: boolean }>();
  for (const r of (reactionRows ?? []) as Reaction[]) {
    const cur = tally.get(r.emoji) ?? { count: 0, mine: false };
    cur.count += 1;
    if (r.user_id === user.id) cur.mine = true;
    tally.set(r.emoji, cur);
  }
  const reactions = Array.from(tally.entries()).map(([emoji, v]) => ({ emoji, ...v }));

  return { comments, reactions, unread, currentUserId: user.id };
}

/** Add a comment and notify the item's owner (if someone else). */
export async function addComment(
  entityType: string,
  entityId: string,
  body: string,
  opts?: { ownerId?: string | null; href?: string; label?: string },
): Promise<ActionResult> {
  const clean = body.trim();
  if (!clean) return { error: "Write something first" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("comments").insert({
    user_id: user.id,
    entity_type: entityType,
    entity_id: entityId,
    body: clean.slice(0, 2000),
  });
  if (error) return { error: error.message };

  // Mark the author as having read up to now, and notify the owner.
  await markThreadRead(entityType, entityId);
  if (opts?.ownerId && opts.ownerId !== user.id) {
    await supabase.from("notifications").insert({
      recipient_user_id: opts.ownerId,
      sender_user_id: user.id,
      entity_type: entityType,
      entity_id: entityId,
      title: "New comment",
      message: opts.label ? `${opts.label}: ${clean.slice(0, 120)}` : clean.slice(0, 140),
      href: opts.href ?? null,
    });
  }
  revalidatePath("/", "layout");
  return {};
}

export async function deleteComment(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) return { error: error.message };
  // Clean up this comment's reactions (polymorphic table, no FK cascade).
  await supabase.from("reactions").delete().eq("entity_type", "comment").eq("entity_id", id);
  return {};
}

/** Toggle one of the current user's emoji reactions on an item. */
export async function toggleReaction(entityType: string, entityId: string, emoji: string): Promise<ActionResult> {
  const { supabase, user } = await getActionContext();
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase.from("reactions").delete().eq("id", (existing as { id: string }).id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("reactions").insert({
      user_id: user.id,
      entity_type: entityType,
      entity_id: entityId,
      emoji,
    });
    if (error) return { error: error.message };
  }
  return {};
}

/** Record that this user has seen the thread up to now (clears unread). */
export async function markThreadRead(entityType: string, entityId: string): Promise<ActionResult> {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("comment_reads").upsert(
    { user_id: user.id, entity_type: entityType, entity_id: entityId, last_read_at: new Date().toISOString() },
    { onConflict: "user_id,entity_type,entity_id" },
  );
  if (error) return { error: error.message };
  return {};
}
