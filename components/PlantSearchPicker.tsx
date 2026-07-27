"use client";

import { useState } from "react";
import type { Plant } from "@/lib/types";
import { getEffectivePrice } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Search, Plus } from "lucide-react";

export interface PlantSearchPickerProps {
  plants: Plant[];
  onSelectPlant: (plant: Plant) => void;
  placeholder?: string;
  collapsible?: boolean;
  triggerLabel?: string;
  className?: string;
}

export function PlantSearchPicker({
  plants,
  onSelectPlant,
  placeholder = "Search plant catalogue by name…",
  collapsible = false,
  triggerLabel = "+ Add Item from Catalogue",
  className = "",
}: PlantSearchPickerProps) {
  const [isOpen, setIsOpen] = useState(!collapsible);
  const [query, setQuery] = useState("");

  const filteredPlants = (plants || []).filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase().trim())
  );

  const handleSelect = (plant: Plant) => {
    if (plant.availability === "unavailable") return;
    onSelectPlant(plant);
    setQuery("");
    if (collapsible) {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {collapsible && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[11px] font-bold text-terracotta hover:underline flex items-center gap-1 my-1"
        >
          <Plus className="w-3.5 h-3.5" />
          {triggerLabel}
        </button>
      )}

      {isOpen && (
        <div
          className={`space-y-2 ${
            collapsible
              ? "mt-2 p-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl z-30"
              : ""
          }`}
        >
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-terracotta"
              autoFocus={collapsible}
            />
          </div>

          {(query.trim().length > 0 || collapsible) && (
            <div className="max-h-56 overflow-y-auto rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-1.5 space-y-1">
              {filteredPlants.length === 0 ? (
                <div className="p-3 text-xs text-stone-400 italic text-center">
                  No matching plants found in catalogue
                </div>
              ) : (
                filteredPlants.map((plant) => {
                  const isUnavailable = plant.availability === "unavailable";
                  const hasSalePrice =
                    plant.sale_price !== null &&
                    plant.sale_price !== undefined &&
                    plant.sale_price < plant.price;
                  const effectivePrice = getEffectivePrice(plant);

                  return (
                    <button
                      key={plant.id}
                      type="button"
                      onClick={() => handleSelect(plant)}
                      disabled={isUnavailable}
                      className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        isUnavailable
                          ? "opacity-50 cursor-not-allowed bg-stone-50 dark:bg-stone-800/40"
                          : "hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {plant.photos && plant.photos[0] ? (
                          <img
                            src={plant.photos[0]}
                            alt={plant.name}
                            className="w-9 h-9 object-cover rounded-lg border border-stone-200 dark:border-stone-700 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-sm shrink-0">
                            🌿
                          </div>
                        )}
                        <div className="truncate">
                          <span className="font-bold text-stone-900 dark:text-stone-100 block truncate">
                            {plant.name}
                          </span>
                          {hasSalePrice ? (
                            <span className="text-[11px] block font-mono">
                              <span className="line-through text-stone-400 mr-1">
                                {formatINR(plant.price)}
                              </span>
                              <span className="text-terracotta font-bold">
                                {formatINR(effectivePrice)}
                              </span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-stone-400 block font-mono">
                              {formatINR(plant.price)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isUnavailable ? (
                          <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            + Add
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
