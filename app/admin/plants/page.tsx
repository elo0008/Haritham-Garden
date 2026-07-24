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
      <p className="text-sm text-red-600">
        Failed to load plants: {error.message}
      </p>
    );
  }

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Plants</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {plants.length} plant{plants.length !== 1 ? "s" : ""} in catalogue
          </p>
        </div>
        <Link
          href="/admin/plants/new"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2
                     rounded-lg text-sm font-medium transition-colors"
        >
          + Add Plant
        </Link>
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {plants.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🌱</p>
          <p className="text-sm">No plants yet. Add your first one!</p>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────── */}
      {plants.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-14">
                  Photo
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Category
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Price
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Availability
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(plants as Plant[]).map((plant) => (
                <tr key={plant.id} className="hover:bg-gray-50/50">
                  {/* Thumbnail */}
                  <td className="px-4 py-3">
                    {plant.photos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={plant.photos[0]}
                        alt={plant.name}
                        className="w-10 h-10 object-cover rounded-lg border border-gray-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                        🌿
                      </div>
                    )}
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{plant.name}</div>
                    {plant.local_name && (
                      <div className="text-xs text-gray-400">{plant.local_name}</div>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 text-gray-600">
                    {CATEGORY_LABEL[plant.category] ?? plant.category}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3 text-gray-700 font-medium">
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
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
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
      )}
    </div>
  );
}
