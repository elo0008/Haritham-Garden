import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PlantCatalog } from "@/components/PlantCatalog";
import type {
  Plant,
  Tag,
  HeroBanner,
  SiteSettings,
  CarouselSectionSettings,
  CarouselSlide,
} from "@/lib/types";

interface PageProps {
  searchParams?: Promise<{ plant?: string; sort?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const supabase = await createClient();

  // Fetch all plants
  const { data: plants, error: plantsError } = await supabase
    .from("plants")
    .select("*")
    .order("created_at", { ascending: false });

  if (plantsError) {
    console.error("Error fetching plants:", plantsError.message);
  }

  // Fetch all tags (ordered by position for chip rendering)
  const { data: tags, error: tagsError } = await supabase
    .from("tags")
    .select("*")
    .order("position", { ascending: true, nullsFirst: false })
    .order("display_order", { ascending: true });

  if (tagsError) {
    console.error("Error fetching tags:", tagsError.message);
  }

  // Fetch all plant_tags links in one go
  const { data: plantTags, error: ptError } = await supabase
    .from("plant_tags")
    .select("plant_id, tag_id");

  if (ptError) {
    console.error("Error fetching plant_tags:", ptError.message);
  }

  // Build a map of plant_id → tag objects for client-side filtering
  const tagMap = new Map<string, Tag>();
  for (const tag of (tags ?? []) as Tag[]) {
    tagMap.set(tag.id, tag);
  }

  // Calculate popularity scores for plants across 3 time windows (30d, 90d, all-time) in a single query
  const now = Date.now();
  const cutoff30d = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const cutoff90d = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString();

  const popMap30d = new Map<string, number>();
  const popMap90d = new Map<string, number>();
  const popMapAll = new Map<string, number>();

  try {
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("items, created_at")
      .or("deleted.is.null,deleted.eq.false");

    if (ordersError) {
      console.error("Error fetching orders for popularity scores:", ordersError.message);
    } else if (ordersData) {
      for (const order of ordersData) {
        const createdAt = order.created_at || "";
        const isWithin30d = createdAt >= cutoff30d;
        const isWithin90d = createdAt >= cutoff90d;
        const items = (order.items || []) as Array<{ plant_id?: string; name?: string; qty?: number }>;

        for (const item of items) {
          const qty = Number(item.qty) || 0;
          if (qty <= 0) continue;

          const plantId = item.plant_id || "";
          if (plantId) {
            popMapAll.set(plantId, (popMapAll.get(plantId) || 0) + qty);
            if (isWithin90d) popMap90d.set(plantId, (popMap90d.get(plantId) || 0) + qty);
            if (isWithin30d) popMap30d.set(plantId, (popMap30d.get(plantId) || 0) + qty);
          }
        }
      }
    }
  } catch (err) {
    console.error("Unexpected error calculating popularity scores:", err);
  }

  // Attach tags and popularity scores to each plant
  const plantsWithData: Plant[] = ((plants as Plant[]) ?? []).map((plant) => {
    const plantTagLinks = (plantTags ?? []).filter(
      (pt: { plant_id: string; tag_id: string }) => pt.plant_id === plant.id
    );
    const attachedTags = plantTagLinks
      .map((pt: { plant_id: string; tag_id: string }) => tagMap.get(pt.tag_id))
      .filter(Boolean) as Tag[];
    return {
      ...plant,
      tags: attachedTags,
      popularity_30d: popMap30d.get(plant.id) || 0,
      popularity_90d: popMap90d.get(plant.id) || 0,
      popularity_all: popMapAll.get(plant.id) || 0,
    };
  });

  // Fetch hero banner safely (singleton)
  let heroBanner: HeroBanner | undefined = undefined;
  try {
    const { data } = await supabase
      .from("hero_banner")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (data) {
      heroBanner = data as HeroBanner;
    }
  } catch (err) {
    console.error("Hero banner fetch notice:", err);
  }

  // Fetch site settings safely (singleton)
  let siteSettings: SiteSettings | undefined = undefined;
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (data) {
      siteSettings = data as SiteSettings;
    }
  } catch (err) {
    console.error("Site settings fetch notice:", err);
  }

  // Fetch carousel section settings & active slides safely
  let carouselSettings: CarouselSectionSettings | undefined = undefined;
  let carouselSlides: CarouselSlide[] = [];
  try {
    const { data: cSettings } = await supabase
      .from("carousel_section_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (cSettings) {
      carouselSettings = cSettings as CarouselSectionSettings;
    }

    if (carouselSettings?.enabled) {
      const { data: cSlides } = await supabase
        .from("carousel_slides")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true });

      if (cSlides) {
        carouselSlides = cSlides as CarouselSlide[];
      }
    }
  } catch (err) {
    console.error("Carousel fetch notice:", err);
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5]" />}>
      <PlantCatalog
        plants={plantsWithData}
        tags={(tags as Tag[]) ?? []}
        initialPlantSlug={resolvedParams.plant}
        initialSort={resolvedParams.sort}
        heroBanner={heroBanner}
        siteSettings={siteSettings}
        carouselSettings={carouselSettings}
        carouselSlides={carouselSlides}
      />
    </Suspense>
  );
}
