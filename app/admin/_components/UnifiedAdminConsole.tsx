"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "../actions";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import type {
  Plant,
  Tag,
  Order,
  HeroBanner,
  CarouselSectionSettings,
  CarouselSlide,
  SiteSettings,
} from "@/lib/types";
import { formatINR } from "@/lib/utils";

// Lucide Icons
import {
  LayoutDashboard,
  Sprout,
  Package,
  LayoutTemplate,
  TrendingUp,
  Tag as TagIcon,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Leaf,
  Plus,
  ArrowRight,
  CheckCircle2,
  Image as ImageIcon,
  SlidersHorizontal,
} from "lucide-react";

import { useAdminToast } from "@/components/AdminToast";

// Sub-components
import { AdminOrdersList } from "../orders/_components/AdminOrdersList";
import { SalesAnalytics } from "../sales/_components/SalesAnalytics";
import { HeroBannerForm } from "../hero-banner/_components/HeroBannerForm";
import { CarouselAdminClient } from "../carousel-section/_components/CarouselAdminClient";
import { SettingsForm } from "../settings/_components/SettingsForm";
import { AdminPlantsGrid } from "../plants/_components/AdminPlantsGrid";
import { PlantModal } from "../plants/_components/PlantModal";
import { TagManagementClient } from "../tags/_components/TagManagementClient";
import type { TagWithUsage } from "../tags/actions";
import { AvailabilitySelect } from "../plants/_components/AvailabilitySelect";
import { DeleteButton } from "../plants/_components/DeleteButton";

export type AdminTab =
  | "overview"
  | "plants"
  | "orders"
  | "storefront"
  | "sales"
  | "settings"
  | "tags";

interface UnifiedAdminConsoleProps {
  siteSettings: SiteSettings | null;
  plants: Plant[];
  plantTagsMap: Record<string, Tag[]>;
  allTags: Tag[];
  orders: Order[];
  heroBanner: HeroBanner | null;
  carouselSettings: CarouselSectionSettings | null;
  carouselSlides: CarouselSlide[];
  userEmail?: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pending: {
    label: "Pending",
    bg: "bg-amber-100 dark:bg-amber-950/60",
    text: "text-amber-800 dark:text-amber-300",
  },
  handled: {
    label: "Handled",
    bg: "bg-blue-100 dark:bg-blue-950/60",
    text: "text-blue-800 dark:text-blue-300",
  },
  paid: {
    label: "Paid",
    bg: "bg-purple-100 dark:bg-purple-950/60",
    text: "text-purple-800 dark:text-purple-300",
  },
  packaged: {
    label: "Packaged",
    bg: "bg-teal-100 dark:bg-teal-950/60",
    text: "text-teal-800 dark:text-teal-300",
  },
  dispatched: {
    label: "Dispatched",
    bg: "bg-emerald-100 dark:bg-emerald-950/60",
    text: "text-emerald-800 dark:text-emerald-300",
  },
};

