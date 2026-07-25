"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface SettingsUpdate {
  enabled: boolean;
  header_tag: string | null;
  header_title: string | null;
  header_subtitle: string | null;
}

export async function updateCarouselSectionSettings(
  data: SettingsUpdate
): Promise<void> {
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("carousel_section_settings")
    .select("id")
    .limit(1)
    .single();

  if (fetchError || !existing) {
    throw new Error("Carousel section settings row not found. Please run the migration first.");
  }

  const { error } = await supabase
    .from("carousel_section_settings")
    .update({
      enabled: data.enabled,
      header_tag: data.header_tag?.trim() || null,
      header_title: data.header_title?.trim() || null,
      header_subtitle: data.header_subtitle?.trim() || null,
    })
    .eq("id", existing.id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/carousel-section");
  revalidatePath("/");
}

interface SlideWriteData {
  tag_label: string | null;
  title: string;
  description: string;
  background_image: string | null;
  active: boolean;
}

export async function createCarouselSlide(
  data: SlideWriteData
): Promise<void> {
  const supabase = await createClient();

  // Get max display_order
  const { data: maxRow } = await supabase
    .from("carousel_slides")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxRow?.display_order ?? 0) + 1;

  const { error } = await supabase.from("carousel_slides").insert({
    tag_label: data.tag_label?.trim() || null,
    title: data.title.trim(),
    description: data.description.trim(),
    background_image: data.background_image?.trim() || null,
    active: data.active,
    display_order: nextOrder,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/carousel-section");
  revalidatePath("/");
}

export async function updateCarouselSlide(
  id: string,
  data: SlideWriteData
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("carousel_slides")
    .update({
      tag_label: data.tag_label?.trim() || null,
      title: data.title.trim(),
      description: data.description.trim(),
      background_image: data.background_image?.trim() || null,
      active: data.active,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/carousel-section");
  revalidatePath("/");
}

export async function deleteCarouselSlide(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("carousel_slides")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/carousel-section");
  revalidatePath("/");
}

export async function reorderCarouselSlides(
  items: { id: string; display_order: number }[]
): Promise<void> {
  const supabase = await createClient();

  for (const item of items) {
    const { error } = await supabase
      .from("carousel_slides")
      .update({ display_order: item.display_order })
      .eq("id", item.id);

    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/carousel-section");
  revalidatePath("/");
}
