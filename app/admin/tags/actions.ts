"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Tag } from "@/lib/types";
import { slugify } from "@/lib/utils";

export type TagWithUsage = Tag & {
  usage_count: number;
};

/**
 * Fetches all tags with live plant usage counts.
 */
export async function fetchTagsWithUsage(): Promise<TagWithUsage[]> {
  const supabase = await createClient();

  const { data: tags, error: tagErr } = await supabase
    .from("tags")
    .select("*")
    .order("display_order", { ascending: true });

  if (tagErr) throw new Error(tagErr.message);

  const { data: links, error: linkErr } = await supabase
    .from("plant_tags")
    .select("tag_id");

  if (linkErr) throw new Error(linkErr.message);

  const countsMap: Record<string, number> = {};
  (links || []).forEach((link: { tag_id: string }) => {
    countsMap[link.tag_id] = (countsMap[link.tag_id] || 0) + 1;
  });

  return (tags || []).map((t) => ({
    ...t,
    usage_count: countsMap[t.id] || 0,
  }));
}

/**
 * Creates a new tag with case-insensitive duplicate checking.
 */
export async function createTagStandalone(
  name: string
): Promise<{ success: boolean; tag?: Tag; isExisting?: boolean; error?: string }> {
  const supabase = await createClient();
  const trimmed = name.trim();
  if (!trimmed) {
    return { success: false, error: "Tag name cannot be empty." };
  }

  // 1. Case-insensitive duplicate check
  const { data: allTags } = await supabase.from("tags").select("*");
  if (allTags) {
    const existing = allTags.find(
      (t) => t.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      return {
        success: false,
        isExisting: true,
        tag: existing as Tag,
        error: `A tag named '${existing.name}' already exists.`,
      };
    }
  }

  const slug = slugify(trimmed);

  // 2. Get next display_order
  const { data: maxRow } = await supabase
    .from("tags")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxRow?.display_order ?? 0) + 1;

  const { data: newTag, error: insertErr } = await supabase
    .from("tags")
    .insert({ name: trimmed, slug, display_order: nextOrder })
    .select()
    .single();

  if (insertErr) {
    return { success: false, error: insertErr.message };
  }

  revalidatePath("/admin/tags");
  revalidatePath("/admin/plants");
  revalidatePath("/");

  return { success: true, tag: newTag as Tag };
}

/**
 * Renames an existing tag with case-insensitive duplicate check.
 */
export async function renameTagAction(id: string, newName: string): Promise<void> {
  const supabase = await createClient();
  const trimmed = newName.trim();
  if (!trimmed) throw new Error("Tag name cannot be empty.");

  const { data: existingTags } = await supabase
    .from("tags")
    .select("id, name")
    .neq("id", id);

  if (existingTags) {
    const duplicate = existingTags.find(
      (t) => t.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      throw new Error(`A tag named '${duplicate.name}' already exists.`);
    }
  }

  const slug = slugify(trimmed);
  const { error } = await supabase
    .from("tags")
    .update({ name: trimmed, slug })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/tags");
  revalidatePath("/admin/plants");
  revalidatePath("/");
}

/**
 * Deletes a tag and removes all its plant_tags junction records.
 */
export async function deleteTagAction(id: string): Promise<void> {
  const supabase = await createClient();

  // 1. Delete plant_tags junction links
  const { error: linkErr } = await supabase
    .from("plant_tags")
    .delete()
    .eq("tag_id", id);

  if (linkErr) throw new Error(linkErr.message);

  // 2. Delete tag row
  const { error: tagErr } = await supabase
    .from("tags")
    .delete()
    .eq("id", id);

  if (tagErr) throw new Error(tagErr.message);

  revalidatePath("/admin/tags");
  revalidatePath("/admin/plants");
  revalidatePath("/");
}

/**
 * Reorders tags display_order.
 */
export async function reorderTagsAction(
  items: { id: string; display_order: number }[]
): Promise<void> {
  const supabase = await createClient();

  for (const item of items) {
    await supabase
      .from("tags")
      .update({ display_order: item.display_order })
      .eq("id", item.id);
  }

  revalidatePath("/admin/tags");
  revalidatePath("/admin/plants");
  revalidatePath("/");
}
