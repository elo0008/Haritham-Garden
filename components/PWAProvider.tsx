"use client";

import { useState, useEffect } from "react";
import { Leaf, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PWAProvider() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showHint, setShowHint] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker on customer side
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("ServiceWorker registered successfully:", reg.scope);
        })
        .catch((err) => {
          console.error("ServiceWorker registration failed:", err);
        });
    }

    // 2. Check dismissal in localStorage
    if (typeof window !== "undefined") {
      const isDismissed = localStorage.getItem("haritham_pwa_hint_dismissed");
      if (isDismissed) return;

      // Check if iOS device
      const userAgent = window.navigator.userAgent.toLowerCase();
      const iosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(iosDevice);

      // Listen for Chrome/Android beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowHint(true);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      // On iOS Safari, show subtle hint once if standalone is not active
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      if (iosDevice && !isStandalone) {
        const timer = setTimeout(() => {
          setShowHint(true);
        }, 3000);
        return () => clearTimeout(timer);
      }

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleDismiss = () => {
    setShowHint(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("haritham_pwa_hint_dismissed", "true");
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        console.log("PWA install accepted");
      }
      setDeferredPrompt(null);
      handleDismiss();
    } else if (isIOS) {
      alert("To install Haritham Garden on your iPhone/iPad:\n1. Tap the Share button in Safari\n2. Select 'Add to Home Screen'");
      handleDismiss();
    }
  };

  return (
    <AnimatePresence>
      {showHint && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 bg-stone-900/95 dark:bg-stone-800/95 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-stone-700/80 backdrop-blur-md flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-botanical-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Leaf className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-xs truncate">Install Haritham App</p>
              <p className="text-stone-300 text-[11px] truncate">Quick home-screen ordering</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="bg-botanical-600 hover:bg-botanical-500 text-white font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 active:scale-95 text-xs shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              aria-label="Dismiss hint"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
