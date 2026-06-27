"use server";

import { revalidatePath } from "next/cache";
import { getActionContext, type ActionResult } from "@/lib/action-utils";
import { ROOMS } from "@/lib/constants";
import type { Room, RoomDesignStatus, RoomDesignVersion, RoomLayoutItem } from "@/lib/database.types";

type LayoutResult = ActionResult & { item?: RoomLayoutItem };

function revalidateRooms(roomId?: string) {
  revalidatePath("/rooms");
  if (roomId) revalidatePath(`/rooms/${roomId}`);
}

/**
 * The household's room list. Falls back to the built-in defaults when the
 * table is empty (i.e. the household hasn't customised it yet).
 */
export async function getRooms(): Promise<string[]> {
  const { supabase } = await getActionContext();
  const { data } = await supabase.from("rooms").select("*").order("name");
  const rows = (data ?? []) as Room[];
  if (rows.length === 0) return [...ROOMS];
  return Array.from(new Set(rows.map((r) => r.name)));
}

/** Seed the defaults into the table the first time the list is customised. */
async function ensureSeeded(): Promise<void> {
  const { supabase, user } = await getActionContext();
  const { count } = await supabase.from("rooms").select("id", { count: "exact", head: true });
  if ((count ?? 0) === 0) {
    await supabase.from("rooms").insert(ROOMS.map((name) => ({ user_id: user.id, name })));
  }
}

export async function addRoom(name: string): Promise<ActionResult> {
  const clean = name.trim().slice(0, 60);
  if (!clean) return { error: "Enter a room name" };
  await ensureSeeded();
  const { supabase, user } = await getActionContext();
  const existing = await getRooms();
  if (existing.some((r) => r.toLowerCase() === clean.toLowerCase())) return { error: "That room already exists" };
  const { error } = await supabase.from("rooms").insert({ user_id: user.id, name: clean });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return {};
}

export async function removeRoom(name: string): Promise<ActionResult> {
  await ensureSeeded();
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("rooms").delete().eq("name", name);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return {};
}

// --- Room entities (the design hub) ---------------------------------------

/** Full room rows for the designer, de-duplicated by name (seeds defaults). */
export async function getRoomEntities(): Promise<Room[]> {
  await ensureSeeded();
  const { supabase } = await getActionContext();
  const { data } = await supabase.from("rooms").select("*").order("name");
  const rows = (data ?? []) as Room[];
  const byName = new Map<string, Room>();
  for (const r of rows) {
    const key = r.name.toLowerCase();
    const existing = byName.get(key);
    // Prefer the row that has had dimensions filled in.
    if (!existing || (!existing.width_cm && r.width_cm)) byName.set(key, r);
  }
  return Array.from(byName.values());
}

const ROOM_FIELDS = [
  "name", "shape", "width_cm", "length_cm", "height_cm", "wall_color",
  "ceiling_color", "floor_color", "trim_color", "flooring", "notes", "project_id",
  "outline", "doors",
] as const;
const NUMERIC_ROOM_FIELDS = new Set(["width_cm", "length_cm", "height_cm"]);

/** Update a room's physical + design properties. */
export async function updateRoomDetails(id: string, patch: Record<string, unknown>): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const clean: Record<string, unknown> = {};
  for (const f of ROOM_FIELDS) {
    if (!(f in patch)) continue;
    const v = patch[f];
    if (NUMERIC_ROOM_FIELDS.has(f)) clean[f] = v === "" || v == null ? null : Number(v);
    else clean[f] = v === "" ? null : v;
  }
  const { error } = await supabase.from("rooms").update(clean as Partial<Room>).eq("id", id);
  if (error) return { error: error.message };
  revalidateRooms(id);
  return {};
}

// --- Design versions ------------------------------------------------------

export async function createDesignVersion(roomId: string, name: string): Promise<ActionResult> {
  const clean = name.trim().slice(0, 120) || "New version";
  const { supabase, user } = await getActionContext();
  const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).single();
  const r = room as Room | null;
  const { error } = await supabase.from("room_design_versions").insert({
    user_id: user.id,
    room_id: roomId,
    name: clean,
    // Snapshot the room's current dimensions + colours as the starting point.
    width_cm: r?.width_cm ?? null,
    length_cm: r?.length_cm ?? null,
    height_cm: r?.height_cm ?? null,
    wall_color: r?.wall_color ?? null,
    ceiling_color: r?.ceiling_color ?? null,
    floor_color: r?.floor_color ?? null,
    trim_color: r?.trim_color ?? null,
  });
  if (error) return { error: error.message };
  revalidateRooms(roomId);
  return {};
}

