"use client";

import { useState, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import type { Plant, PlantCategory } from "@/lib/types";
import { Logo } from "./Logo";
import { PlantCard } from "./PlantCard";
import { PlantBottomSheet } from "./PlantBottomSheet";
import { CartDrawer } from "./CartDrawer";
import { useCart } from "@/context/CartContext";

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
  const pathname = usePathname();

  const { totalItems, openCart, addItem } = useCart();

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
    const params = new URLSearchParams(searchParams.toString());
    params.set("plant", plant.slug);
    window.history.pushState(null, "", `${pathname}?${params.toString()}`);
  };

  const handleClosePlant = () => {
    setActivePlant(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("plant");
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    window.history.pushState(null, "", newUrl);
  };

  const handleAddToCart = (plant: Plant, qty: number) => {
    addItem(plant, qty);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#24211E]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 border-b border-stone-200/60 bg-[#FAF8F5]/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Logo Component */}
            <Logo showTagline={true} />

            {/* Cart Icon Button (Min 44px tap target) */}
            <div className="relative">
              <button
                type="button"
                onClick={openCart}
                className="relative flex h-11 w-11 items-center justify-center rounded-full bg-stone-200/50 text-[#24211E] hover:bg-stone-200 active:scale-95 transition-all"
                aria-label={`Shopping Cart with ${totalItems} items`}
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

                {/* Cart Badge */}
                {totalItems > 0 ? (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#C1662F] text-[11px] font-bold text-white shadow-xs animate-in zoom-in-50 duration-200">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                ) : (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-stone-300 text-[11px] font-bold text-stone-600">
                    0
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Chips Bar (Min 44px height tap targets) */}
        <div className="border-t border-stone-200/40">
          <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8">
            <div className="no-scrollbar touch-scroll flex items-center gap-2 overflow-x-auto">
              {CATEGORY_CHIPS.map((chip) => {
                const isActive = selectedCategory === chip.value;
                return (
                  <button
                    key={chip.value}
                    onClick={() => setSelectedCategory(chip.value)}
                    className={`shrink-0 min-h-[44px] rounded-full px-4 py-2 text-xs font-medium transition-all sm:text-sm ${
                      isActive
                        ? "bg-[#C1662F] text-white shadow-xs"
                        : "bg-stone-200/60 text-stone-700 hover:bg-stone-200 active:bg-stone-300"
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

      {/* Main Plant Grid */}
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

      {/* Quick-View Bottom Sheet */}
      <PlantBottomSheet
        plant={activePlant}
        onClose={handleClosePlant}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  );
}
