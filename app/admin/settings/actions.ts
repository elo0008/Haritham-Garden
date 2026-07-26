"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface SettingsUpdate {
  logo_url: string | null;
  business_name: string;
  tagline: string;
  whatsapp_number: string;
  location_text: string | null;
  service_area_text: string | null;
  instagram_url: string | null;
  contact_phone: string | null;
  secondary_social_label: string | null;
  secondary_social_url: string | null;
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
      location_text: data.location_text?.trim() || null,
      service_area_text: data.service_area_text?.trim() || null,
      instagram_url: data.instagram_url?.trim() || null,
      contact_phone: data.contact_phone?.trim() || null,
      secondary_social_label: data.secondary_social_label?.trim() || null,
      secondary_social_url: data.secondary_social_url?.trim() || null,
    })
    .eq("id", existing.id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
  revalidatePath("/");
}
