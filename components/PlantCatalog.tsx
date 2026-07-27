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
import { ThemeToggle } from "./ThemeToggle";
import { PlantCard } from "./PlantCard";
import { PlantBottomSheet } from "./PlantBottomSheet";
import { HeroBannerDisplay } from "./HeroBannerDisplay";
import { CarouselSection } from "./CarouselSection";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { ShoppingBag, PackageCheck } from "lucide-react";

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

  // ── Plant sheet & cart handlers ────────────────────────────────────────────

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

  const handleAddToCart = (plant: Plant, qty: number = 1) => {
    addItem(plant, qty);

    // Auto-open cart drawer ONLY on first item add of this session
    if (typeof window !== "undefined") {
      const hasAutoOpened = sessionStorage.getItem("haritham_cart_auto_opened");
      if (!hasAutoOpened) {
        sessionStorage.setItem("haritham_cart_auto_opened", "true");
        openCart();
      }
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const isAllActive = activeTagIds.size === 0;

  return (
    <div className="bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 font-sans antialiased min-h-screen flex flex-col relative transition-colors duration-300">
      {/* Sticky Header / Navbar */}
      <header className="sticky top-0 z-40 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo Component */}
          <Logo
            showTagline={true}
            businessName={siteSettings?.business_name}
            tagline={siteSettings?.tagline}
            logoUrl={siteSettings?.logo_url}
            href="/"
          />

          {/* Header Actions: Theme Toggle + My Orders + Bag Button */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/my-orders"
              className="relative p-2.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-botanical-600 dark:hover:border-botanical-600 active:scale-95 transition-all shadow-2xs flex items-center gap-1.5 px-3.5 min-h-[44px]"
              title="My Orders"
            >
              <PackageCheck className="w-5 h-5 text-botanical-800 dark:text-botanical-100" />
              <span className="text-sm font-semibold hidden sm:inline">My Orders</span>
            </Link>

            <ThemeToggle />

            {/* Bag Button */}
            <button
              type="button"
              onClick={openCart}
              className="relative p-2.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-botanical-600 dark:hover:border-botanical-600 active:scale-95 transition-all shadow-2xs flex items-center gap-2 px-4 min-h-[44px]"
              aria-label={`Shopping Bag with ${totalItems} items`}
            >
              <ShoppingBag className="w-5 h-5 text-botanical-800 dark:text-botanical-100" />
              <span className="text-sm font-semibold hidden sm:inline">Bag</span>
              <span
                key={totalItems}
                className="bg-terracotta text-white font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center animate-badge-bounce"
              >
                {totalItems}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Hero Banner */}
        {heroBanner && <HeroBannerDisplay banner={heroBanner} />}

        {/* Filters Section Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8 border-b border-stone-200 dark:border-stone-800 pb-5" id="filter-bar">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar w-full sm:w-auto">
            {/* "All Plants" Chip */}
            <button
              type="button"
              onClick={clearFilters}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shrink-0 min-h-[44px] active:scale-95 ${
                isAllActive
                  ? "bg-botanical-800 dark:bg-botanical-600 text-white shadow-xs"
                  : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800"
              }`}
            >
              All Plants
            </button>

            {/* Dynamic Tag Filter Chips */}
            {tags.map((tag) => {
              const isActive = activeTagIds.has(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-5 py-2.5 rounded-full text-sm transition-all shrink-0 min-h-[44px] active:scale-95 ${
                    isActive
                      ? "bg-botanical-800 dark:bg-botanical-600 text-white font-semibold shadow-xs"
                      : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium"
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>

          <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Showing <span className="text-stone-900 dark:text-stone-100 font-bold">{filteredPlants.length}</span> items
          </div>
        </div>

        {/* Product Grid */}
        {filteredPlants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-botanical-50 dark:bg-stone-900 border border-botanical-100 dark:border-stone-800 text-2xl">
              🌱
            </div>
            <h2 className="font-heading text-lg font-bold text-stone-900 dark:text-stone-100">
              No plants match these filters
            </h2>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 max-w-xs">
              Try removing some tags to see more plants.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 min-h-[44px] rounded-full bg-botanical-800 dark:bg-botanical-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-botanical-900 transition-colors active:scale-95"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 mb-16">
            {filteredPlants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onSelect={handleOpenPlant}
                onQuickAdd={(p) => handleAddToCart(p, 1)}
              />
            ))}
          </div>
        )}

        {/* Dynamic Admin-Manageable Carousel Section */}
        <CarouselSection settings={carouselSettings} slides={carouselSlides} />
      </main>

      {/* Footer */}
      <Footer settings={siteSettings} />

      {/* Quick-View Bottom Sheet / Modal */}
      <PlantBottomSheet
        plant={activePlant}
        onClose={handleClosePlant}
        onAddToCart={handleAddToCart}
      />

      {/* Slide-over Cart Drawer */}
      <CartDrawer whatsappNumber={siteSettings?.whatsapp_number} />
    </div>
  );
}
