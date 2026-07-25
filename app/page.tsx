import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PlantCatalog } from "@/components/PlantCatalog";
import type { Plant, Tag, HeroBanner, SiteSettings } from "@/lib/types";

interface PageProps {
  searchParams?: Promise<{ plant?: string }>;
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

  // Fetch all tags (ordered by display_order for chip rendering)
  const { data: tags, error: tagsError } = await supabase
    .from("tags")
    .select("*")
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

  // Attach tags to each plant
  const plantsWithTags: Plant[] = ((plants as Plant[]) ?? []).map((plant) => {
    const plantTagLinks = (plantTags ?? []).filter(
      (pt: { plant_id: string; tag_id: string }) => pt.plant_id === plant.id
    );
    const attachedTags = plantTagLinks
      .map((pt: { plant_id: string; tag_id: string }) => tagMap.get(pt.tag_id))
      .filter(Boolean) as Tag[];
    return { ...plant, tags: attachedTags };
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

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5]" />}>
      <PlantCatalog
        plants={plantsWithTags}
        tags={(tags as Tag[]) ?? []}
        initialPlantSlug={resolvedParams.plant}
        heroBanner={heroBanner}
        siteSettings={siteSettings}
      />
    </Suspense>
  );
}
