"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useCart } from "@/context/CartContext";
import type { SiteSettings } from "@/lib/types";
import { Home, Sprout, Sparkles, PackageCheck, ShoppingBag, Menu, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePWA } from "@/context/PWAContext";

interface CustomerHeaderProps {
  siteSettings: SiteSettings | null;
  carouselTagLabel: string | null;
}

export function CustomerHeader({ siteSettings, carouselTagLabel }: CustomerHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { totalItems, openCart } = useCart();
  const { isStandalone, promptInstall } = usePWA();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<"home" | "catalogue" | "carousel">("home");

  const isHomePage = pathname === "/";
  const isOrdersPage = pathname?.startsWith("/my-orders");

  // On Home page, detect scroll position to update active pill section
  useEffect(() => {
    if (!isHomePage) return;

    const handleScroll = () => {
      const carouselEl = document.getElementById("carousel-section");
      const filterEl = document.getElementById("filter-bar");
      const scrollY = window.scrollY;
      const isMobile = window.innerWidth < 640;
      const headerHeight = isMobile ? 64 : 80;

      if (carouselTagLabel && carouselEl) {
        const carouselTop =
          carouselEl.getBoundingClientRect().top + window.pageYOffset - (headerHeight + 100);
        const carouselBottom = carouselTop + carouselEl.offsetHeight;
        if (scrollY >= carouselTop && scrollY < carouselBottom) {
          setActiveSection("carousel");
          return;
        }
      }

      if (filterEl) {
        const filterTop =
          filterEl.getBoundingClientRect().top + window.pageYOffset - (headerHeight + 100);
        if (scrollY >= filterTop) {
          setActiveSection("catalogue");
          return;
        }
      }

      setActiveSection("home");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage, carouselTagLabel]);

  const handleNavClick = (target: "home" | "catalogue" | "carousel") => {
    const wasMobileMenuOpen = isMobileMenuOpen;
    setIsMobileMenuOpen(false);

    const executeScroll = () => {
      if (isHomePage) {
        if (target === "home") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (target === "catalogue") {
          const el = document.getElementById("filter-bar");
          if (el) {
            const isMobile = window.innerWidth < 640;
            const headerHeight = isMobile ? 64 : 80;
            const offset = el.getBoundingClientRect().top + window.pageYOffset - (headerHeight + 20);
            window.scrollTo({ top: offset, behavior: "smooth" });
          }
        } else if (target === "carousel") {
          const el = document.getElementById("carousel-section");
          if (el) {
            const isMobile = window.innerWidth < 640;
            const headerHeight = isMobile ? 64 : 80;
            const offset = el.getBoundingClientRect().top + window.pageYOffset - (headerHeight + 20);
            window.scrollTo({ top: offset, behavior: "smooth" });
          }
        }
      } else {
        if (target === "home") {
          router.push("/?scroll=top");
        } else if (target === "catalogue") {
          router.push("/?scroll=filter-bar");
        } else if (target === "carousel") {
          router.push("/?scroll=carousel-section");
        }
      }
    };

    if (wasMobileMenuOpen) {
      // Delay scroll execution until mobile menu collapse animation completes (~230ms)
      // and layout reflow stabilizes so getBoundingClientRect() measures post-collapse layout.
      setTimeout(executeScroll, 230);
    } else {
      executeScroll();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-stone-50/70 dark:bg-stone-950/70 backdrop-blur-md border-b border-stone-200/40 dark:border-stone-800/40 transition-all w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Block: Logo */}
        <div className="flex-1 flex items-center justify-start min-w-0">
          <Logo
            showTagline={true}
            businessName={siteSettings?.business_name}
            tagline={siteSettings?.tagline}
            logoUrl={siteSettings?.logo_url}
            href="/"
          />
        </div>

        {/* Center Block: Desktop Navigation Links — Centered Admin Pill Tabs */}
        <div className="hidden lg:flex flex-1 items-center justify-center min-w-0">
          <nav className="flex items-center h-11 gap-1 bg-stone-100/90 dark:bg-stone-800/90 p-1 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 shadow-inner">
            <button
              type="button"
              onClick={() => handleNavClick("home")}
              className={`px-3.5 h-9 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isHomePage && activeSection === "home"
                  ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <Home className="w-3.5 h-3.5 text-botanical-800 dark:text-botanical-100" />
              <span>Home</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick("catalogue")}
              className={`px-3.5 h-9 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isHomePage && activeSection === "catalogue"
                  ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
              <span>Catalogue</span>
            </button>

            {carouselTagLabel && (
              <button
                type="button"
                onClick={() => handleNavClick("carousel")}
                className={`px-3.5 h-9 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 max-w-[180px] ${
                  isHomePage && activeSection === "carousel"
                    ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                }`}
                title={carouselTagLabel}
              >
                <Sparkles className="w-3.5 h-3.5 text-terracotta" />
                <span className="truncate">{carouselTagLabel}</span>
              </button>
            )}

            <Link
              href="/my-orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-3.5 h-9 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isOrdersPage
                  ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5 text-botanical-600 dark:text-botanical-400" />
              <span>Orders</span>
            </Link>
          </nav>
        </div>

        {/* Right Block: Header Actions (Theme Toggle + Bag Button + Mobile Menu) */}
        <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-3 shrink-0">
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

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2.5 rounded-full bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800/80 text-stone-700 dark:text-stone-200 hover:border-botanical-600 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center active:scale-95 transition-all shadow-2xs"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-botanical-800 dark:text-botanical-100" />
            ) : (
              <Menu className="w-5 h-5 text-botanical-800 dark:text-botanical-100" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="lg:hidden bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 px-4 py-3.5 space-y-1.5 overflow-hidden font-sans shadow-xl"
          >
            <button
              type="button"
              onClick={() => handleNavClick("home")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isHomePage && activeSection === "home"
                  ? "bg-botanical-50 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100 font-bold"
                  : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              }`}
            >
              <Home className="w-4 h-4 text-botanical-800 dark:text-botanical-100" />
              <span>Home</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick("catalogue")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isHomePage && activeSection === "catalogue"
                  ? "bg-botanical-50 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100 font-bold"
                  : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              }`}
            >
              <Sprout className="w-4 h-4 text-emerald-600" />
              <span>Catalogue</span>
            </button>

            {carouselTagLabel && (
              <button
                type="button"
                onClick={() => handleNavClick("carousel")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isHomePage && activeSection === "carousel"
                    ? "bg-botanical-50 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100 font-bold"
                    : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                <Sparkles className="w-4 h-4 text-terracotta" />
                <span className="truncate">{carouselTagLabel}</span>
              </button>
            )}

            <Link
              href="/my-orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isOrdersPage
                  ? "bg-botanical-50 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100 font-bold"
                  : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              }`}
            >
              <PackageCheck className="w-4 h-4 text-botanical-600 dark:text-botanical-400" />
              <span>Orders</span>
            </Link>

            {!isStandalone && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  promptInstall();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-botanical-600 dark:text-botanical-400" />
                <span>Install App</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
