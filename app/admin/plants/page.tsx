import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AvailabilitySelect } from "./_components/AvailabilitySelect";
import { DeleteButton } from "./_components/DeleteButton";
import type { Plant, Tag } from "@/lib/types";

export const metadata = { title: "Plants — Haritham Garden Admin" };

export default async function AdminPlantsPage() {
  const supabase = await createClient();

  // Fetch all plants
  const { data: plants, error } = await supabase
    .from("plants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
        Failed to load plants: {error.message}
      </div>
    );
  }

  // Fetch all tags and plant_tags for display
  const { data: allTags } = await supabase
    .from("tags")
    .select("*")
    .order("display_order", { ascending: true });

  const { data: plantTags } = await supabase
    .from("plant_tags")
    .select("plant_id, tag_id");

  // Build tag lookup
  const tagMap = new Map<string, Tag>();
  for (const tag of (allTags ?? []) as Tag[]) {
    tagMap.set(tag.id, tag);
  }

  // Build plant_id → Tag[] mapping
  const plantTagsMap = new Map<string, Tag[]>();
  for (const pt of (plantTags ?? []) as { plant_id: string; tag_id: string }[]) {
    const tag = tagMap.get(pt.tag_id);
    if (tag) {
      const existing = plantTagsMap.get(pt.plant_id) ?? [];
      existing.push(tag);
      plantTagsMap.set(pt.plant_id, existing);
    }
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="text-xs text-stone-500 hover:text-stone-900 transition-colors"
            >
              ← Admin
            </Link>
          </div>
          <h1 className="text-xl font-bold text-[#24211E] mt-1">Plants Catalogue</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {plants.length} plant{plants.length !== 1 ? "s" : ""} in catalogue
          </p>
        </div>
        <Link
          href="/admin/plants/new"
          className="bg-[#C1662F] hover:bg-[#A85524] active:bg-[#92481e] text-white px-4 py-2.5
                     rounded-xl text-xs font-semibold shadow-xs min-h-[44px] flex items-center transition-colors"
        >
          + Add Plant
        </Link>
      </div>

      {/* Empty state */}
      {plants.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300/80 p-12 text-center text-stone-400 bg-white">
          <div className="text-3xl mb-2">🌱</div>
          <p className="text-sm font-medium text-stone-700">No plants yet</p>
          <p className="text-xs text-stone-400 mt-1">Add your first plant to display it on the website.</p>
        </div>
      )}

      {/* Table */}
      {plants.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-stone-100/70 border-b border-stone-200/80 text-xs font-semibold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-4 py-3.5 w-16">Photo</th>
                  <th className="px-4 py-3.5">Name</th>
                  <th className="px-4 py-3.5">Tags</th>
                  <th className="px-4 py-3.5">Price</th>
                  <th className="px-4 py-3.5">Availability</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {(plants as Plant[]).map((plant) => {
                  const tags = plantTagsMap.get(plant.id) ?? [];
                  return (
                    <tr key={plant.id} className="hover:bg-stone-50/60 transition-colors">
                      {/* Thumbnail */}
                      <td className="px-4 py-3">
                        {plant.photos[0] ? (
                          <img
                            src={plant.photos[0]}
                            alt={plant.name}
                            className="w-10 h-10 object-cover rounded-xl border border-stone-200/80"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-lg">
                            🌿
                          </div>
                        )}
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#24211E]">{plant.name}</div>
                        {plant.local_name && (
                          <div className="text-xs text-stone-400">{plant.local_name}</div>
                        )}
                      </td>

                      {/* Tags */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {tags.length > 0 ? (
                            tags.map((tag) => (
                              <span
                                key={tag.id}
                                className="inline-block rounded-lg bg-stone-100 border border-stone-200/80 px-2 py-0.5 text-[11px] font-semibold text-stone-600"
                              >
                                {tag.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-stone-400 italic">No tags</span>
                          )}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 text-[#24211E] font-semibold">
                        ₹{plant.price.toLocaleString("en-IN")}
                      </td>

                      {/* Availability — inline editable */}
                      <td className="px-4 py-3">
                        <AvailabilitySelect
                          plantId={plant.id}
                          current={plant.availability}
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/admin/plants/${plant.id}/edit`}
                            className="min-h-[44px] flex items-center text-xs font-semibold text-stone-700 hover:text-[#C1662F] transition-colors"
                          >
                            Edit
                          </Link>
                          <DeleteButton
                            plantId={plant.id}
                            plantName={plant.name}
                            photoUrls={plant.photos}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
