"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface SettingsUpdate {
  logo_url: string | null;
  business_name: string;
  tagline: string;
  whatsapp_number: string;
}

export async function updateSiteSettings(data: SettingsUpdate): Promise<void> {
  const supabase = await createClient();

  // Get the singleton row ID
  const { data: existing, error: fetchError } = await supabase
    .from("site_settings")
    .select("id")
    .limit(1)
    .single();

  if (fetchError || !existing) {
    throw new Error("Site settings row not found. Please run the migration first.");
  }

  // Clean WhatsApp number format (digits only)
  const cleanPhone = data.whatsapp_number.replace(/[^0-9]/g, "");
  if (!cleanPhone) {
    throw new Error("A valid WhatsApp number is required (e.g. 919876543210).");
  }

  const { error } = await supabase
    .from("site_settings")
    .update({
      logo_url: data.logo_url,
      business_name: data.business_name.trim() || "Haritham Garden",
      tagline: data.tagline.trim() || "Fresh plants & greens for your home",
      whatsapp_number: cleanPhone,
    })
    .eq("id", existing.id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
  revalidatePath("/");
}
