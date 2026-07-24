"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { Plant, PlantCategory } from "@/lib/types";
import { PlantCard } from "./PlantCard";
import { PlantBottomSheet } from "./PlantBottomSheet";

interface PlantCatalogProps {
  plants: Plant[];
  initialPlantSlug?: string;
}

const CATEGORY_CHIPS: { label: string; value: PlantCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Indoor", value: "indoor" },
  { label: "Outdoor", value: "outdoor" },
  { label: "Flowering", value: "flowering" },
  { label: "Fruit", value: "fruit" },
  { label: "Other", value: "other" },
];

export function PlantCatalog({ plants, initialPlantSlug }: PlantCatalogProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [selectedCategory, setSelectedCategory] = useState<PlantCategory | "all">("all");
  const [activePlant, setActivePlant] = useState<Plant | null>(null);

  // Sync active plant from URL search params or initial prop
  useEffect(() => {
    const slugParam = searchParams.get("plant") || initialPlantSlug;
    if (slugParam) {
      const match = plants.find((p) => p.slug === slugParam || p.id === slugParam);
      if (match) {
        setActivePlant(match);
      }
    } else {
      setActivePlant(null);
    }
  }, [searchParams, initialPlantSlug, plants]);

  const filteredPlants = selectedCategory === "all"
    ? plants
    : plants.filter((plant) => plant.category === selectedCategory);

  const handleOpenPlant = (plant: Plant) => {
    setActivePlant(plant);
    // Update URL with ?plant=slug without full page reload
    const params = new URLSearchParams(searchParams.toString());
    params.set("plant", plant.slug);
    window.history.pushState(null, "", `${pathname}?${params.toString()}`);
  };

  const handleClosePlant = () => {
    setActivePlant(null);
    // Remove plant query parameter from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete("plant");
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    window.history.pushState(null, "", newUrl);
  };

  const handleAddToCart = (plant: Plant, qty: number) => {
    console.log(`Add to cart: ${qty} x ${plant.name} (₹${plant.price * qty})`);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#24211E]">
      {/* Sticky Top Bar / Header */}
      <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-[#FAF8F5]/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Wordmark & Tagline */}
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#24211E] sm:text-2xl">
                Haritham Garden
              </h1>
              <p className="text-xs text-stone-500 sm:text-sm">
                Fresh plants & greens for your home
              </p>
            </div>

            {/* Cart Icon Placeholder */}
            <div className="relative">
              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-stone-200/50 text-stone-700 hover:bg-stone-200 transition-colors"
                aria-label="Shopping Cart"
              >
                <svg
                  className="h-5 w-5 fill-none stroke-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                {/* Cart Badge Placeholder */}
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#C1662F] text-[11px] font-bold text-white shadow-xs">
                  0
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="border-t border-stone-200/40">
          <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8">
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
              {CATEGORY_CHIPS.map((chip) => {
                const isActive = selectedCategory === chip.value;
                return (
                  <button
                    key={chip.value}
                    onClick={() => setSelectedCategory(chip.value)}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all sm:text-sm ${
                      isActive
                        ? "bg-[#C1662F] text-white shadow-xs"
                        : "bg-stone-200/60 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {filteredPlants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-stone-200/50 text-2xl">
              🌱
            </div>
            <h2 className="text-lg font-semibold text-stone-800">
              No plants found
            </h2>
            <p className="mt-1 text-xs text-stone-500 max-w-xs">
              No plants available under the &quot;{selectedCategory}&quot; category at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-x-6 sm:gap-y-8">
            {filteredPlants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onSelect={handleOpenPlant}
              />
            ))}
          </div>
        )}
      </main>

      {/* Bottom Sheet Quick-View */}
      <PlantBottomSheet
        plant={activePlant}
        onClose={handleClosePlant}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
