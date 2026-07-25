"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface HeroBannerUpdate {
  tag_label: string | null;
  title: string | null;
  description: string | null;
  background_image: string | null;
  active: boolean;
}

export async function updateHeroBanner(data: HeroBannerUpdate): Promise<void> {
  const supabase = await createClient();

  // Get the singleton row ID
  const { data: existing, error: fetchError } = await supabase
    .from("hero_banner")
    .select("id")
    .limit(1)
    .single();

  if (fetchError || !existing) {
    throw new Error("Hero banner row not found. Run the migration first.");
  }

  const { error } = await supabase
    .from("hero_banner")
    .update(data)
    .eq("id", existing.id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/hero-banner");
  revalidatePath("/");
}
