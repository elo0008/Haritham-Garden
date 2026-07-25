import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlantForm } from "../../_components/PlantForm";
import type { Plant, Tag } from "@/lib/types";

export const metadata = { title: "Edit Plant — Haritham Garden Admin" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPlantPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch plant data
  const { data: plant, error } = await supabase
    .from("plants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !plant) notFound();

  // Fetch all tags for the picker
  const { data: allTags } = await supabase
    .from("tags")
    .select("*")
    .order("display_order", { ascending: true });

  // Fetch this plant's current tag links
  const { data: plantTagLinks } = await supabase
    .from("plant_tags")
    .select("tag_id")
    .eq("plant_id", id);

  const initialTagIds = (plantTagLinks ?? []).map(
    (pt: { tag_id: string }) => pt.tag_id
  );

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-[#24211E] mb-1">Edit Plant</h1>
      <p className="text-sm text-stone-400 mb-6">{plant.name}</p>
      <PlantForm
        initialData={plant as Plant}
        allTags={(allTags as Tag[]) ?? []}
        initialTagIds={initialTagIds}
      />
    </div>
  );
}
