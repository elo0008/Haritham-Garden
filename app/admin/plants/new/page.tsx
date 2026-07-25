import { createClient } from "@/lib/supabase/server";
import { PlantForm } from "../_components/PlantForm";
import type { Tag } from "@/lib/types";

export const metadata = { title: "Add Plant — Haritham Garden Admin" };

export default async function NewPlantPage() {
  const supabase = await createClient();

  // Fetch all tags for the tag picker
  const { data: allTags } = await supabase
    .from("tags")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-[#24211E] mb-6">Add Plant</h1>
      <PlantForm allTags={(allTags as Tag[]) ?? []} />
    </div>
  );
}
