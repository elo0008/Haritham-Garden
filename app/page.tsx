import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PlantCatalog } from "@/components/PlantCatalog";
import type { Plant } from "@/lib/types";

interface PageProps {
  searchParams?: Promise<{ plant?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const supabase = await createClient();
  const { data: plants, error } = await supabase
    .from("plants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching plants:", error.message);
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5]" />}>
      <PlantCatalog
        plants={(plants as Plant[]) || []}
        initialPlantSlug={resolvedParams.plant}
      />
    </Suspense>
  );
}
