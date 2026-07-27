"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { PlantAvailability, PlantWriteData, Tag } from "@/lib/types";

// ── Slug helpers ──────────────────────────────────────────────────────────────

function extractStoragePath(url: string): string {
  const marker = "/plant-photos/";
  const idx = url.indexOf(marker);
  return idx >= 0 ? url.slice(idx + marker.length) : url;
}

async function generateUniqueSlug(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  name: string,
  excludeId?: string
): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let n = 1;

  while (true) {
    let q = supabase.from("plants").select("id").eq("slug", slug);
    if (excludeId) q = q.neq("id", excludeId);
    const { data } = await q.maybeSingle();
    if (!data) return slug;
    slug = `${base}-${n++}`;
  }
}

// ── Tag actions ───────────────────────────────────────────────────────────────

export async function createTag(
  name: string
): Promise<{ tag: Tag; isExisting: boolean }> {
  const supabase = await createClient();
  const trimmed = name.trim();

  // Case-insensitive duplicate check
  const { data: allTags } = await supabase.from("tags").select("*");
  if (allTags) {
    const existing = allTags.find(
      (t) => t.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      return { tag: existing as Tag, isExisting: true };
    }
  }

  const slug = slugify(trimmed);

  // Get next display_order
  const { data: maxRow } = await supabase
    .from("tags")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxRow?.display_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("tags")
    .insert({ name: trimmed, slug, display_order: nextOrder })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/tags");
  return { tag: data as Tag, isExisting: false };
}

export async function fetchAllTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as Tag[]) ?? [];
}

/**
 * Syncs the plant_tags junction table so the plant's tags match exactly
 * the provided tagIds array. Deletes removed links, inserts new ones.
 */
export async function syncPlantTags(
  plantId: string,
  tagIds: string[]
): Promise<void> {
  const supabase = await createClient();

  // Get current tag links
  const { data: existing, error: fetchError } = await supabase
    .from("plant_tags")
    .select("tag_id")
    .eq("plant_id", plantId);

  if (fetchError) throw new Error(fetchError.message);

  const currentIds = (existing ?? []).map((r: { tag_id: string }) => r.tag_id);

  // Tags to remove (in DB but not in new selection)
  const toRemove = currentIds.filter((id: string) => !tagIds.includes(id));
  // Tags to add (in new selection but not in DB)
  const toAdd = tagIds.filter((id) => !currentIds.includes(id));

  // Delete removed links
  if (toRemove.length > 0) {
    const { error: delError } = await supabase
      .from("plant_tags")
      .delete()
      .eq("plant_id", plantId)
      .in("tag_id", toRemove);
    if (delError) throw new Error(delError.message);
  }

  // Insert new links
  if (toAdd.length > 0) {
    const rows = toAdd.map((tag_id) => ({ plant_id: plantId, tag_id }));
    const { error: insError } = await supabase
      .from("plant_tags")
      .insert(rows);
    if (insError) throw new Error(insError.message);
  }
}

// ── Plant actions ─────────────────────────────────────────────────────────────

export async function createPlant(
  data: PlantWriteData,
  tagIds: string[] = []
): Promise<void> {
  const supabase = await createClient();
  const slug = await generateUniqueSlug(supabase, data.name);

  const { data: newPlant, error } = await supabase
    .from("plants")
    .insert({ ...data, slug })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  // Link tags
  if (tagIds.length > 0) {
    const rows = tagIds.map((tag_id) => ({
      plant_id: newPlant.id,
      tag_id,
    }));
    const { error: tagError } = await supabase
      .from("plant_tags")
      .insert(rows);
    if (tagError) throw new Error(tagError.message);
  }

  revalidatePath("/admin/plants");
}

export async function updatePlant(
  id: string,
  data: PlantWriteData,
  photosToDelete: string[] = [],
  tagIds?: string[]
): Promise<void> {
  const supabase = await createClient();
  const slug = await generateUniqueSlug(supabase, data.name, id);

  // Remove photos that were deleted from the form
  if (photosToDelete.length > 0) {
    const paths = photosToDelete.map(extractStoragePath);
    // Ignore storage errors — file may already be gone
    await supabase.storage.from("plant-photos").remove(paths);
  }

  const { error } = await supabase
    .from("plants")
    .update({ ...data, slug })
    .eq("id", id);
  if (error) throw new Error(error.message);

  // Sync tags if provided
  if (tagIds !== undefined) {
    await syncPlantTags(id, tagIds);
  }

  revalidatePath("/admin/plants");
}

export async function deletePlant(
  id: string,
  photoUrls: string[]
): Promise<void> {
  const supabase = await createClient();

  // 1. Check if plant is referenced in any active orders (not dispatched & not deleted)
  const { data: activeOrders, error: orderErr } = await supabase
    .from("orders")
    .select("id, status, items")
    .eq("deleted", false)
    .neq("status", "dispatched");

  if (orderErr) throw new Error(orderErr.message);

  let activeCount = 0;
  for (const order of activeOrders || []) {
    const items = (order.items || []) as Array<{ plant_id?: string }>;
    if (items.some((item) => item.plant_id === id)) {
      activeCount++;
    }
  }

  if (activeCount > 0) {
    throw new Error(
      `This plant is part of ${activeCount} active order(s) and can't be deleted right now. Mark it as unavailable instead, or wait until those orders are completed.`
    );
  }

  // 2. Delete associated photos from storage first
  if (photoUrls.length > 0) {
    const paths = photoUrls.map(extractStoragePath);
    await supabase.storage.from("plant-photos").remove(paths);
  }

  // plant_tags rows cascade-delete automatically via FK
  const { error } = await supabase.from("plants").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/plants");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updateAvailability(
  id: string,
  availability: PlantAvailability
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("plants")
    .update({ availability })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/plants");
}
