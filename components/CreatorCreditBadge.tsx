"use client";

import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DISMISS_KEY = "haritham_creator_badge_dismissed";

export function CreatorCreditBadge() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [isPwaHintVisible, setIsPwaHintVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDismissed = localStorage.getItem(DISMISS_KEY) === "true";
    setDismissed(isDismissed);

    const checkPwa = () => {
      if (typeof window !== "undefined") {
        setIsPwaHintVisible(Boolean((window as any).__pwaHintVisible));
      }
    };

    // Initial check on mount
    checkPwa();

    const handlePwaVisibility = (e: Event) => {
      const customEvent = e as CustomEvent<{ visible?: boolean }>;
      if (typeof customEvent.detail?.visible === "boolean") {
        setIsPwaHintVisible(customEvent.detail.visible);
      } else {
        checkPwa();
      }
    };

    window.addEventListener("pwa-hint-visibility-change", handlePwaVisibility);
    return () => {
      window.removeEventListener("pwa-hint-visibility-change", handlePwaVisibility);
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(DISMISS_KEY, "true");
    }
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          key="creator-credit-badge"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={`fixed right-4 sm:right-6 z-40 transition-all duration-300 ease-out ${
            isPwaHintVisible ? "bottom-[100px]" : "bottom-4"
          }`}
        >
          <div className="group flex items-center gap-1.5 bg-white/90 dark:bg-stone-900/90 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg hover:shadow-xl hover:border-terracotta/40 dark:hover:border-terracotta/40 opacity-85 hover:opacity-100 transition-all text-xs font-medium">
            <a
              href="mailto:synera77@gmail.com"
              className="flex items-center gap-1.5 hover:text-terracotta dark:hover:text-terracotta transition-colors"
              title="Contact creator via email"
            >
              <Sparkles className="w-3.5 h-3.5 text-terracotta shrink-0" />
              <span>
                Built by <span className="font-bold text-stone-900 dark:text-stone-100">Synera</span>
              </span>
            </a>
            <span className="w-px h-3 bg-stone-200 dark:bg-stone-800 mx-0.5" aria-hidden="true" />
            <button
              type="button"
              onClick={handleDismiss}
              className="p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full transition-colors cursor-pointer"
              aria-label="Dismiss creator badge"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
