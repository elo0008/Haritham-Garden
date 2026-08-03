"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PWAProvider() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallHint, setShowInstallHint] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker in customer browser environment
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("PWA Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.error("PWA Service Worker registration failed:", err);
        });
    }

    // 2. Listen to native beforeinstallprompt for optional subtle non-pushy hint
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Check if user has already dismissed the hint
      if (typeof window !== "undefined") {
        const isDismissed = localStorage.getItem("haritham_pwa_hint_dismissed");
        if (!isDismissed) {
          setShowInstallHint(true);
        }
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install prompt outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallHint(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("haritham_pwa_hint_dismissed", "true");
    }
  };

  const handleDismiss = () => {
    setShowInstallHint(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("haritham_pwa_hint_dismissed", "true");
    }
  };

  if (!showInstallHint) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 bg-stone-900/95 dark:bg-stone-800/95 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl backdrop-blur-md border border-stone-700/80 flex items-center justify-between gap-3 text-xs font-sans"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-botanical-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-stone-100 truncate">Install App</p>
            <p className="text-stone-300 text-[11px] truncate">Add Haritham Garden to home screen</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="bg-botanical-600 hover:bg-botanical-500 text-white font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-xs text-xs cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Dismiss app install hint"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
