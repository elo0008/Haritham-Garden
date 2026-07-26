import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { UnifiedAdminConsole } from "./_components/UnifiedAdminConsole";
import type {
  Plant,
  Tag,
  Order,
  HeroBanner,
  CarouselSectionSettings,
  CarouselSlide,
  SiteSettings,
} from "@/lib/types";

export const metadata = { title: "Unified Admin Console — Haritham Garden" };

export default async function AdminPage() {
  const supabase = await createClient();

  // Get current auth user email
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch site settings
  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select("*")
    .limit(1)
    .single();

  // Fetch all non-deleted plants
  const { data: plants } = await supabase
    .from("plants")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch tags and plant tags mapping
  const { data: allTags } = await supabase
    .from("tags")
    .select("*")
    .order("display_order", { ascending: true });

  const { data: plantTags } = await supabase
    .from("plant_tags")
    .select("plant_id, tag_id");

  const tagMap = new Map<string, Tag>();
  for (const tag of (allTags ?? []) as Tag[]) {
    tagMap.set(tag.id, tag);
  }

  const plantTagsMap: Record<string, Tag[]> = {};
  for (const pt of (plantTags ?? []) as { plant_id: string; tag_id: string }[]) {
    const tag = tagMap.get(pt.tag_id);
    if (tag) {
      if (!plantTagsMap[pt.plant_id]) {
        plantTagsMap[pt.plant_id] = [];
      }
      plantTagsMap[pt.plant_id].push(tag);
    }
  }

  // Fetch non-deleted orders
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("deleted", false)
    .order("created_at", { ascending: false });

  // Fetch Hero Banner settings
  const { data: heroBanner } = await supabase
    .from("hero_banner")
    .select("*")
    .limit(1)
    .single();

  // Fetch Carousel Section settings & slides
  const { data: carouselSettings } = await supabase
    .from("carousel_section_settings")
    .select("*")
    .limit(1)
    .single();

  const { data: carouselSlides } = await supabase
    .from("carousel_slides")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 text-stone-500 text-sm font-medium">
          Loading Unified Admin Console...
        </div>
      }
    >
      <UnifiedAdminConsole
        siteSettings={(siteSettings as SiteSettings) ?? null}
        plants={(plants as Plant[]) ?? []}
        plantTagsMap={plantTagsMap}
        allTags={(allTags as Tag[]) ?? []}
        orders={(orders as Order[]) ?? []}
        heroBanner={(heroBanner as HeroBanner) ?? null}
        carouselSettings={(carouselSettings as CarouselSectionSettings) ?? null}
        carouselSlides={(carouselSlides as CarouselSlide[]) ?? []}
        userEmail={user?.email}
      />
    </Suspense>
  );
}
