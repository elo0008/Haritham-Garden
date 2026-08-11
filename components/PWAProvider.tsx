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

      // Check if event was captured globally before mount
      if ((window as any).deferredPwaPrompt) {
        setDeferredPrompt((window as any).deferredPwaPrompt);
        setShowHint(true);
      }

      const handlePromptAvailable = () => {
        if ((window as any).deferredPwaPrompt) {
          setDeferredPrompt((window as any).deferredPwaPrompt);
          setShowHint(true);
        }
      };

      // Listen for Chrome/Android beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        (window as any).deferredPwaPrompt = e;
        setDeferredPrompt(e);
        setShowHint(true);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.addEventListener("pwa-prompt-available", handlePromptAvailable);

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
        window.removeEventListener("pwa-prompt-available", handlePromptAvailable);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__pwaHintVisible = showHint;
      window.dispatchEvent(
        new CustomEvent("pwa-hint-visibility-change", { detail: { visible: showHint } })
      );
    }
  }, [showHint]);

  const handleDismiss = () => {
    setShowHint(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("haritham_pwa_hint_dismissed", "true");
    }
  };

  const handleInstallClick = async () => {
    const activePrompt =
      deferredPrompt ||
      (typeof window !== "undefined" ? (window as any).deferredPwaPrompt : null);

    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const { outcome } = await activePrompt.userChoice;
        if (outcome === "accepted") {
          console.log("PWA install accepted");
        }
      } catch (err) {
        console.error("Error triggering native install prompt:", err);
      }
      setDeferredPrompt(null);
      if (typeof window !== "undefined") {
        (window as any).deferredPwaPrompt = null;
      }
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
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[60] bg-white/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 backdrop-blur-md flex items-center justify-between gap-3 text-xs transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-botanical-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Leaf className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-stone-900 dark:text-stone-100 text-xs truncate">Install Haritham App</p>
              <p className="text-stone-600 dark:text-stone-400 text-[11px] truncate">Quick home-screen ordering</p>
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
