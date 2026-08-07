"use client";

import { useState } from "react";
import type { Plant, Tag } from "@/lib/types";
import { getEffectivePrice, getPhotoUrl, getPhotoFocalPoint } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { AvailabilitySelect } from "./AvailabilitySelect";
import { DeleteButton } from "./DeleteButton";
import { PlantModal } from "./PlantModal";
import { Plus, Pencil, Sprout, Tag as TagIcon, X } from "lucide-react";

interface AdminPlantsGridProps {
  plants: Plant[];
  plantTagsMap: Record<string, Tag[]>;
  allTags: Tag[];
}

export function AdminPlantsGrid({
  plants,
  plantTagsMap,
  allTags,
}: AdminPlantsGridProps) {
  // Filter state (Multi-select tag IDs for AND-logic filtering)
  const [selectedFilterTagIds, setSelectedFilterTagIds] = useState<string[]>([]);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<{
    plant: Plant;
    tagIds: string[];
  } | null>(null);

  // Toggle filter tag
  const toggleFilterTag = (tagId: string) => {
    setSelectedFilterTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const clearTagFilters = () => {
    setSelectedFilterTagIds([]);
  };

  // AND-logic Filtering: plant must possess EVERY selected tag ID
  const filteredPlants = plants.filter((plant) => {
    if (selectedFilterTagIds.length === 0) return true;
    const plantTags = plantTagsMap[plant.id] ?? [];
    const plantTagIds = plantTags.map((t) => t.id);
    return selectedFilterTagIds.every((tagId) => plantTagIds.includes(tagId));
  });

  return (
    <div className="space-y-6">
      {/* ── 1. Top Controls Bar & Multi-Select Tag Filter (AND-Logic) ──────── */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-stone-900 dark:text-stone-100 tracking-tight">
              Plants Catalogue
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Showing {filteredPlants.length} of {plants.length} plant
              {plants.length !== 1 ? "s" : ""}
              {selectedFilterTagIds.length > 0 && " (AND-filtered by tags)"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-terracotta hover:bg-[#b04a25] text-white px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 shrink-0 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Plant</span>
          </button>
        </div>

        {/* Multi-Select Tag Chips (AND Filter) */}
        {allTags.length > 0 && (
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-stone-400 dark:text-stone-500 flex items-center gap-1 shrink-0">
              <TagIcon className="w-3.5 h-3.5" /> Filter by Tags:
            </span>

            {allTags.map((tag) => {
              const isSelected = selectedFilterTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleFilterTag(tag.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs ${
                    isSelected
                      ? "bg-botanical-800 dark:bg-botanical-600 text-white shadow-xs"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
                  }`}
                >
                  <span>{tag.name}</span>
                  {isSelected && <X className="w-3 h-3" />}
                </button>
              );
            })}

            {selectedFilterTagIds.length > 0 && (
              <button
                type="button"
                onClick={clearTagFilters}
                className="text-xs font-bold text-terracotta hover:underline ml-2"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 2. Plant Cards Responsive Grid ─────────────────────────────────── */}
      {filteredPlants.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 p-12 text-center text-stone-400 bg-white dark:bg-stone-900">
          <Sprout className="w-10 h-10 mx-auto mb-2 text-stone-300 dark:text-stone-600" />
          <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            No plants match tag filter
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
            {selectedFilterTagIds.length > 0
              ? "Try clearing tag filters or selecting different tag combinations."
              : "Click '+ Add Plant' to list your first plant in the catalogue."}
          </p>
          {selectedFilterTagIds.length > 0 && (
            <button
              type="button"
              onClick={clearTagFilters}
              className="mt-4 px-4 py-2 bg-stone-100 dark:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 rounded-xl hover:bg-stone-200"
            >
              Clear All Tag Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlants.map((plant) => {
            const tags = plantTagsMap[plant.id] ?? [];
            const tagIds = tags.map((t) => t.id);
            const photoUrl = getPhotoUrl(plant.photos[0]);
            const photoFocalPoint = getPhotoFocalPoint(plant.photos[0]);
            const hasSalePrice =
              plant.sale_price !== null &&
              plant.sale_price !== undefined &&
              plant.sale_price < plant.price;
            const effectivePrice = getEffectivePrice(plant);

            return (
              <div
                key={plant.id}
                className="group bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-2xs hover:shadow-xl dark:hover:shadow-stone-950/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative z-1 hover:z-30 focus-within:z-30"
              >
                <div>
                  {/* Photo Container */}
                  <div className="relative aspect-4/3 w-full bg-stone-100 dark:bg-stone-800 rounded-t-3xl overflow-hidden">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={plant.name}
                        style={{ objectPosition: `${photoFocalPoint.x}% ${photoFocalPoint.y}%` }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🌿
                      </div>
                    )}

                    {/* Overlaid Top-Left: First Tag Pill Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      {tags.length > 0 ? (
                        <span className="bg-stone-900/80 text-white backdrop-blur-md text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-2xs">
                          {tags[0].name}
                        </span>
                      ) : (
                        <span className="bg-stone-900/60 text-white backdrop-blur-md text-[10px] font-medium px-2 py-0.5 rounded-md">
                          No Tags
                        </span>
                      )}
                    </div>

                    {/* Overlaid Top-Right: Badges (SALE + Availability) */}
                    <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1">
                      {hasSalePrice && (
                        <span className="bg-terracotta text-white backdrop-blur-md text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                          SALE
                        </span>
                      )}
                      {plant.availability === "available" && (
                        <span className="bg-emerald-600/90 text-white backdrop-blur-md text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                          IN STOCK
                        </span>
                      )}
                      {plant.availability === "limited" && (
                        <span className="bg-amber-600/90 text-white backdrop-blur-md text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                          LIMITED
                        </span>
                      )}
                      {plant.availability === "unavailable" && (
                        <span className="bg-rose-600/90 text-white backdrop-blur-md text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                          OUT OF STOCK
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Info Content */}
                  <div className="p-5 pb-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-heading font-bold text-base text-stone-900 dark:text-stone-100 truncate">
                        {plant.name}
                      </h3>
                      {hasSalePrice ? (
                        <div className="flex items-baseline gap-1.5 shrink-0">
                          <span className="text-stone-400 dark:text-stone-500 line-through text-xs font-semibold">
                            {formatINR(plant.price)}
                          </span>
                          <span className="font-heading font-bold text-base text-terracotta dark:text-terracotta">
                            {formatINR(effectivePrice)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-heading font-bold text-base text-stone-900 dark:text-stone-100 shrink-0">
                          {formatINR(plant.price)}
                        </span>
                      )}
                    </div>

                    {plant.local_name && (
                      <p className="text-xs text-stone-400 font-normal italic truncate">
                        {plant.local_name}
                      </p>
                    )}

                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 line-clamp-1">
                      {plant.description || "Nursery plant listed in catalogue."}
                    </p>
                  </div>
                </div>

                {/* Card Quick Actions Bar */}
                <div className="p-4 pt-3 bg-stone-50/70 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                  {/* Inline Availability Dropdown Select */}
                  <AvailabilitySelect
                    plantId={plant.id}
                    current={plant.availability}
                  />

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPlant({ plant, tagIds })}
                      className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:text-terracotta hover:border-terracotta transition-colors text-xs font-semibold flex items-center gap-1 min-h-[36px]"
                      title="Edit plant"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <DeleteButton
                      plantId={plant.id}
                      plantName={plant.name}
                      photoUrls={plant.photos}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 3. Centered Modals for Add & Edit Plant Forms ──────────────────── */}
      <PlantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        allTags={allTags}
      />

      {editingPlant && (
        <PlantModal
          isOpen={true}
          onClose={() => setEditingPlant(null)}
          initialData={editingPlant.plant}
          allTags={allTags}
          initialTagIds={editingPlant.tagIds}
        />
      )}
    </div>
  );
}
