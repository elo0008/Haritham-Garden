"use client";

import { useState, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import type {
  Plant,
  Tag,
  HeroBanner,
  SiteSettings,
  CarouselSectionSettings,
  CarouselSlide,
} from "@/lib/types";
import { Logo } from "./Logo";
import { PlantCard } from "./PlantCard";
import { PlantBottomSheet } from "./PlantBottomSheet";
import { HeroBannerDisplay } from "./HeroBannerDisplay";
import { CarouselSection } from "./CarouselSection";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { useCart } from "@/context/CartContext";

interface PlantCatalogProps {
  plants: Plant[];
  tags: Tag[];
  initialPlantSlug?: string;
  heroBanner?: HeroBanner;
  siteSettings?: SiteSettings;
  carouselSettings?: CarouselSectionSettings;
  carouselSlides?: CarouselSlide[];
}

export function PlantCatalog({
  plants,
  tags,
  initialPlantSlug,
  heroBanner,
  siteSettings,
  carouselSettings,
  carouselSlides,
}: PlantCatalogProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const { totalItems, openCart, addItem } = useCart();

  // Multi-select: set of active tag IDs (empty = show all)
  const [activeTagIds, setActiveTagIds] = useState<Set<string>>(new Set());
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

  // ── Filtering (AND logic) ──────────────────────────────────────────────────

  const filteredPlants =
    activeTagIds.size === 0
      ? plants
      : plants.filter((plant) => {
          const plantTagIds = new Set((plant.tags ?? []).map((t) => t.id));
          // Plant must have ALL active tags
          for (const activeId of activeTagIds) {
            if (!plantTagIds.has(activeId)) return false;
          }
          return true;
        });

  // ── Tag chip toggle ────────────────────────────────────────────────────────

  const toggleTag = (tagId: string) => {
    setActiveTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  const clearFilters = () => setActiveTagIds(new Set());

  // ── Plant sheet handlers ───────────────────────────────────────────────────

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

  // ── Render ─────────────────────────────────────────────────────────────────

  const isAllActive = activeTagIds.size === 0;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#24211E]">
      {/* Sticky Top Header (Logo & Cart) */}
      <header className="sticky top-0 z-20 border-b border-stone-200/60 bg-[#FAF8F5]/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Logo Component */}
            <Logo
              showTagline={true}
              businessName={siteSettings?.business_name}
              tagline={siteSettings?.tagline}
              logoUrl={siteSettings?.logo_url}
            />

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
      </header>

      {/* Hero Banner (Above tag filter chips and plant grid) */}
      {heroBanner && <HeroBannerDisplay banner={heroBanner} />}

      {/* Tag Filter Chips Bar (Below Hero Banner, Multi-select, min 44px height tap targets) */}
      <div className="border-b border-stone-200/40 bg-[#FAF8F5]">
        <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="no-scrollbar touch-scroll flex items-center gap-2 overflow-x-auto">
            {/* "All Plants" chip */}
            <button
              onClick={clearFilters}
              className={`shrink-0 min-h-[44px] rounded-full px-4 py-2 text-xs font-medium transition-all sm:text-sm ${
                isAllActive
                  ? "bg-[#C1662F] text-white shadow-xs"
                  : "bg-stone-200/60 text-stone-700 hover:bg-stone-200 active:bg-stone-300"
              }`}
            >
              All Plants
            </button>

            {/* Dynamic tag chips */}
            {tags.map((tag) => {
              const isActive = activeTagIds.has(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`shrink-0 min-h-[44px] rounded-full px-4 py-2 text-xs font-medium transition-all sm:text-sm ${
                    isActive
                      ? "bg-[#C1662F] text-white shadow-xs"
                      : "bg-stone-200/60 text-stone-700 hover:bg-stone-200 active:bg-stone-300"
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Plant Grid */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Items counter when filters are active */}
        {!isAllActive && filteredPlants.length > 0 && (
          <p className="mb-4 text-xs text-stone-500">
            Showing {filteredPlants.length} plant{filteredPlants.length !== 1 ? "s" : ""}
          </p>
        )}

        {filteredPlants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-stone-200/50 text-2xl">
              🌱
            </div>
            <h2 className="text-lg font-semibold text-stone-800">
              No plants match these filters
            </h2>
            <p className="mt-1 text-xs text-stone-500 max-w-xs">
              Try removing some tags to see more plants.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 min-h-[44px] rounded-full bg-[#C1662F] px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#A85524] active:bg-[#92481e] transition-colors"
            >
              Clear filters
            </button>
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

      {/* Carousel Section (Admin manageable, renders only if enabled & has active slides) */}
      <CarouselSection settings={carouselSettings} slides={carouselSlides} />

      {/* Footer */}
      <Footer settings={siteSettings} />

      {/* Quick-View Bottom Sheet */}
      <PlantBottomSheet
        plant={activePlant}
        onClose={handleClosePlant}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Drawer */}
      <CartDrawer whatsappNumber={siteSettings?.whatsapp_number} />
    </div>
  );
}
