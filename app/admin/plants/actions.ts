"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { PlantAvailability, PlantWriteData } from "@/lib/types";

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

// ── Actions ───────────────────────────────────────────────────────────────────

export async function createPlant(data: PlantWriteData): Promise<void> {
  const supabase = await createClient();
  const slug = await generateUniqueSlug(supabase, data.name);

  const { error } = await supabase.from("plants").insert({ ...data, slug });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/plants");
}

export async function updatePlant(
  id: string,
  data: PlantWriteData,
  photosToDelete: string[] = []
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

  revalidatePath("/admin/plants");
}

export async function deletePlant(
  id: string,
  photoUrls: string[]
): Promise<void> {
  const supabase = await createClient();

  // Delete associated photos from storage first
  if (photoUrls.length > 0) {
    const paths = photoUrls.map(extractStoragePath);
    await supabase.storage.from("plant-photos").remove(paths);
  }

  const { error } = await supabase.from("plants").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/plants");
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
