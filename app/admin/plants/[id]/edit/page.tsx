import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlantForm } from "../../_components/PlantForm";
import type { Plant } from "@/lib/types";

export const metadata = { title: "Edit Plant — Haritham Garden Admin" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPlantPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: plant, error } = await supabase
    .from("plants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !plant) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Edit Plant</h1>
      <p className="text-sm text-gray-400 mb-6">{plant.name}</p>
      <PlantForm initialData={plant as Plant} />
    </div>
  );
}
