import { createClient } from "@/lib/supabase/server";
import { PlantCatalog } from "@/components/PlantCatalog";
import type { Plant } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: plants, error } = await supabase
    .from("plants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching plants:", error.message);
  }

  return <PlantCatalog plants={(plants as Plant[]) || []} />;
}
