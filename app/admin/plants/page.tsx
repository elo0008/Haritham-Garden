import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AvailabilitySelect } from "./_components/AvailabilitySelect";
import { DeleteButton } from "./_components/DeleteButton";
import type { Plant } from "@/lib/types";

export const metadata = { title: "Plants — Haritham Garden Admin" };

const CATEGORY_LABEL: Record<string, string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  flowering: "Flowering",
  fruit: "Fruit",
  other: "Other",
};

export default async function AdminPlantsPage() {
  const supabase = await createClient();
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
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Price</th>
                  <th className="px-4 py-3.5">Availability</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {(plants as Plant[]).map((plant) => (
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

                    {/* Category */}
                    <td className="px-4 py-3 text-stone-600 text-xs capitalize">
                      {CATEGORY_LABEL[plant.category] ?? plant.category}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