const VERSION_FIELDS = [
  "name", "description", "status", "cost_estimate", "width_cm", "length_cm",
  "height_cm", "wall_color", "ceiling_color", "floor_color", "trim_color", "notes",
] as const;
const NUMERIC_VERSION_FIELDS = new Set(["cost_estimate", "width_cm", "length_cm", "height_cm"]);

export async function updateDesignVersion(id: string, patch: Record<string, unknown>): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const clean: Record<string, unknown> = {};
  for (const f of VERSION_FIELDS) {
    if (!(f in patch)) continue;
    const v = patch[f];
    if (NUMERIC_VERSION_FIELDS.has(f)) clean[f] = v === "" || v == null ? null : Number(v);
    else clean[f] = v === "" ? null : v;
  }
  const { data, error } = await supabase.from("room_design_versions").update(clean as Partial<RoomDesignVersion>).eq("id", id).select("room_id").single();
  if (error) return { error: error.message };
  revalidateRooms((data as { room_id?: string } | null)?.room_id);
  return {};
}

export async function deleteDesignVersion(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { data } = await supabase.from("room_design_versions").select("room_id").eq("id", id).single();
  const { error } = await supabase.from("room_design_versions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateRooms((data as { room_id?: string } | null)?.room_id);
  return {};
}

export async function setDesignVersionStatus(id: string, status: RoomDesignStatus): Promise<ActionResult> {
  return updateDesignVersion(id, { status });
}

/** Mark one version final (and current); clears the flag on the room's others. */
export async function markDesignVersionFinal(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { data: ver } = await supabase.from("room_design_versions").select("room_id").eq("id", id).single();
  const roomId = (ver as { room_id?: string } | null)?.room_id;
  if (!roomId) return { error: "Version not found" };
  await supabase.from("room_design_versions").update({ is_final: false }).eq("room_id", roomId);
  const { error } = await supabase
    .from("room_design_versions")
    .update({ is_final: true, status: "chosen" })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateRooms(roomId);
  return {};
}

/** Duplicate a version and all its furniture layout items. */
export async function duplicateDesignVersion(id: string): Promise<ActionResult> {
  const { supabase, user } = await getActionContext();
  const { data: orig, error: readErr } = await supabase.from("room_design_versions").select("*").eq("id", id).single();
  if (readErr || !orig) return { error: readErr?.message ?? "Version not found" };
  const v = orig as RoomDesignVersion;
  const { data: created, error } = await supabase
    .from("room_design_versions")
    .insert({
      user_id: user.id,
      room_id: v.room_id,
      name: `${v.name} (copy)`,
      description: v.description,
      status: "draft",
      is_final: false,
      cost_estimate: v.cost_estimate,
      width_cm: v.width_cm,
      length_cm: v.length_cm,
      height_cm: v.height_cm,
      wall_color: v.wall_color,
      ceiling_color: v.ceiling_color,
      floor_color: v.floor_color,
      trim_color: v.trim_color,
      notes: v.notes,
    })
    .select("id")
    .single();
  if (error || !created) return { error: error?.message ?? "Couldn't duplicate" };
  const newId = (created as { id: string }).id;

  const { data: items } = await supabase.from("room_design_layout_items").select("*").eq("version_id", id);
  const rows = (items ?? []) as RoomLayoutItem[];
  if (rows.length) {
    await supabase.from("room_design_layout_items").insert(
      rows.map((it) => ({
        user_id: user.id,
        version_id: newId,
        name: it.name,
        category: it.category,
        width_cm: it.width_cm,
        depth_cm: it.depth_cm,
        height_cm: it.height_cm,
        x_cm: it.x_cm,
        y_cm: it.y_cm,
        rotation: it.rotation,
        color: it.color,
        material: it.material,
        notes: it.notes,
        cost: it.cost,
        priority: it.priority,
        status: it.status,
        purchase_id: it.purchase_id,
        option_id: it.option_id,
        shape: it.shape,
        image_url: it.image_url,
      })),
    );
  }
  revalidateRooms(v.room_id);
  return {};
}

// --- Layout items (2D floor planner furniture) ----------------------------

export async function addLayoutItem(
  versionId: string,
  data: {
    name: string;
    category?: string;
    width_cm?: number;
    depth_cm?: number;
    height_cm?: number;
    color?: string;
    cost?: number;
    shape?: string;
    purchase_id?: string;
    option_id?: string;
  },
): Promise<LayoutResult> {
  const { supabase, user } = await getActionContext();
  const { data: created, error } = await supabase
    .from("room_design_layout_items")
    .insert({
      user_id: user.id,
      version_id: versionId,
      name: data.name?.trim() || "Furniture",
      category: data.category ?? null,
      width_cm: data.width_cm ?? 100,
      depth_cm: data.depth_cm ?? 60,
      height_cm: data.height_cm ?? null,
      color: data.color ?? null,
      cost: data.cost ?? null,
      shape: data.shape ?? null,
      purchase_id: data.purchase_id ?? null,
      option_id: data.option_id ?? null,
      x_cm: 10,
      y_cm: 10,
      rotation: 0,
    })
    .select("*")
    .single();
  if (error) return { error: error.message };
  return { item: created as RoomLayoutItem };
}

const LAYOUT_FIELDS = [
  "name", "category", "width_cm", "depth_cm", "height_cm", "x_cm", "y_cm",
  "rotation", "color", "material", "notes", "cost", "priority", "status",
  "purchase_id", "option_id", "shape", "image_url",
] as const;
const NUMERIC_LAYOUT_FIELDS = new Set(["width_cm", "depth_cm", "height_cm", "x_cm", "y_cm", "rotation", "cost"]);

export async function updateLayoutItem(id: string, patch: Record<string, unknown>): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const clean: Record<string, unknown> = {};
  for (const f of LAYOUT_FIELDS) {
    if (!(f in patch)) continue;
    const v = patch[f];
    if (NUMERIC_LAYOUT_FIELDS.has(f)) clean[f] = v === "" || v == null ? null : Number(v);
    else clean[f] = v === "" ? null : v;
  }
  const { error } = await supabase.from("room_design_layout_items").update(clean as Partial<RoomLayoutItem>).eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function deleteLayoutItem(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("room_design_layout_items").delete().eq("id", id);
  if (error) return { error: error.message };
  return {};
}

// --- Colour palettes + swatches -------------------------------------------

export async function createPalette(roomId: string, name: string): Promise<ActionResult> {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("room_colour_palettes").insert({
    user_id: user.id,
    room_id: roomId,
    name: name.trim().slice(0, 80) || "Palette",
  });
  if (error) return { error: error.message };
  revalidateRooms(roomId);
  return {};
}

export async function deletePalette(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("room_colour_palettes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/rooms");
  return {};
}

export async function addSwatches(paletteId: string, hexes: string[], label?: string): Promise<ActionResult> {
  const clean = hexes
    .map((h) => h.trim().toLowerCase())
    .filter((h) => /^#?[0-9a-f]{6}$/.test(h))
    .map((h) => (h.startsWith("#") ? h : `#${h}`));
  if (!clean.length) return { error: "No valid colours" };
  const { supabase, user } = await getActionContext();
  const rows = clean.map((hex, i) => ({ user_id: user.id, palette_id: paletteId, hex, label: label ?? null, position: i }));
  const { error } = await supabase.from("room_colour_swatches").insert(rows);
  if (error) return { error: error.message };
  revalidatePath("/rooms");
  return {};
}

export async function deleteSwatch(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("room_colour_swatches").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/rooms");
  return {};
}

// --- Layout item ↔ purchase bridge ----------------------------------------

/** Create a wishlist purchase from a planned furniture item and link them. */
export async function createPurchaseFromLayout(
  itemId: string,
  roomName: string,
): Promise<ActionResult & { purchaseId?: string }> {
  const { supabase, user } = await getActionContext();
  const { data: item } = await supabase.from("room_design_layout_items").select("*").eq("id", itemId).single();
  const it = item as RoomLayoutItem | null;
  if (!it) return { error: "Item not found" };
  const { data: created, error } = await supabase
    .from("purchases")
    .insert({
      user_id: user.id,
      name: it.name,
      category: "Furniture",
      price: it.cost ?? 0,
      room: roomName || null,
      priority: "Low",
      status: "Considering",
    })
    .select("id")
    .single();
  if (error || !created) return { error: error?.message ?? "Couldn't create purchase" };
  const purchaseId = (created as { id: string }).id;
  await supabase.from("room_design_layout_items").update({ purchase_id: purchaseId, status: "planned" }).eq("id", itemId);
  revalidatePath("/purchases");
  return { purchaseId };
}

/** Rename a room and keep its tagged purchases/inspiration pointing at it. */
export async function renameRoom(oldName: string, newName: string): Promise<ActionResult> {
  const clean = newName.trim().slice(0, 60);
  if (!clean) return { error: "Enter a room name" };
  if (clean.toLowerCase() === oldName.toLowerCase()) return {};
  await ensureSeeded();
  const { supabase } = await getActionContext();
  const existing = await getRooms();
  if (existing.some((r) => r.toLowerCase() === clean.toLowerCase())) return { error: "That room already exists" };
  const { error } = await supabase.from("rooms").update({ name: clean }).eq("name", oldName);
  if (error) return { error: error.message };
  await supabase.from("purchases").update({ room: clean }).eq("room", oldName);
  await supabase.from("inspiration").update({ room: clean }).eq("room", oldName);
  revalidatePath("/settings");
  revalidateRooms();
  return {};
}