export function UnifiedAdminConsole({
  siteSettings,
  plants,
  plantTagsMap,
  allTags,
  orders,
  heroBanner,
  carouselSettings,
  carouselSlides,
  userEmail,
}: UnifiedAdminConsoleProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { showToast } = useAdminToast();

  // Tab State
  const initialTab = (searchParams.get("tab") as AdminTab) || "overview";
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Add Plant Modal State (used from Overview and any other entry point)
  const [isAddPlantModalOpen, setIsAddPlantModalOpen] = useState(false);

  // Storefront Sub-tab State
  const [storefrontSubTab, setStorefrontSubTab] = useState<"hero" | "carousel">("hero");

  // Catalogue Category Filter State
  const [plantCategoryFilter, setPlantCategoryFilter] = useState("all");

  // Reactive Realtime State
  const [ordersState, setOrdersState] = useState<Order[]>(orders);
  const [plantsState, setPlantsState] = useState<Plant[]>(plants);
  const [tagsState, setTagsState] = useState<Tag[]>(allTags);
  const [heroBannerState, setHeroBannerState] = useState<HeroBanner | null>(heroBanner);
  const [carouselSettingsState, setCarouselSettingsState] = useState<CarouselSectionSettings | null>(carouselSettings);
  const [carouselSlidesState, setCarouselSlidesState] = useState<CarouselSlide[]>(carouselSlides);
  const [siteSettingsState, setSiteSettingsState] = useState<SiteSettings | null>(siteSettings);

  useEffect(() => setOrdersState(orders), [orders]);
  useEffect(() => setPlantsState(plants), [plants]);
  useEffect(() => setTagsState(allTags), [allTags]);
  useEffect(() => setHeroBannerState(heroBanner), [heroBanner]);
  useEffect(() => setCarouselSettingsState(carouselSettings), [carouselSettings]);
  useEffect(() => setCarouselSlidesState(carouselSlides), [carouselSlides]);
  useEffect(() => setSiteSettingsState(siteSettings), [siteSettings]);

  // Supabase Realtime Subscriptions (Syncs state & notifies via toast)
  useRealtimeSubscription<Order>({
    table: "orders",
    onInsert: (newOrder) => {
      if (newOrder.deleted) return;
      setOrdersState((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
      showToast("New Order Received", `Order #${newOrder.order_ref || newOrder.id.substring(0, 8)}`);
    },
    onUpdate: (updatedOrder) => {
      setOrdersState((prev) => {
        if (updatedOrder.deleted) return prev.filter((o) => o.id !== updatedOrder.id);
        const exists = prev.some((o) => o.id === updatedOrder.id);
        if (!exists) return [updatedOrder, ...prev];
        return prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
      });
      if (updatedOrder.deleted) {
        showToast("Order Removed", `Order #${updatedOrder.order_ref || updatedOrder.id.substring(0, 8)}`);
      } else {
        showToast("Order Updated", `Order #${updatedOrder.order_ref || updatedOrder.id.substring(0, 8)}`);
      }
    },
    onDelete: (oldRecord) => {
      if (oldRecord.id) {
        setOrdersState((prev) => prev.filter((o) => o.id !== oldRecord.id));
        showToast("Order Deleted", "Order record removed");
      }
    },
    onReconnect: () => router.refresh(),
  });

  useRealtimeSubscription<Plant>({
    table: "plants",
    onInsert: (newPlant) => {
      if ((newPlant as any).deleted) return;
      setPlantsState((prev) => [newPlant, ...prev.filter((p) => p.id !== newPlant.id)]);
      showToast("Plant Added", `'${newPlant.name}' added to catalogue`);
    },
    onUpdate: (updatedPlant) => {
      setPlantsState((prev) => {
        if ((updatedPlant as any).deleted) return prev.filter((p) => p.id !== updatedPlant.id);
        const exists = prev.some((p) => p.id === updatedPlant.id);
        if (!exists) return [updatedPlant, ...prev];
        return prev.map((p) => (p.id === updatedPlant.id ? { ...p, ...updatedPlant } : p));
      });
      if ((updatedPlant as any).deleted) {
        showToast("Plant Removed", `'${updatedPlant.name}' removed from catalogue`);
      } else {
        showToast("Catalogue Updated", `'${updatedPlant.name}' updated`);
      }
    },
    onDelete: (oldRecord) => {
      if (oldRecord.id) {
        setPlantsState((prev) => prev.filter((p) => p.id !== oldRecord.id));
        showToast("Plant Deleted", "Plant removed from catalogue");
      }
    },
    onReconnect: () => router.refresh(),
  });

  useRealtimeSubscription<Tag>({
    table: "tags",
    onInsert: (newTag) => {
      setTagsState((prev) => [...prev.filter((t) => t.id !== newTag.id), newTag]);
      showToast("Tag Created", `Category tag '${newTag.name}' created`);
    },
    onUpdate: (updatedTag) => {
      setTagsState((prev) => prev.map((t) => (t.id === updatedTag.id ? { ...t, ...updatedTag } : t)));
      showToast("Tag Updated", `Category tag '${updatedTag.name}' updated`);
    },
    onDelete: (oldRecord) => {
      if (oldRecord.id) {
        setTagsState((prev) => prev.filter((t) => t.id !== oldRecord.id));
        showToast("Tag Deleted", "Category tag removed");
      }
    },
    onReconnect: () => router.refresh(),
  });

  useRealtimeSubscription<HeroBanner>({
    table: "hero_banner",
    onUpdate: (banner) => {
      setHeroBannerState(banner);
      showToast("Hero Banner Updated", "Homepage hero banner settings updated");
    },
    onReconnect: () => router.refresh(),
  });

  useRealtimeSubscription<CarouselSectionSettings>({
    table: "carousel_section_settings",
    onUpdate: (settings) => {
      setCarouselSettingsState(settings);
      showToast("Carousel Settings Updated", "Carousel section settings updated");
    },
    onReconnect: () => router.refresh(),
  });

  useRealtimeSubscription<CarouselSlide>({
    table: "carousel_slides",
    onInsert: (slide) => {
      setCarouselSlidesState((prev) => [...prev.filter((s) => s.id !== slide.id), slide]);
      showToast("Carousel Slide Added", `Slide '${slide.title || "New Slide"}' added`);
    },
    onUpdate: (slide) => {
      setCarouselSlidesState((prev) => prev.map((s) => (s.id === slide.id ? slide : s)));
      showToast("Carousel Slide Updated", `Slide '${slide.title || "Slide"}' updated`);
    },
    onDelete: (oldRecord) => {
      if (oldRecord.id) {
        setCarouselSlidesState((prev) => prev.filter((s) => s.id !== oldRecord.id));
        showToast("Carousel Slide Deleted", "Slide removed from carousel");
      }
    },
    onReconnect: () => router.refresh(),
  });

  useRealtimeSubscription<SiteSettings>({
    table: "site_settings",
    onUpdate: (settings) => {
      setSiteSettingsState(settings);
      showToast("Site Settings Updated", "Site configuration updated");
    },
    onReconnect: () => router.refresh(),
  });

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") as AdminTab;
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const switchTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    // Update URL query string without reloading page
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState({}, "", url.toString());
  };

  // KPI Calculations
  const activeOrdersCount = ordersState.filter(
    (o) => (o.status || (o.handled ? "dispatched" : "pending")) !== "dispatched"
  ).length;

  const dispatchedOrders = ordersState.filter(
    (o) => (o.status || (o.handled ? "dispatched" : "pending")) === "dispatched"
  );
  const completedDispatchesCount = dispatchedOrders.length;

  const totalRevenue = dispatchedOrders.reduce(
    (sum, o) => sum + (o.final_total || o.subtotal || 0),
    0
  );

  const recentOrders = ordersState.slice(0, 5);

  // Catalogue Filtered Plants
  const filteredPlants = plantsState.filter((plant) => {
    if (plantCategoryFilter === "all") return true;
    const tags = plantTagsMap[plant.id] ?? [];
    return tags.some(
      (t) => t.name.toLowerCase() === plantCategoryFilter.toLowerCase()
    );
  });

  const tagsWithUsage: TagWithUsage[] = tagsState.map((t) => {
    const usageCount = Object.values(plantTagsMap).reduce((count, tagList) => {
      return count + (tagList.some((tag) => tag.id === t.id) ? 1 : 0);
    }, 0);
    return { ...t, usage_count: usageCount };
  });

  const businessName = siteSettingsState?.business_name || "Haritham Garden";
  const logoUrl = siteSettingsState?.logo_url;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 font-sans antialiased transition-colors duration-300 w-full max-w-full overflow-x-clip">
      {/* ========================================== */}
      {/* STICKY TOP NAVIGATION (3-ZONE ARCHITECTURE) */}
      {/* ========================================== */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 transition-all shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* ZONE 1: LEFT BRAND & ADMIN BADGE */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
            <button
              type="button"
              onClick={() => switchTab("overview")}
              className="flex items-center gap-2 sm:gap-3 group text-left min-w-0"
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-botanical-100 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100 flex items-center justify-center group-hover:bg-botanical-800 dark:group-hover:bg-botanical-600 group-hover:text-white transition-all shadow-xs overflow-hidden shrink-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={businessName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Leaf className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-heading font-bold text-sm sm:text-base lg:text-lg tracking-tight text-botanical-900 dark:text-botanical-100 leading-none whitespace-nowrap">
                    {businessName}
                  </span>
                  <span className="bg-terracotta/10 dark:bg-terracotta/20 text-terracotta border border-terracotta/30 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider hidden xs:flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
                    Admin
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5 block truncate whitespace-nowrap hidden sm:block">
                  Nursery Management Console
                </span>
              </div>
            </button>
          </div>

          {/* ZONE 2: CENTER PRIMARY NAVIGATION TABS (Desktop) */}
          <nav className="hidden lg:flex items-center h-11 gap-1 bg-stone-100/90 dark:bg-stone-800/90 p-1 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 shadow-inner">
            <button
              type="button"
              onClick={() => switchTab("overview")}
              className={`px-2.5 xl:px-3.5 h-9 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === "overview"
                  ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-botanical-800 dark:text-botanical-100" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => switchTab("plants")}
              className={`px-2.5 xl:px-3.5 h-9 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === "plants"
                  ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
              <span>Catalogue</span>
            </button>

            <button
              type="button"
              onClick={() => switchTab("orders")}
              className={`px-2.5 xl:px-3.5 h-9 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === "orders"
                  ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <Package className="w-3.5 h-3.5 text-amber-600" />
              <span>Orders</span>
              {activeOrdersCount > 0 && (
                <span className="bg-terracotta text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => switchTab("storefront")}
              className={`px-2.5 xl:px-3.5 h-9 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === "storefront"
                  ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-terracotta" />
              <span>Storefront CMS</span>
            </button>

            <button
              type="button"
              onClick={() => switchTab("sales")}
              className={`px-2.5 xl:px-3.5 h-9 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === "sales"
                  ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sales</span>
            </button>
          </nav>

          {/* ZONE 3: RIGHT UTILITIES & USER ACCOUNT CONTROLS */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-botanical-600 transition-all flex items-center justify-center shrink-0"
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-botanical-600 transition-all flex items-center justify-center shrink-0"
              title="Toggle Dark/Light Mode"
            >
              <Sun className="w-4 h-4 text-amber-500 hidden dark:block" />
              <Moon className="w-4 h-4 text-stone-600 block dark:hidden" />
            </button>

            {/* Tags Button */}
            <button
              type="button"
              onClick={() => switchTab("tags")}
              className={`h-9 sm:h-11 px-2.5 sm:px-3.5 rounded-xl border transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 ${
                activeTab === "tags"
                  ? "bg-botanical-800 dark:bg-botanical-600 text-white border-botanical-800"
                  : "bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-botanical-600"
              }`}
              title="Tag Management"
            >
              <TagIcon className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold hidden xl:inline">Tags</span>
            </button>

            {/* Settings Button */}
            <button
              type="button"
              onClick={() => switchTab("settings")}
              className={`h-9 sm:h-11 px-2.5 sm:px-3.5 rounded-xl border transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 ${
                activeTab === "settings"
                  ? "bg-botanical-800 dark:bg-botanical-600 text-white border-botanical-800"
                  : "bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-botanical-600"
              }`}
              title="Site Settings"
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold hidden xl:inline">Settings</span>
            </button>

            {/* Sign Out Button */}
            <form action={signOut} className="shrink-0">
              <button
                type="submit"
                className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-300 dark:hover:border-red-800 transition-all flex items-center justify-center shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 shrink-0" />
              </button>
            </form>
          </div>
        </div>

        {/* RESPONSIVE MOBILE MENU DROPDOWN */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="lg:hidden border-t border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 px-4 py-3.5 space-y-1.5 shadow-xl backdrop-blur-md overflow-hidden"
            >
              <button
                type="button"
                onClick={() => switchTab("overview")}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                  activeTab === "overview"
                    ? "bg-botanical-50 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100"
                    : "text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-botanical-800 dark:text-botanical-100" />
                <span>Overview</span>
              </button>
              <button
                type="button"
                onClick={() => switchTab("plants")}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                  activeTab === "plants"
                    ? "bg-emerald-50 dark:bg-stone-800 text-emerald-800 dark:text-emerald-300"
                    : "text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                <Sprout className="w-4 h-4 text-emerald-600" />
                <span>Catalogue</span>
              </button>
              <button
                type="button"
                onClick={() => switchTab("orders")}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                  activeTab === "orders"
                    ? "bg-amber-50 dark:bg-stone-800 text-amber-800 dark:text-amber-300"
                    : "text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-amber-600" />
                  <span>Orders Management</span>
                </div>
                <span className="bg-terracotta text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                  {activeOrdersCount} Active
                </span>
              </button>
              <button
                type="button"
                onClick={() => switchTab("storefront")}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                  activeTab === "storefront"
                    ? "bg-stone-100 dark:bg-stone-800 text-terracotta"
                    : "text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                <LayoutTemplate className="w-4 h-4 text-terracotta" />
                <span>Storefront CMS</span>
              </button>
              <button
                type="button"
                onClick={() => switchTab("sales")}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                  activeTab === "sales"
                    ? "bg-emerald-50 dark:bg-stone-800 text-emerald-800 dark:text-emerald-300"
                    : "text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Sales Analytics</span>
              </button>
              <button
                type="button"
                onClick={() => switchTab("tags")}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 border-t border-stone-100 dark:border-stone-800 pt-3 mt-1 ${
                  activeTab === "tags"
                    ? "bg-botanical-50 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100"
                    : "text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                <TagIcon className="w-4 h-4 text-botanical-600 dark:text-botanical-400" />
                <span>Tag Management</span>
              </button>
              <button
                type="button"
                onClick={() => switchTab("settings")}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                  activeTab === "settings"
                    ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white"
                    : "text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                <Settings className="w-4 h-4 text-stone-400" />
                <span>Site Settings</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-grow max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 w-full overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
        {/* =================================================================== */}
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {/* =================================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-heading font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
                  Admin Control Center
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                  Select a core nursery module to manage your inventory, customer orders, or storefront promotional banners.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPlantModalOpen(true)}
                className="bg-terracotta hover:bg-[#b04a25] text-white px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 shrink-0 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Plant</span>
              </button>
            </div>

            {/* KPI Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Catalogue */}
              <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                    Total Catalogue
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-heading font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
                      {plants.length}
                    </span>
                    <span className="text-xs text-emerald-600 font-semibold">Plants Listed</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-botanical-50 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100 flex items-center justify-center shrink-0">
                  <Sprout className="w-6 h-6" />
                </div>
              </div>

              {/* Active Orders */}
              <div
                onClick={() => switchTab("orders")}
                className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-2xs flex items-center justify-between cursor-pointer hover:border-amber-600 transition-all group"
              >
                <div>
                  <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                    Active Orders
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-heading font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
                      {activeOrdersCount}
                    </span>
                    <span className="text-xs text-amber-600 font-semibold">In Progress</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Package className="w-6 h-6" />
                </div>
              </div>

              {/* Total Earned */}
              <div
                onClick={() => switchTab("sales")}
                className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-2xs flex items-center justify-between cursor-pointer hover:border-emerald-600 transition-all group"
              >
                <div>
                  <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                    Total Earned (All Time)
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-heading font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
                      {formatINR(totalRevenue)}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              {/* Completed Dispatches */}
              <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                    Completed Dispatches
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-heading font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
                      {completedDispatchesCount}
                    </span>
                    <span className="text-xs text-emerald-600 font-semibold">Delivered</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* 3 Core Admin Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Plants */}
              <div
                onClick={() => switchTab("plants")}
                className="group bg-white dark:bg-stone-900 rounded-3xl p-7 border border-stone-200/80 dark:border-stone-800 shadow-2xs hover:shadow-xl dark:hover:shadow-stone-950/50 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-botanical-50 dark:bg-stone-800/40 rounded-bl-full -z-0 transition-transform group-hover:scale-110 duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-botanical-100 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100 flex items-center justify-center mb-6 group-hover:bg-botanical-800 dark:group-hover:bg-botanical-600 group-hover:text-white transition-colors shadow-sm">
                    <Sprout className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-botanical-600 dark:text-botanical-100 block mb-1">
                    Catalogue Module
                  </span>
                  <h3 className="font-heading font-bold text-2xl text-stone-900 dark:text-stone-100 group-hover:text-botanical-800 dark:group-hover:text-botanical-100 transition-colors">
                    Plants
                  </h3>
                  <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm mt-2 leading-relaxed">
                    Manage plant catalogue, stock pricing, botanical categories, and upload nursery photos.
                  </p>
                </div>
                <div className="mt-8 pt-5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between relative z-10">
                  <span className="text-xs font-semibold text-stone-400">
                    {plants.length} Items Listed
                  </span>
                  <span className="text-xs font-bold text-terracotta flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Manage Catalogue <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Orders */}
              <div
                onClick={() => switchTab("orders")}
                className="group bg-white dark:bg-stone-900 rounded-3xl p-7 border border-stone-200/80 dark:border-stone-800 shadow-2xs hover:shadow-xl dark:hover:shadow-stone-950/50 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 dark:bg-amber-950/20 rounded-bl-full -z-0 transition-transform group-hover:scale-110 duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-stone-800 text-amber-800 dark:text-amber-400 flex items-center justify-center mb-6 group-hover:bg-amber-700 group-hover:text-white transition-colors shadow-sm">
                    <Package className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block mb-1">
                    Dispatch Module
                  </span>
                  <h3 className="font-heading font-bold text-2xl text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    Orders Management
                  </h3>
                  <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm mt-2 leading-relaxed">
                    Track 5-stage order fulfillment: verify payments, quote courier charges, and dispatch.
                  </p>
                </div>
                <div className="mt-8 pt-5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between relative z-10">
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md">
                    {activeOrdersCount} Active Order{activeOrdersCount !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Orders <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Storefront */}
              <div
                onClick={() => switchTab("storefront")}
                className="group bg-white dark:bg-stone-900 rounded-3xl p-7 border border-stone-200/80 dark:border-stone-800 shadow-2xs hover:shadow-xl dark:hover:shadow-stone-950/50 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-terracotta/10 rounded-bl-full -z-0 transition-transform group-hover:scale-110 duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-terracotta/15 dark:bg-stone-800 text-terracotta flex items-center justify-center mb-6 group-hover:bg-terracotta group-hover:text-white transition-colors shadow-sm">
                    <LayoutTemplate className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-terracotta block mb-1">
                    Storefront CMS
                  </span>
                  <h3 className="font-heading font-bold text-2xl text-stone-900 dark:text-stone-100 group-hover:text-terracotta transition-colors">
                    Storefront Banners
                  </h3>
                  <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm mt-2 leading-relaxed">
                    Customize homepage hero promotional banner, update seasonal badges, and configure carousels.
                  </p>
                </div>
                <div className="mt-8 pt-5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between relative z-10">
                  <span className="text-xs font-semibold text-stone-400">Hero Banner &amp; Carousel</span>
                  <span className="text-xs font-bold text-terracotta flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Edit Storefront <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Orders Preview Table */}
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
                    Recent Customer Orders
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Latest incoming plant order requests across Kerala and South India.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => switchTab("orders")}
                  className="text-xs font-bold text-botanical-800 dark:text-botanical-100 hover:underline flex items-center gap-1"
                >
                  <span>View All Orders</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {recentOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400 dark:text-stone-500">
                  No orders recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-stone-100 dark:border-stone-800 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        <th className="pb-3 pl-2">Order Ref</th>
                        <th className="pb-3">Customer</th>
                        <th className="pb-3">Plant Items</th>
                        <th className="pb-3">Total</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right pr-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-xs font-medium">
                      {recentOrders.map((order) => {
                        const status =
                          order.status || (order.handled ? "dispatched" : "pending");
                        const badge = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                        const itemSummary =
                          order.items && order.items.length > 0
                            ? order.items.map((i) => `${i.qty}x ${i.name}`).join(", ")
                            : "Items details";

                        const totalVal =
                          order.final_total ||
                          order.subtotal +
                            (order.final_courier_price ?? order.estimated_courier_price ?? 0);

                        return (
                          <tr
                            key={order.id}
                            className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors"
                          >
                            <td className="py-4 pl-2 font-heading font-bold text-stone-900 dark:text-stone-100">
                              {order.order_ref}
                            </td>
                            <td className="py-4 text-stone-800 dark:text-stone-200">
                              {order.customer_name ? (
                                <>
                                  <span className="font-semibold block">{order.customer_name}</span>
                                  {order.customer_phone && (
                                    <span className="text-[11px] text-stone-400 font-normal block">
                                      {order.customer_phone}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-stone-400 italic">WhatsApp Customer</span>
                              )}
                            </td>
                            <td className="py-4 text-stone-600 dark:text-stone-300 max-w-xs truncate">
                              {itemSummary}
                            </td>
                            <td className="py-4 font-heading font-bold text-stone-900 dark:text-stone-100">
                              {formatINR(totalVal)}
                            </td>
                            <td className="py-4">
                              <span
                                className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${badge.bg} ${badge.text}`}
                              >
                                {badge.label}
                              </span>
                            </td>
                            <td className="py-4 text-right pr-2">
                              <button
                                type="button"
                                onClick={() => switchTab("orders")}
                                className="text-xs bg-botanical-50 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100 hover:bg-botanical-800 hover:text-white px-3 py-1.5 rounded-lg font-semibold transition-all"
                              >
                                Manage →
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: PLANTS CATALOGUE */}
        {/* =================================================================== */}
        {activeTab === "plants" && (
          <div className="animate-fadeIn">
            <AdminPlantsGrid
              plants={plantsState}
              plantTagsMap={plantTagsMap}
              allTags={tagsState}
            />
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: ORDERS MANAGEMENT */}
        {/* =================================================================== */}
        {activeTab === "orders" && (
          <div className="space-y-6 animate-fadeIn">
            <AdminOrdersList orders={ordersState} plants={plantsState} />
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: STOREFRONT CMS (Hero Banner + Carousel Section) */}
        {/* =================================================================== */}
        {activeTab === "storefront" && (
          <div className="space-y-8 animate-fadeIn max-w-5xl">
            {/* Header */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                Storefront CMS
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                Customize homepage promotional hero banner and carousel section slides.
              </p>
            </div>

            {/* Sub-tab Pill Switcher */}
            <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
              <button
                type="button"
                onClick={() => setStorefrontSubTab("hero")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  storefrontSubTab === "hero"
                    ? "bg-terracotta text-white shadow-xs"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Homepage Hero Banner</span>
              </button>

              <button
                type="button"
                onClick={() => setStorefrontSubTab("carousel")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  storefrontSubTab === "carousel"
                    ? "bg-terracotta text-white shadow-xs"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Carousel Section &amp; Slides</span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={storefrontSubTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* Sub-tab 1: Hero Banner */}
                {storefrontSubTab === "hero" && (
                  <div>
                    {heroBannerState ? (
                      <HeroBannerForm banner={heroBannerState} />
                    ) : (
                      <div className="rounded-xl bg-red-50 p-4 text-xs text-red-700">
                        Hero banner data not initialized.
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab 2: Carousel Section */}
                {storefrontSubTab === "carousel" && (
                  <div>
                    {carouselSettingsState ? (
                      <CarouselAdminClient
                        settings={carouselSettingsState}
                        slides={carouselSlidesState}
                      />
                    ) : (
                      <div className="rounded-xl bg-red-50 p-4 text-xs text-red-700">
                        Carousel section settings not initialized.
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: SALES ANALYTICS */}
        {/* =================================================================== */}
        {activeTab === "sales" && (
          <div className="space-y-6 animate-fadeIn">
            <SalesAnalytics orders={dispatchedOrders} />
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 6: SITE SETTINGS */}
        {/* =================================================================== */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-fadeIn max-w-3xl">
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                Site Settings
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                Manage business logo, header text, contact phone, secondary social links, and footer info cards.
              </p>
            </div>

            {siteSettingsState ? (
              <SettingsForm settings={siteSettingsState} />
            ) : (
              <div className="rounded-xl bg-red-50 p-4 text-xs text-red-700">
                Site settings data not initialized.
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 8: TAG MANAGEMENT */}
        {/* =================================================================== */}
        {activeTab === "tags" && (
          <div className="space-y-6 animate-fadeIn">
            <TagManagementClient initialTags={tagsWithUsage} />
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Global Add Plant Modal (shared across Overview, Catalogue, and all entry points) ── */}
      <PlantModal
        isOpen={isAddPlantModalOpen}
        onClose={() => setIsAddPlantModalOpen(false)}
        allTags={tagsState}
      />
    </div>
  );
}
