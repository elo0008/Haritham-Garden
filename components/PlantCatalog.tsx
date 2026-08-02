"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
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
import { ShoppingBag, PackageCheck, ArrowUpDown, Check } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface PlantCatalogProps {
  plants: Plant[];
  tags: Tag[];
  initialPlantSlug?: string;
  initialSort?: string;
  heroBanner?: HeroBanner;
  siteSettings?: SiteSettings;
  carouselSettings?: CarouselSectionSettings;
  carouselSlides?: CarouselSlide[];
}

type SortOption = "popular_30" | "popular_90" | "popular_all" | "newest";

const AVAILABILITY_RANK: Record<string, number> = {
  available: 1,
  limited: 2,
  unavailable: 3,
};

export function PlantCatalog({
  plants,
  tags,
  initialPlantSlug,
  initialSort,
  heroBanner,
  siteSettings,
  carouselSettings,
  carouselSlides,
}: PlantCatalogProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const { totalItems, openCart, addItem } = useCart();

  // Multi-select: set of active tag IDs (empty = show all)
  const [activeTagIds, setActiveTagIds] = useState<Set<string>>(new Set());
  const [activePlant, setActivePlant] = useState<Plant | null>(null);

  // Sorting state synced with URL search params
  const [selectedSort, setSelectedSort] = useState<SortOption>(() => {
    const param = searchParams.get("sort") || initialSort;
    if (param === "popular_90" || param === "popular_all" || param === "newest") {
      return param;
    }
    return "popular_30";
  });

  const handleSortChange = (newSort: SortOption) => {
    setSelectedSort(newSort);
    const params = new URLSearchParams(searchParams.toString());
    if (newSort === "popular_30") {
      params.delete("sort");
    } else {
      params.set("sort", newSort);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // Custom Popover Sort Dropdown State & Refs
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [focusedSortIndex, setFocusedSortIndex] = useState(-1);
  const sortContainerRef = useRef<HTMLDivElement>(null);

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "popular_30", label: "Popular (30 days)" },
    { value: "popular_90", label: "Popular (90 days)" },
    { value: "popular_all", label: "Popular (All Time)" },
    { value: "newest", label: "Newest First" },
  ];

  // Click outside to close sort dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortContainerRef.current && !sortContainerRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSortKeyDown = (e: React.KeyboardEvent) => {
    if (!isSortOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsSortOpen(true);
        setFocusedSortIndex(SORT_OPTIONS.findIndex((o) => o.value === selectedSort));
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsSortOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedSortIndex((prev) => (prev + 1) % SORT_OPTIONS.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedSortIndex((prev) => (prev - 1 + SORT_OPTIONS.length) % SORT_OPTIONS.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (focusedSortIndex >= 0 && focusedSortIndex < SORT_OPTIONS.length) {
        handleSortChange(SORT_OPTIONS[focusedSortIndex].value);
        setIsSortOpen(false);
      }
    }
  };

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

  // ── Sorting ────────────────────────────────────────────────────────────────

  const sortedPlants = [...filteredPlants].sort((a, b) => {
    if (selectedSort === "newest") {
      // Newest First: purely created_at descending (ignores popularity & availability)
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return timeB - timeA;
    }

    // Primary: Availability rank (available < limited < unavailable)
    const rankA = AVAILABILITY_RANK[a.availability] ?? 2;
    const rankB = AVAILABILITY_RANK[b.availability] ?? 2;
    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // Secondary: Popularity score descending for selected time window
    let scoreA = 0;
    let scoreB = 0;

    if (selectedSort === "popular_90") {
      scoreA = a.popularity_90d ?? 0;
      scoreB = b.popularity_90d ?? 0;
    } else if (selectedSort === "popular_all") {
      scoreA = a.popularity_all ?? 0;
      scoreB = b.popularity_all ?? 0;
    } else {
      // popular_30 (Default)
      scoreA = a.popularity_30d ?? 0;
      scoreB = b.popularity_30d ?? 0;
    }

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    // Tertiary: created_at descending (covers zero-order and tied plants)
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return timeB - timeA;
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
      {/* Fixed Header / Navbar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-stone-50/70 dark:bg-stone-950/70 backdrop-blur-md border-b border-stone-200/40 dark:border-stone-800/40 transition-all w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo Component */}
          <div className="min-w-0 flex-1 max-w-[55%] xs:max-w-[65%] sm:max-w-none">
            <Logo
              showTagline={true}
              businessName={siteSettings?.business_name}
              tagline={siteSettings?.tagline}
              logoUrl={siteSettings?.logo_url}
              href="/"
            />
          </div>

          {/* Header Actions: Theme Toggle + My Orders + Bag Button */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              href="/my-orders"
              className="relative p-2 sm:p-2.5 rounded-full bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800/80 text-stone-700 dark:text-stone-200 hover:border-botanical-600 dark:hover:border-botanical-600 active:scale-95 transition-all shadow-2xs flex items-center gap-1.5 px-2.5 sm:px-3.5 min-h-[40px] sm:min-h-[44px]"
              title="My Orders"
            >
              <PackageCheck className="w-5 h-5 text-botanical-800 dark:text-botanical-100 shrink-0" />
              <span className="text-sm font-semibold hidden sm:inline">My Orders</span>
            </Link>

            <ThemeToggle />

            {/* Bag Button */}
            <button
              type="button"
              onClick={openCart}
              className="relative p-2 sm:p-2.5 rounded-full bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800/80 text-stone-700 dark:text-stone-200 hover:border-botanical-600 dark:hover:border-botanical-600 active:scale-95 transition-all shadow-2xs flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 min-h-[40px] sm:min-h-[44px]"
              aria-label={`Shopping Bag with ${totalItems} items`}
            >
              <ShoppingBag className="w-5 h-5 text-botanical-800 dark:text-botanical-100 shrink-0" />
              <span className="text-sm font-semibold hidden sm:inline">Bag</span>
              <span
                key={totalItems}
                className="bg-terracotta text-white font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center animate-badge-bounce shrink-0"
              >
                {totalItems}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner Section (full 100dvh, starts cleanly at top-0 under fixed header) */}
      {heroBanner && <HeroBannerDisplay banner={heroBanner} />}

      {/* Main Content Area */}
      <main className={`flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 w-full ${heroBanner ? "pt-6 sm:pt-8" : "pt-20 sm:pt-24"}`}>
        {/* Filters Section Bar */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="flex items-center justify-between flex-wrap gap-4 mb-8 border-b border-stone-200 dark:border-stone-800 pb-5"
          id="filter-bar"
        >
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

          <div className="flex items-center gap-3.5 justify-between w-full sm:w-auto">
            {/* Custom Styled Sort Dropdown */}
            <div className="relative inline-flex items-center" ref={sortContainerRef}>
              <button
                type="button"
                onClick={() => {
                  setIsSortOpen((prev) => !prev);
                  setFocusedSortIndex(SORT_OPTIONS.findIndex((o) => o.value === selectedSort));
                }}
                onKeyDown={handleSortKeyDown}
                className="p-2.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-botanical-600 dark:hover:border-botanical-600 active:scale-95 transition-all shadow-2xs flex items-center justify-center min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px]"
                title="Sort catalog"
                aria-haspopup="listbox"
                aria-expanded={isSortOpen}
                aria-label="Sort options"
              >
                <ArrowUpDown className="w-5 h-5 text-botanical-800 dark:text-botanical-100" />
              </button>

              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-50 min-w-[200px] w-max max-w-[calc(100vw-32px)] py-1.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-2xl overflow-hidden text-stone-900 dark:text-stone-100 font-sans"
                    role="listbox"
                    aria-label="Sort options"
                  >
                    {SORT_OPTIONS.map((opt, idx) => {
                      const isSelected = selectedSort === opt.value;
                      const isFocused = focusedSortIndex === idx;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            handleSortChange(opt.value);
                            setIsSortOpen(false);
                          }}
                          onMouseEnter={() => setFocusedSortIndex(idx)}
                          className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between transition-colors ${
                            isSelected
                              ? "bg-botanical-50 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100 font-bold"
                              : isFocused
                              ? "bg-stone-100 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100"
                              : "text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/40"
                          }`}
                        >
                          <span className="whitespace-nowrap">{opt.label}</span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-botanical-600 dark:text-botanical-400 shrink-0 ml-3" />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Showing <span className="text-stone-900 dark:text-stone-100 font-bold">{sortedPlants.length}</span> items
            </div>
          </div>
        </motion.div>

        {/* Product Grid with Filter & Sort Crossfade */}
        <AnimatePresence mode="wait">
          {sortedPlants.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
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
            </motion.div>
          ) : (
            <motion.div
              key={`${Array.from(activeTagIds).sort().join(",")}-${selectedSort}`}
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 mb-16"
            >
              {sortedPlants.map((plant, index) => (
                <motion.div
                  key={plant.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    ease: "easeOut",
                    delay: shouldReduceMotion ? 0 : Math.min(index * 0.03, 0.18),
                  }}
                >
                  <PlantCard
                    plant={plant}
                    onSelect={handleOpenPlant}
                    onQuickAdd={(p) => handleAddToCart(p, 1)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

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
